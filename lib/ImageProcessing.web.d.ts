/**
 * Web implementation using @imgly/background-removal
 *
 * Provides real background removal on web using WebAssembly and ML models.
 * Falls back to no-op if the library fails to load.
 */
/**
 * Output format for processed images
 */
export type OutputFormat = 'PNG' | 'WEBP';
export interface CompressImageOptions {
    maxSizeKB?: number;
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'png' | 'jpeg';
}
export interface GenerateThumbhashOptions {
    size?: number;
}
export interface RemoveBgImageOptions {
    maxDimension?: number;
    format?: OutputFormat;
    quality?: number;
    onProgress?: (progress: number) => void;
    useCache?: boolean;
    debug?: boolean;
}
/**
 * Compress image on web using canvas
 * @returns Compressed image as data URL
 */
export declare function compressImage(uri: string, options?: CompressImageOptions): Promise<string>;
/**
 * Generate thumbhash on web using canvas
 * @returns Base64 thumbhash string
 */
export declare function generateThumbhash(imageUri: string, options?: GenerateThumbhashOptions): Promise<string>;
/**
 * Remove background from image on web using @imgly/background-removal
 * @returns Data URL of processed image with transparent background
 */
export declare function removeBgImage(uri: string, options?: RemoveBgImageOptions): Promise<string>;
/**
 * Backward compatibility alias
 * @deprecated Use removeBgImage instead
 */
export declare const removeBackground: typeof removeBgImage;
/**
 * Clear the web background removal cache
 * @param _deleteFiles - Ignored on web (no disk cache)
 */
export declare function clearCache(_deleteFiles?: boolean): Promise<void>;
/**
 * Get the current cache size
 */
export declare function getCacheSize(): number;
/**
 * Handle low memory conditions by clearing the cache
 * On web, this simply clears the in-memory cache
 *
 * @param _deleteFiles - Ignored on web (no disk cache)
 * @returns Number of entries that were cleared
 */
export declare function onLowMemory(_deleteFiles?: boolean): Promise<number>;
/**
 * Configure the background removal cache
 * On web, maxEntries limits cache size. Disk persistence options are no-ops.
 */
export declare function configureCache(config: {
    maxEntries?: number;
    maxAgeMinutes?: number;
    persistToDisk?: boolean;
    cacheDirectory?: string;
}): void;
/**
 * Get the cache directory path
 * On web, returns empty string as there is no disk cache
 */
export declare function getCacheDirectory(): string;
