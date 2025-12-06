import * as FileSystem from 'expo-file-system/legacy'

/**
 * Cache entry for processed images
 */
interface CacheEntry {
  /** Original file path */
  originalPath: string
  /** Result file path */
  resultPath: string
  /** Timestamp when cached */
  timestamp: number
  /** Options hash to differentiate processing configs */
  optionsHash: string
}

/**
 * Simple in-memory LRU cache for background removal results
 */
class BackgroundRemovalCache {
  private cache = new Map<string, CacheEntry>()
  private readonly maxEntries: number
  private readonly maxAgeMs: number

  constructor(maxEntries = 50, maxAgeMinutes = 30) {
    this.maxEntries = maxEntries
    this.maxAgeMs = maxAgeMinutes * 60 * 1000
  }

  /**
   * Generate a cache key from path and options
   */
  private generateKey(path: string, optionsHash: string): string {
    return `${path}::${optionsHash}`
  }

  /**
   * Hash options object to string for cache key
   */
  hashOptions(options: Record<string, unknown>): string {
    const sorted = Object.keys(options)
      .sort()
      .reduce((acc, key) => {
        const value = options[key]
        // Exclude functions from hash
        if (typeof value !== 'function') {
          acc[key] = value
        }
        return acc
      }, {} as Record<string, unknown>)
    return JSON.stringify(sorted)
  }

  /**
   * Get cached result if valid
   */
  async get(path: string, optionsHash: string): Promise<string | null> {
    const key = this.generateKey(path, optionsHash)
    const entry = this.cache.get(key)

    if (!entry) {
      return null
    }

    // Check if expired
    if (Date.now() - entry.timestamp > this.maxAgeMs) {
      this.cache.delete(key)
      return null
    }

    // Verify result file still exists
    try {
      const info = await FileSystem.getInfoAsync(entry.resultPath)
      if (!info.exists) {
        this.cache.delete(key)
        return null
      }
    } catch {
      this.cache.delete(key)
      return null
    }

    // Move to end (most recently used)
    this.cache.delete(key)
    this.cache.set(key, entry)

    return entry.resultPath
  }

  /**
   * Store result in cache
   */
  set(path: string, optionsHash: string, resultPath: string): void {
    const key = this.generateKey(path, optionsHash)

    // Evict oldest entries if at capacity
    while (this.cache.size >= this.maxEntries) {
      const oldestKey = this.cache.keys().next().value
      if (oldestKey) {
        this.cache.delete(oldestKey)
      }
    }

    this.cache.set(key, {
      originalPath: path,
      resultPath,
      timestamp: Date.now(),
      optionsHash,
    })
  }

  /**
   * Clear all cached entries
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Get current cache size
   */
  get size(): number {
    return this.cache.size
  }

  /**
   * Remove expired entries
   */
  prune(): number {
    const now = Date.now()
    let removed = 0

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.maxAgeMs) {
        this.cache.delete(key)
        removed++
      }
    }

    return removed
  }
}

// Export singleton instance
export const bgRemovalCache = new BackgroundRemovalCache()
