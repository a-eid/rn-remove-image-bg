import { mapErrorToBackgroundRemovalError, BackgroundRemovalError } from '../errors/WebErrorAdapter';
import { normalizeUri } from '../utils/uriHelper';
/**
 * Gets the @imgly removeBackground function from window.
 * This must be loaded via CDN script tag before use.
 */
function getImglyRemoveBackground() {
    if (typeof window === 'undefined') {
        throw new BackgroundRemovalError('Background removal is only available in browser environment.', 'ENVIRONMENT_ERROR');
    }
    if (!window.imglyRemoveBackground) {
        throw new BackgroundRemovalError('Background removal library not loaded. Please add the following script to your HTML:\n' +
            '<script type="module">\n' +
            '  import { removeBackground } from "https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.7.0/+esm";\n' +
            '  window.imglyRemoveBackground = removeBackground;\n' +
            '</script>', 'LIBRARY_NOT_LOADED');
    }
    return window.imglyRemoveBackground;
}
export const BackgroundRemover = {
    /**
     * Checks if the background removal library is loaded.
     */
    isAvailable() {
        return typeof window !== 'undefined' && typeof window.imglyRemoveBackground === 'function';
    },
    /**
     * Removes background from an image.
     * Returns a Blob of the processed image (PNG with transparency).
     *
     * Requires @imgly/background-removal to be loaded via CDN script tag.
     */
    async remove(uri, options) {
        try {
            const imglyRemove = getImglyRemoveBackground();
            const normalizedUri = await normalizeUri(uri);
            const config = {
                // Pass publicPath if provided (for self-hosted assets)
                publicPath: options.publicPath,
                // Map progress callback
                progress: (_key, current, total) => {
                    if (options.onProgress && total > 0) {
                        const p = Math.min(100, Math.round((current / total) * 100));
                        options.onProgress(p);
                    }
                },
                // Enable debug logging if requested
                debug: options.debug ?? false,
                // Explicit output configuration for transparent PNG
                output: {
                    format: 'image/png',
                    quality: 1.0,
                    type: 'foreground', // Extract foreground with transparency
                },
            };
            // Execute removal
            const blob = await imglyRemove(normalizedUri, config);
            return blob;
        }
        catch (error) {
            throw mapErrorToBackgroundRemovalError(error);
        }
    }
};
