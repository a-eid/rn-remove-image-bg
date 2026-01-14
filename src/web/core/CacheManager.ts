import type { RemoveBgImageOptions } from './types';

interface CacheEntry {
  dataUrl: string; // The processed image as Data URL
  timestamp: number;
}

export class CacheManager {
  private cache: Map<string, CacheEntry>;
  private readonly MAX_SIZE = 50; // Limit to 50 items to avoid memory leaks

  constructor() {
    this.cache = new Map();
  }

  /**
   * Generates a unique cache key based on input URI and processing options
   */
  private generateKey(uri: string, options: RemoveBgImageOptions): string {
    // We include relevant options that affect output
    const { format = 'PNG', quality = 100, maxDimension = 0 } = options;
    return `${uri}|${format}|${quality}|${maxDimension}`;
  }

  public get(uri: string, options: RemoveBgImageOptions): string | null {
    const key = this.generateKey(uri, options);
    const entry = this.cache.get(key);
    if (entry) {
      entry.timestamp = Date.now(); // Update usage timestamp (simple LRU)
      return entry.dataUrl;
    }
    return null;
  }

  public set(uri: string, options: RemoveBgImageOptions, dataUrl: string): void {
    const key = this.generateKey(uri, options);
    
    // Evict if full
    if (this.cache.size >= this.MAX_SIZE) {
      this.evictOldest();
    }

    this.cache.set(key, {
      dataUrl,
      timestamp: Date.now()
    });
  }

  public clear(): void {
    this.cache.clear();
  }

  public size(): number {
    return this.cache.size;
  }

  private evictOldest(): void {
    // Find oldest entry
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }
}

// Singleton instance
export const cacheManager = new CacheManager();
