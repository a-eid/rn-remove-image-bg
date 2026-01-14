import { loadImage } from './uriHelper';
export async function compressImage(uri, options) {
    const img = await loadImage(uri);
    let { width, height, quality = 0.8, format = 'jpeg' } = options;
    // Default dimensions to original if not specified
    if (!width)
        width = img.naturalWidth;
    if (!height)
        height = img.naturalHeight;
    // Calculate aspect ratio if one dimension is missing (though simpler to just use natural if both default)
    const ratio = img.naturalWidth / img.naturalHeight;
    if (options.width && !options.height)
        height = Math.round(width / ratio);
    if (options.height && !options.width)
        width = Math.round(height * ratio);
    // Normalize format
    const mimeType = format === 'png' ? 'image/png' : format === 'webp' ? 'image/webp' : 'image/jpeg';
    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('Canvas 2D context not available');
    }
    // Clear canvas with transparent pixels (preserve alpha channel)
    ctx.clearRect(0, 0, width, height);
    // Draw image (preserves transparency from source)
    ctx.drawImage(img, 0, 0, width, height);
    // Export
    // Note: quality (0-1) is ignored for PNG
    const dataUrl = canvas.toDataURL(mimeType, quality);
    return dataUrl;
}
