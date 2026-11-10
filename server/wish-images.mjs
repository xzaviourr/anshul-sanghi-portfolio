import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { MAX_IMAGE_BYTES, MAX_IMAGE_EDGE } from '../src/wishboard/content.js';

export class ImageValidationError extends Error {}

export async function prepareStoredPhoto(dataUrl) {
  if (dataUrl === undefined || dataUrl === null) return null;
  if (typeof dataUrl !== 'string') throw new ImageValidationError('Please attach a valid photo.');
  const match = dataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/);
  if (!match) throw new ImageValidationError('Only JPG, PNG, and WebP photos are supported.');
  if (match[2].length > Math.ceil(MAX_IMAGE_BYTES / 3) * 4) {
    throw new ImageValidationError('The prepared photo must be smaller than 1 MB.');
  }
  const input = Buffer.from(match[2], 'base64');
  if (!input.length || input.length > MAX_IMAGE_BYTES || input.toString('base64') !== match[2]) {
    throw new ImageValidationError('The photo is too large or could not be read.');
  }
  const signatureMatches = match[1] === 'image/jpeg'
    ? input.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))
    : match[1] === 'image/png'
      ? input.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
      : input.subarray(0, 4).toString() === 'RIFF' && input.subarray(8, 12).toString() === 'WEBP';
  if (!signatureMatches) throw new ImageValidationError('This file is not a valid JPG, PNG, or WebP photo.');
  let output;
  try {
    const image = sharp(input, { limitInputPixels: 20000000, failOn: 'warning' });
    const metadata = await image.metadata();
    if (metadata.pages && metadata.pages > 1) {
      throw new ImageValidationError('Please attach a still photo. Use the GIF picker for animations.');
    }
    // Re-encoding validates the file and strips EXIF/location metadata.
    output = await image.rotate().resize({
      width: MAX_IMAGE_EDGE, height: MAX_IMAGE_EDGE, fit: 'inside', withoutEnlargement: true,
    }).webp({ quality: 82 }).toBuffer();
  } catch (error) {
    if (error instanceof ImageValidationError) throw error;
    throw new ImageValidationError('This photo could not be processed. Please choose another image.');
  }
  if (output.length > MAX_IMAGE_BYTES) throw new ImageValidationError('Please choose a smaller photo.');
  return { buffer: output, hash: createHash('sha256').update(input).digest('hex') };
}
