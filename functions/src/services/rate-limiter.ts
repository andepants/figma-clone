/**
 * Rate Limiter Service
 *
 * Prevents abuse by limiting AI command frequency per user.
 * Uses Firebase RTDB for distributed rate limiting across function instances.
 */

import { getDatabase } from './firebase-admin';

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

export interface RateLimitData {
  count: number;
  windowStart: number;
}

// Default: 10 commands per minute
const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10,
};

/**
 * Check if user is within rate limit for AI commands
 *
 * @param userId - Firebase auth user ID
 * @param config - Optional rate limit configuration
 * @returns true if request allowed, false if rate limited
 */
export async function checkRateLimit(
  userId: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): Promise<boolean> {
  const ref = getDatabase().ref(`rate-limits/ai-commands/${userId}`);
  const snapshot = await ref.once('value');
  const data: RateLimitData | null = snapshot.val();

  const now = Date.now();

  if (!data) {
    // First request - allow and initialize
    await ref.set({ count: 1, windowStart: now });
    return true;
  }

  // Check if we're in a new window
  if (now - data.windowStart > config.windowMs) {
    // New window - reset count
    await ref.set({ count: 1, windowStart: now });
    return true;
  }

  // Within same window - check limit
  if (data.count >= config.maxRequests) {
    return false; // Rate limited
  }

  // Increment count
  await ref.update({ count: data.count + 1 });
  return true;
}

/**
 * Get remaining requests for user in current window
 *
 * @param userId - Firebase auth user ID
 * @param config - Optional rate limit configuration
 * @returns number of requests remaining
 */
export async function getRemainingRequests(
  userId: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): Promise<number> {
  const ref = getDatabase().ref(`rate-limits/ai-commands/${userId}`);
  const snapshot = await ref.once('value');
  const data: RateLimitData | null = snapshot.val();

  if (!data) {
    return config.maxRequests;
  }

  const now = Date.now();

  // Check if we're in a new window
  if (now - data.windowStart > config.windowMs) {
    return config.maxRequests;
  }

  return Math.max(0, config.maxRequests - data.count);
}

/**
 * Get time until rate limit resets
 *
 * @param userId - Firebase auth user ID
 * @param config - Optional rate limit configuration
 * @returns milliseconds until reset, or 0 if not limited
 */
export async function getResetTime(
  userId: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): Promise<number> {
  const ref = getDatabase().ref(`rate-limits/ai-commands/${userId}`);
  const snapshot = await ref.once('value');
  const data: RateLimitData | null = snapshot.val();

  if (!data) {
    return 0;
  }

  const now = Date.now();
  const windowEnd = data.windowStart + config.windowMs;

  if (now >= windowEnd) {
    return 0;
  }

  return windowEnd - now;
}
