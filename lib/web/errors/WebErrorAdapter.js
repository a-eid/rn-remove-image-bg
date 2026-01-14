export class BackgroundRemovalError extends Error {
    code;
    constructor(message, code = 'UNKNOWN_ERROR') {
        super(message);
        this.name = 'BackgroundRemovalError';
        this.code = code;
    }
}
/**
 * Maps library errors to standardized BackgroundRemovalError
 */
export function mapErrorToBackgroundRemovalError(error) {
    if (error instanceof BackgroundRemovalError)
        return error;
    const message = error instanceof Error ? error.message : String(error);
    // Model loading errors
    if (message.includes('fetch') || message.includes('network') || message.includes('Failed to load resource')) {
        return new BackgroundRemovalError(`Failed to download AI model. Please check your internet connection. (Details: ${message})`, 'MODEL_DOWNLOAD_ERROR');
    }
    // WASM errors
    if (message.includes('wasm') || message.includes('WebAssembly')) {
        return new BackgroundRemovalError(`WebAssembly failed to initialize. Your browser might not support it. (Details: ${message})`, 'WASM_INIT_ERROR');
    }
    // Processing errors
    if (message.includes('memory') || message.includes('allocation')) {
        return new BackgroundRemovalError('Out of memory. Try using a smaller maxDimension or closing other tabs.', 'MEMORY_ERROR');
    }
    return new BackgroundRemovalError(message);
}
