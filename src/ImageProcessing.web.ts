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
export async function compressImage(
	uri: string,
	_options: CompressImageOptions = {},
): Promise<string> {
	console.warn(
		"[rn-remove-image-bg] compressImage is not supported on web, returning original URI",
	);
	return uri;
}

/**
 * Generate thumbhash (no-op on web)
 * @returns Empty placeholder string
 */
export async function generateThumbhash(
	_imageUri: string,
	_options: GenerateThumbhashOptions = {},
): Promise<string> {
	console.warn(
		"[rn-remove-image-bg] generateThumbhash is not supported on web",
	);
	return "";
}

/**
 * Remove background from image (no-op on web)
 * @returns Original URI unchanged
 */
export async function removeBgImage(
	uri: string,
	options: RemoveBgImageOptions = {},
): Promise<string> {
	const { onProgress, debug = false } = options;

	if (debug) {
		console.warn(
			"[rn-remove-image-bg] removeBgImage is not supported on web, returning original URI",
		);
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
export function clearCache(): void {
	// No-op
}

/**
 * Get the current cache size (always 0 on web)
 */
export function getCacheSize(): number {
	return 0;
}
