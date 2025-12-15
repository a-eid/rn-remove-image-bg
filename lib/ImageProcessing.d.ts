import * as ImageManipulator from "expo-image-manipulator";
import type { OutputFormat, NativeRemoveBackgroundOptions } from "./specs/ImageBackgroundRemover.nitro";
export type { OutputFormat, NativeRemoveBackgroundOptions };
export interface CompressImageOptions {
    /**
     * Maximum file size in KB (default: 250)
     */
    maxSizeKB?: number;
    /**
     * Initial image width (default: 1024)
     */
    width?: number;
    /**
     * Initial image height (default: 1024)
     */
    height?: number;
    /**
     * Initial compression quality (0-1, default: 0.85)
     */
    quality?: number;
    /**
     * Image format (default: WEBP)
     */
    format?: ImageManipulator.SaveFormat;
}
export interface GenerateThumbhashOptions {
    /**
     * Thumbhash size (default: 32)
     */
    size?: number;
}
/**
 * Options for background removal
 */
export interface RemoveBgImageOptions {
    /**
     * Maximum dimension (width or height) for processing
     * Larger images will be downsampled for better performance
     * @default 2048
     */
    maxDimension?: number;
    /**
     * Output image format
     * - PNG: Lossless, larger file size, best for transparency
     * - WEBP: Smaller file size, good quality
     * @default 'PNG'
     */
    format?: OutputFormat;
    /**
     * Quality for WEBP format (0-100)
     * Ignored when format is PNG
     * @default 100
     */
    quality?: number;
    /**
     * Progress callback (0-100)
     * Note: Progress is approximate and may not be linear
     */
    onProgress?: (progress: number) => void;
    /**
     * Use cached result if available
     * @default true
     */
    useCache?: boolean;
    /**
     * Enable debug logging
     * @default false
     */
    debug?: boolean;
}
/**
 * Compress image to WebP format with configurable options
 */
export declare function compressImage(uri: string, options?: CompressImageOptions): Promise<string>;
/**
 * Generate thumbhash from image URI (Native/Mobile)
 */
export declare function generateThumbhash(imageUri: string, options?: GenerateThumbhashOptions): Promise<string>;
/**
 * Remove background from image using native ML models
 *
 * @param uri - File path or file:// URI to the source image
 * @param options - Processing options
 * @returns Promise resolving to file:// URI of the processed image with transparent background
 *
 * @throws {BackgroundRemovalError} When image cannot be processed
 *
 * @example
 * ```typescript
 * const result = await removeBgImage('file:///path/to/photo.jpg')
 * console.log(result) // file:///cache/bg_removed_xxx.png
 * ```
 *
 * @example
 * ```typescript
 * // With options
 * const result = await removeBgImage('file:///path/to/photo.jpg', {
 *   maxDimension: 1024,
 *   format: 'WEBP',
 *   quality: 90,
 *   onProgress: (p) => console.log(`Progress: ${p}%`)
 * })
 * ```
 */
export declare function removeBgImage(uri: string, options?: RemoveBgImageOptions): Promise<string>;
/**
 * Backward compatibility alias for removeBgImage
 * @deprecated Use removeBgImage instead
 */
export declare const removeBackground: typeof removeBgImage;
/**
 * Clear the background removal cache
 */
export declare function clearCache(): void;
/**
 * Get the current cache size
 */
export declare function getCacheSize(): number;
