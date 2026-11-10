import { imageUrlFor, MAX_IMAGE_BYTES, MAX_MESSAGE, MAX_NAME } from '../src/wishboard/content.js';
import { StorageNotConfiguredError, wishStore } from '../server/wish-store.mjs';
import { ImageValidationError, prepareStoredPhoto } from '../server/wish-images.mjs';
import { validSavedWish, validWish } from '../server/wish-validation.mjs';

const MAX_TEXT_BODY_BYTES = 8192;
const MAX_BODY_BYTES = MAX_TEXT_BODY_BYTES + Math.ceil(MAX_IMAGE_BYTES / 3) * 4 + 100;
const RATE_WINDOW_MS = 10 * 60 * 1000;

export function createWishboardHandler(store = wishStore) {
  // Best-effort, per-instance throttling. Wishes themselves live in durable Blob storage.
  const visitors = new Map();
  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (req.method !== 'GET' && req.method !== 'POST') {
      res.setHeader('Allow', 'GET, POST');
      return res.status(405).json({ error: 'This endpoint only accepts GET and POST.' });
    }

    try {
      if (req.method === 'GET') {
        const wishes = await store.all();
        if (!Array.isArray(wishes) || !wishes.every(validSavedWish)) {
          throw new Error('Storage returned invalid wishes.');
        }
        return res.status(200).json({ wishes });
      }
      const contentType = req.headers['content-type']?.split(';')[0].trim();
      if (contentType !== 'application/json') {
        return res.status(415).json({ error: 'Please send your wish as JSON.' });
      }
      if (Number(req.headers['content-length']) > MAX_BODY_BYTES) {
        return res.status(413).json({ error: 'That note is too large. Please keep it short and sweet.' });
      }
      let body;
      try {
        body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      } catch {
        return res.status(400).json({ error: 'Your note could not be read. Please try again.' });
      }
      const bodyLimit = body && typeof body.imageDataUrl === 'string' ? MAX_BODY_BYTES : MAX_TEXT_BODY_BYTES;
      if (Number(req.headers['content-length']) > bodyLimit || Buffer.byteLength(JSON.stringify(body) ?? '') > bodyLimit) {
        return res.status(413).json({ error: 'That note is too large. Please keep it short and sweet.' });
      }
      if (!validWish(body)) {
        return res.status(400).json({ error: `Please add a name (up to ${MAX_NAME} characters), a message (up to ${MAX_MESSAGE} characters), and choose one of the available note colours and GIFs.` });
      }
      if (body.gifId !== null && body.imageDataUrl != null) {
        return res.status(400).json({ error: 'Please choose either a photo or a GIF for your note, not both.' });
      }
      const now = Date.now();
      for (const [ip, visitor] of visitors) {
        if (visitor.expiresAt <= now) visitors.delete(ip);
      }
      // Vercel supplies this header; don't trust a caller-provided X-Forwarded-For.
      const ip = req.headers['x-vercel-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
      const visitor = visitors.get(ip);
      if ((visitor && visitor.count >= 5) || (!visitor && visitors.size >= 10000)) {
        res.setHeader('Retry-After', String(visitor ? Math.ceil((visitor.expiresAt - now) / 1000) : 600));
        return res.status(429).json({ error: 'So much love! Please wait 10 minutes before adding more notes.' });
      }
      visitors.set(ip, { count: (visitor?.count ?? 0) + 1, expiresAt: visitor?.expiresAt ?? now + RATE_WINDOW_MS });
      const photo = await prepareStoredPhoto(body.imageDataUrl);
      const wish = {
        id: body.id,
        name: body.name.trim(),
        message: body.message.trim(),
        color: body.color,
        gifId: body.gifId,
        imageUrl: photo ? imageUrlFor(body.id, photo.hash) : null,
        createdAt: new Date().toISOString(),
      };
      const saved = await store.save(wish, photo);
      if (!validSavedWish(saved)) throw new Error('Storage did not confirm a valid saved note.');
      if (saved.name !== wish.name || saved.message !== wish.message || saved.color !== wish.color || saved.gifId !== wish.gifId || saved.id !== wish.id || (saved.imageUrl ?? null) !== wish.imageUrl) {
        return res.status(409).json({ error: 'This note has already been sent. Please start a new note.' });
      }
      return res.status(201).json({ wish: saved });
    } catch (error) {
      if (error instanceof ImageValidationError) {
        return res.status(400).json({ error: error.message });
      }
      // Keep message contents and storage credentials out of logs.
      console.error('[wishboard]', error instanceof StorageNotConfiguredError ? 'Blob storage not configured' : 'Blob storage request failed');
      return res.status(503).json({
        error: error instanceof StorageNotConfiguredError
          ? 'The board is not connected yet. Its owner needs to connect a private Blob store in Vercel before wishes can be saved.'
          : 'The board is temporarily unavailable. Your note has not been confirmed. Please try again shortly.',
      });
    }
  };
}

export default createWishboardHandler();
