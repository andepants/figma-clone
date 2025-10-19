/**
 * Image Upload Service
 *
 * Coordinates the complete image upload flow:
 * - File validation
 * - Compression
 * - Storage strategy determination
 * - Upload to Firebase Storage (for large files)
 * - Canvas object creation
 */

import type { ImageObject } from '@/types/canvas.types'
import {
  validateImageFile,
  compressImage,
  getImageDimensions,
  fileToDataURL,
  determineStorageStrategy,
  calculateDisplayDimensions,
} from '@/lib/utils/image'
import { uploadImageToStorage, deleteImageFromStorage, type UploadProgressCallback } from './storage'

/**
 * Uploaded image data for canvas object creation
 */
export interface UploadedImageData {
  src: string
  naturalWidth: number
  naturalHeight: number
  width: number
  height: number
  fileName: string
  fileSize: number
  mimeType: string
  storageType: 'dataURL' | 'storage'
  storagePath?: string
}

/**
 * Upload an image and prepare data for canvas object creation
 *
 * This function:
 * 1. Validates the image file
 * 2. Compresses the image (if needed)
 * 3. Determines storage strategy (data URL vs Firebase Storage)
 * 4. Uploads to Firebase Storage (if file is large)
 * 5. Returns image data ready for canvas object creation
 *
 * @param file - Image file to upload
 * @param roomId - Canvas/room identifier
 * @param userId - User ID (for ownership)
 * @param onProgress - Optional progress callback (0-100)
 * @param abortSignal - Optional abort signal for cancellation
 * @returns Promise resolving to uploaded image data
 *
 * @throws Error if validation or upload fails
 *
 * @example
 * ```ts
 * try {
 *   const imageData = await uploadImage(
 *     file,
 *     'main',
 *     'user123',
 *     (progress) => console.log(`${progress}%`)
 *   )
 *
 *   // Create canvas object with imageData
 *   const imageObject: ImageObject = {
 *     id: crypto.randomUUID(),
 *     type: 'image',
 *     x: 100,
 *     y: 100,
 *     ...imageData,
 *     createdBy: 'user123',
 *     createdAt: Date.now(),
 *     updatedAt: Date.now(),
 *   }
 * } catch (error) {
 *   console.error('Upload failed:', error)
 * }
 * ```
 */
export async function uploadImage(
  file: File,
  roomId: string,
  userId: string,
  onProgress?: UploadProgressCallback,
  abortSignal?: AbortSignal
): Promise<UploadedImageData> {
  // Step 1: Validate file
  const validation = validateImageFile(file)
  if (!validation.isValid) {
    throw new Error(validation.error)
  }

  // Report initial progress
  onProgress?.(5)

  // Step 2: Get image dimensions
  const { width: naturalWidth, height: naturalHeight } = await getImageDimensions(file)
  onProgress?.(10)

  // Step 3: Compress image (if needed)
  const compressedFile = await compressImage(file)
  onProgress?.(20)

  // Step 4: Calculate display dimensions
  const { width, height } = calculateDisplayDimensions(naturalWidth, naturalHeight)

  // Step 5: Determine storage strategy
  const storageType = determineStorageStrategy(compressedFile)

  let src: string
  let storagePath: string | undefined

  if (storageType === 'dataURL') {
    // Small file: Convert to data URL and store inline in RTDB
    src = await fileToDataURL(compressedFile)
    onProgress?.(100)
  } else {
    // Large file: Upload to Firebase Storage
    const uploadResult = await uploadImageToStorage(
      compressedFile,
      roomId,
      userId,
      (uploadProgress) => {
        // Map upload progress from 20% to 100%
        const mappedProgress = 20 + uploadProgress * 0.8
        onProgress?.(mappedProgress)
      },
      abortSignal
    )
    src = uploadResult.url
    storagePath = uploadResult.storagePath
  }

  return {
    src,
    naturalWidth,
    naturalHeight,
    width,
    height,
    fileName: file.name,
    fileSize: compressedFile.size,
    mimeType: file.type,
    storageType,
    storagePath,
  }
}

/**
 * Delete image storage if needed
 *
 * Only deletes from Firebase Storage if storageType === 'storage'.
 * Data URLs don't need cleanup.
 *
 * @param imageObject - Image object to delete storage for
 *
 * @example
 * ```ts
 * await deleteImageStorage(imageObject)
 * ```
 */
export async function deleteImageStorage(imageObject: ImageObject): Promise<void> {
  if (imageObject.storageType === 'storage' && imageObject.storagePath) {
    try {
      await deleteImageFromStorage(imageObject.storagePath)
    } catch (error) {
      console.error('Failed to delete image from storage:', error)
      // Don't throw - RTDB object can be deleted even if Storage cleanup fails
    }
  }
}
