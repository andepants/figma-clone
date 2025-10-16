/**
 * Context Cache
 *
 * Caches optimized canvas context to reduce RTDB reads and optimization overhead.
 * TTL: 30 seconds (balance freshness vs performance)
 */

import {CanvasState} from "../../types";

interface CacheEntry {
  optimizedState: CanvasState;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();

const CACHE_TTL_MS = 30 * 1000; // 30 seconds

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
