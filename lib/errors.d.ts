/**
 * Error codes for background removal operations
 */
export type BackgroundRemovalErrorCode = 'INVALID_PATH' | 'FILE_NOT_FOUND' | 'DECODE_FAILED' | 'ML_PROCESSING_FAILED' | 'SAVE_FAILED' | 'INVALID_OPTIONS' | 'UNKNOWN';
/**
 * Custom error class for background removal operations
 */
export declare class BackgroundRemovalError extends Error {
    readonly code: BackgroundRemovalErrorCode;
    readonly originalError?: Error;
    constructor(message: string, code: BackgroundRemovalErrorCode, originalError?: Error);
    /**
     * Create a user-friendly error message
     */
    toUserMessage(): string;
}
/**
 * Helper to wrap native errors with proper typing
 */
export declare function wrapNativeError(error: unknown): BackgroundRemovalError;
