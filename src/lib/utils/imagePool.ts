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
 * Cache statistics for debugging
 */
export interface CacheStats {
  /** Number of images currently cached */
  count: number;
  /** Total memory usage in bytes */
  totalSize: number;
  /** Total memory usage in MB */
  totalSizeMB: number;
  /** Cache hit rate (0-1) */
  hitRate: number;
  /** Total cache hits */
  hits: number;
  /** Total cache misses */
  misses: number;
}

/**
 * Image Pool class implementing LRU cache
 */
class ImagePool {
  /** Maximum number of cached images */
  private readonly MAX_IMAGES = 50;

  /** Maximum total memory in bytes (200MB) */
  private readonly MAX_MEMORY = 200 * 1024 * 1024;

  /** Cache storage (Map maintains insertion order) */
  private cache = new Map<string, CacheEntry>();

  /** Cache hit counter */
  private hits = 0;

  /** Cache miss counter */
  private misses = 0;

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
  async getImage(src: string): Promise<HTMLImageElement> {
    // Check if image is in cache
    const cached = this.cache.get(src);

    if (cached) {
      // Cache hit - update last accessed time and move to end (most recent)
      this.hits++;
      cached.lastAccessed = Date.now();
      this.cache.delete(src);
      this.cache.set(src, cached);
      return cached.image;
    }

    // Cache miss - load image
    this.misses++;
    const image = await this.loadImage(src);

    // Add to cache
    this.addToCache(src, image);

    return image;
  }

  /**
   * Load image from URL
   *
   * @param src - Image source URL or data URL
   * @returns Promise resolving to loaded HTMLImageElement
   */
  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.crossOrigin = 'anonymous'; // Allow cross-origin images from Firebase Storage

      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`));

      img.src = src;
    });
  }

  /**
   * Add image to cache
   * Handles eviction if cache limits exceeded
   *
   * @param src - Image source URL
   * @param image - Loaded HTMLImageElement
   */
  private addToCache(src: string, image: HTMLImageElement): void {
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
    this.cache.set(src, entry);

    // Evict if necessary
    this.evictIfNeeded();
  }

  /**
   * Evict entries if cache limits exceeded
   * Uses LRU policy: removes oldest accessed images first
   */
  private evictIfNeeded(): void {
    // Check if eviction needed
    const stats = this.getStats();

    // Evict if count exceeds limit
    while (this.cache.size > this.MAX_IMAGES) {
      this.evictOldest();
    }

    // Evict if memory exceeds limit
    while (stats.totalSize > this.MAX_MEMORY && this.cache.size > 0) {
      this.evictOldest();
      // Recalculate stats
      const newStats = this.getStats();
      stats.totalSize = newStats.totalSize;
    }
  }

  /**
   * Evict the oldest (least recently used) entry
   * Map maintains insertion order, so first entry is the oldest
   */
  private evictOldest(): void {
    // Get first (oldest) entry
    const firstKey = this.cache.keys().next().value;
    if (firstKey) {
      this.cache.delete(firstKey);
    }
  }

  /**
   * Get cache statistics for debugging
   *
   * @returns Cache statistics
   *
   * @example
   * ```typescript
   * const stats = imagePool.getCacheStats();
   * console.log(`Cache: ${stats.count} images, ${stats.totalSizeMB.toFixed(2)} MB`);
   * console.log(`Hit rate: ${(stats.hitRate * 100).toFixed(1)}%`);
   * ```
   */
  getCacheStats(): CacheStats {
    const stats = this.getStats();
    const totalRequests = this.hits + this.misses;
    const hitRate = totalRequests > 0 ? this.hits / totalRequests : 0;

    return {
      count: stats.count,
      totalSize: stats.totalSize,
      totalSizeMB: stats.totalSize / (1024 * 1024),
      hitRate,
      hits: this.hits,
      misses: this.misses,
    };
  }

  /**
   * Calculate current cache statistics
   * Helper for internal use
   */
  private getStats(): { count: number; totalSize: number } {
    let totalSize = 0;

    for (const entry of this.cache.values()) {
      totalSize += entry.size;
    }

    return {
      count: this.cache.size,
      totalSize,
    };
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
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
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
  remove(src: string): boolean {
    return this.cache.delete(src);
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
  has(src: string): boolean {
    return this.cache.has(src);
  }

  /**
   * Get current cache size (number of images)
   *
   * @returns Number of cached images
   */
  get size(): number {
    return this.cache.size;
  }
}

/**
 * Global image pool instance
 * Singleton pattern for shared cache across application
 */
export const imagePool = new ImagePool();

/**
 * Get cache statistics (convenience export)
 *
 * @returns Cache statistics
 *
 * @example
 * ```typescript
 * import { getCacheStats } from '@/lib/utils/imagePool';
 *
 * const stats = getCacheStats();
 * console.log(`Cached images: ${stats.count}`);
 * console.log(`Memory usage: ${stats.totalSizeMB.toFixed(2)} MB`);
 * console.log(`Hit rate: ${(stats.hitRate * 100).toFixed(1)}%`);
 * ```
 */
export function getCacheStats(): CacheStats {
  return imagePool.getCacheStats();
}
