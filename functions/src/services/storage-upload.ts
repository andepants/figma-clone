/**
 * Firebase Storage Upload Service
 *
 * Handles downloading images from OpenAI (which expire after 1 hour)
 * and uploading them to Firebase Storage for permanent storage.
 *
 * Storage structure:
 * ai-generated/{userId}/icon/{timestamp}-{uuid}.png
 * ai-generated/{userId}/feature/{timestamp}-{uuid}.png
 *
 * @see https://firebase.google.com/docs/storage
 * @see functions/src/ai/tools/generateAppIcon.ts (usage example)
 */

import { getStorage } from './firebase-admin';
import fetch from 'node-fetch';
import * as logger from 'firebase-functions/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * Result from storage upload operation
 * @interface UploadImageResult
 */
interface UploadImageResult {
  /** Whether upload succeeded */
  success: boolean;
  /** Public URL for accessing image */
  publicUrl?: string;
  /** Storage path (for deletion/management) */
  storagePath?: string;
  /** Error message if failed */
  error?: string;
  /** Error code for programmatic handling */
  errorCode?: 'download_failed' | 'upload_failed' | 'quota_exceeded' | 'invalid_url';
}

/**
 * Download image from URL and upload to Firebase Storage
 *
 * Downloads image from OpenAI's temporary URL (expires in 1 hour)
 * and uploads to Firebase Storage for permanent public access.
 *
 * Includes retry logic for transient network failures.
 *
 * @param imageUrl - OpenAI image URL (temporary, expires in 1 hour)
 * @param userId - User ID (for organizing storage)
 * @param type - Image type (for organizing storage and metadata)
 * @returns Upload result with public URL
 *
 * @example
 * const result = await uploadImageFromUrl(
 *   'https://oaidalleapiprodscus.blob.core.windows.net/...',
 *   'user123',
 *   'icon'
 * );
 *
 * if (result.success) {
 *   console.log('Public URL:', result.publicUrl);
 * }
 */
export async function uploadImageFromUrl(
  imageUrl: string,
  userId: string,
  type: 'icon' | 'feature',
  retryCount = 0
): Promise<UploadImageResult> {
  const startTime = Date.now();
  const MAX_RETRIES = 2;
  let currentStep = 'validation';

  try {
    // Validate inputs
    logger.info('Starting image upload from URL', {
      urlPreview: imageUrl.substring(0, 80) + '...',
      userId,
      type,
      retry: retryCount,
    });

    if (!imageUrl || !imageUrl.startsWith('http')) {
      logger.error('Invalid image URL provided', { imageUrl });
      return {
        success: false,
        error: 'Invalid image URL',
        errorCode: 'invalid_url',
      };
    }

    if (!userId || userId.trim().length === 0) {
      logger.error('Missing user ID');
      return {
        success: false,
        error: 'User ID required',
        errorCode: 'upload_failed',
      };
    }

    currentStep = 'download';
    logger.info('Downloading image from OpenAI', {
      url: imageUrl.substring(0, 50) + '...',
      userId,
      type,
      retry: retryCount,
    });

    // Download image with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

    logger.info('Fetching image from URL', {
      timeout: '30000ms',
      urlLength: imageUrl.length,
    });

    const response = await fetch(imageUrl, {
      signal: controller.signal as AbortSignal,
    });

    clearTimeout(timeoutId);

    logger.info('Fetch response received', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      contentType: response.headers.get('content-type'),
      contentLength: response.headers.get('content-length'),
    });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.status} ${response.statusText}`);
    }

    currentStep = 'buffer_conversion';
    logger.info('Converting response to buffer');

    const buffer = await response.buffer();

    if (!buffer || buffer.length === 0) {
      logger.error('Downloaded empty file', {
        hasBuffer: !!buffer,
        bufferLength: buffer?.length || 0,
      });
      throw new Error('Downloaded empty file');
    }

    logger.info('Image downloaded successfully', {
      sizeBytes: buffer.length,
      sizeKB: Math.round(buffer.length / 1024),
      sizeMB: (buffer.length / (1024 * 1024)).toFixed(2),
    });

    // Generate unique filename with timestamp and UUID
    currentStep = 'filename_generation';
    const timestamp = Date.now();
    const uniqueId = uuidv4().slice(0, 8);
    const filename = `ai-generated/${userId}/${type}/${timestamp}-${uniqueId}.png`;

    logger.info('Generated filename', {
      filename,
      userId,
      type,
      timestamp,
      uniqueId,
    });

    currentStep = 'storage_initialization';
    logger.info('Uploading to Firebase Storage', {
      filename,
      userId,
      type,
    });

    // Get storage bucket
    logger.info('Getting storage bucket');
    const bucket = getStorage().bucket();
    logger.info('Storage bucket obtained', {
      bucketName: bucket.name || 'default',
      hasName: !!bucket.name,
    });

    const file = bucket.file(filename);
    logger.info('File reference created', {
      filename,
      fileExists: 'checking...',
    });

    // Upload with metadata
    currentStep = 'file_upload';
    logger.info('Starting file upload to Firebase Storage', {
      filename,
      bufferSize: buffer.length,
      contentType: 'image/png',
    });

    await file.save(buffer, {
      metadata: {
        contentType: 'image/png',
        cacheControl: 'public, max-age=31536000', // Cache for 1 year
        metadata: {
          generatedBy: 'dalle-3',
          userId,
          type,
          timestamp: timestamp.toString(),
          generatedAt: new Date(timestamp).toISOString(),
        },
      },
    });

    logger.info('File saved to storage successfully', { filename });

    // Make file publicly accessible
    currentStep = 'make_public';
    logger.info('Making file publicly accessible');

    await file.makePublic();

    logger.info('File made public successfully');

    // Construct public URL
    currentStep = 'url_construction';
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;

    const duration = Date.now() - startTime;

    logger.info('Image uploaded successfully to storage', {
      filename,
      publicUrl: publicUrl.substring(0, 80) + '...',
      publicUrlLength: publicUrl.length,
      duration: `${duration}ms`,
      sizeKB: Math.round(buffer.length / 1024),
      finalStep: currentStep,
    });

    return {
      success: true,
      publicUrl,
      storagePath: filename,
    };
  } catch (error: unknown) {
    const duration = Date.now() - startTime;
    const errorObj = error as {
      message?: string;
      name?: string;
      code?: string;
      stack?: string;
    };

    logger.error('Storage upload failed', {
      currentStep, // Shows which step failed
      errorMessage: errorObj.message,
      errorName: errorObj.name,
      errorCode: errorObj.code,
      stack: errorObj.stack,
      userId,
      type,
      retry: retryCount,
      duration: `${duration}ms`,
      fullError: JSON.stringify(error, null, 2).substring(0, 500),
    });

    // Retry logic for transient errors
    const isTransientError =
      errorObj.message?.includes('ECONNRESET') ||
      errorObj.message?.includes('timeout') ||
      errorObj.message?.includes('ETIMEDOUT') ||
      errorObj.message?.includes('socket hang up');

    if (isTransientError && retryCount < MAX_RETRIES) {
      logger.info('Retrying upload due to transient error', {
        currentStep,
        attempt: retryCount + 1,
        maxRetries: MAX_RETRIES,
      });
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
      return uploadImageFromUrl(imageUrl, userId, type, retryCount + 1);
    }

    // Determine error code
    let errorCode: UploadImageResult['errorCode'] = 'upload_failed';
    let errorMessage = 'Failed to upload image to storage';

    if (errorObj.message?.includes('quota') || errorObj.message?.includes('QUOTA')) {
      errorCode = 'quota_exceeded';
      errorMessage = 'Storage quota exceeded. Please contact support.';
    } else if (errorObj.message?.includes('Download failed')) {
      errorCode = 'download_failed';
      errorMessage = 'Failed to download image from OpenAI. Please try again.';
    } else if (errorObj.name === 'AbortError' || errorObj.message?.includes('timeout')) {
      errorCode = 'download_failed';
      errorMessage = 'Image download timed out. Please try again.';
    } else if (errorObj.message) {
      // Include actual error message for debugging
      errorMessage = `Failed during ${currentStep}: ${errorObj.message}`;
    }

    return {
      success: false,
      error: errorMessage,
      errorCode,
    };
  }
}

/**
 * Delete image from Firebase Storage
 *
 * Useful for cleanup or regeneration workflows.
 *
 * @param storagePath - Storage path from upload result
 * @returns Success status
 */
export async function deleteImage(storagePath: string): Promise<boolean> {
  try {
    const bucket = getStorage().bucket();
    const file = bucket.file(storagePath);
    await file.delete();

    logger.info('Image deleted from storage', { storagePath });
    return true;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to delete image', { error: errorMessage, storagePath });
    return false;
  }
}
