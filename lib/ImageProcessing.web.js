import { BackgroundRemover } from './web/core/BackgroundRemover';
import { cacheManager } from './web/core/CacheManager';
import { compressImage as compressImageWeb } from './web/utils/CompressImage';
import { generateThumbhash as generateThumbhashWeb } from './web/utils/ThumbhashGenerator';
import { blobToDataUrl } from './web/utils/formatConverter';
/**
 * Remove background from image (Web Implementation)
 */
export async function removeBgImage(uri, options = {}) {
    const { onProgress, useCache = true, debug = false } = options;
    if (debug)
        console.log('[Web] removeBgImage called with:', uri, options);
    // 1. Check Cache
    if (useCache) {
        const cached = cacheManager.get(uri, options);
        if (cached) {
            if (debug)
                console.log('[Web] Cache hit');
            onProgress?.(100);
            return cached;
        }
    }
    // 2. Process
    onProgress?.(10); // Start
    const blob = await BackgroundRemover.remove(uri, {
        ...options,
        onProgress: (p) => {
            // Map progress to 10-90 range to leave room for start/end
            const mapped = 10 + Math.round((p * 0.8));
            onProgress?.(mapped);
        }
    });
    if (debug) {
        console.log('[Web] Blob received:', {
            type: blob.type,
            size: blob.size,
        });
    }
    // 3. Convert to Data URL
    const dataUrl = await blobToDataUrl(blob);
    if (debug) {
        console.log('[Web] DataURL prefix:', dataUrl.substring(0, 50));
    }
    onProgress?.(100);
    // 4. Cache Result
    if (useCache) {
        cacheManager.set(uri, options, dataUrl);
    }
    return dataUrl;
}
/**
 * Backward compatibility alias
 * @deprecated Use removeBgImage
 */
export const removeBackground = removeBgImage;
/**
 * Compress image (Web Implementation)
 */
export async function compressImage(uri, options = {}) {
    return compressImageWeb(uri, options);
}
/**
 * Generate thumbhash (Web Implementation)
 */
export async function generateThumbhash(uri, _options = {}) {
    // Web implementation currently doesn't use options (size hardcoded or auto-scaled)
    return generateThumbhashWeb(uri);
}
// Cache Management APIs
export async function clearCache(_deleteFiles = false) {
    cacheManager.clear();
    console.log('[Web] Cache cleared');
}
export function getCacheSize() {
    return cacheManager.size();
}
export async function onLowMemory(_deleteFiles = true) {
    const size = cacheManager.size();
    cacheManager.clear();
    console.log(`[Web] Cleared ${size} items due to low memory`);
    return size;
}
export function configureCache(_config) {
    // Web cache is simple in-memory LRU, config not fully supported yet but stubbed
    console.log('[Web] Cache configuration updated (no-op on web)');
}
export function getCacheDirectory() {
    return ''; // No file system on web
}
