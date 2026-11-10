import { IMAGE_HASH_PATTERN, MAX_IMAGE_BYTES, WISH_ID_PATTERN } from '../src/wishboard/content.js';
import { StorageNotConfiguredError, wishStore } from '../server/wish-store.mjs';

export function createImageHandler(store = wishStore) {
  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      return res.status(405).json({ error: 'Photos can only be loaded with GET.' });
    }
    const { id, v } = req.query ?? {};
    if (typeof id !== 'string' || typeof v !== 'string' || !WISH_ID_PATTERN.test(id) || !IMAGE_HASH_PATTERN.test(v)) {
      return res.status(400).json({ error: 'This photo link is not valid.' });
    }
    try {
      const photo = await store.image(id, v);
      if (!photo) return res.status(404).json({ error: 'This photo is no longer available.' });
      if (photo.blob.contentType !== 'image/webp' || photo.blob.size > MAX_IMAGE_BYTES) {
        throw new Error('Photo storage returned an unexpected file.');
      }
      const buffer = Buffer.from(await new Response(photo.stream).arrayBuffer());
      if (!buffer.length || buffer.length > MAX_IMAGE_BYTES) throw new Error('Photo storage returned an invalid size.');
      res.setHeader('Content-Type', 'image/webp');
      res.setHeader('Content-Disposition', 'inline; filename="a-photo-for-kirti.webp"');
      return res.status(200).send(buffer);
    } catch (error) {
      console.error('[wishboard image]', error instanceof StorageNotConfiguredError ? 'Blob storage not configured' : 'Blob storage request failed');
      return res.status(503).json({ error: 'This photo could not be loaded. Please try again later.' });
    }
  };
}

export default createImageHandler();
