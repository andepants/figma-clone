/**
 * Image Pool - LRU Cache for HTMLImageElement
 *
 * Implements an LRU (Least Recently Used) cache for loaded images to improve performance.
 * Prevents re-loading the same image multiple times and manages memory usage.
 *
 * Features:
 * - LRU eviction policy (oldest accessed images are evicted first)
 * - Maximum cache size: 50 images
 * - Maximum memory usage: 200MB
 * - Automatic cleanup when limits exceeded
 * - Cache statistics for debugging
 */

/**
 * Cache entry storing image and metadata
 */
interface CacheEntry {
  /** Loaded HTMLImageElement */
  image: HTMLImageElement;
  /** URL/src of the image */
  src: string;
  /** Estimated memory usage in bytes */
  size: number;
  /** Timestamp of last access (for LRU) */
  lastAccessed: number;
}

/**
 * Cache statistics
 */
interface CacheStats {
  /** Number of cached images */
  count: number;
  /** Total memory usage in bytes */
  totalSize: number;
  /** Number of cache hits */
  hits: number;
  /** Number of cache misses */
  misses: number;
}

/**
 * Image pool interface
 */
interface ImagePoolAPI {
  /** Get image from cache or load if not cached */
  getImage: (src: string) => Promise<HTMLImageElement>;
  /** Clear all cached images */
  clear: () => void;
  /** Remove specific image from cache */
  remove: (src: string) => boolean;
  /** Check if image is in cache */
  has: (src: string) => boolean;
  /** Get current cache size (number of images) */
  size: number;
  /** Get cache statistics for debugging */
  getCacheStats: () => CacheStats;
}

/**
 * Create an image pool with LRU caching
 *
 * Factory function that creates an image pool instance using closure
 * to encapsulate private state.
 *
 * @returns Image pool API
 *
 * @example
 * ```typescript
 * const pool = createImagePool();
 * const img = await pool.getImage('https://example.com/image.png');
 * ```
 */
function createImagePool(): ImagePoolAPI {
  /** Maximum number of cached images */
  const MAX_IMAGES = 50;

  /** Maximum total memory in bytes (200MB) */
  const MAX_MEMORY = 200 * 1024 * 1024;

  /** Cache storage (Map maintains insertion order) */
  const cache = new Map<string, CacheEntry>();

  /** Cache hit counter */
  let hits = 0;

  /** Cache miss counter */
  let misses = 0;

  /**
   * Load image from URL
   *
   * @param src - Image source URL or data URL
   * @returns Promise resolving to loaded HTMLImageElement
   */
  function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new window.Image();

      // CRITICAL FIX: Don't set crossOrigin for Firebase Storage URLs
      // Firebase Storage getDownloadURL() returns URLs with embedded access tokens
      // Setting crossOrigin='anonymous' prevents auth credentials from being sent
      // This causes 403 errors in production when storage rules require authentication
      //
      // Only set crossOrigin for true cross-origin URLs that need CORS
      const isFirebaseStorage = src.includes('firebasestorage.googleapis.com') || src.includes(':9199');
      const isDataURL = src.startsWith('data:');
      const isSameOrigin = src.startsWith('/') || src.startsWith(window.location.origin);

      // Only set crossOrigin for external URLs that aren't Firebase Storage
      if (!isFirebaseStorage && !isDataURL && !isSameOrigin) {
        img.crossOrigin = 'anonymous';
      }

      console.log('[ImagePool] Loading image:', {
        srcPreview: src.substring(0, 100) + '...',
        srcLength: src.length,
        isDataURL,
        isFirebaseStorage,
        isSameOrigin,
        crossOrigin: img.crossOrigin || 'not-set',
        hasToken: src.includes('token=') || src.includes('alt=media'),
      });

      img.onload = () => {
        console.log('[ImagePool] Image loaded successfully:', {
          srcPreview: src.substring(0, 100) + '...',
          width: img.width,
          height: img.height,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
        });
        resolve(img);
      };

      img.onerror = (error) => {
        // Enhanced error logging for debugging production issues
        const errorDetails = {
          srcPreview: src.substring(0, 100) + '...',
          srcLength: src.length,
          isDataURL,
          isFirebaseStorage,
          crossOrigin: img.crossOrigin || 'not-set',
          error: error,
          errorType: error?.constructor?.name || 'unknown',
          // Try to extract more error details if available
          ...(error instanceof ErrorEvent && {
            message: error.message,
            filename: error.filename,
            lineno: error.lineno,
            colno: error.colno,
          }),
        };

        console.error('[ImagePool] Failed to load image:', errorDetails);

        // Create detailed error message
        const errorMsg = `Failed to load image: ${src.substring(0, 100)}... (${isFirebaseStorage ? 'Firebase Storage' : isDataURL ? 'Data URL' : 'External URL'})`;
        reject(new Error(errorMsg));
      };

      img.src = src;
    });
  }

  /**
   * Calculate current cache statistics
   * Helper for internal use
   */
  function getStats(): { count: number; totalSize: number } {
    let totalSize = 0;

    cache.forEach((entry) => {
      totalSize += entry.size;
    });

    return {
      count: cache.size,
      totalSize,
    };
  }

  /**
   * Evict the oldest (least recently used) entry
   * Map maintains insertion order, so first entry is the oldest
   */
  function evictOldest(): void {
    // Get first (oldest) entry
    const firstKey = cache.keys().next().value;
    if (firstKey) {
      cache.delete(firstKey);
    }
  }

  /**
   * Evict entries if cache limits exceeded
   * Uses LRU policy: removes oldest accessed images first
   */
  function evictIfNeeded(): void {
    // Check if eviction needed
    const stats = getStats();

    // Evict if count exceeds limit
    while (cache.size > MAX_IMAGES) {
      evictOldest();
    }

    // Evict if memory exceeds limit
    let currentStats = stats;
    while (currentStats.totalSize > MAX_MEMORY && cache.size > 0) {
      evictOldest();
      // Recalculate stats
      currentStats = getStats();
    }
  }

  /**
   * Add image to cache
   * Handles eviction if cache limits exceeded
   *
   * @param src - Image source URL
   * @param image - Loaded HTMLImageElement
   */
  function addToCache(src: string, image: HTMLImageElement): void {
    // Estimate memory usage (width × height × 4 bytes per pixel)
    const size = image.width * image.height * 4;

    // Create cache entry
    const entry: CacheEntry = {
      image,
      src,
      size,
      lastAccessed: Date.now(),
    };

    // Add to cache
    cache.set(src, entry);

    // Evict if necessary
    evictIfNeeded();
  }

  /**
   * Get image from cache or load if not cached
   *
   * @param src - Image source URL or data URL
   * @returns Promise resolving to HTMLImageElement
   *
   * @example
   * ```typescript
   * const img = await imagePool.getImage('https://example.com/image.png');
   * ```
   */
  async function getImage(src: string): Promise<HTMLImageElement> {
    // Check if image is in cache
    const cached = cache.get(src);

    if (cached) {
      // Cache hit - update last accessed time and move to end (most recent)
      hits++;
      cached.lastAccessed = Date.now();
      cache.delete(src);
      cache.set(src, cached);
      return cached.image;
    }

    // Cache miss - load image
    misses++;
    const image = await loadImage(src);

    // Add to cache
    addToCache(src, image);

    return image;
  }

  /**
   * Clear all cached images
   * Useful for testing or freeing memory
   *
   * @example
   * ```typescript
   * imagePool.clear();
   * ```
   */
  function clear(): void {
    cache.clear();
    hits = 0;
    misses = 0;
  }

  /**
   * Remove specific image from cache
   *
   * @param src - Image source to remove
   * @returns True if image was removed, false if not in cache
   *
   * @example
   * ```typescript
   * imagePool.remove('https://example.com/old-image.png');
   * ```
   */
  function remove(src: string): boolean {
    return cache.delete(src);
  }

  /**
   * Check if image is in cache
   *
   * @param src - Image source to check
   * @returns True if image is cached
   *
   * @example
   * ```typescript
   * if (imagePool.has('https://example.com/image.png')) {
   *   console.log('Image is cached');
   * }
   * ```
   */
  function has(src: string): boolean {
    return cache.has(src);
  }

  /**
   * Get cache statistics for debugging
   *
   * @returns Cache statistics including count, size, hits, and misses
   *
   * @example
   * ```typescript
   * const stats = imagePool.getCacheStats();
   * console.log(`Cache: ${stats.count} images, ${stats.hits} hits, ${stats.misses} misses`);
   * ```
   */
  function getCacheStats(): CacheStats {
    const stats = getStats();
    return {
      count: stats.count,
      totalSize: stats.totalSize,
      hits,
      misses,
    };
  }

  // Return public API
  return {
    getImage,
    clear,
    remove,
    has,
    getCacheStats,
    get size() {
      return cache.size;
    },
  };
}

/**
 * Global image pool instance
 * Singleton pattern for shared cache across application
 */
export const imagePool = createImagePool();
