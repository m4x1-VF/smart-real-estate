/**
 * Client-side image optimization using Canvas API.
 * Resizes images exceeding MAX_DIMENSION and compresses to JPEG at JPEG_QUALITY.
 */

export const MAX_DIMENSION = 1920;
export const JPEG_QUALITY = 0.85;

/**
 * Resizes (if exceeding MAX_DIMENSION) and compresses (JPEG 85%) an image
 * using Canvas API. Returns a Blob with type "image/jpeg".
 */
export async function optimizeImage(file: File): Promise<Blob> {
  // 1. Decode the image file into an ImageBitmap
  const bitmap = await createImageBitmap(file);

  // 2. Calculate output dimensions
  let { width, height } = bitmap;
  const longestSide = Math.max(width, height);

  if (longestSide > MAX_DIMENSION) {
    const scale = MAX_DIMENSION / longestSide;
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  // 3. Create canvas with output dimensions
  const canvas = new OffscreenCanvas(width, height);

  // 4. Draw the image onto the canvas
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Image optimization failed: could not get 2d context');
  }
  ctx.drawImage(bitmap, 0, 0, width, height);

  // Clean up the bitmap
  bitmap.close();

  // 5. Convert to JPEG Blob
  const blob = await canvas.convertToBlob({
    type: 'image/jpeg',
    quality: JPEG_QUALITY,
  });

  if (!blob) {
    throw new Error('Image optimization failed: canvas returned null');
  }

  return blob;
}
