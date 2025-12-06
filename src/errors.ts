/**
 * Error codes for background removal operations
 */
export type BackgroundRemovalErrorCode =
  | 'INVALID_PATH'
  | 'FILE_NOT_FOUND'
  | 'DECODE_FAILED'
  | 'ML_PROCESSING_FAILED'
  | 'SAVE_FAILED'
  | 'INVALID_OPTIONS'
  | 'UNKNOWN'

/**
 * Custom error class for background removal operations
 */
export class BackgroundRemovalError extends Error {
  readonly code: BackgroundRemovalErrorCode
  readonly originalError?: Error

  constructor(
    message: string,
    code: BackgroundRemovalErrorCode,
    originalError?: Error
  ) {
    super(message)
    this.name = 'BackgroundRemovalError'
    this.code = code
    this.originalError = originalError

    // Maintain proper stack trace in V8 environments
    if ('captureStackTrace' in Error) {
      // @ts-expect-error - captureStackTrace is V8-specific
      Error.captureStackTrace(this, BackgroundRemovalError)
    }
  }

  /**
   * Create a user-friendly error message
   */
  toUserMessage(): string {
    switch (this.code) {
      case 'INVALID_PATH':
        return 'The image path provided is invalid.'
      case 'FILE_NOT_FOUND':
        return 'The image file could not be found.'
      case 'DECODE_FAILED':
        return 'The image could not be read. Please ensure it is a valid image file.'
      case 'ML_PROCESSING_FAILED':
        return 'Background removal failed. Please try with a different image.'
      case 'SAVE_FAILED':
        return 'Could not save the processed image.'
      case 'INVALID_OPTIONS':
        return 'Invalid options provided for background removal.'
      default:
        return 'An unexpected error occurred during background removal.'
    }
  }
}

/**
 * Helper to wrap native errors with proper typing
 */
export function wrapNativeError(error: unknown): BackgroundRemovalError {
  if (error instanceof BackgroundRemovalError) {
    return error
  }

  const message = error instanceof Error ? error.message : String(error)
  const originalError = error instanceof Error ? error : undefined

  // Try to determine error code from message
  if (message.includes('does not exist') || message.includes('not found')) {
    return new BackgroundRemovalError(message, 'FILE_NOT_FOUND', originalError)
  }
  if (message.includes('decode') || message.includes('load image')) {
    return new BackgroundRemovalError(message, 'DECODE_FAILED', originalError)
  }
  if (message.includes('mask') || message.includes('segment') || message.includes('ML')) {
    return new BackgroundRemovalError(message, 'ML_PROCESSING_FAILED', originalError)
  }
  if (message.includes('save') || message.includes('write')) {
    return new BackgroundRemovalError(message, 'SAVE_FAILED', originalError)
  }

  return new BackgroundRemovalError(message, 'UNKNOWN', originalError)
}
