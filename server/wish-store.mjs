import { del, get, list, put } from '@vercel/blob';
import { MAX_WISHES, WISH_ID_PATTERN } from '../src/wishboard/content.js';

const PREFIX = 'wishboard/v1/notes/';
const IMAGE_PREFIX = 'wishboard/v1/images/';

export class StorageNotConfiguredError extends Error {}

export function createWishStore(client = { del, get, list, put }) {
  function options() {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) throw new StorageNotConfiguredError('Connect a private Vercel Blob store first.');
    return { token, abortSignal: AbortSignal.timeout(15000) };
  }

  async function readFile(pathname) {
    const result = await client.get(pathname, { ...options(), access: 'private', useCache: false });
    if (!result) return null;
    if (result.statusCode !== 200 || !result.stream) throw new Error('Unable to read a saved file.');
    return result;
  }

  async function read(pathname) {
    const result = await readFile(pathname);
    if (!result) return null;
    return new Response(result.stream).json();
  }

  async function listPage(prefix, cursor, limit) {
    const page = await client.list({ ...options(), prefix, limit, cursor });
    if (page.hasMore && (!page.cursor || page.cursor === cursor)) {
      throw new Error('Unable to read the next page of saved notes.');
    }
    return page;
  }

  async function readNotes(blobs) {
    const wishes = [];
    // Bound storage traffic instead of opening hundreds of connections at once.
    for (let index = 0; index < blobs.length; index += 10) {
      const batch = await Promise.all(blobs.slice(index, index + 10).map(blob => read(blob.pathname)));
      if (batch.some(wish => !wish)) throw new Error('A saved note could not be loaded. Please refresh.');
      wishes.push(...batch);
    }
    return wishes;
  }

  return {
    async all() {
      const blobs = [];
      let cursor;
      do {
        const page = await listPage(PREFIX, cursor, 1000);
        blobs.push(...page.blobs.filter(blob => blob.pathname.endsWith('.json')));
        cursor = page.hasMore ? page.cursor : undefined;
      } while (cursor);
      blobs.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
      return readNotes(blobs.slice(0, MAX_WISHES));
    },
    async page(cursor) {
      const page = await listPage(PREFIX, cursor, 50);
      return {
        wishes: await readNotes(page.blobs.filter(blob => blob.pathname.endsWith('.json'))),
        cursor: page.hasMore ? page.cursor : null,
      };
    },
    async remove(id) {
      if (typeof id !== 'string' || !WISH_ID_PATTERN.test(id)) throw new Error('Invalid note ID.');
      const paths = [`${PREFIX}${id}.json`];
      let cursor;
      do {
        const page = await listPage(`${IMAGE_PREFIX}${id}-`, cursor, 1000);
        paths.push(...page.blobs.map(blob => blob.pathname));
        cursor = page.hasMore ? page.cursor : undefined;
      } while (cursor);
      // Include leftover uploads so retrying a partially completed deletion is safe.
      for (let index = 0; index < paths.length; index += 1000) {
        await client.del(paths.slice(index, index + 1000), options());
      }
    },
    async image(id, hash) {
      return readFile(`${IMAGE_PREFIX}${id}-${hash}.webp`);
    },
    async save(wish, photo) {
      const pathname = `${PREFIX}${wish.id}.json`;
      const existing = await read(pathname);
      if (existing) return existing;
      if (photo) {
        const imagePath = `${IMAGE_PREFIX}${wish.id}-${photo.hash}.webp`;
        try {
          await client.put(imagePath, photo.buffer, {
            ...options(), access: 'private', addRandomSuffix: false,
            allowOverwrite: false, contentType: 'image/webp',
          });
        } catch (error) {
          const confirmed = await readFile(imagePath);
          if (!confirmed || !Buffer.from(await new Response(confirmed.stream).arrayBuffer()).equals(photo.buffer)) {
            throw error;
          }
        }
      }
      try {
        await client.put(pathname, JSON.stringify(wish), {
          ...options(), access: 'private', addRandomSuffix: false,
          allowOverwrite: false, contentType: 'application/json',
        });
      } catch (error) {
        // A retry or a simultaneous request may already have written this exact ID.
        const confirmed = await read(pathname);
        if (confirmed) return confirmed;
        throw error;
      }
      return wish;
    },
  };
}

export const wishStore = createWishStore();
