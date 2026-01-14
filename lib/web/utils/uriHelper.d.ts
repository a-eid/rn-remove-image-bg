/**
 * Helper to normalize React Native URIs for Web consumption.
 * Handles file://, asset://, and data: URIs.
 */
export declare function normalizeUri(uri: string): Promise<string>;
/**
 * Loads an image from a URI into an HTMLImageElement for processing.
 * Handles CORS cross-origin issues.
 */
export declare function loadImage(uri: string): Promise<HTMLImageElement>;
