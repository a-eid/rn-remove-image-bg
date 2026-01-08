/**
 * Web implementation using @imgly/background-removal
 *
 * Provides real background removal on web using WebAssembly and ML models.
 * Falls back to no-op if the library fails to load.
 */

import { removeBackground as imglyRemoveBackground } from '@imgly/background-removal';

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
// Web cache configuration
const webCacheConfig = {
	maxEntries: 50,
	maxAgeMinutes: 30,
};

// Simple in-memory LRU cache for web
const webCache = new Map<string, string>();

/**
 * Add entry to cache with LRU eviction
 */
function setCacheEntry(key: string, value: string): void {
	// If key exists, delete it first (to update LRU order)
	if (webCache.has(key)) {
		webCache.delete(key);
	}

	// Evict oldest entries if at capacity
	while (webCache.size >= webCacheConfig.maxEntries) {
		const oldestKey = webCache.keys().next().value;
		if (oldestKey) {
			webCache.delete(oldestKey);
		}
	}

	webCache.set(key, value);
}

/**
 * Get entry from cache and update LRU order
 */
function getCacheEntry(key: string): string | undefined {
	const value = webCache.get(key);
	if (value !== undefined) {
		// Move to end (most recently used)
		webCache.delete(key);
		webCache.set(key, value);
	}
	return value;
}

/**
 * Compress image on web using canvas
 * @returns Compressed image as data URL
 */
export async function compressImage(
  uri: string,
  options: CompressImageOptions = {}
): Promise<string> {
  const {
    maxSizeKB = 250,
    width = 1024,
    height = 1024,
    quality = 0.85,
    format = 'webp',
  } = options;

  try {
    // Load image
    const img = await loadImage(uri);

    // Calculate target dimensions maintaining aspect ratio
    const scale = Math.min(width / img.width, height / img.height, 1);
    const targetWidth = Math.round(img.width * scale);
    const targetHeight = Math.round(img.height * scale);

    // Create canvas and draw resized image
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    // Convert to data URL with compression
    const mimeType =
      format === 'png'
        ? 'image/png'
        : format === 'jpeg'
          ? 'image/jpeg'
          : 'image/webp';
    let dataUrl = canvas.toDataURL(mimeType, quality);

    // If still too large, reduce quality iteratively
    let currentQuality = quality;
    while (getDataUrlSizeKB(dataUrl) > maxSizeKB && currentQuality > 0.5) {
      currentQuality -= 0.1;
      dataUrl = canvas.toDataURL(mimeType, currentQuality);
    }

    return dataUrl;
  } catch (error) {
    console.warn(
      '[rn-remove-image-bg] compressImage failed on web, returning original:',
      error
    );
    return uri;
  }
}

/**
 * Generate thumbhash on web using canvas
 * @returns Base64 thumbhash string
 */
export async function generateThumbhash(
  imageUri: string,
  options: GenerateThumbhashOptions = {}
): Promise<string> {
  const { size = 32 } = options;

  try {
    // Dynamically import thumbhash to avoid bundling issues
    const { rgbaToThumbHash } = await import('thumbhash');

    // Load and resize image
    const img = await loadImage(imageUri);
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    ctx.drawImage(img, 0, 0, size, size);

    // Get RGBA data
    const imageData = ctx.getImageData(0, 0, size, size);
    const hash = rgbaToThumbHash(size, size, imageData.data);

    // Convert to base64
    return btoa(String.fromCharCode(...hash));
  } catch (error) {
    console.warn(
      '[rn-remove-image-bg] generateThumbhash failed on web:',
      error
    );
    return '';
  }
}

/**
 * Remove background from image on web using @imgly/background-removal
 * @returns Data URL of processed image with transparent background
 */
export async function removeBgImage(
  uri: string,
  options: RemoveBgImageOptions = {}
): Promise<string> {
  const {
    format = 'PNG',
    quality = 100,
    onProgress,
    useCache = true,
    debug = false,
  } = options;

  // Check cache
  const cacheKey = `${uri}::${format}::${quality}`;
  if (useCache) {
    const cachedResult = getCacheEntry(cacheKey);
    if (cachedResult) {
      if (debug) {
        console.log('[rn-remove-image-bg] Web cache hit');
      }
      onProgress?.(100);
      return cachedResult;
    }
  }

  if (debug) {
    console.log('[rn-remove-image-bg] Starting web background removal:', uri);
  }

  onProgress?.(5);

  try {
    // Call @imgly/background-removal
    const blob = await imglyRemoveBackground(uri, {
      progress: (key: string, current: number, total: number) => {
        if (onProgress && total > 0) {
          // Map progress to 10-90 range
          const progress = Math.round(10 + (current / total) * 80);
          onProgress(Math.min(progress, 90));
        }
        if (debug) {
          console.log(`[rn-remove-image-bg] ${key}: ${current}/${total}`);
        }
      },
      output: {
        format: format === 'WEBP' ? 'image/webp' : 'image/png',
        quality: quality / 100,
      },
    });

    onProgress?.(95);

    // Convert blob to data URL
    const dataUrl = await blobToDataUrl(blob);

    // Cache the result with LRU eviction
    if (useCache) {
      setCacheEntry(cacheKey, dataUrl);
    }

    if (debug) {
      console.log('[rn-remove-image-bg] Web background removal complete');
    }

    onProgress?.(100);
    return dataUrl;
  } catch (error) {
    console.error('[rn-remove-image-bg] Web background removal failed:', error);
    // Return original URI on failure
    onProgress?.(100);
    return uri;
  }
}

/**
 * Backward compatibility alias
 * @deprecated Use removeBgImage instead
 */
export const removeBackground = removeBgImage;

/**
 * Clear the web background removal cache
 * @param _deleteFiles - Ignored on web (no disk cache)
 */
export async function clearCache(_deleteFiles = false): Promise<void> {
  webCache.clear();
}

/**
 * Get the current cache size
 */
export function getCacheSize(): number {
  return webCache.size;
}

/**
 * Handle low memory conditions by clearing the cache
 * On web, this simply clears the in-memory cache
 *
 * @param _deleteFiles - Ignored on web (no disk cache)
 * @returns Number of entries that were cleared
 */
export async function onLowMemory(_deleteFiles = true): Promise<number> {
  const size = webCache.size;
  webCache.clear();
  console.log(
    `[rn-remove-image-bg] Cleared ${size} web cache entries due to memory pressure`
  );
  return size;
}

/**
 * Configure the background removal cache
 * On web, maxEntries limits cache size. Disk persistence options are no-ops.
 */
export function configureCache(config: {
  maxEntries?: number;
  maxAgeMinutes?: number;
  persistToDisk?: boolean;
  cacheDirectory?: string;
}): void {
  if (config.maxEntries !== undefined && config.maxEntries > 0) {
    webCacheConfig.maxEntries = config.maxEntries;
  }
  if (config.maxAgeMinutes !== undefined && config.maxAgeMinutes > 0) {
    webCacheConfig.maxAgeMinutes = config.maxAgeMinutes;
  }
  // persistToDisk and cacheDirectory are no-ops on web
}

/**
 * Get the cache directory path
 * On web, returns empty string as there is no disk cache
 */
export function getCacheDirectory(): string {
  return '';
}

// Helper functions

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function getDataUrlSizeKB(dataUrl: string): number {
  // Data URL format: data:mime;base64,<base64data>
  const base64 = dataUrl.split(',')[1] || '';
  // Base64 encodes 3 bytes as 4 characters
  return (base64.length * 3) / 4 / 1024;
}
