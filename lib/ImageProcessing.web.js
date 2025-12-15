/**
 * Web implementation - No-op stubs
 *
 * Background removal is not supported on web.
 * These functions exist to prevent runtime errors when the library
 * is used in a web environment (e.g., React Native Web).
 */
/**
 * Compress image (no-op on web)
 * @returns Original URI unchanged
 */
export async function compressImage(uri, _options = {}) {
    console.warn("[rn-remove-image-bg] compressImage is not supported on web, returning original URI");
    return uri;
}
/**
 * Generate thumbhash (no-op on web)
 * @returns Empty placeholder string
 */
export async function generateThumbhash(_imageUri, _options = {}) {
    console.warn("[rn-remove-image-bg] generateThumbhash is not supported on web");
    return "";
}
/**
 * Remove background from image (no-op on web)
 * @returns Original URI unchanged
 */
export async function removeBgImage(uri, options = {}) {
    const { onProgress, debug = false } = options;
    if (debug) {
        console.warn("[rn-remove-image-bg] removeBgImage is not supported on web, returning original URI");
    }
    // Simulate progress for consistency
    onProgress?.(0);
    onProgress?.(100);
    return uri;
}
/**
 * Backward compatibility alias
 * @deprecated Use removeBgImage instead
 */
export const removeBackground = removeBgImage;
/**
 * Clear the background removal cache (no-op on web)
 */
export function clearCache() {
    // No-op
}
/**
 * Get the current cache size (always 0 on web)
 */
export function getCacheSize() {
    return 0;
}
