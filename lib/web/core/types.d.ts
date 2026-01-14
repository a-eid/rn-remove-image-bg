export type OutputFormat = 'PNG' | 'WEBP';
export interface RemoveBgImageOptions {
    /**
     * Output format of the processed image.
     * Default: 'PNG'
     */
    format?: OutputFormat;
    /**
     * Quality of the output image (0-100). Only applies to WEBP/JPEG.
     * Default: 100
     */
    quality?: number;
    /**
     * Callback to track download and processing progress (0-100).
     */
    onProgress?: (progress: number) => void;
    /**
     * Enable debug logging.
     * Default: false
     */
    debug?: boolean;
    /**
     * Maximum dimension for the output image. Use this to resize large images before processing.
     */
    maxDimension?: number;
    /**
     * Public path to serve the model assets from.
     * If not provided, it will attempt to fetch from @imgly CDN.
     * Important for Metro bundler compatibility if not using CDN.
     */
    publicPath?: string;
    /**
     * Whether to use the cache for this request.
     * Default: true
     */
    useCache?: boolean;
}
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
