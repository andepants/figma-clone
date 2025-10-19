/**
 * Remove Image Background Handler
 *
 * Firebase callable function to remove background from canvas images.
 * Accepts both HTTP(S) URLs and data URLs for maximum flexibility.
 * Flow: Validate → Call Replicate API → Download result → Upload to Storage → Track usage
 */

import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';
import { getStorage } from '../services/firebase-admin';
import { getDatabase } from '../services/firebase-admin';
import { removeBackground } from '../services/replicate-background-removal';
import type { RemoveBackgroundRequest, RemoveBackgroundResponse } from '../types';

/**
 * Handler for removeImageBackground callable function
 *
 * @param request - Callable request with auth context and data
 * @returns Response with processed image URL or error
 */
export async function removeImageBackgroundHandler(
  request: CallableRequest<RemoveBackgroundRequest>
): Promise<RemoveBackgroundResponse> {
  const startTime = Date.now();

  try {
    // Validate authentication
    if (!request.auth) {
      logger.warn('Unauthenticated background removal request');
      throw new HttpsError('unauthenticated', 'You must be signed in to remove backgrounds');
    }

    const userId = request.auth.uid;
    const { imageUrl, projectId, originalImageId } = request.data;

    // Log ALL incoming data for debugging
    logger.info('=== FULL REQUEST DATA ===', {
      authUid: userId,
      requestData: JSON.stringify(request.data, null, 2),
      imageUrlLength: imageUrl?.length,
      imageUrlType: typeof imageUrl,
      imageUrlPreview: imageUrl?.substring(0, 200),
    });

    // Validate required fields
    if (!imageUrl || !projectId || !originalImageId) {
      logger.error('Missing required fields', {
        hasImageUrl: !!imageUrl,
        hasProjectId: !!projectId,
        hasOriginalImageId: !!originalImageId,
      });
      throw new HttpsError('invalid-argument', 'Missing required fields: imageUrl, projectId, originalImageId');
    }

    logger.info('Processing background removal request', {
      userId,
      projectId,
      originalImageId,
      imageUrl: imageUrl.substring(0, 100) + '...',
      imageUrlFull: imageUrl, // Log full URL
      isDataUrl: imageUrl.startsWith('data:'),
      isHttpUrl: imageUrl.startsWith('http'),
      isStorageUrl: imageUrl.includes('firebasestorage.googleapis.com') || imageUrl.includes('127.0.0.1:9199'),
    });

    // Test URL accessibility (if it's an HTTP URL, not a data URL)
    if (imageUrl.startsWith('http')) {
      try {
        logger.info('Testing URL accessibility...');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const testResponse = await fetch(imageUrl, {
          method: 'HEAD',
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        logger.info('URL accessibility test result', {
          status: testResponse.status,
          statusText: testResponse.statusText,
          contentType: testResponse.headers.get('content-type'),
          contentLength: testResponse.headers.get('content-length'),
          accessible: testResponse.ok,
        });
      } catch (urlError) {
        logger.error('URL accessibility test FAILED', {
          error: urlError instanceof Error ? urlError.message : 'Unknown error',
          url: imageUrl,
        });
        // Continue anyway - Replicate might still be able to access it
      }
    }

    // Step 1: Call Replicate API to remove background
    logger.info('Calling Replicate API', { imageUrl });
    const replicateResult = await removeBackground(imageUrl);

    if (!replicateResult.success || !replicateResult.resultUrl) {
      logger.error('Replicate background removal failed', {
        error: replicateResult.error,
        errorCode: replicateResult.errorCode,
      });

      // Track failed usage
      await trackUsage(userId, projectId, originalImageId, false, replicateResult.errorCode);

      return {
        success: false,
        error: replicateResult.error || 'Background removal failed',
        errorCode: replicateResult.errorCode || 'api_error',
      };
    }

    logger.info('Replicate processing successful', {
      resultUrl: replicateResult.resultUrl.substring(0, 100) + '...',
    });

    // Step 2: Download processed image from Replicate
    logger.info('Downloading processed image from Replicate');
    const downloadController = new AbortController();
    const downloadTimeoutId = setTimeout(() => downloadController.abort(), 30000);

    const downloadResponse = await fetch(replicateResult.resultUrl, {
      signal: downloadController.signal,
    });
    clearTimeout(downloadTimeoutId);

    if (!downloadResponse.ok) {
      throw new Error(`Failed to download processed image: ${downloadResponse.status}`);
    }

    const buffer = await downloadResponse.buffer();

    if (!buffer || buffer.length === 0) {
      throw new Error('Downloaded empty file from Replicate');
    }

    logger.info('Processed image downloaded', {
      sizeBytes: buffer.length,
      sizeKB: Math.round(buffer.length / 1024),
    });

    // Step 3: Upload to Firebase Storage
    const timestamp = Date.now();
    const uniqueId = uuidv4().slice(0, 8);
    const filename = `processed-images/${projectId}/${timestamp}-${uniqueId}.png`;

    logger.info('Uploading to Firebase Storage', { filename });

    const bucket = getStorage().bucket();
    const file = bucket.file(filename);

    await file.save(buffer, {
      metadata: {
        contentType: 'image/png',
        cacheControl: 'public, max-age=31536000', // Cache for 1 year
        metadata: {
          processedBy: 'replicate-rembg',
          userId,
          projectId,
          originalImageId,
          timestamp: timestamp.toString(),
          processedAt: new Date(timestamp).toISOString(),
        },
      },
    });

    logger.info('Uploaded to Firebase Storage successfully', { filename });

    // Step 4: Generate public download URL
    const bucketName = bucket.name;
    const encodedPath = encodeURIComponent(filename);

    // Detect if running in emulator
    const isEmulator =
      process.env.FIREBASE_STORAGE_EMULATOR_HOST !== undefined ||
      process.env.FIREBASE_DATABASE_EMULATOR_HOST !== undefined ||
      process.env.FUNCTIONS_EMULATOR === 'true';

    const publicUrl = isEmulator
      ? `http://127.0.0.1:9199/v0/b/${bucketName}/o/${encodedPath}?alt=media`
      : `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodedPath}?alt=media`;

    logger.info('Public URL generated', {
      url: publicUrl.substring(0, 100) + '...',
      isEmulator,
    });

    // Step 5: Get image dimensions (from downloaded buffer)
    // For now, we'll let the frontend handle dimensions via Image.onload
    // Alternatively, we could use sharp package here to get dimensions server-side

    // Step 6: Track usage in RTDB
    await trackUsage(userId, projectId, originalImageId, true);

    const duration = Date.now() - startTime;
    logger.info('Background removal completed successfully', {
      duration: `${duration}ms`,
      storagePath: filename,
      fileSize: buffer.length,
    });

    return {
      success: true,
      processedImageUrl: publicUrl,
      storagePath: filename,
      fileSize: buffer.length,
      // Note: naturalWidth and naturalHeight will be determined client-side
      // when the image loads in the browser
    };
  } catch (error: unknown) {
    const duration = Date.now() - startTime;
    const errorObj = error as {
      message?: string;
      code?: string;
      details?: unknown;
    };

    logger.error('Background removal handler error', {
      errorMessage: errorObj.message,
      errorCode: errorObj.code,
      duration: `${duration}ms`,
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Track failed usage if we have the data
    if (request.auth && request.data?.projectId && request.data?.originalImageId) {
      await trackUsage(
        request.auth.uid,
        request.data.projectId,
        request.data.originalImageId,
        false,
        'upload_failed'
      ).catch((trackError) => {
        logger.error('Failed to track usage', { error: trackError });
      });
    }

    // Map errors to user-friendly messages
    let errorMessage = 'Failed to remove background';
    let errorCode: RemoveBackgroundResponse['errorCode'] = 'api_error';

    if (errorObj.message?.includes('timeout')) {
      errorCode = 'timeout';
      errorMessage = 'Request timed out. Please try again.';
    } else if (errorObj.message?.includes('download')) {
      errorCode = 'download_failed';
      errorMessage = 'Failed to download processed image. Please try again.';
    } else if (errorObj.message?.includes('upload') || errorObj.message?.includes('Storage')) {
      errorCode = 'upload_failed';
      errorMessage = 'Failed to save processed image. Please try again.';
    } else if (errorObj.message) {
      errorMessage = `Background removal failed: ${errorObj.message}`;
    }

    return {
      success: false,
      error: errorMessage,
      errorCode,
    };
  }
}

/**
 * Track background removal usage in RTDB
 *
 * Stores usage data at: /usage/{userId}/backgroundRemoval/{timestamp}
 *
 * @param userId - User ID
 * @param projectId - Project ID
 * @param imageId - Original image object ID
 * @param success - Whether processing succeeded
 * @param errorCode - Error code if failed (optional)
 */
async function trackUsage(
  userId: string,
  projectId: string,
  imageId: string,
  success: boolean,
  errorCode?: string
): Promise<void> {
  try {
    const db = getDatabase();
    const timestamp = Date.now();
    const usageRef = db.ref(`usage/${userId}/backgroundRemoval/${timestamp}`);

    await usageRef.set({
      timestamp,
      projectId,
      imageId,
      success,
      ...(errorCode ? { errorCode } : {}),
    });

    logger.info('Usage tracked', { userId, projectId, success });
  } catch (error) {
    logger.error('Failed to track usage', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    // Don't throw - usage tracking failure shouldn't block the main flow
  }
}
