import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const config = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'));

test('only the archival feature branch disables automatic Vercel deployments', () => {
  assert.deepEqual(config.git.deploymentEnabled, { 'feature/kirti-corner': false });
});

test('legacy page and management URLs permanently redirect to Kirti routes', () => {
  for (const [source, destination] of [
    ['/wishboard', '/kirti'],
    ['/wishboard/', '/kirti'],
    ['/wishboard.html', '/kirti'],
    ['/wishboard/manage', '/kirti/manage'],
    ['/wishboard/manage/', '/kirti/manage'],
  ]) {
    const redirect = config.redirects.find(rule => rule.source === source);
    assert.ok(redirect, `Missing legacy redirect for ${source}`);
    assert.equal(redirect.destination, destination);
    assert.equal(redirect.permanent, true);
  }
  assert.ok(!config.redirects.some(rule => rule.source.startsWith('/api/')));
});

test('public and protected Kirti routes use the new HTML entry and retain privacy headers', async () => {
  for (const source of ['/kirti', '/kirti/', '/kirti/manage', '/kirti/manage/']) {
    assert.equal(config.rewrites.find(rule => rule.source === source)?.destination, '/kirti.html');
  }
  for (const source of ['/kirti', '/kirti/', '/kirti.html', '/kirti/manage/:path*']) {
    const headers = config.headers.find(rule => rule.source === source)?.headers;
    assert.ok(headers, `Missing privacy headers for ${source}`);
    assert.ok(headers.some(header => header.key === 'X-Robots-Tag' && header.value === 'noindex, nofollow'));
    assert.ok(headers.some(header => header.key === 'Referrer-Policy' && header.value === 'no-referrer'));
    if (source.includes('manage')) {
      assert.ok(headers.some(header => header.key === 'Cache-Control' && header.value === 'no-store'));
    }
  }
  await assert.rejects(readFile(new URL('../wishboard.html', import.meta.url)), { code: 'ENOENT' });
});

test('the HTML title and link preview identify Kirti rather than a generic wishboard', async () => {
  const html = await readFile(new URL('../kirti.html', import.meta.url), 'utf8');
  assert.ok(html.includes("<title>Kirti's corner | Anshul</title>"));
  assert.ok(html.includes('property="og:title" content="Kirti\'s corner | Anshul"'));
  assert.ok(html.includes('name="robots" content="noindex, nofollow"'));
  assert.ok(!/wishboard/i.test(html));
});
