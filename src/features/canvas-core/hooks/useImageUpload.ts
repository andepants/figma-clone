/**
 * useImageUpload Hook
 *
 * React hook for uploading images and creating canvas objects.
 * Handles:
 * - File validation
 * - Upload progress tracking
 * - Error handling
 * - Upload cancellation
 * - Cleanup on unmount
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { useAuth } from '@/features/auth/hooks'
import { uploadImage, type UploadedImageData } from '@/lib/firebase/imageUploadService'

/**
 * Upload state tracking
 */
export interface UploadState {
  isUploading: boolean
  progress: number
  error: string | null
}

/**
 * useImageUpload hook options
 */
export interface UseImageUploadOptions {
  /** Project/canvas ID for Firebase storage path (defaults to 'main' for legacy support) */
  projectId?: string
}

/**
 * useImageUpload hook return type
 */
export interface UseImageUploadReturn {
  uploadImage: (file: File, position?: { x: number; y: number }) => Promise<UploadedImageData | null>
  cancelUpload: () => void
  isUploading: boolean
  uploadProgress: number
  uploadError: string | null
  resetUploadState: () => void
}

/**
 * Hook for uploading images to canvas
 *
 * Features:
 * - Progress tracking (0-100%)
 * - Error handling with user-friendly messages
 * - Upload cancellation via AbortController
 * - Automatic cleanup on component unmount
 * - Retry logic (3 attempts with exponential backoff)
 *
 * @param {UseImageUploadOptions} [options] - Hook options
 * @returns Upload functions and state
 *
 * @example
 * ```tsx
 * function ImageUploadButton() {
 *   const { uploadImage, isUploading, uploadProgress, uploadError } = useImageUpload({ projectId: 'my-project' })
 *
 *   const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
 *     const file = e.target.files?.[0]
 *     if (!file) return
 *
 *     const imageData = await uploadImage(file, { x: 100, y: 100 })
 *     if (imageData) {
 *       // Create canvas object with imageData
 *       console.log('Upload successful:', imageData)
 *     }
 *   }
 *
 *   return (
 *     <div>
 *       <input type="file" accept="image/*" onChange={handleFileChange} disabled={isUploading} />
 *       {isUploading && <div>Uploading: {uploadProgress}%</div>}
 *       {uploadError && <div>Error: {uploadError}</div>}
 *     </div>
 *   )
 * }
 * ```
 */
export function useImageUpload(options: UseImageUploadOptions = {}): UseImageUploadReturn {
  const { projectId = 'main' } = options
  const { currentUser } = useAuth()
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
  })

  // Track abort controller for cancellation
  const abortControllerRef = useRef<AbortController | null>(null)

  /**
   * Upload an image file with retry logic
   *
   * @param file - Image file to upload
   * @param maxRetries - Maximum retry attempts (default: 3)
   * @returns Promise resolving to upload result or null on failure
   */
  const uploadWithRetry = useCallback(
    async (
      file: File,
      roomId: string,
      userId: string,
      onProgress: (progress: number) => void,
      abortSignal: AbortSignal,
      maxRetries: number = 3
    ): Promise<UploadedImageData> => {
      let lastError: Error | null = null

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          return await uploadImage(file, roomId, userId, onProgress, abortSignal)
        } catch (error) {
          lastError = error instanceof Error ? error : new Error('Upload failed')

          // Don't retry if cancelled, invalid file, or too large
          if (
            lastError.message.includes('cancelled') ||
            lastError.message.includes('Upload cancelled') ||
            lastError.message.includes('Invalid') ||
            lastError.message.includes('too large') ||
            lastError.message.includes('not supported')
          ) {
            throw lastError
          }

          // Wait before retry (exponential backoff: 1s, 2s, 4s)
          if (attempt < maxRetries) {
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000)
            console.log(`Upload failed, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})...`)
            await new Promise((resolve) => setTimeout(resolve, delay))
          }
        }
      }

      throw lastError || new Error('Upload failed after retries')
    },
    []
  )

  /**
   * Upload an image file
   *
   * @param file - Image file to upload
   * @param _position - Optional position on canvas (unused, kept for API compatibility)
   * @returns Promise resolving to uploaded image data or null on error
   */
  const uploadImageFile = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async (file: File, _position?: { x: number; y: number }): Promise<UploadedImageData | null> => {
      if (!currentUser) {
        setUploadState({ isUploading: false, progress: 0, error: 'Not authenticated' })
        return null
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController()
      setUploadState({ isUploading: true, progress: 0, error: null })

      try {
        const result = await uploadWithRetry(
          file,
          projectId, // Use project-specific storage path
          currentUser.uid,
          (progress) => {
            setUploadState((prev) => ({ ...prev, progress: Math.round(progress) }))
          },
          abortControllerRef.current.signal
        )

        setUploadState({ isUploading: false, progress: 100, error: null })
        return result
      } catch (error) {
        // Handle cancellation separately
        if (error instanceof Error && error.message.includes('cancelled')) {
          setUploadState({ isUploading: false, progress: 0, error: null })
          return null
        }

        // Handle other errors
        const errorMessage = error instanceof Error ? error.message : 'Upload failed'
        setUploadState({ isUploading: false, progress: 0, error: errorMessage })
        return null
      } finally {
        abortControllerRef.current = null
      }
    },
    [currentUser, uploadWithRetry, projectId]
  )

  /**
   * Cancel current upload
   */
  const cancelUpload = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
  }, [])

  /**
   * Reset upload state
   */
  const resetUploadState = useCallback(() => {
    setUploadState({ isUploading: false, progress: 0, error: null })
  }, [])

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    uploadImage: uploadImageFile,
    cancelUpload,
    isUploading: uploadState.isUploading,
    uploadProgress: uploadState.progress,
    uploadError: uploadState.error,
    resetUploadState,
  }
}
