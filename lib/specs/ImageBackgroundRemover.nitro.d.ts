import type { HybridObject } from "react-native-nitro-modules";
/**
 * Output format for processed images
 */
export type OutputFormat = 'PNG' | 'WEBP';
/**
 * Native options for background removal
 */
export interface NativeRemoveBackgroundOptions {
    /**
     * Maximum dimension (width or height) for processing
     * Larger images will be downsampled for better performance
     * Default: 2048
     */
    maxDimension: number;
    /**
     * Output image format
     * PNG: Lossless, larger file size
     * WEBP: Smaller file size, good quality
     * Default: PNG
     */
    format: OutputFormat;
    /**
     * Quality for WEBP format (0-100)
     * Ignored for PNG format
     * Default: 100
     */
    quality: number;
}
export interface ImageBackgroundRemover extends HybridObject<{
    ios: "swift";
    android: "kotlin";
}> {
    /**
     * Remove background from an image
     * @param imagePath - File path or file:// URI to the source image
     * @param options - Processing options
     * @returns Promise resolving to the output file path
     */
    removeBackground(imagePath: string, options: NativeRemoveBackgroundOptions): Promise<string>;
}
