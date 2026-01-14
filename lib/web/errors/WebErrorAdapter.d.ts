export declare class BackgroundRemovalError extends Error {
    code: string;
    constructor(message: string, code?: string);
}
/**
 * Maps library errors to standardized BackgroundRemovalError
 */
export declare function mapErrorToBackgroundRemovalError(error: unknown): BackgroundRemovalError;
