import type { RemoveBgImageOptions } from './types';
type ImglyConfig = {
    publicPath?: string;
    progress?: (key: string, current: number, total: number) => void;
    debug?: boolean;
    output?: {
        format?: 'image/png' | 'image/jpeg' | 'image/webp';
        quality?: number;
        type?: 'foreground' | 'background' | 'mask';
    };
};
type ImglyRemoveBackground = (image: string | Blob | ArrayBuffer, config?: ImglyConfig) => Promise<Blob>;
declare global {
    interface Window {
        imglyRemoveBackground?: ImglyRemoveBackground;
    }
}
export declare const BackgroundRemover: {
    /**
     * Checks if the background removal library is loaded.
     */
    isAvailable(): boolean;
    /**
     * Removes background from an image.
     * Returns a Blob of the processed image (PNG with transparency).
     *
     * Requires @imgly/background-removal to be loaded via CDN script tag.
     */
    remove(uri: string, options: RemoveBgImageOptions): Promise<Blob>;
};
export {};
