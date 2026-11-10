import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import { after, before, test } from 'node:test';
import { del, get, list, put } from '@vercel/blob';
import sharp from 'sharp';
import { createImageHandler } from '../api/wish-image.mjs';
import { createWishboardHandler } from '../api/wishes.mjs';
import { createAdminHandler } from '../api/wish-admin.mjs';
import { createWishStore } from '../server/wish-store.mjs';
import { gifs, MAX_IMAGE_BYTES, MAX_WISHES } from '../src/wishboard/content.js';

const originalToken = process.env.BLOB_READ_WRITE_TOKEN;
const originalAdminPassword = process.env.WISHBOARD_ADMIN_PASSWORD;
const adminPassword = 'test-admin-password-not-a-real-secret';
const adminHeaders = { authorization: `Bearer ${adminPassword}` };
before(() => {
  process.env.BLOB_READ_WRITE_TOKEN = 'test-token-not-a-real-credential';
  process.env.WISHBOARD_ADMIN_PASSWORD = adminPassword;
});
after(() => {
  if (originalToken === undefined) delete process.env.BLOB_READ_WRITE_TOKEN;
  else process.env.BLOB_READ_WRITE_TOKEN = originalToken;
  if (originalAdminPassword === undefined) delete process.env.WISHBOARD_ADMIN_PASSWORD;
  else process.env.WISHBOARD_ADMIN_PASSWORD = originalAdminPassword;
});

function note(overrides = {}) {
  return { id: randomUUID(), name: 'A friend', message: 'You make the world brighter!', color: 'rose', gifId: null, ...overrides };
}

function fakeBlobClient() {
  const files = new Map();
  const writes = [];
  return {
    files, writes,
    async get(pathname) {
      const file = files.get(pathname);
      return file ? {
        statusCode: 200, stream: new Response(file.body).body,
        blob: { contentType: file.contentType, size: Buffer.byteLength(file.body) },
      } : null;
    },
    async put(pathname, body, options) {
      assert.equal(options.access, 'private');
      assert.equal(options.allowOverwrite, false);
      assert.equal(options.addRandomSuffix, false);
      if (files.has(pathname)) throw new Error('Already exists');
      writes.push(pathname);
      files.set(pathname, { body, contentType: options.contentType, uploadedAt: new Date() });
      return { pathname };
    },
    async del(paths, options) {
      assert.equal(options.token, process.env.BLOB_READ_WRITE_TOKEN);
      for (const pathname of paths) files.delete(pathname);
    },
    async list({ prefix, cursor, limit }) {
      const all = [...files].filter(([pathname]) => pathname.startsWith(prefix))
        .map(([pathname, file]) => ({ pathname, uploadedAt: file.uploadedAt }));
      const start = Number(cursor ?? 0);
      // Exercise pagination without needing thousands of files.
      const end = start + Math.min(limit, 3);
      return { blobs: all.slice(start, end), hasMore: end < all.length, cursor: String(end) };
    },
  };
}

async function invoke(handler, method = 'GET', body, headers = {}, query = {}) {
  const response = {
    headers: {}, statusCode: 200, data: undefined,
    setHeader(key, value) { this.headers[key] = value; },
    status(code) { this.statusCode = code; return this; },
    json(data) { this.data = data; return this; },
    send(data) { this.data = data; return this; },
  };
  await handler({
    method, body, query,
    headers: { 'content-type': 'application/json', 'x-vercel-forwarded-for': '192.0.2.1', ...headers },
    socket: { remoteAddress: '127.0.0.1' },
  }, response);
  return response;
}

async function photoDataUrl(width = 64, height = 48, format = 'png') {
  const buffer = await sharp({
    create: { width, height, channels: 3, background: '#e9a7b5' },
  }).toFormat(format).toBuffer();
  return `data:image/${format};base64,${buffer.toString('base64')}`;
}

test('a saved wish survives recreating the handler and storage adapter', async () => {
  const client = fakeBlobClient();
  const first = createWishboardHandler(createWishStore(client));
  const body = note({ name: '  Anshul  ', message: '  A beautiful memory\nand a wish!  ', gifId: gifs[0].id });
  const posted = await invoke(first, 'POST', body);
  assert.equal(posted.statusCode, 201);
  assert.equal(posted.data.wish.name, 'Anshul');
  assert.equal(posted.data.wish.message, 'A beautiful memory\nand a wish!');
  assert.ok(!Number.isNaN(Date.parse(posted.data.wish.createdAt)));
  const restarted = createWishboardHandler(createWishStore(client));
  const loaded = await invoke(restarted);
  assert.equal(loaded.statusCode, 200);
  assert.deepEqual(loaded.data.wishes, [posted.data.wish]);
  assert.equal(loaded.headers['Cache-Control'], 'no-store');
});

test('concurrent visitors do not overwrite each other and retries do not duplicate notes', async () => {
  const client = fakeBlobClient();
  const handler = createWishboardHandler(createWishStore(client));
  const notes = Array.from({ length: 10 }, () => note());
  const results = await Promise.all(notes.map((body, index) => invoke(handler, 'POST', body, { 'x-vercel-forwarded-for': `192.0.2.${index}` })));
  assert.ok(results.every(result => result.statusCode === 201));
  assert.equal(client.files.size, 10);
  const retry = await invoke(handler, 'POST', notes[0]);
  assert.equal(retry.statusCode, 201);
  assert.deepEqual(retry.data.wish, results[0].data.wish);
  assert.equal(client.files.size, 10);
  assert.equal((await invoke(handler)).data.wishes.length, 10);
});

test('conflicting submission IDs cannot replace an existing note', async () => {
  const client = fakeBlobClient();
  const handler = createWishboardHandler(createWishStore(client));
  const body = note();
  await invoke(handler, 'POST', body);
  assert.equal((await invoke(handler, 'POST', { ...body, message: 'Changed' })).statusCode, 409);
  assert.equal((await invoke(handler)).data.wishes[0].message, body.message);
});

test('simultaneous retries of one note create only one durable file', async () => {
  const client = fakeBlobClient();
  const handler = createWishboardHandler(createWishStore(client));
  const body = note();
  const responses = await Promise.all(Array.from({ length: 5 }, () => invoke(handler, 'POST', body)));
  assert.ok(responses.every(response => response.statusCode === 201));
  assert.equal(client.files.size, 1);
  assert.equal(client.writes.length, 1);
  assert.ok(responses.every(response => response.data.wish.createdAt === responses[0].data.wish.createdAt));
});

test('a lost upload acknowledgement is verified from storage before claiming success', async () => {
  const client = fakeBlobClient();
  const originalPut = client.put;
  client.put = async (...args) => { await originalPut(...args); throw new Error('Connection interrupted after save'); };
  const response = await invoke(createWishboardHandler(createWishStore(client)), 'POST', note());
  assert.equal(response.statusCode, 201);
  assert.equal(client.files.size, 1);
});

test('only the newest 500 wishes are displayed, with every older file retained', async () => {
  const client = fakeBlobClient();
  for (let index = 0; index < MAX_WISHES + 2; index++) {
    const wish = { ...note(), createdAt: new Date(1700000000000 + index).toISOString() };
    client.files.set(`wishboard/v1/notes/${wish.id}.json`, { body: JSON.stringify(wish), uploadedAt: new Date(wish.createdAt) });
  }
  const wishes = await createWishStore(client).all();
  assert.equal(wishes.length, MAX_WISHES);
  assert.equal(wishes[0].createdAt, new Date(1700000000000 + MAX_WISHES + 1).toISOString());
  assert.equal(client.files.size, MAX_WISHES + 2);
});

test('invalid inputs never reach storage', async () => {
  const client = fakeBlobClient();
  const handler = createWishboardHandler(createWishStore(client));
  const invalid = [
    null, {}, note({ id: '../notes' }), note({ name: '   ' }), note({ name: 'x'.repeat(41) }),
    note({ message: '' }), note({ message: 'x'.repeat(601) }), note({ color: 'anything' }),
    note({ gifId: 'https://untrusted.example/image.gif' }), note({ gifId: {} }),
  ];
  for (const body of invalid) assert.equal((await invoke(handler, 'POST', body)).statusCode, 400);
  assert.equal(client.files.size, 0);
  assert.equal((await invoke(handler, 'POST', '{broken')).statusCode, 400);
  assert.equal((await invoke(handler, 'POST', note(), { 'content-type': 'text/plain' })).statusCode, 415);
  assert.equal((await invoke(handler, 'POST', note(), { 'content-length': '9000' })).statusCode, 413);
  assert.equal((await invoke(handler, 'POST', { ...note(), extra: 'x'.repeat(9000) })).statusCode, 413);
  assert.equal((await invoke(handler, 'DELETE')).statusCode, 405);
});

test('input boundaries are accepted and client timestamps/extra fields are not stored', async () => {
  const client = fakeBlobClient();
  const body = note({ name: 'x'.repeat(40), message: 'y'.repeat(600), createdAt: 'fake', unexpected: 'do not store' });
  const response = await invoke(createWishboardHandler(createWishStore(client)), 'POST', body);
  assert.equal(response.statusCode, 201);
  assert.notEqual(response.data.wish.createdAt, 'fake');
  assert.ok(!('unexpected' in response.data.wish));
});

test('throttling counts attempts, ignores spoofed forwarding, and expires', async t => {
  const client = fakeBlobClient();
  const handler = createWishboardHandler(createWishStore(client));
  const now = Date.now();
  t.mock.method(Date, 'now', () => now);
  for (let index = 0; index < 5; index++) {
    assert.equal((await invoke(handler, 'POST', note())).statusCode, 201);
  }
  const limited = await invoke(handler, 'POST', note(), { 'x-forwarded-for': 'spoofed' });
  assert.equal(limited.statusCode, 429);
  assert.equal(limited.headers['Retry-After'], '600');
  t.mock.method(Date, 'now', () => now + 600001);
  assert.equal((await invoke(handler, 'POST', note())).statusCode, 201);
});

test('missing configuration and storage failures are explicit, not empty successful boards', async t => {
  t.mock.method(console, 'error', () => {});
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  delete process.env.BLOB_READ_WRITE_TOKEN;
  try {
    const missing = await invoke(createWishboardHandler(createWishStore(fakeBlobClient())));
    assert.equal(missing.statusCode, 503);
    assert.match(missing.data.error, /connect a private Blob store/);
  } finally { process.env.BLOB_READ_WRITE_TOKEN = token; }

  const unavailable = createWishboardHandler({
    all: async () => { throw new Error('Service unavailable'); },
    save: async () => { throw new Error('Service unavailable'); },
  });
  assert.equal((await invoke(unavailable)).statusCode, 503);
  const failed = await invoke(unavailable, 'POST', note());
  assert.equal(failed.statusCode, 503);
  assert.match(failed.data.error, /not been confirmed/);
});

test('corrupted saved notes and incomplete listings produce visible errors', async t => {
  t.mock.method(console, 'error', () => {});
  const client = fakeBlobClient();
  client.files.set('wishboard/v1/notes/corrupted.json', { body: '{"name":"oops"}', uploadedAt: new Date() });
  assert.equal((await invoke(createWishboardHandler(createWishStore(client)))).statusCode, 503);
  const broken = fakeBlobClient();
  broken.list = async () => ({ blobs: [], hasMore: true });
  await assert.rejects(createWishStore(broken).all(), /next page/);
});

test('a photo note is durable and readable after a server restart', async () => {
  const client = fakeBlobClient();
  const body = note({ imageDataUrl: await photoDataUrl(3200, 900, 'jpeg') });
  const posted = await invoke(createWishboardHandler(createWishStore(client)), 'POST', body);
  assert.equal(posted.statusCode, 201);
  assert.match(posted.data.wish.imageUrl, /^\/api\/wish-image\?id=/);
  assert.ok(!('imageDataUrl' in posted.data.wish));
  assert.equal(client.files.size, 2);
  const store = createWishStore(client);
  const loaded = await invoke(createWishboardHandler(store));
  assert.deepEqual(loaded.data.wishes, [posted.data.wish]);
  const query = Object.fromEntries(new URL(posted.data.wish.imageUrl, 'http://localhost').searchParams);
  const image = await invoke(createImageHandler(store), 'GET', undefined, {}, query);
  assert.equal(image.statusCode, 200);
  assert.equal(image.headers['Content-Type'], 'image/webp');
  assert.equal(image.headers['X-Content-Type-Options'], 'nosniff');
  const metadata = await sharp(image.data).metadata();
  assert.equal(metadata.format, 'webp');
  assert.equal(metadata.width, 1600);
  assert.equal(metadata.height, 450);
  assert.ok(image.data.length <= MAX_IMAGE_BYTES);
  assert.equal(loaded.data.wishes[0].gifId, null);
});

test('the installed Blob SDK uploads, reads, and deletes private notes and photos over HTTP', async t => {
  const files = new Map();
  const requests = [];
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      requests.push({ method: req.method, headers: req.headers, url });
      if (req.method === 'POST' && url.pathname === '/delete') {
        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);
        const { urls } = JSON.parse(Buffer.concat(chunks).toString());
        for (const pathname of urls) files.delete(pathname);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end('{}');
      }
      if (req.method === 'PUT') {
        const pathname = url.searchParams.get('pathname');
        if (files.has(pathname)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: { code: 'blob_already_exists', message: 'Already exists' } }));
        }
        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);
        const file = {
          pathname, body: Buffer.concat(chunks), contentType: req.headers['x-content-type'],
          uploadedAt: new Date().toISOString(),
        };
        files.set(pathname, file);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          pathname, url: `${origin}/${pathname}`, downloadUrl: `${origin}/${pathname}?download=1`,
          contentType: file.contentType, contentDisposition: 'inline', etag: `"${files.size}"`,
        }));
      }
      if (url.pathname === '/') {
        const matching = [...files.values()].filter(file => file.pathname.startsWith(url.searchParams.get('prefix')));
        const start = Number(url.searchParams.get('cursor') ?? 0);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          blobs: matching.slice(start, start + 1).map(file => ({
            pathname: file.pathname, url: `${origin}/${file.pathname}`,
            downloadUrl: `${origin}/${file.pathname}?download=1`,
            size: file.body.length, uploadedAt: file.uploadedAt, etag: '"fixture"',
          })),
          hasMore: start + 1 < matching.length, cursor: String(start + 1),
        }));
      }
      const file = files.get(url.pathname.slice(1));
      if (!file) {
        res.writeHead(404);
        return res.end();
      }
      res.writeHead(200, {
        'Content-Type': file.contentType, 'Content-Length': file.body.length,
        'Last-Modified': new Date(file.uploadedAt).toUTCString(),
      });
      return res.end(file.body);
    } catch (error) {
      res.writeHead(500);
      res.end(String(error));
    }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => {
    server.close(resolve);
    server.closeAllConnections();
  }));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const previousUrl = process.env.VERCEL_BLOB_API_URL;
  const previousRetries = process.env.VERCEL_BLOB_RETRIES;
  process.env.VERCEL_BLOB_API_URL = origin;
  process.env.VERCEL_BLOB_RETRIES = '0';
  t.after(() => {
    if (previousUrl === undefined) delete process.env.VERCEL_BLOB_API_URL;
    else process.env.VERCEL_BLOB_API_URL = previousUrl;
    if (previousRetries === undefined) delete process.env.VERCEL_BLOB_RETRIES;
    else process.env.VERCEL_BLOB_RETRIES = previousRetries;
  });
  // Only redirect transport to loopback; authentication and response parsing use the real SDK.
  const client = { del, list, put, get: (pathname, options) => get(`${origin}/${pathname}`, options) };
  const handler = createWishboardHandler(createWishStore(client));
  const bodies = [note(), note({ gifId: gifs[0].id }), note({ imageDataUrl: await photoDataUrl() })];
  const saved = [];
  for (const body of bodies) {
    const response = await invoke(handler, 'POST', body);
    assert.equal(response.statusCode, 201, JSON.stringify(response.data));
    saved.push(response.data.wish);
  }
  const restartedStore = createWishStore(client);
  const loaded = await invoke(createWishboardHandler(restartedStore));
  assert.equal(loaded.statusCode, 200);
  const byId = (a, b) => a.id.localeCompare(b.id);
  assert.deepEqual(loaded.data.wishes.sort(byId), [...saved].sort(byId));
  const photo = saved[2];
  const query = Object.fromEntries(new URL(photo.imageUrl, origin).searchParams);
  const image = await invoke(createImageHandler(restartedStore), 'GET', undefined, {}, query);
  assert.equal(image.statusCode, 200);
  assert.equal((await sharp(image.data).metadata()).format, 'webp');
  const retry = await invoke(createWishboardHandler(createWishStore(client)), 'POST', bodies[2]);
  assert.equal(retry.statusCode, 201);
  assert.deepEqual(retry.data.wish, photo);
  assert.equal(files.size, 4);
  assert.equal(requests.filter(request => request.method === 'PUT').length, 4);
  const admin = createAdminHandler(restartedStore);
  const adminPage = await invoke(admin, 'GET', undefined, adminHeaders);
  assert.equal(adminPage.statusCode, 200);
  assert.equal(adminPage.data.wishes.length, 1);
  assert.ok(adminPage.data.cursor);
  const removed = await invoke(admin, 'DELETE', undefined, adminHeaders, { id: photo.id });
  assert.equal(removed.statusCode, 200);
  assert.equal(files.size, 2);
  assert.equal((await invoke(createImageHandler(restartedStore), 'GET', undefined, {}, query)).statusCode, 404);
  assert.equal((await invoke(admin, 'DELETE', undefined, adminHeaders, { id: photo.id })).statusCode, 200);
  for (const request of requests) {
    assert.equal(request.headers.authorization, `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`);
    if (request.method === 'PUT') {
      assert.equal(request.headers['x-vercel-blob-access'], 'private');
      assert.equal(request.headers['x-add-random-suffix'], '0');
      assert.equal(request.headers['x-allow-overwrite'], '0');
    } else if (request.method === 'GET' && request.url.pathname !== '/') {
      assert.equal(request.url.searchParams.get('cache'), '0');
    }
  }
});

test('text-only and GIF-only notes work, but combining a photo and GIF never writes to storage', async () => {
  for (const attachment of [{}, { gifId: gifs[0].id }]) {
    const client = fakeBlobClient();
    const result = await invoke(createWishboardHandler(createWishStore(client)), 'POST', note(attachment));
    assert.equal(result.statusCode, 201);
    assert.equal(result.data.wish.imageUrl, null);
    assert.equal(client.files.size, 1);
  }
  const client = fakeBlobClient();
  const result = await invoke(createWishboardHandler(createWishStore(client)), 'POST', note({
    gifId: gifs[0].id, imageDataUrl: await photoDataUrl(),
  }));
  assert.equal(result.statusCode, 400);
  assert.match(result.data.error, /either a photo or a GIF/);
  assert.equal(client.files.size, 0);
});

test('photo normalization removes metadata and applies camera orientation', async () => {
  const buffer = await sharp({
    create: { width: 64, height: 48, channels: 3, background: '#aabbcc' },
  }).withMetadata({ orientation: 6 }).jpeg().toBuffer();
  const client = fakeBlobClient();
  const result = await invoke(createWishboardHandler(createWishStore(client)), 'POST', note({
    imageDataUrl: `data:image/jpeg;base64,${buffer.toString('base64')}`,
  }));
  assert.equal(result.statusCode, 201);
  const file = [...client.files.values()].find(file => file.contentType === 'image/webp');
  const metadata = await sharp(file.body).metadata();
  assert.equal(metadata.width, 48);
  assert.equal(metadata.height, 64);
  assert.equal(metadata.exif, undefined);
  assert.equal(metadata.orientation, undefined);
});

test('invalid, oversized, forged, and excessive-pixel photos never reach storage', async () => {
  const invalid = [
    {}, '', 'https://example.com/photo.png',
    'data:image/svg+xml;base64,PHN2Zy8+',
    'data:image/png;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==',
    `data:image/png;base64,${Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).toString('base64')}`,
    `data:image/jpeg;base64,${Buffer.alloc(MAX_IMAGE_BYTES + 1).toString('base64')}`,
    await photoDataUrl(5000, 5000),
  ];
  for (const imageDataUrl of invalid) {
    const client = fakeBlobClient();
    const result = await invoke(createWishboardHandler(createWishStore(client)), 'POST', note({ imageDataUrl }));
    assert.ok([400, 413].includes(result.statusCode), JSON.stringify(result.data));
    assert.equal(client.files.size, 0);
  }
});

test('simultaneous photo retries do not duplicate or overwrite attachments', async () => {
  const client = fakeBlobClient();
  const handler = createWishboardHandler(createWishStore(client));
  const body = note({ imageDataUrl: await photoDataUrl() });
  const results = await Promise.all(Array.from({ length: 3 }, () => invoke(handler, 'POST', body)));
  assert.ok(results.every(result => result.statusCode === 201));
  assert.equal(client.files.size, 2);
  assert.equal(client.writes.length, 2);
  assert.ok(results.every(result => result.data.wish.imageUrl === results[0].data.wish.imageUrl));
  assert.equal((await invoke(handler, 'POST', { ...body, imageDataUrl: null })).statusCode, 409);
});

test('a failed note write retains the draft image for a safe retry, not a false success', async t => {
  t.mock.method(console, 'error', () => {});
  const client = fakeBlobClient();
  const originalPut = client.put;
  let failNote = true;
  client.put = async (path, ...args) => {
    if (path.endsWith('.json') && failNote) {
      failNote = false;
      throw new Error('Note write interrupted');
    }
    return originalPut(path, ...args);
  };
  const body = note({ imageDataUrl: await photoDataUrl() });
  const failed = await invoke(createWishboardHandler(createWishStore(client)), 'POST', body);
  assert.equal(failed.statusCode, 503);
  assert.equal(client.files.size, 1);
  const retry = await invoke(createWishboardHandler(createWishStore(client)), 'POST', body);
  assert.equal(retry.statusCode, 201);
  assert.equal(client.files.size, 2);
});

test('photo upload failures do not save notes with missing attachments', async t => {
  t.mock.method(console, 'error', () => {});
  const client = fakeBlobClient();
  client.put = async () => { throw new Error('Storage unavailable'); };
  const result = await invoke(createWishboardHandler(createWishStore(client)), 'POST', note({
    imageDataUrl: await photoDataUrl(),
  }));
  assert.equal(result.statusCode, 503);
  assert.equal(client.files.size, 0);
});

test('photo endpoint rejects arbitrary paths, malformed hashes, and missing files', async () => {
  const handler = createImageHandler(createWishStore(fakeBlobClient()));
  const valid = { id: randomUUID(), v: 'a'.repeat(64) };
  for (const query of [{}, { ...valid, id: '../secret' }, { ...valid, v: 'https://example.com' }, { ...valid, id: [valid.id] }]) {
    assert.equal((await invoke(handler, 'GET', undefined, {}, query)).statusCode, 400);
  }
  assert.equal((await invoke(handler, 'GET', undefined, {}, valid)).statusCode, 404);
  assert.equal((await invoke(handler, 'POST', undefined, {}, valid)).statusCode, 405);
});

test('photo endpoint surfaces storage failures and invalid stored types', async t => {
  t.mock.method(console, 'error', () => {});
  const query = { id: randomUUID(), v: 'a'.repeat(64) };
  const unavailable = createImageHandler({ image: async () => { throw new Error('Storage unavailable'); } });
  assert.equal((await invoke(unavailable, 'GET', undefined, {}, query)).statusCode, 503);
  const invalid = createImageHandler({
    image: async () => ({
      blob: { contentType: 'image/svg+xml', size: 6 },
      stream: new Response('<svg/>').body,
    }),
  });
  assert.equal((await invoke(invalid, 'GET', undefined, {}, query)).statusCode, 503);
});

test('old notes without image fields remain readable and untrusted image URLs are rejected', async t => {
  t.mock.method(console, 'error', () => {});
  const client = fakeBlobClient();
  const old = { ...note(), createdAt: new Date().toISOString() };
  const path = `wishboard/v1/notes/${old.id}.json`;
  client.files.set(path, { body: JSON.stringify(old), uploadedAt: new Date() });
  const handler = createWishboardHandler(createWishStore(client));
  assert.deepEqual((await invoke(handler)).data.wishes, [old]);
  client.files.set(path, { body: JSON.stringify({ ...old, imageUrl: 'https://untrusted.example/photo.png' }), uploadedAt: new Date() });
  assert.equal((await invoke(handler)).statusCode, 503);
});

test('admin access requires a configured strong password and never exposes storage to unauthenticated callers', async () => {
  let called = false;
  const handler = createAdminHandler({
    page: async () => { called = true; return { wishes: [], cursor: null }; },
    remove: async () => { called = true; },
  });
  for (const authorization of [undefined, 'Bearer wrong', ['Bearer secret'], `Basic ${adminPassword}`]) {
    for (const method of ['GET', 'DELETE']) {
      const response = await invoke(handler, method, undefined, { authorization }, { id: randomUUID() });
      assert.equal(response.statusCode, 401);
      assert.equal(response.headers['Cache-Control'], 'no-store');
    }
  }
  assert.equal(called, false);
  try {
    for (const password of ['', 'short', 'x'.repeat(257)]) {
      process.env.WISHBOARD_ADMIN_PASSWORD = password;
      assert.equal((await invoke(handler, 'GET', undefined, adminHeaders)).statusCode, 503);
    }
  } finally { process.env.WISHBOARD_ADMIN_PASSWORD = adminPassword; }
  assert.equal(called, false);
  assert.equal((await invoke(handler, 'POST', undefined, adminHeaders)).statusCode, 405);
  assert.equal((await invoke(handler, 'GET', undefined, adminHeaders)).statusCode, 200);
});

test('admin pagination includes retained notes beyond the public 500-note limit', async () => {
  const client = fakeBlobClient();
  for (let index = 0; index < MAX_WISHES + 2; index++) {
    const wish = { ...note(), createdAt: new Date(1700000000000 + index).toISOString() };
    client.files.set(`wishboard/v1/notes/${wish.id}.json`, { body: JSON.stringify(wish), uploadedAt: new Date(wish.createdAt) });
  }
  const handler = createAdminHandler(createWishStore(client));
  const seen = new Set();
  let cursor;
  do {
    const response = await invoke(handler, 'GET', undefined, adminHeaders, cursor ? { cursor } : {});
    assert.equal(response.statusCode, 200);
    for (const wish of response.data.wishes) {
      assert.ok(!seen.has(wish.id));
      seen.add(wish.id);
    }
    assert.notEqual(response.data.cursor, cursor);
    cursor = response.data.cursor;
  } while (cursor);
  assert.equal(seen.size, MAX_WISHES + 2);
});

test('admin deletion removes only the chosen note, its photo, and leftover photo uploads, and can be retried', async () => {
  const client = fakeBlobClient();
  const store = createWishStore(client);
  const publicHandler = createWishboardHandler(store);
  const first = await invoke(publicHandler, 'POST', note({ imageDataUrl: await photoDataUrl() }));
  const second = await invoke(publicHandler, 'POST', note({ imageDataUrl: await photoDataUrl() }));
  const id = first.data.wish.id;
  for (const hash of ['1', '2', '3', '4']) {
    client.files.set(`wishboard/v1/images/${id}-${hash.repeat(64)}.webp`, { body: 'unused upload', uploadedAt: new Date() });
  }
  const handler = createAdminHandler(store);
  const removed = await invoke(handler, 'DELETE', undefined, adminHeaders, { id });
  assert.equal(removed.statusCode, 200);
  assert.equal(removed.data.deletedId, id);
  assert.equal(client.files.size, 2);
  assert.deepEqual((await invoke(publicHandler)).data.wishes, [second.data.wish]);
  assert.equal((await invoke(handler, 'DELETE', undefined, adminHeaders, { id })).statusCode, 200);
  assert.equal(client.files.size, 2);
  assert.equal((await invoke(publicHandler, 'DELETE', undefined, adminHeaders, { id: second.data.wish.id })).statusCode, 405);
});

test('invalid management IDs and pagination never reach storage', async () => {
  const handler = createAdminHandler({
    page: async () => { assert.fail('Invalid cursor reached storage'); },
    remove: async () => { assert.fail('Invalid ID reached storage'); },
  });
  for (const id of [undefined, '../secret', ['id'], '', randomUUID() + '/other']) {
    assert.equal((await invoke(handler, 'DELETE', undefined, adminHeaders, { id })).statusCode, 400);
  }
  for (const cursor of [['cursor'], '', 'x'.repeat(4097)]) {
    assert.equal((await invoke(handler, 'GET', undefined, adminHeaders, { cursor })).statusCode, 400);
  }
});

test('failed or partially completed admin deletions return errors and retry cleans up remaining photos', async t => {
  t.mock.method(console, 'error', () => {});
  const client = fakeBlobClient();
  const store = createWishStore(client);
  const saved = await invoke(createWishboardHandler(store), 'POST', note({ imageDataUrl: await photoDataUrl() }));
  const id = saved.data.wish.id;
  const originalDel = client.del;
  const handler = createAdminHandler(store);
  client.del = async () => { throw new Error('Storage unavailable'); };
  const failed = await invoke(handler, 'DELETE', undefined, adminHeaders, { id });
  assert.equal(failed.statusCode, 503);
  assert.equal(client.files.size, 2);
  client.del = async paths => {
    client.files.delete(paths[0]);
    throw new Error('Connection interrupted during deletion');
  };
  assert.equal((await invoke(handler, 'DELETE', undefined, adminHeaders, { id })).statusCode, 503);
  assert.equal(client.files.size, 1);
  client.del = originalDel;
  assert.equal((await invoke(handler, 'DELETE', undefined, adminHeaders, { id })).statusCode, 200);
  assert.equal(client.files.size, 0);
});

test('admin listing and photo-cleanup failures never claim success', async t => {
  t.mock.method(console, 'error', () => {});
  const invalid = createAdminHandler({ page: async () => ({ wishes: [{}], cursor: null }) });
  assert.equal((await invoke(invalid, 'GET', undefined, adminHeaders)).statusCode, 503);
  const client = fakeBlobClient();
  const store = createWishStore(client);
  const saved = await invoke(createWishboardHandler(store), 'POST', note());
  client.list = async () => { throw new Error('Storage unavailable'); };
  const handler = createAdminHandler(store);
  assert.equal((await invoke(handler, 'GET', undefined, adminHeaders)).statusCode, 503);
  assert.equal((await invoke(handler, 'DELETE', undefined, adminHeaders, { id: saved.data.wish.id })).statusCode, 503);
  assert.equal(client.files.size, 1);
});
