import type { ImageObject } from '@/types';

/**
 * Crop Renderer Utilities
 *
 * Provides functions to detect and render cropped portions of images.
 * Used for preprocessing cropped images before background removal.
 */

/**
 * Check if image has crop properties applied
 *
 * An image is considered cropped if:
 * - cropX or cropY is set and non-zero, OR
 * - cropWidth/cropHeight differs from naturalWidth/naturalHeight
 *
 * @param image - Image object to check
 * @returns True if image is cropped
 *
 * @example
 * ```ts
 * if (isCropped(imageObject)) {
 *   // Render cropped portion
 * } else {
 *   // Use original image
 * }
 * ```
 */
export function isCropped(image: ImageObject): boolean {
  // Check if crop position is non-zero
  const hasCropX = image.cropX !== undefined && image.cropX !== 0;
  const hasCropY = image.cropY !== undefined && image.cropY !== 0;

  // Check if crop dimensions differ from natural dimensions
  const hasCropWidth =
    image.cropWidth !== undefined &&
    image.cropWidth !== image.naturalWidth;
  const hasCropHeight =
    image.cropHeight !== undefined &&
    image.cropHeight !== image.naturalHeight;

  return hasCropX || hasCropY || hasCropWidth || hasCropHeight;
}

/**
 * Load image element from URL
 * Helper function to load HTMLImageElement with promise
 */
async function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (error) => reject(new Error(`Failed to load image: ${error}`));
    img.src = src;
  });
}

/**
 * Render cropped portion of image to PNG blob
 *
 * Creates an off-screen canvas, draws the cropped portion,
 * and converts to PNG blob for upload.
 *
 * @param imageSrc - Image source URL (data URL or Firebase Storage URL)
 * @param cropX - X position to start crop from source image
 * @param cropY - Y position to start crop from source image
 * @param cropWidth - Width of crop area from source image
 * @param cropHeight - Height of crop area from source image
 * @returns Promise resolving to PNG blob
 *
 * @throws {Error} If image fails to load
 * @throws {Error} If blob creation fails
 *
 * @example
 * ```ts
 * const blob = await renderCroppedImage(
 *   imageUrl,
 *   100, 50,  // Start at x=100, y=50
 *   400, 300  // Crop 400x300 area
 * );
 * // blob is ready to upload
 * ```
 */
export async function renderCroppedImage(
  imageSrc: string,
  cropX: number,
  cropY: number,
  cropWidth: number,
  cropHeight: number
): Promise<Blob> {
  // Step 1: Load image
  const img = await loadImageElement(imageSrc);

  // Step 2: Create off-screen canvas sized to crop dimensions
  const canvas = document.createElement('canvas');
  canvas.width = cropWidth;
  canvas.height = cropHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas 2D context');
  }

  // Step 3: Draw cropped portion
  // drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
  ctx.drawImage(
    img,
    cropX,
    cropY,
    cropWidth,
    cropHeight, // Source crop area
    0,
    0,
    cropWidth,
    cropHeight // Destination (full canvas)
  );

  // Step 4: Convert to blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob from canvas'));
        }
      },
      'image/png',
      1.0 // Max quality
    );
  });
}
