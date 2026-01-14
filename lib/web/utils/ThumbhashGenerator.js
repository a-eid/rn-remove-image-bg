import * as ThumbHash from 'thumbhash';
import { loadImage } from './uriHelper';
export async function generateThumbhash(uri) {
    const img = await loadImage(uri);
    // Thumbhash works best with images < 100x100
    const maxSize = 100;
    let width = img.naturalWidth;
    let height = img.naturalHeight;
    const scale = Math.min(maxSize / width, maxSize / height);
    if (scale < 1) {
        width = Math.round(width * scale);
        height = Math.round(height * scale);
    }
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('Canvas 2D context not available');
    }
    ctx.drawImage(img, 0, 0, width, height);
    // Get RGBA data
    const imageData = ctx.getImageData(0, 0, width, height);
    const rgba = imageData.data;
    // Generate binary hash
    const hash = ThumbHash.rgbaToThumbHash(width, height, rgba);
    // Convert to base64 using browser API
    // hash is Uint8Array, spread into String.fromCharCode is safe for small thumbhashes (~30 bytes)
    const binary = String.fromCharCode(...hash);
    return window.btoa(binary);
}
