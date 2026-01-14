import type { RemoveBgImageOptions } from './types';
export declare class CacheManager {
    private cache;
    private readonly MAX_SIZE;
    constructor();
    /**
     * Generates a unique cache key based on input URI and processing options
     */
    private generateKey;
    get(uri: string, options: RemoveBgImageOptions): string | null;
    set(uri: string, options: RemoveBgImageOptions, dataUrl: string): void;
    clear(): void;
    size(): number;
    private evictOldest;
}
export declare const cacheManager: CacheManager;
