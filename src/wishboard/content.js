// GIF choices are shared with the API so only curated media can be posted.
export const gifs = [
  { id: 'VbawWIGNtKYwOFXF7U', label: 'Sending you a hug' },
  { id: 'R6gvnAxj2ISzJdbA63', label: 'A whole lot of love' },
  { id: 'MDJ9IbxxvDUQM', label: 'Kitten kisses' },
  { id: 'gDfteqLchLcRTtjAD7', label: 'A heart full of love' },
];

export const colors = ['rose', 'butter', 'lavender', 'mint'];
export const MAX_NAME = 40;
export const MAX_MESSAGE = 600;
export const MAX_WISHES = 500;
export const MAX_IMAGE_SOURCE_BYTES = 10 * 1024 * 1024;
export const MAX_IMAGE_BYTES = 1024 * 1024;
export const MAX_IMAGE_EDGE = 1600;
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const WISH_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const IMAGE_HASH_PATTERN = /^[0-9a-f]{64}$/;
/** @param {string} id @param {string} hash */
export const imageUrlFor = (id, hash) => `/api/wish-image?id=${id}&v=${hash}`;
/** @param {unknown} url @param {string} id */
export function isSavedImageUrl(url, id) {
  if (typeof url !== 'string') return false;
  const match = url.match(/^\/api\/wish-image\?id=([0-9a-f-]{36})&v=([0-9a-f]{64})$/i);
  return Boolean(match && match[1] === id);
}
/** @param {string} id */
export const gifUrl = (id) => `https://media.giphy.com/media/${id}/giphy.gif`;
