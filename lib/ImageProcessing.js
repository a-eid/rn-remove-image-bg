import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system/legacy";
import { Buffer } from "buffer";
import { rgbaToThumbHash } from "thumbhash";
import { NitroModules } from "react-native-nitro-modules";
import { BackgroundRemovalError, wrapNativeError } from "./errors";
import { bgRemovalCache } from "./cache";
let nativeRemover;
function getNativeRemover() {
    if (!nativeRemover) {
        nativeRemover = NitroModules.createHybridObject("ImageBackgroundRemover");
    }
    return nativeRemover;
}
/**
 * Validate image path format
 */
function validateImagePath(uri) {
    if (!uri || uri.trim().length === 0) {
        throw new BackgroundRemovalError('Image path cannot be empty', 'INVALID_PATH');
    }
    // Must be a file path or file:// URI
    const isValidPath = uri.startsWith('file://') || uri.startsWith('/') || uri.match(/^[a-zA-Z]:\\/);
    if (!isValidPath) {
        throw new BackgroundRemovalError(`Invalid file path format: ${uri}. Expected file:// URI or absolute path.`, 'INVALID_PATH');
    }
}
/**
 * Validate options
 */
function validateOptions(options) {
    if (options.maxDimension !== undefined) {
        if (options.maxDimension < 100 || options.maxDimension > 8192) {
            throw new BackgroundRemovalError('maxDimension must be between 100 and 8192', 'INVALID_OPTIONS');
        }
    }
    if (options.quality !== undefined) {
        if (options.quality < 0 || options.quality > 100) {
            throw new BackgroundRemovalError('quality must be between 0 and 100', 'INVALID_OPTIONS');
        }
    }
    if (options.format !== undefined && !['PNG', 'WEBP'].includes(options.format)) {
        throw new BackgroundRemovalError('format must be either "PNG" or "WEBP"', 'INVALID_OPTIONS');
    }
}
/** Default options for background removal */
const DEFAULT_OPTIONS = {
    maxDimension: 2048,
    format: 'PNG',
    quality: 100,
    useCache: true,
    debug: false,
};
/**
 * Compress image to WebP format with configurable options
 */
export async function compressImage(uri, options = {}) {
    const { maxSizeKB = 250, width = 1024, height = 1024, quality = 0.85, format = ImageManipulator.SaveFormat.WEBP } = options;
    const startTime = Date.now();
    const maxSize = maxSizeKB * 1024;
    // Get original file size
    const originalInfo = await FileSystem.getInfoAsync(uri);
    const originalSize = "size" in originalInfo ? originalInfo.size : 0;
    // Start with specified dimensions and quality
    let result = await ImageManipulator.manipulateAsync(uri, [{ resize: { width, height } }], {
        compress: quality,
        format,
    });
    let fileInfo = await FileSystem.getInfoAsync(result.uri);
    // If still too large, reduce quality
    if ("size" in fileInfo && fileInfo.size > maxSize) {
        let currentQuality = quality * 0.9;
        while (currentQuality > 0.5 && "size" in fileInfo && fileInfo.size > maxSize) {
            result = await ImageManipulator.manipulateAsync(uri, [{ resize: { width, height } }], {
                compress: currentQuality,
                format,
            });
            fileInfo = await FileSystem.getInfoAsync(result.uri);
            if ("size" in fileInfo && fileInfo.size <= maxSize)
                break;
            currentQuality -= 0.05;
        }
        // If still too large, try smaller dimensions
        if ("size" in fileInfo && fileInfo.size > maxSize) {
            const smallerWidth = Math.floor(width * 0.75);
            const smallerHeight = Math.floor(height * 0.75);
            result = await ImageManipulator.manipulateAsync(uri, [{ resize: { width: smallerWidth, height: smallerHeight } }], {
                compress: 0.75,
                format,
            });
            fileInfo = await FileSystem.getInfoAsync(result.uri);
            // Final quality reduction if needed
            if ("size" in fileInfo && fileInfo.size > maxSize) {
                let finalQuality = 0.7;
                while (finalQuality > 0.5 && "size" in fileInfo && fileInfo.size > maxSize) {
                    result = await ImageManipulator.manipulateAsync(uri, [{ resize: { width: smallerWidth, height: smallerHeight } }], {
                        compress: finalQuality,
                        format,
                    });
                    fileInfo = await FileSystem.getInfoAsync(result.uri);
                    if ("size" in fileInfo && fileInfo.size <= maxSize)
                        break;
                    finalQuality -= 0.05;
                }
            }
        }
    }
    const finalSize = "size" in fileInfo ? fileInfo.size : 0;
    const duration = Date.now() - startTime;
    console.log(`[Native] Image Compression:`, {
        originalSize: `${(originalSize / 1024).toFixed(2)} KB`,
        compressedSize: `${(finalSize / 1024).toFixed(2)} KB`,
        reduction: `${(((originalSize - finalSize) / originalSize) * 100).toFixed(1)}%`,
        duration: `${duration}ms`,
    });
    return result.uri;
}
/**
 * Generate thumbhash from image URI (Native/Mobile)
 */
export async function generateThumbhash(imageUri, options = {}) {
    const { size = 32 } = options;
    // 1. Create tiny PNG
    const tiny = await ImageManipulator.manipulateAsync(imageUri, [{ resize: { width: size, height: size } }], { format: ImageManipulator.SaveFormat.PNG });
    // 2. Read as base64
    const base64 = await FileSystem.readAsStringAsync(tiny.uri, {
        encoding: "base64",
    });
    // 3. Decode PNG and generate thumbhash
    const UPNG = require("upng-js");
    const buffer = Buffer.from(base64, "base64");
    const img = UPNG.decode(buffer);
    const rgba = UPNG.toRGBA8(img)[0];
    const hash = rgbaToThumbHash(size, size, new Uint8Array(rgba));
    // 4. Convert to base64
    return Buffer.from(hash).toString("base64");
}
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
export async function removeBgImage(uri, options = {}) {
    const startTime = Date.now();
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const { onProgress, debug } = opts;
    // Validate inputs
    validateImagePath(uri);
    validateOptions(options);
    if (debug) {
        console.log('[rn-remove-image-bg] Starting background removal:', uri);
        console.log('[rn-remove-image-bg] Options:', opts);
    }
    // Report initial progress
    onProgress?.(5);
    // Check cache if enabled
    if (opts.useCache) {
        const optionsHash = bgRemovalCache.hashOptions({
            maxDimension: opts.maxDimension,
            format: opts.format,
            quality: opts.quality,
        });
        const cached = await bgRemovalCache.get(uri, optionsHash);
        if (cached) {
            if (debug) {
                console.log('[rn-remove-image-bg] Cache hit:', cached);
            }
            onProgress?.(100);
            return cached.startsWith("file://") ? cached : `file://${cached}`;
        }
    }
    onProgress?.(10);
    try {
        // Prepare native options
        const nativeOptions = {
            maxDimension: opts.maxDimension,
            format: opts.format,
            quality: opts.quality,
        };
        onProgress?.(20);
        // Call native implementation
        const result = await getNativeRemover().removeBackground(uri, nativeOptions);
        onProgress?.(90);
        // Normalize result path
        const resultPath = result.startsWith("file://") ? result : `file://${result}`;
        // Cache the result
        if (opts.useCache) {
            const optionsHash = bgRemovalCache.hashOptions({
                maxDimension: opts.maxDimension,
                format: opts.format,
                quality: opts.quality,
            });
            bgRemovalCache.set(uri, optionsHash, resultPath);
        }
        if (debug) {
            console.log('[rn-remove-image-bg] Completed in', Date.now() - startTime, 'ms');
            console.log('[rn-remove-image-bg] Result:', resultPath);
        }
        onProgress?.(100);
        return resultPath;
    }
    catch (error) {
        if (debug) {
            console.error('[rn-remove-image-bg] Failed:', error);
        }
        throw wrapNativeError(error);
    }
}
/**
 * Backward compatibility alias for removeBgImage
 * @deprecated Use removeBgImage instead
 */
export const removeBackground = removeBgImage;
/**
 * Clear the background removal cache
 */
export function clearCache() {
    bgRemovalCache.clear();
}
/**
 * Get the current cache size
 */
export function getCacheSize() {
    return bgRemovalCache.size;
}
