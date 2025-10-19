/**
 * Icon Detection Utilities
 *
 * Provides functions to detect app icon bounds within DALL-E generated images.
 * DALL-E typically renders app icons centered on smooth gradient backgrounds.
 * This utility detects the solid icon region by analyzing color variance.
 */

/**
 * Icon bounds result
 */
export interface IconBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Calculate color variance for a region
 * Higher variance = more complex/detailed area (icon)
 * Lower variance = smooth gradient (background)
 */
function calculateColorVariance(
  imageData: ImageData,
  startX: number,
  startY: number,
  sampleWidth: number,
  sampleHeight: number
): number {
  const data = imageData.data;
  const width = imageData.width;

  let rSum = 0;
  let gSum = 0;
  let bSum = 0;
  let count = 0;

  // Calculate mean color
  for (let y = startY; y < startY + sampleHeight; y++) {
    for (let x = startX; x < startX + sampleWidth; x++) {
      if (x >= width || y >= imageData.height) continue;

      const i = (y * width + x) * 4;
      rSum += data[i];
      gSum += data[i + 1];
      bSum += data[i + 2];
      count++;
    }
  }

  if (count === 0) return 0;

  const rMean = rSum / count;
  const gMean = gSum / count;
  const bMean = bSum / count;

  // Calculate variance from mean
  let variance = 0;
  for (let y = startY; y < startY + sampleHeight; y++) {
    for (let x = startX; x < startX + sampleWidth; x++) {
      if (x >= width || y >= imageData.height) continue;

      const i = (y * width + x) * 4;
      const rDiff = data[i] - rMean;
      const gDiff = data[i + 1] - gMean;
      const bDiff = data[i + 2] - bMean;

      variance += rDiff * rDiff + gDiff * gDiff + bDiff * bDiff;
    }
  }

  return variance / count;
}

/**
 * Find edge by scanning from outside toward center
 * Returns the first position where variance exceeds threshold
 */
function findEdge(
  imageData: ImageData,
  direction: 'left' | 'right' | 'top' | 'bottom',
  varianceThreshold: number
): number {
  const { width, height } = imageData;
  const sampleSize = 10; // Sample 10x10 regions for variance

  switch (direction) {
    case 'left':
      for (let x = 0; x < width - sampleSize; x += 2) {
        const variance = calculateColorVariance(
          imageData,
          x,
          Math.floor(height / 2) - sampleSize / 2,
          sampleSize,
          sampleSize
        );
        if (variance > varianceThreshold) return x;
      }
      return 0;

    case 'right':
      for (let x = width - sampleSize; x > 0; x -= 2) {
        const variance = calculateColorVariance(
          imageData,
          x,
          Math.floor(height / 2) - sampleSize / 2,
          sampleSize,
          sampleSize
        );
        if (variance > varianceThreshold) return x + sampleSize;
      }
      return width;

    case 'top':
      for (let y = 0; y < height - sampleSize; y += 2) {
        const variance = calculateColorVariance(
          imageData,
          Math.floor(width / 2) - sampleSize / 2,
          y,
          sampleSize,
          sampleSize
        );
        if (variance > varianceThreshold) return y;
      }
      return 0;

    case 'bottom':
      for (let y = height - sampleSize; y > 0; y -= 2) {
        const variance = calculateColorVariance(
          imageData,
          Math.floor(width / 2) - sampleSize / 2,
          y,
          sampleSize,
          sampleSize
        );
        if (variance > varianceThreshold) return y + sampleSize;
      }
      return height;
  }
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
 * Detect app icon bounds within DALL-E generated image
 *
 * DALL-E generates app icons centered on smooth gradient backgrounds.
 * This function detects the icon by:
 * 1. Loading image to off-screen canvas
 * 2. Scanning from edges inward to find high variance regions (icon)
 * 3. Calculating tight bounding box around icon
 * 4. Adding safety margin to avoid clipping
 *
 * @param imageUrl - URL of image to analyze (data URL or Firebase Storage URL)
 * @returns Promise resolving to icon bounds (x, y, width, height in pixels)
 *
 * @throws {Error} If image fails to load
 * @throws {Error} If icon bounds cannot be detected
 *
 * @example
 * ```ts
 * const bounds = await detectIconBounds(imageUrl);
 * // Use bounds to crop image:
 * // { x: 120, y: 80, width: 800, height: 800 }
 * ```
 */
export async function detectIconBounds(imageUrl: string): Promise<IconBounds> {
  // Step 1: Load image
  const img = await loadImageElement(imageUrl);

  // Step 2: Create off-screen canvas
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    throw new Error('Failed to get canvas 2D context');
  }

  // Step 3: Draw image to canvas
  ctx.drawImage(img, 0, 0);

  // Step 4: Get pixel data
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  // Step 5: Calculate variance threshold
  // Sample center region to determine typical icon variance
  const centerX = Math.floor(canvas.width / 2);
  const centerY = Math.floor(canvas.height / 2);
  const centerVariance = calculateColorVariance(imageData, centerX - 50, centerY - 50, 100, 100);

  // Use 30% of center variance as threshold
  // This works because gradients have very low variance (<100)
  // while icons have high variance (>1000)
  const varianceThreshold = Math.max(centerVariance * 0.3, 200);

  console.log('[IconDetection] Center variance:', centerVariance, 'Threshold:', varianceThreshold);

  // Step 6: Find edges
  const left = findEdge(imageData, 'left', varianceThreshold);
  const right = findEdge(imageData, 'right', varianceThreshold);
  const top = findEdge(imageData, 'top', varianceThreshold);
  const bottom = findEdge(imageData, 'bottom', varianceThreshold);

  // Step 7: Calculate dimensions
  let width = right - left;
  let height = bottom - top;

  // Validate bounds
  if (width <= 0 || height <= 0) {
    throw new Error('Could not detect icon bounds - image may not be a DALL-E app icon');
  }

  // Step 8: Add safety margin (3% padding to avoid clipping)
  const safetyMargin = 0.03;
  const marginX = Math.floor(width * safetyMargin);
  const marginY = Math.floor(height * safetyMargin);

  const x = Math.max(0, left - marginX);
  const y = Math.max(0, top - marginY);
  width = Math.min(canvas.width - x, width + marginX * 2);
  height = Math.min(canvas.height - y, height + marginY * 2);

  console.log('[IconDetection] Detected bounds:', { x, y, width, height });

  return { x, y, width, height };
}
