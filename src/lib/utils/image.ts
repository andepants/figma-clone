/**
 * Image Utilities
 *
 * Utilities for handling image files:
 * - Validation (file type, size)
 * - Compression
 * - Data URL conversion
 * - Dimension calculation
 */

import imageCompression from 'browser-image-compression'

/**
 * Storage strategy threshold
 * - Files <100KB: Stored as data URLs in RTDB
 * - Files >=100KB: Stored in Firebase Storage
 */
export const STORAGE_THRESHOLD = 100 * 1024 // 100KB in bytes

/**
 * Maximum file size (10MB)
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB in bytes

/**
 * Supported image MIME types
 */
export const SUPPORTED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/webp',
  'image/svg+xml',
] as const

/**
 * Image validation result
 */
export interface ImageValidationResult {
  isValid: boolean
  error?: string
}

/**
 * Check if file is HEIF/HEIC format (iPhone photos)
 *
 * @param file - File to check
 * @returns True if HEIF/HEIC format
 */
function isHEIFFormat(file: File): boolean {
  return (
    file.type === 'image/heif' ||
    file.type === 'image/heic' ||
    file.name.toLowerCase().endsWith('.heif') ||
    file.name.toLowerCase().endsWith('.heic')
  )
}

/**
 * Validate an image file
 *
 * Checks:
 * - File size (must be <= 10MB)
 * - MIME type (must be supported image format)
 * - HEIF/HEIC detection (not supported)
 *
 * @param file - File to validate
 * @returns Validation result with error message if invalid
 *
 * @example
 * ```ts
 * const result = validateImageFile(file)
 * if (!result.isValid) {
 *   console.error(result.error)
 * }
 * ```
 */
export function validateImageFile(file: File): ImageValidationResult {
  // Check for HEIF format (not supported in most browsers)
  if (isHEIFFormat(file)) {
    return {
      isValid: false,
      error: 'HEIF/HEIC format not supported. Please convert to JPG or PNG first.',
    }
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / 1024 / 1024).toFixed(1)
    return {
      isValid: false,
      error: `File too large (${sizeMB}MB). Maximum size is 10MB.`,
    }
  }

  // Check MIME type
  if (!SUPPORTED_MIME_TYPES.includes(file.type as typeof SUPPORTED_MIME_TYPES[number])) {
    return {
      isValid: false,
      error: `File type not supported: ${file.type}. Supported formats: PNG, JPG, GIF, WebP, SVG.`,
    }
  }

  return { isValid: true }
}

/**
 * Compress an image file
 *
 * - Skips compression for files <100KB (already small enough for data URLs)
 * - Skips compression for SVG files (already optimized)
 * - Compresses larger files to reduce upload time and storage costs
 * - Uses fallback if compression increases file size (rare but possible)
 *
 * @param file - File to compress
 * @returns Promise resolving to compressed file (or original if compression failed/unnecessary)
 *
 * @example
 * ```ts
 * const compressedFile = await compressImage(file)
 * console.log(`Size reduced: ${file.size} → ${compressedFile.size}`)
 * ```
 */
export async function compressImage(file: File): Promise<File> {
  // Skip compression for small files
  if (file.size < STORAGE_THRESHOLD) {
    return file
  }

  // Skip compression for SVG (already optimized)
  if (file.type === 'image/svg+xml') {
    return file
  }

  try {
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: file.type as 'image/jpeg' | 'image/png' | 'image/webp',
    }

    const compressedFile = await imageCompression(file, options)

    // Check if compression increased size (rare but possible with highly-optimized images)
    if (compressedFile.size > file.size) {
      console.log(`Compression increased size, using original: ${file.name}`)
      return file // Use original
    }

    console.log(
      `Compressed ${file.name}: ${(file.size / 1024).toFixed(1)}KB → ${(compressedFile.size / 1024).toFixed(1)}KB`
    )
    return compressedFile
  } catch (error) {
    console.error('Compression failed, using original file:', error)
    return file
  }
}

/**
 * Convert a file to a data URL
 *
 * @param file - File to convert
 * @returns Promise resolving to data URL string
 *
 * @example
 * ```ts
 * const dataURL = await fileToDataURL(file)
 * // dataURL: "data:image/png;base64,iVBORw0KGgo..."
 * ```
 */
export function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

/**
 * Get image dimensions from a file
 *
 * @param file - Image file
 * @returns Promise resolving to {width, height}
 *
 * @example
 * ```ts
 * const { width, height } = await getImageDimensions(file)
 * console.log(`Image size: ${width}×${height}`)
 * ```
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      })
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }

    img.src = url
  })
}

/**
 * Calculate display dimensions for an image on canvas
 *
 * Scales image to fit within max dimensions while maintaining aspect ratio.
 * Ensures minimum dimensions of 1×1px to prevent rendering issues.
 *
 * @param naturalWidth - Original image width
 * @param naturalHeight - Original image height
 * @param maxWidth - Maximum display width (default: 400)
 * @param maxHeight - Maximum display height (default: 400)
 * @returns Display dimensions {width, height}
 *
 * @example
 * ```ts
 * // 2000×1000 image scaled to fit 400×400 canvas
 * const dims = calculateDisplayDimensions(2000, 1000)
 * // Result: {width: 400, height: 200}
 *
 * // 10000×1 extremely wide image
 * const dims = calculateDisplayDimensions(10000, 1)
 * // Result: {width: 400, height: 1} (minimum 1px height)
 * ```
 */
export function calculateDisplayDimensions(
  naturalWidth: number,
  naturalHeight: number,
  maxWidth: number = 400,
  maxHeight: number = 400
): { width: number; height: number } {
  const aspectRatio = naturalWidth / naturalHeight

  let width = naturalWidth
  let height = naturalHeight

  // Scale down if larger than max dimensions
  if (width > maxWidth) {
    width = maxWidth
    height = width / aspectRatio
  }

  if (height > maxHeight) {
    height = maxHeight
    width = height * aspectRatio
  }

  // Ensure minimum dimensions (prevent 0px with extreme aspect ratios)
  const MIN_DIMENSION = 1
  width = Math.max(MIN_DIMENSION, Math.round(width))
  height = Math.max(MIN_DIMENSION, Math.round(height))

  return { width, height }
}

/**
 * Determine storage strategy based on file size
 *
 * @param file - File to check
 * @returns 'dataURL' for small files (<100KB), 'storage' for larger files
 *
 * @example
 * ```ts
 * const strategy = determineStorageStrategy(file)
 * if (strategy === 'dataURL') {
 *   // Store inline in RTDB
 * } else {
 *   // Upload to Firebase Storage
 * }
 * ```
 */
export function determineStorageStrategy(file: File): 'dataURL' | 'storage' {
  return file.size < STORAGE_THRESHOLD ? 'dataURL' : 'storage'
}
