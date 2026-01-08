import * as FileSystem from 'expo-file-system/legacy';

/**
 * Cache entry for processed images
 */
interface CacheEntry {
  /** Original file path */
  originalPath: string;
  /** Result file path */
  resultPath: string;
  /** Timestamp when cached */
  timestamp: number;
  /** Options hash to differentiate processing configs */
  optionsHash: string;
}

/**
 * Disk cache manifest structure
 */
interface CacheManifest {
  version: number;
  entries: Record<string, CacheEntry>;
}

/**
 * Configuration for the background removal cache
 */
export interface CacheConfig {
  /** Maximum number of entries in memory (default: 50) */
  maxEntries?: number;
  /** Maximum age of cache entries in minutes (default: 30) */
  maxAgeMinutes?: number;
  /** Enable disk persistence (default: false) */
  persistToDisk?: boolean;
  /** Custom cache directory (default: FileSystem.cacheDirectory + 'bg-removal/') */
  cacheDirectory?: string;
}

const MANIFEST_FILENAME = 'cache-manifest.json';
const CACHE_VERSION = 1;

/**
 * LRU cache for background removal results with optional disk persistence
 */
class BackgroundRemovalCache {
  private cache = new Map<string, CacheEntry>();
  private _maxEntries: number;
  private _maxAgeMs: number;
  private persistToDisk: boolean;
  private cacheDirectory: string;
  private initialized = false;

  constructor(config: CacheConfig = {}) {
    this._maxEntries = config.maxEntries ?? 50;
    this._maxAgeMs = (config.maxAgeMinutes ?? 30) * 60 * 1000;
    this.persistToDisk = config.persistToDisk ?? false;
    this.cacheDirectory =
      config.cacheDirectory ?? `${FileSystem.cacheDirectory}bg-removal/`;
  }

  /**
   * Configure cache settings
   */
  configure(config: CacheConfig): void {
    if (config.maxEntries !== undefined) {
      this._maxEntries = config.maxEntries;
    }
    if (config.maxAgeMinutes !== undefined) {
      this._maxAgeMs = config.maxAgeMinutes * 60 * 1000;
    }
    if (config.persistToDisk !== undefined) {
      this.persistToDisk = config.persistToDisk;
    }
    if (config.cacheDirectory !== undefined) {
      this.cacheDirectory = config.cacheDirectory;
    }
  }

  /**
   * Initialize disk cache (load manifest if exists)
   */
  async initialize(): Promise<void> {
    if (this.initialized || !this.persistToDisk) return;

    try {
      // Ensure cache directory exists
      const dirInfo = await FileSystem.getInfoAsync(this.cacheDirectory);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.cacheDirectory, {
          intermediates: true,
        });
      }

      // Load manifest if exists
      const manifestPath = `${this.cacheDirectory}${MANIFEST_FILENAME}`;
      const manifestInfo = await FileSystem.getInfoAsync(manifestPath);

      if (manifestInfo.exists) {
        const manifestJson = await FileSystem.readAsStringAsync(manifestPath);
        const manifest: CacheManifest = JSON.parse(manifestJson);

        if (manifest.version === CACHE_VERSION) {
          // Validate and load entries
          for (const [key, entry] of Object.entries(manifest.entries)) {
            const fileInfo = await FileSystem.getInfoAsync(entry.resultPath);
            if (fileInfo.exists) {
              this.cache.set(key, entry);
            }
          }
        }
      }
    } catch (error) {
      console.warn(
        '[rn-remove-image-bg] Failed to load cache manifest:',
        error
      );
    }

    this.initialized = true;
  }

  /**
   * Save cache manifest to disk
   */
  private async saveManifest(): Promise<void> {
    if (!this.persistToDisk) return;

    try {
      const manifest: CacheManifest = {
        version: CACHE_VERSION,
        entries: Object.fromEntries(this.cache.entries()),
      };

      const manifestPath = `${this.cacheDirectory}${MANIFEST_FILENAME}`;
      await FileSystem.writeAsStringAsync(
        manifestPath,
        JSON.stringify(manifest, null, 2)
      );
    } catch (error) {
      console.warn(
        '[rn-remove-image-bg] Failed to save cache manifest:',
        error
      );
    }
  }

  /**
   * Generate a cache key from path and options
   */
  private generateKey(path: string, optionsHash: string): string {
    return `${path}::${optionsHash}`;
  }

  /**
   * Hash options object to string for cache key
   */
  hashOptions(options: Record<string, unknown>): string {
    const sorted = Object.keys(options)
      .sort()
      .reduce(
        (acc, key) => {
          const value = options[key];
          // Exclude functions from hash
          if (typeof value !== 'function') {
            acc[key] = value;
          }
          return acc;
        },
        {} as Record<string, unknown>
      );
    return JSON.stringify(sorted);
  }

  /**
   * Get cached result if valid
   */
  async get(path: string, optionsHash: string): Promise<string | null> {
    await this.initialize();

    const key = this.generateKey(path, optionsHash);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > this._maxAgeMs) {
      this.cache.delete(key);
      this.saveManifest();
      return null;
    }

    // Verify result file still exists
    try {
      const info = await FileSystem.getInfoAsync(entry.resultPath);
      if (!info.exists) {
        this.cache.delete(key);
        this.saveManifest();
        return null;
      }
    } catch {
      this.cache.delete(key);
      this.saveManifest();
      return null;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.resultPath;
  }

  /**
   * Store result in cache
   */
  set(path: string, optionsHash: string, resultPath: string): void {
    const key = this.generateKey(path, optionsHash);

    // Evict oldest entries if at capacity
    while (this.cache.size >= this._maxEntries) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      originalPath: path,
      resultPath,
      timestamp: Date.now(),
      optionsHash,
    });

    this.saveManifest();
  }

  /**
   * Clear all cached entries
   * @param deleteFiles - Also delete cached files from disk (default: false)
   */
  async clear(deleteFiles = false): Promise<void> {
    if (deleteFiles && this.persistToDisk) {
      try {
        // Delete all cached result files
        for (const entry of this.cache.values()) {
          try {
            await FileSystem.deleteAsync(entry.resultPath, {
              idempotent: true,
            });
          } catch {
            // Ignore individual file deletion errors
          }
        }

        // Delete manifest
        const manifestPath = `${this.cacheDirectory}${MANIFEST_FILENAME}`;
        await FileSystem.deleteAsync(manifestPath, { idempotent: true });
      } catch (error) {
        console.warn('[rn-remove-image-bg] Error clearing cache files:', error);
      }
    }

    this.cache.clear();
  }

  /**
   * Get current cache size
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * Remove expired entries
   */
  prune(): number {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this._maxAgeMs) {
        this.cache.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      this.saveManifest();
    }

    return removed;
  }

  /**
   * Get cache directory path
   */
  getCacheDirectory(): string {
    return this.cacheDirectory;
  }
}

// Export singleton instance
export const bgRemovalCache = new BackgroundRemovalCache();
