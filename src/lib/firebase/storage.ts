/**
 * Firebase Storage Service
 *
 * Provides utilities for interacting with Firebase Cloud Storage:
 * - Create storage references for images
 * - Upload files to storage
 * - Get download URLs
 * - Delete files from storage
 */

import { storage } from './config'
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  type StorageReference,
  type UploadTask,
} from 'firebase/storage'

/**
 * Create a storage reference for an image
 *
 * Path structure: /images/{roomId}/{userId}/{timestamp}_{fileName}
 *
 * @param roomId - Canvas/room identifier
 * @param userId - User ID (for ownership validation)
 * @param fileName - Original file name
 * @returns Storage reference
 *
 * @example
 * ```ts
 * const imageRef = createImageRef('main', 'user123', 'photo.png')
 * // Path: /images/main/user123/1634567890123_photo.png
 * ```
 */
export function createImageRef(roomId: string, userId: string, fileName: string): StorageReference {
  const timestamp = Date.now()
  const randomSuffix = Math.random().toString(36).substring(2, 8) // 6 random chars
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
  const path = `images/${roomId}/${userId}/${timestamp}_${randomSuffix}_${sanitizedFileName}`
  return ref(storage, path)
}

/**
 * Upload progress callback
 *
 * @param progress - Upload progress (0-100)
 */
export type UploadProgressCallback = (progress: number) => void

/**
 * Upload result
 *
 * @property url - Download URL for the uploaded file
 * @property storagePath - Full storage path (e.g., 'images/main/user123/1234_photo.png')
 */
export interface UploadResult {
  url: string
  storagePath: string
}

/**
 * Upload a file to Firebase Storage
 *
 * @param file - File to upload
 * @param roomId - Canvas/room identifier
 * @param userId - User ID (for ownership)
 * @param onProgress - Optional progress callback (0-100)
 * @param abortSignal - Optional abort signal for cancellation
 * @returns Promise resolving to download URL and storage path
 *
 * @throws Error if upload fails
 *
 * @example
 * ```ts
 * try {
 *   const { url, storagePath } = await uploadImageToStorage(
 *     file,
 *     'main',
 *     'user123',
 *     (progress) => console.log(`${progress}% uploaded`)
 *   )
 *   console.log('Image uploaded:', url)
 * } catch (error) {
 *   console.error('Upload failed:', error)
 * }
 * ```
 */
export async function uploadImageToStorage(
  file: File,
  roomId: string,
  userId: string,
  onProgress?: UploadProgressCallback,
  abortSignal?: AbortSignal
): Promise<UploadResult> {
  const storageRef = createImageRef(roomId, userId, file.name)
  const uploadTask: UploadTask = uploadBytesResumable(storageRef, file, {
    contentType: file.type,
  })

  // Listen for abort signal
  if (abortSignal) {
    abortSignal.addEventListener('abort', () => {
      uploadTask.cancel()
    })
  }

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        onProgress?.(progress)
      },
      (error) => {
        // Check if cancelled
        if (error.code === 'storage/canceled') {
          reject(new Error('Upload cancelled'))
        } else {
          reject(new Error(`Upload failed: ${error.message}`))
        }
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
        resolve({
          url: downloadURL,
          storagePath: storageRef.fullPath,
        })
      }
    )
  })
}

/**
 * Delete an image from Firebase Storage
 *
 * @param storagePath - Full storage path (e.g., 'images/main/user123/1234_photo.png')
 * @returns Promise resolving when deletion completes
 *
 * @throws Error if deletion fails
 *
 * @example
 * ```ts
 * try {
 *   await deleteImageFromStorage('images/main/user123/1234_photo.png')
 *   console.log('Image deleted')
 * } catch (error) {
 *   console.error('Deletion failed:', error)
 * }
 * ```
 */
export async function deleteImageFromStorage(storagePath: string): Promise<void> {
  const storageRef = ref(storage, storagePath)
  await deleteObject(storageRef)
}

/**
 * Get download URL for a storage path
 *
 * @param storagePath - Full storage path
 * @returns Promise resolving to download URL
 *
 * @throws Error if file doesn't exist or access denied
 *
 * @example
 * ```ts
 * const url = await getImageDownloadURL('images/main/user123/1234_photo.png')
 * console.log('Download URL:', url)
 * ```
 */
export async function getImageDownloadURL(storagePath: string): Promise<string> {
  const storageRef = ref(storage, storagePath)
  return await getDownloadURL(storageRef)
}
