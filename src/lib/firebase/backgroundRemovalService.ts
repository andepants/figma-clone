/**
 * Background Removal Service
 *
 * Frontend service to call Firebase removeImageBackground function.
 * Handles image background removal via Replicate's rembg API.
 */

import { functions } from './config';
import { httpsCallable } from 'firebase/functions';

/**
 * Request payload for background removal
 */
export interface RemoveBackgroundRequest {
  imageUrl: string;
  projectId: string;
  originalImageId: string;
}

/**
 * Response from background removal
 */
export interface RemoveBackgroundResponse {
  success: boolean;
  processedImageUrl?: string;
  storagePath?: string;
  naturalWidth?: number;
  naturalHeight?: number;
  fileSize?: number;
  error?: string;
  errorCode?: 'api_error' | 'download_failed' | 'upload_failed' | 'invalid_url' | 'timeout' | 'network_error';
}

/**
 * Remove background from image
 *
 * Calls Firebase Function to process image through Replicate's rembg API.
 * Processing typically takes 5-15 seconds. Function will wait up to 120 seconds.
 *
 * Accepts both HTTP(S) URLs (Firebase Storage) and data URLs (inline base64).
 * The service automatically handles both formats without additional processing needed.
 *
 * @param imageUrl - URL of image to process (Storage URL or data URL)
 * @param projectId - Current project/room ID
 * @param imageId - ID of original image object (for tracking)
 * @returns Promise with processed image URL and metadata
 *
 * @throws Error if Firebase function call fails
 *
 * @example
 * ```typescript
 * try {
 *   // Works with both storage URLs and data URLs
 *   const result = await removeImageBackground(
 *     image.src, // Can be Firebase Storage URL or data URL
 *     'main',
 *     image.id
 *   );
 *
 *   if (result.success) {
 *     console.log('Processed image:', result.processedImageUrl);
 *   } else {
 *     console.error('Failed:', result.error);
 *   }
 * } catch (error) {
 *   console.error('Function call failed:', error);
 * }
 * ```
 */
export async function removeImageBackground(
  imageUrl: string,
  projectId: string,
  imageId: string
): Promise<RemoveBackgroundResponse> {
  const callable = httpsCallable<RemoveBackgroundRequest, RemoveBackgroundResponse>(
    functions,
    'removeImageBackground'
  );

  const result = await callable({
    imageUrl,
    projectId,
    originalImageId: imageId,
  });

  return result.data;
}
