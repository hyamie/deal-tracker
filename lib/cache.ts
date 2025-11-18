/**
 * Simple in-memory cache for price scraping results
 * Reduces ScraperAPI costs and improves response times
 *
 * Future improvements:
 * - Use Redis for persistent cache across deployments
 * - Add cache invalidation strategies
 * - Implement LRU eviction for memory management
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
}

class SimpleCache {
  private cache: Map<string, CacheEntry<any>> = new Map()
  private defaultTTL: number = 1000 * 60 * 30 // 30 minutes default

  /**
   * Get cached value if it exists and hasn't expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)

    if (!entry) {
      return null
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  /**
   * Set a value in the cache with optional TTL (in milliseconds)
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const now = Date.now()
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + (ttl || this.defaultTTL)
    }

    this.cache.set(key, entry)
  }

  /**
   * Remove a specific key from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  /**
   * Clear all cached entries
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Remove expired entries (garbage collection)
   */
  cleanup(): number {
    const now = Date.now()
    let removed = 0

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key)
        removed++
      }
    }

    return removed
  }

  /**
   * Get cache statistics
   */
  stats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    }
  }
}

// Singleton instance
export const cache = new SimpleCache()

// Run cleanup every 10 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const removed = cache.cleanup()
    if (removed > 0) {
      console.log(`[Cache] Cleaned up ${removed} expired entries`)
    }
  }, 1000 * 60 * 10)
}

/**
 * Cache key generators for consistent naming
 */
export const cacheKeys = {
  priceData: (url: string) => `price:${url}`,
  alternatives: (productName: string, url: string) => `alt:${productName}:${url}`,
  product: (id: string) => `product:${id}`,
}
