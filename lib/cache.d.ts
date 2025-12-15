/**
 * Simple in-memory LRU cache for background removal results
 */
declare class BackgroundRemovalCache {
    private cache;
    private readonly maxEntries;
    private readonly maxAgeMs;
    constructor(maxEntries?: number, maxAgeMinutes?: number);
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
     */
    clear(): void;
    /**
     * Get current cache size
     */
    get size(): number;
    /**
     * Remove expired entries
     */
    prune(): number;
}
export declare const bgRemovalCache: BackgroundRemovalCache;
export {};
