/**
 * Web implementation - No-op stubs
 *
 * Background removal is not supported on web.
 * These functions exist to prevent runtime errors when the library
 * is used in a web environment (e.g., React Native Web).
 */
/**
 * Output format for processed images
 */
export type OutputFormat = "PNG" | "WEBP";
export interface CompressImageOptions {
    maxSizeKB?: number;
    width?: number;
    height?: number;
    quality?: number;
    format?: "webp" | "png" | "jpeg";
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
 * Compress image (no-op on web)
 * @returns Original URI unchanged
 */
export declare function compressImage(uri: string, _options?: CompressImageOptions): Promise<string>;
/**
 * Generate thumbhash (no-op on web)
 * @returns Empty placeholder string
 */
export declare function generateThumbhash(_imageUri: string, _options?: GenerateThumbhashOptions): Promise<string>;
/**
 * Remove background from image (no-op on web)
 * @returns Original URI unchanged
 */
export declare function removeBgImage(uri: string, options?: RemoveBgImageOptions): Promise<string>;
/**
 * Backward compatibility alias
 * @deprecated Use removeBgImage instead
 */
export declare const removeBackground: typeof removeBgImage;
/**
 * Clear the background removal cache (no-op on web)
 */
export declare function clearCache(): void;
/**
 * Get the current cache size (always 0 on web)
 */
export declare function getCacheSize(): number;
