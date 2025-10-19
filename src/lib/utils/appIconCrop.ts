/**
 * App Icon Crop Orchestrator
 *
 * Orchestrates the two-step workflow for cropping and cleaning app icons:
 * 1. Detect icon bounds within DALL-E image
 * 2. Render cropped portion
 * 3. Upload to Firebase Storage (temporary)
 * 4. Remove background via Replicate API
 * 5. Create new image object with result
 * 6. Clean up temporary file
 */

import type { ImageObject, CanvasObject } from '@/types';
import { detectIconBounds } from './iconDetection';
import { renderCroppedImage } from './cropRenderer';
import { uploadImageToStorage, deleteImageFromStorage } from '@/lib/firebase/storage';
import { removeImageBackground } from '@/lib/firebase/backgroundRemovalService';
import { toast } from 'sonner';

/**
 * Crop app icon result
 */
export interface CropAppIconResult {
  success: boolean;
  error?: string;
}

/**
 * Crop app icon from DALL-E image and remove background
 *
 * Complete workflow:
 * 1. Detect icon bounds using variance analysis
 * 2. Crop to icon bounds
 * 3. Upload cropped image (temporary)
 * 4. Remove background via Replicate
 * 5. Create new processed image object
 * 6. Clean up temporary file
 *
 * @param imageObject - Original image object from canvas
 * @param projectId - Current project ID
 * @param userId - Current user ID
 * @param createProcessedImage - Canvas store function to create processed image
 * @returns Promise resolving to success status
 *
 * @example
 * ```ts
 * const result = await cropAppIcon(
 *   imageObject,
 *   'project123',
 *   'user456',
 *   createProcessedImage
 * );
 *
 * if (result.success) {
 *   console.log('Icon cropped and background removed!');
 * } else {
 *   console.error('Failed:', result.error);
 * }
 * ```
 */
export async function cropAppIcon(
  imageObject: ImageObject,
  projectId: string,
  userId: string,
  createProcessedImage: (
    original: CanvasObject,
    processed: {
      url: string;
      storagePath: string;
      naturalWidth?: number;
      naturalHeight?: number;
      fileSize: number;
    },
    userId: string
  ) => Promise<void>
): Promise<CropAppIconResult> {
  let tempStoragePath: string | undefined;

  try {
    // Step 1: Detect icon bounds
    toast.info('Detecting icon bounds...', {
      description: 'Analyzing image to find app icon',
      duration: 2000,
    });

    console.log('[AppIconCrop] Starting detection for image:', imageObject.id);

    const bounds = await detectIconBounds(imageObject.src);

    console.log('[AppIconCrop] Detected bounds:', bounds);

    // Step 2: Render cropped portion
    toast.info('Cropping icon...', {
      description: `Extracting ${bounds.width}x${bounds.height}px region`,
      duration: 2000,
    });

    const croppedBlob = await renderCroppedImage(
      imageObject.src,
      bounds.x,
      bounds.y,
      bounds.width,
      bounds.height
    );

    console.log('[AppIconCrop] Cropped to blob:', {
      size: croppedBlob.size,
      type: croppedBlob.type,
    });

    // Step 3: Upload cropped image (temporary)
    toast.info('Uploading cropped image...', {
      description: 'Preparing for background removal',
      duration: 2000,
    });

    const croppedFile = new File(
      [croppedBlob],
      `cropped-temp-${Date.now()}-${imageObject.fileName}`,
      { type: 'image/png' }
    );

    const uploadResult = await uploadImageToStorage(croppedFile, projectId, userId);

    tempStoragePath = uploadResult.storagePath;

    console.log('[AppIconCrop] Uploaded temp cropped image:', {
      url: uploadResult.url,
      path: tempStoragePath,
    });

    // Step 4: Remove background
    toast.info('Removing background...', {
      description: 'This may take 5-15 seconds',
      duration: 3000,
    });

    const bgRemovalResult = await removeImageBackground(uploadResult.url, projectId, imageObject.id);

    if (!bgRemovalResult.success || !bgRemovalResult.processedImageUrl || !bgRemovalResult.storagePath) {
      throw new Error(bgRemovalResult.error || 'Background removal failed');
    }

    console.log('[AppIconCrop] Background removed:', {
      processedUrl: bgRemovalResult.processedImageUrl,
      processedPath: bgRemovalResult.storagePath,
    });

    // Step 5: Get processed image dimensions
    const img = new Image();
    img.crossOrigin = 'anonymous';

    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = bgRemovalResult.processedImageUrl!;
    });

    console.log('[AppIconCrop] Processed image dimensions:', {
      width: img.naturalWidth,
      height: img.naturalHeight,
    });

    // Step 6: Create new processed image object
    // Position offset: 50px right, 50px down from original
    await createProcessedImage(
      imageObject,
      {
        url: bgRemovalResult.processedImageUrl,
        storagePath: bgRemovalResult.storagePath,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        fileSize: bgRemovalResult.fileSize || imageObject.fileSize,
      },
      userId
    );

    console.log('[AppIconCrop] Created processed image object');

    // Step 7: Clean up temporary file
    if (tempStoragePath) {
      try {
        await deleteImageFromStorage(tempStoragePath);
        console.log('[AppIconCrop] Deleted temp file:', tempStoragePath);
      } catch (error) {
        console.warn('[AppIconCrop] Failed to cleanup temp file:', error);
        // Don't fail entire operation if cleanup fails
      }
    }

    toast.success('App icon cropped and cleaned!', {
      description: 'New image created next to original',
      duration: 3000,
    });

    return { success: true };
  } catch (error) {
    console.error('[AppIconCrop] Failed:', error);

    // Clean up temp file on error
    if (tempStoragePath) {
      try {
        await deleteImageFromStorage(tempStoragePath);
        console.log('[AppIconCrop] Cleaned up temp file after error');
      } catch (cleanupError) {
        console.warn('[AppIconCrop] Failed to cleanup temp file after error:', cleanupError);
      }
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    toast.error('Failed to crop app icon', {
      description: errorMessage,
      duration: 5000,
    });

    return { success: false, error: errorMessage };
  }
}
