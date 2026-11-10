import { colors, gifs, isSavedImageUrl } from './content.js';

export type Wish = {
  id: string;
  name: string;
  message: string;
  color: string;
  gifId: string | null;
  imageUrl?: string | null;
  createdAt: string;
};

export function isWish(value: unknown): value is Wish {
  if (!value || typeof value !== 'object') return false;
  const wish = value as Record<string, unknown>;
  return typeof wish.id === 'string' && typeof wish.name === 'string'
    && typeof wish.message === 'string' && typeof wish.createdAt === 'string'
    && !Number.isNaN(Date.parse(wish.createdAt))
    && typeof wish.color === 'string' && colors.includes(wish.color)
    && (wish.imageUrl === undefined || wish.imageUrl === null || isSavedImageUrl(wish.imageUrl, wish.id))
    && (wish.gifId === null || gifs.some(gif => gif.id === wish.gifId));
}
