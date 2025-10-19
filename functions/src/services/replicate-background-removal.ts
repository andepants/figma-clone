/**
 * Replicate Background Removal Service
 *
 * Handles background removal using Replicate's rembg model.
 * Uses synchronous API with "Prefer: wait" header for immediate results.
 *
 * API Documentation:
 * @see https://replicate.com/cjwbw/rembg/api
 * @see https://replicate.com/docs/reference/http
 */

import fetch from 'node-fetch';
import * as logger from 'firebase-functions/logger';

/**
 * Result from background removal operation
 * @interface RemoveBackgroundResult
 */
interface RemoveBackgroundResult {
  /** Whether removal succeeded */
  success: boolean;
  /** URL of processed image (PNG with transparent background) */
  resultUrl?: string;
  /** Error message if failed */
  error?: string;
  /** Error code for programmatic handling */
  errorCode?: 'api_error' | 'timeout' | 'invalid_url' | 'network_error' | 'download_failed';
}

/**
 * Remove background from image using Replicate rembg API
 *
 * Makes synchronous request to Replicate API with "Prefer: wait" header.
 * Waits for processing to complete (typically 5-15 seconds).
 * Includes retry logic for transient network failures.
 *
 * Accepts both HTTP(S) URLs and data URLs:
 * - HTTP(S) URLs are downloaded and converted to base64 data URLs
 * - Data URLs are used directly without additional processing
 *
 * @param imageUrl - Public HTTP(S) URL or data URL of image to process
 * @param retryCount - Internal retry counter (default: 0)
 * @returns Promise with result containing processed image URL
 *
 * @example
 * // With HTTP URL
 * const result1 = await removeBackground('https://example.com/image.jpg');
 *
 * // With data URL
 * const result2 = await removeBackground('data:image/png;base64,...');
 *
 * if (result1.success) {
 *   console.log('Processed image:', result1.resultUrl);
 * }
 */
export async function removeBackground(
  imageUrl: string,
  retryCount = 0
): Promise<RemoveBackgroundResult> {
  const startTime = Date.now();
  const MAX_RETRIES = 2;

  try {
    // Validate API token exists
    if (!process.env.REPLICATE_API_TOKEN) {
      logger.error('REPLICATE_API_TOKEN not configured');
      return {
        success: false,
        error: 'Replicate API token not configured',
        errorCode: 'api_error',
      };
    }

    // Validate image URL (allow both HTTP URLs and data URLs)
    const isDataUrl = imageUrl.startsWith('data:');
    const isHttpUrl = imageUrl.startsWith('http://') || imageUrl.startsWith('https://');

    if (!imageUrl || (!isDataUrl && !isHttpUrl)) {
      logger.error('Invalid image URL', {
        imageUrl: imageUrl.substring(0, 100) + '...',
        startsWithData: isDataUrl,
        startsWithHttp: isHttpUrl,
      });
      return {
        success: false,
        error: 'Invalid image URL - must be a public HTTP(S) URL or data URL',
        errorCode: 'invalid_url',
      };
    }

    logger.info('Starting background removal', {
      imageUrl: imageUrl.substring(0, 100) + '...',
      retry: retryCount,
      imageType: isDataUrl ? 'data-url' : 'http-url',
    });

    // Step 1: Get data URL (either directly or by downloading and converting)
    let dataUrl: string;

    if (isDataUrl) {
      // Already a data URL - use directly
      logger.info('Using provided data URL directly');
      dataUrl = imageUrl;
    } else {
      // HTTP(S) URL - download and convert to base64 data URL
      logger.info('Downloading source image from URL');
      const downloadResponse = await fetch(imageUrl, {
        timeout: 30000, // 30s timeout
      });

      if (!downloadResponse.ok) {
        logger.error('Failed to download source image', {
          status: downloadResponse.status,
          statusText: downloadResponse.statusText,
        });
        return {
          success: false,
          error: `Failed to download source image: ${downloadResponse.status} ${downloadResponse.statusText}`,
          errorCode: 'download_failed',
        };
      }

      const imageBuffer = await downloadResponse.buffer();

      if (!imageBuffer || imageBuffer.length === 0) {
        logger.error('Downloaded empty image file');
        return {
          success: false,
          error: 'Downloaded empty image file',
          errorCode: 'download_failed',
        };
      }

      // Detect MIME type from response headers or default to image/png
      const contentType = downloadResponse.headers.get('content-type') || 'image/png';
      const mimeType = contentType.split(';')[0]; // Remove any charset info

      logger.info('Source image downloaded', {
        sizeBytes: imageBuffer.length,
        sizeKB: Math.round(imageBuffer.length / 1024),
        mimeType,
      });

      // Convert to base64 data URL
      const base64Image = imageBuffer.toString('base64');
      dataUrl = `data:${mimeType};base64,${base64Image}`;

      logger.info('Converted to base64 data URL', {
        dataUrlLength: dataUrl.length,
        dataUrlPreview: dataUrl.substring(0, 50) + '...',
      });
    }

    // Step 2: Make API request with Prefer: wait for synchronous response
    const requestBody = {
      version: 'fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003',
      input: {
        image: dataUrl, // Send base64 data URL instead of Firebase Storage URL
      },
    };

    logger.info('=== REPLICATE API REQUEST ===', {
      url: 'https://api.replicate.com/v1/predictions',
      version: requestBody.version,
      hasApiToken: !!process.env.REPLICATE_API_TOKEN,
      apiTokenLength: process.env.REPLICATE_API_TOKEN?.length,
      dataUrlPreview: dataUrl.substring(0, 100),
      dataUrlLength: dataUrl.length,
      isValidDataUrl: dataUrl.startsWith('data:'),
      dataUrlMimeType: dataUrl.split(';')[0].replace('data:', ''),
    });

    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
        'Prefer': 'wait', // Wait for result instead of polling
      },
      body: JSON.stringify(requestBody),
      // 60s timeout (Replicate can take up to 60s with Prefer: wait)
      timeout: 60000,
    });

    logger.info('=== REPLICATE API RESPONSE ===', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: JSON.stringify(Object.fromEntries(response.headers.entries())),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('=== REPLICATE API ERROR ===', {
        status: response.status,
        statusText: response.statusText,
        errorResponseFull: errorText,
        errorResponsePreview: errorText.substring(0, 500),
        requestDataUrlLength: dataUrl.length,
        requestDataUrlPreview: dataUrl.substring(0, 200),
      });

      // Try to parse error as JSON for more details
      try {
        const errorJson = JSON.parse(errorText);
        logger.error('Parsed error response', { errorJson });
      } catch {
        logger.info('Error response is not JSON');
      }

      throw new Error(`Replicate API error: ${response.status} ${response.statusText}`);
    }

    // Parse response
    const data = await response.json() as {
      output?: string | string[];
      status?: string;
      error?: string;
    };

    logger.info('Replicate response parsed', {
      hasOutput: !!data.output,
      status: data.status,
      hasError: !!data.error,
    });

    // Check for API errors
    if (data.error) {
      logger.error('Replicate processing error', { error: data.error });
      return {
        success: false,
        error: `Background removal failed: ${data.error}`,
        errorCode: 'api_error',
      };
    }

    // Extract result URL
    // Replicate rembg returns output as string (single image URL) or array
    let resultUrl: string | undefined;
    if (typeof data.output === 'string') {
      resultUrl = data.output;
    } else if (Array.isArray(data.output) && data.output.length > 0) {
      resultUrl = data.output[0];
    }

    if (!resultUrl) {
      logger.error('No output in Replicate response', {
        output: data.output,
        status: data.status,
      });
      return {
        success: false,
        error: 'No processed image in response',
        errorCode: 'api_error',
      };
    }

    const duration = Date.now() - startTime;
    logger.info('Background removal successful', {
      duration: `${duration}ms`,
      resultUrl: resultUrl.substring(0, 100) + '...',
    });

    return {
      success: true,
      resultUrl,
    };
  } catch (error: unknown) {
    const duration = Date.now() - startTime;
    const errorObj = error as {
      message?: string;
      type?: string;
      code?: string;
      name?: string;
    };

    logger.error('Background removal failed', {
      errorMessage: errorObj.message,
      errorType: errorObj.type,
      errorName: errorObj.name,
      retry: retryCount,
      duration: `${duration}ms`,
    });

    // Retry logic for transient errors
    const isTransientError =
      errorObj.message?.includes('ECONNRESET') ||
      errorObj.message?.includes('timeout') ||
      errorObj.message?.includes('ETIMEDOUT') ||
      errorObj.message?.includes('socket hang up') ||
      errorObj.name === 'FetchError';

    if (isTransientError && retryCount < MAX_RETRIES) {
      logger.info('Retrying background removal due to transient error', {
        attempt: retryCount + 1,
        maxRetries: MAX_RETRIES,
      });

      // Wait before retry (exponential backoff: 1s, 2s)
      await new Promise((resolve) => setTimeout(resolve, 1000 * (retryCount + 1)));
      return removeBackground(imageUrl, retryCount + 1);
    }

    // Determine error code
    let errorCode: RemoveBackgroundResult['errorCode'] = 'api_error';
    let errorMessage = 'Failed to remove background';

    if (errorObj.message?.includes('timeout') || errorObj.name === 'AbortError') {
      errorCode = 'timeout';
      errorMessage = 'Background removal timed out. Please try again.';
    } else if (errorObj.message?.includes('network') || errorObj.name === 'FetchError') {
      errorCode = 'network_error';
      errorMessage = 'Network error during background removal. Please try again.';
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
