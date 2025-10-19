/**
 * Context Cache
 *
 * Caches optimized canvas context to reduce RTDB reads and optimization overhead.
 * Also caches LLM responses for identical commands.
 * TTL: 5 minutes (balance freshness vs performance)
 */

import {CanvasState} from "../../types";
import * as crypto from "crypto";

interface CacheEntry {
  optimizedState: CanvasState;
  timestamp: number;
}

interface ResponseCacheEntry {
  response: unknown; // LLM response
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const responseCache = new Map<string, ResponseCacheEntry>();

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Get cached optimized context
 *
 * @param cacheKey - Unique key for this canvas state
 * @returns Cached state or null if expired/missing
 */
export function getCachedContext(cacheKey: string): CanvasState | null {
  const entry = cache.get(cacheKey);

  if (!entry) return null;

  const age = Date.now() - entry.timestamp;
  if (age > CACHE_TTL_MS) {
    cache.delete(cacheKey);
    return null;
  }

  return entry.optimizedState;
}

/**
 * Store optimized context in cache
 *
 * @param cacheKey - Unique key
 * @param optimizedState - Optimized canvas state
 */
export function setCachedContext(
  cacheKey: string,
  optimizedState: CanvasState
): void {
  cache.set(cacheKey, {
    optimizedState,
    timestamp: Date.now(),
  });

  // Cleanup: Remove expired entries (max 100 entries)
  if (cache.size > 100) {
    const now = Date.now();
    for (const [key, entry] of cache.entries()) {
      if (now - entry.timestamp > CACHE_TTL_MS) {
        cache.delete(key);
      }
    }
  }
}

/**
 * Generate cache key from canvas state
 *
 * @param canvasState - Canvas state
 * @returns Hash-based cache key
 */
export function generateCacheKey(canvasState: CanvasState): string {
  // Simple hash: canvas size + object count + selected IDs
  const selectedHash = canvasState.selectedObjectIds?.sort().join(",") || "";
  return `${canvasState.canvasSize.width}x${canvasState.canvasSize.height}_${canvasState.objects.length}_${selectedHash}`;
}

/**
 * Generate response cache key from command and canvas state summary
 *
 * @param command - User's command
 * @param canvasState - Canvas state
 * @returns Hash-based cache key
 */
export function generateResponseCacheKey(
  command: string,
  canvasState: CanvasState
): string {
  // Hash includes: normalized command + object count + selected objects
  const normalized = command.toLowerCase().trim();
  const selectedIds = (canvasState.selectedObjectIds || []).sort().join(",");
  const objectCount = canvasState.objects.length;

  // Create a deterministic hash
  const hash = crypto
    .createHash("md5")
    .update(`${normalized}|${objectCount}|${selectedIds}`)
    .digest("hex");

  return `resp_${hash}`;
}

/**
 * Get cached LLM response
 *
 * @param cacheKey - Response cache key
 * @returns Cached response or null if expired/missing
 */
export function getCachedResponse(cacheKey: string): unknown | null {
  const entry = responseCache.get(cacheKey);

  if (!entry) return null;

  const age = Date.now() - entry.timestamp;
  if (age > CACHE_TTL_MS) {
    responseCache.delete(cacheKey);
    return null;
  }

  return entry.response;
}

/**
 * Store LLM response in cache
 *
 * @param cacheKey - Response cache key
 * @param response - LLM response to cache
 */
export function setCachedResponse(cacheKey: string, response: unknown): void {
  responseCache.set(cacheKey, {
    response,
    timestamp: Date.now(),
  });

  // Cleanup: Remove expired entries (max 50 entries)
  if (responseCache.size > 50) {
    const now = Date.now();
    for (const [key, entry] of responseCache.entries()) {
      if (now - entry.timestamp > CACHE_TTL_MS) {
        responseCache.delete(key);
      }
    }
  }
}
