import { IMAGE_TYPES, MAX_IMAGE_BYTES, MAX_IMAGE_EDGE, MAX_IMAGE_SOURCE_BYTES } from './content.js';

export async function preparePhoto(file: File): Promise<string> {
  if (!IMAGE_TYPES.includes(file.type)) {
    throw new Error('Please choose a JPG, PNG, or WebP photo. SVGs and other file types are not supported.');
  }
  if (!file.size || file.size > MAX_IMAGE_SOURCE_BYTES) {
    throw new Error('Please choose a photo smaller than 10 MB.');
  }
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    try {
      await image.decode();
    } catch {
      throw new Error('This photo could not be opened. Please choose another image.');
    }
    if (!image.naturalWidth || !image.naturalHeight || image.naturalWidth * image.naturalHeight > 50000000) {
      throw new Error('This photo is too large to prepare. Please choose a smaller image.');
    }
    const scale = Math.min(1, MAX_IMAGE_EDGE / image.naturalWidth, MAX_IMAGE_EDGE / image.naturalHeight);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('This browser could not prepare your photo. Please try another browser.');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.86, 0.72, 0.58]) {
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      if (atob(dataUrl.slice(dataUrl.indexOf(',') + 1)).length <= MAX_IMAGE_BYTES) return dataUrl;
    }
    throw new Error('This photo is still too large. Please choose a smaller image.');
  } finally {
    URL.revokeObjectURL(url);
  }
}
