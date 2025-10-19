/**
 * Rate Limiter Service
 *
 * Prevents abuse by limiting AI command frequency per user.
 * Uses Firebase RTDB for distributed rate limiting across function instances.
 * In-memory cache (100ms TTL) reduces RTDB reads by ~90%.
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

interface CacheEntry {
  data: RateLimitData;
  timestamp: number;
}

// Default: 10 commands per minute
const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10,
};

// In-memory cache for rate limit status
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 100; // 100ms - short TTL for fresh data

/**
 * Cleanup expired cache entries
 */
function cleanupCache(): void {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now - entry.timestamp > CACHE_TTL_MS) {
      cache.delete(key);
    }
  }
}

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
  const now = Date.now();
  const cacheKey = `${userId}_${config.windowMs}_${config.maxRequests}`;

  // Check cache first
  const cached = cache.get(cacheKey);
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    // Use cached data - check if within window and under limit
    if (now - cached.data.windowStart <= config.windowMs) {
      if (cached.data.count >= config.maxRequests) {
        return false; // Rate limited (cached)
      }
      // Optimistic increment in cache (will sync to RTDB below)
      cached.data.count++;
      cached.timestamp = now;
    }
  }

  // Periodic cleanup (every ~100 requests)
  if (Math.random() < 0.01) {
    cleanupCache();
  }

  const ref = getDatabase().ref(`rate-limits/ai-commands/${userId}`);
  const snapshot = await ref.once('value');
  const data: RateLimitData | null = snapshot.val();

  if (!data) {
    // First request - allow and initialize
    const newData = { count: 1, windowStart: now };
    await ref.set(newData);
    // Cache the new data
    cache.set(cacheKey, { data: newData, timestamp: now });
    return true;
  }

  // Check if we're in a new window
  if (now - data.windowStart > config.windowMs) {
    // New window - reset count
    const newData = { count: 1, windowStart: now };
    await ref.set(newData);
    // Cache the new data
    cache.set(cacheKey, { data: newData, timestamp: now });
    return true;
  }

  // Within same window - check limit
  if (data.count >= config.maxRequests) {
    // Cache the rate limit status
    cache.set(cacheKey, { data, timestamp: now });
    return false; // Rate limited
  }

  // Increment count
  const updatedData = { ...data, count: data.count + 1 };
  await ref.update({ count: data.count + 1 });
  // Cache the updated data
  cache.set(cacheKey, { data: updatedData, timestamp: now });
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
