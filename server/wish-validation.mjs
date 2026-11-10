import { colors, gifs, isSavedImageUrl, MAX_MESSAGE, MAX_NAME, WISH_ID_PATTERN } from '../src/wishboard/content.js';

export function validWish(wish) {
  return wish && typeof wish === 'object' && typeof wish.id === 'string' && WISH_ID_PATTERN.test(wish.id)
    && typeof wish.name === 'string' && wish.name.trim().length > 0 && wish.name.length <= MAX_NAME
    && typeof wish.message === 'string' && wish.message.trim().length > 0 && wish.message.length <= MAX_MESSAGE
    && colors.includes(wish.color)
    && (wish.gifId === null || gifs.some(gif => gif.id === wish.gifId));
}

export function validSavedWish(wish) {
  return validWish(wish) && typeof wish.createdAt === 'string' && !Number.isNaN(Date.parse(wish.createdAt))
    && (wish.imageUrl === undefined || wish.imageUrl === null || isSavedImageUrl(wish.imageUrl, wish.id));
}
