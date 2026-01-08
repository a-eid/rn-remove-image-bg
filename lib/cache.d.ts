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
/**
 * LRU cache for background removal results with optional disk persistence
 */
declare class BackgroundRemovalCache {
    private cache;
    private _maxEntries;
    private _maxAgeMs;
    private persistToDisk;
    private cacheDirectory;
    private initialized;
    constructor(config?: CacheConfig);
    /**
     * Configure cache settings
     */
    configure(config: CacheConfig): void;
    /**
     * Initialize disk cache (load manifest if exists)
     */
    initialize(): Promise<void>;
    /**
     * Save cache manifest to disk
     */
    private saveManifest;
    /**
     * Generate a cache key from path and options
     */
    private generateKey;
    /**
     * Hash options object to string for cache key
     */
    hashOptions(options: Record<string, unknown>): string;
    /**
     * Get cached result if valid
     */
    get(path: string, optionsHash: string): Promise<string | null>;
    /**
     * Store result in cache
     */
    set(path: string, optionsHash: string, resultPath: string): void;
    /**
     * Clear all cached entries
     * @param deleteFiles - Also delete cached files from disk (default: false)
     */
    clear(deleteFiles?: boolean): Promise<void>;
    /**
     * Get current cache size
     */
    get size(): number;
    /**
     * Remove expired entries
     */
    prune(): number;
    /**
     * Get cache directory path
     */
    getCacheDirectory(): string;
}
export declare const bgRemovalCache: BackgroundRemovalCache;
export {};
