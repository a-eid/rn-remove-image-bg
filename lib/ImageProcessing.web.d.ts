import type { RemoveBgImageOptions, CompressImageOptions, GenerateThumbhashOptions, OutputFormat } from './web/core/types';
export type { RemoveBgImageOptions, CompressImageOptions, GenerateThumbhashOptions, OutputFormat };
export type NativeRemoveBackgroundOptions = RemoveBgImageOptions;
/**
 * Remove background from image (Web Implementation)
 */
export declare function removeBgImage(uri: string, options?: RemoveBgImageOptions): Promise<string>;
/**
 * Backward compatibility alias
 * @deprecated Use removeBgImage
 */
export declare const removeBackground: typeof removeBgImage;
/**
 * Compress image (Web Implementation)
 */
export declare function compressImage(uri: string, options?: CompressImageOptions): Promise<string>;
/**
 * Generate thumbhash (Web Implementation)
 */
export declare function generateThumbhash(uri: string, _options?: GenerateThumbhashOptions): Promise<string>;
export declare function clearCache(_deleteFiles?: boolean): Promise<void>;
export declare function getCacheSize(): number;
export declare function onLowMemory(_deleteFiles?: boolean): Promise<number>;
export declare function configureCache(_config: Record<string, unknown>): void;
export declare function getCacheDirectory(): string;
