/**
 * Retry Utility
 *
 * Provides exponential backoff retry logic for async operations.
 * Useful for handling transient network errors and Firebase operations.
 */

/**
 * Firebase error interface
 */
interface FirebaseError extends Error {
  code?: string;
}

/**
 * Retries an async function with exponential backoff
 *
 * @param fn - The async function to retry
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @param baseDelay - Base delay in milliseconds (default: 1000ms)
 * @returns Promise resolving to the function's result
 * @throws The last error if all retries fail
 *
 * @example
 * ```typescript
 * const result = await retryAsync(
 *   () => updateCanvasObjects('main', objects),
 *   3,
 *   1000
 * );
 * ```
 */
export async function retryAsync<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      // Check if error is retriable
      if (!isRetriableError(error)) {
        throw error
      }

      // Don't delay after the last attempt
      if (attempt < maxRetries - 1) {
        // Exponential backoff: delay * (attempt + 1)
        // Attempt 0: 1s, Attempt 1: 2s, Attempt 2: 3s
        const delay = baseDelay * (attempt + 1)
        await sleep(delay)
      }
    }
  }

  // All retries exhausted
  throw lastError
}

/**
 * Sleep for a specified duration
 *
 * @param ms - Milliseconds to sleep
 * @returns Promise that resolves after the delay
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Determines if an error is retriable
 *
 * @param error - The error to check
 * @returns true if the error should be retried
 */
function isRetriableError(error: unknown): boolean {
  // Don't retry if error is not an Error object
  if (!(error instanceof Error)) {
    return false
  }

  // Firebase error codes that should NOT be retried
  const nonRetriableFirebaseErrors = [
    'permission-denied', // Auth/permission issue
    'unauthenticated', // User not logged in
    'invalid-argument', // Bad data
    'failed-precondition', // Precondition not met
    'already-exists', // Resource already exists
  ]

  // Check for Firebase error codes
  const firebaseError = error as FirebaseError
  if (firebaseError.code && nonRetriableFirebaseErrors.includes(firebaseError.code)) {
    return false
  }

  // Network errors and timeouts should be retried
  const retriableErrorMessages = [
    'network',
    'timeout',
    'unavailable',
    'connection',
    'ECONNREFUSED',
    'ETIMEDOUT',
  ]

  const errorMessage = error.message.toLowerCase()
  return retriableErrorMessages.some((msg) => errorMessage.includes(msg))
}

/**
 * Retries an async function with custom retry logic
 *
 * @param fn - The async function to retry
 * @param options - Retry options
 * @returns Promise resolving to the function's result
 *
 * @example
 * ```typescript
 * const result = await retryWithOptions(
 *   () => fetchData(),
 *   {
 *     maxRetries: 5,
 *     baseDelay: 500,
 *     maxDelay: 10000,
 *     shouldRetry: (error) => error.message.includes('503')
 *   }
 * );
 * ```
 */
export async function retryWithOptions<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number
    baseDelay?: number
    maxDelay?: number
    shouldRetry?: (error: unknown) => boolean
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    shouldRetry = isRetriableError,
  } = options

  let lastError: Error = new Error('No attempts made')

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      // Check if error should be retried
      if (!shouldRetry(error)) {
        throw error
      }

      // Don't delay after the last attempt
      if (attempt < maxRetries - 1) {
        // Exponential backoff with cap
        const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay)
        await sleep(delay)
      }
    }
  }

  throw lastError
}
