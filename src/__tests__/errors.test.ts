import { describe, it, expect } from 'vitest';
import { BackgroundRemovalError, wrapNativeError } from '../errors';

describe('BackgroundRemovalError', () => {
  describe('constructor', () => {
    it('should create an error with message and code', () => {
      const error = new BackgroundRemovalError('Test message', 'INVALID_PATH');

      expect(error.message).toBe('Test message');
      expect(error.code).toBe('INVALID_PATH');
      expect(error.name).toBe('BackgroundRemovalError');
      expect(error.originalError).toBeUndefined();
    });

    it('should preserve original error', () => {
      const originalError = new Error('Original error');
      const error = new BackgroundRemovalError(
        'Wrapped',
        'UNKNOWN',
        originalError
      );

      expect(error.originalError).toBe(originalError);
    });
  });

  describe('toUserMessage', () => {
    it('should return user-friendly message for INVALID_PATH', () => {
      const error = new BackgroundRemovalError('test', 'INVALID_PATH');
      expect(error.toUserMessage()).toBe('The image path provided is invalid.');
    });

    it('should return user-friendly message for FILE_NOT_FOUND', () => {
      const error = new BackgroundRemovalError('test', 'FILE_NOT_FOUND');
      expect(error.toUserMessage()).toBe('The image file could not be found.');
    });

    it('should return user-friendly message for DECODE_FAILED', () => {
      const error = new BackgroundRemovalError('test', 'DECODE_FAILED');
      expect(error.toUserMessage()).toBe(
        'The image could not be read. Please ensure it is a valid image file.'
      );
    });

    it('should return user-friendly message for ML_PROCESSING_FAILED', () => {
      const error = new BackgroundRemovalError('test', 'ML_PROCESSING_FAILED');
      expect(error.toUserMessage()).toBe(
        'Background removal failed. Please try with a different image.'
      );
    });

    it('should return user-friendly message for SAVE_FAILED', () => {
      const error = new BackgroundRemovalError('test', 'SAVE_FAILED');
      expect(error.toUserMessage()).toBe('Could not save the processed image.');
    });

    it('should return user-friendly message for INVALID_OPTIONS', () => {
      const error = new BackgroundRemovalError('test', 'INVALID_OPTIONS');
      expect(error.toUserMessage()).toBe(
        'Invalid options provided for background removal.'
      );
    });

    it('should return default message for UNKNOWN', () => {
      const error = new BackgroundRemovalError('test', 'UNKNOWN');
      expect(error.toUserMessage()).toBe(
        'An unexpected error occurred during background removal.'
      );
    });
  });
});

describe('wrapNativeError', () => {
  it('should return same error if already BackgroundRemovalError', () => {
    const error = new BackgroundRemovalError('test', 'INVALID_PATH');
    const wrapped = wrapNativeError(error);

    expect(wrapped).toBe(error);
  });

  it('should wrap string error', () => {
    const wrapped = wrapNativeError('Something went wrong');

    expect(wrapped).toBeInstanceOf(BackgroundRemovalError);
    expect(wrapped.message).toBe('Something went wrong');
    expect(wrapped.code).toBe('UNKNOWN');
  });

  it('should detect FILE_NOT_FOUND from message', () => {
    const error = new Error('File does not exist at path');
    const wrapped = wrapNativeError(error);

    expect(wrapped.code).toBe('FILE_NOT_FOUND');
    expect(wrapped.originalError).toBe(error);
  });

  it('should detect DECODE_FAILED from message', () => {
    const error = new Error('Could not decode image');
    const wrapped = wrapNativeError(error);

    expect(wrapped.code).toBe('DECODE_FAILED');
  });

  it('should detect ML_PROCESSING_FAILED from message', () => {
    const error = new Error('Failed to generate mask');
    const wrapped = wrapNativeError(error);

    expect(wrapped.code).toBe('ML_PROCESSING_FAILED');
  });

  it('should detect SAVE_FAILED from message', () => {
    const error = new Error('Could not save output file');
    const wrapped = wrapNativeError(error);

    expect(wrapped.code).toBe('SAVE_FAILED');
  });
});
