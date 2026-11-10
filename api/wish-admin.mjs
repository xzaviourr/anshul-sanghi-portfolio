import { createHash, timingSafeEqual } from 'node:crypto';
import { WISH_ID_PATTERN } from '../src/wishboard/content.js';
import { StorageNotConfiguredError, wishStore } from '../server/wish-store.mjs';
import { validSavedWish } from '../server/wish-validation.mjs';

export function createAdminHandler(store = wishStore) {
  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    if (req.method !== 'GET' && req.method !== 'DELETE') {
      res.setHeader('Allow', 'GET, DELETE');
      return res.status(405).json({ error: 'This endpoint only accepts GET and DELETE.' });
    }
    const password = process.env.WISHBOARD_ADMIN_PASSWORD;
    if (!password || password.length < 16 || password.length > 256) {
      return res.status(503).json({ error: 'Set a server-only WISHBOARD_ADMIN_PASSWORD of 16-256 characters in Vercel, then redeploy.' });
    }
    const authorization = req.headers.authorization;
    const supplied = typeof authorization === 'string' && authorization.startsWith('Bearer ')
      ? authorization.slice(7) : '';
    const digest = value => createHash('sha256').update(value).digest();
    if (!supplied || supplied.length > 256 || !timingSafeEqual(digest(supplied), digest(password))) {
      res.setHeader('WWW-Authenticate', 'Bearer');
      return res.status(401).json({ error: 'Incorrect admin password. Please try again.' });
    }
    try {
      if (req.method === 'GET') {
        const cursor = req.query?.cursor;
        if (cursor !== undefined && (typeof cursor !== 'string' || !cursor.length || cursor.length > 4096)) {
          return res.status(400).json({ error: 'This page of notes is not valid. Please unlock the page again.' });
        }
        const page = await store.page(cursor);
        if (!page || !Array.isArray(page.wishes) || !page.wishes.every(validSavedWish)
          || !(page.cursor === null || (typeof page.cursor === 'string' && page.cursor.length > 0))) {
          throw new Error('Storage returned an invalid page of notes.');
        }
        return res.status(200).json(page);
      }
      const id = req.query?.id;
      if (typeof id !== 'string' || !WISH_ID_PATTERN.test(id)) {
        return res.status(400).json({ error: 'Choose a valid note to delete.' });
      }
      await store.remove(id);
      return res.status(200).json({ deletedId: id });
    } catch (error) {
      console.error('[wishboard admin]', error instanceof StorageNotConfiguredError ? 'Blob storage not configured' : 'Blob storage request failed');
      return res.status(503).json({
        error: error instanceof StorageNotConfiguredError
          ? 'Connect a private Blob store before managing notes.'
          : req.method === 'DELETE'
            ? 'Deletion could not be confirmed. Please retry to finish removing the note and its photo.'
            : 'Notes could not be loaded. Please try again.',
      });
    }
  };
}

export default createAdminHandler();
