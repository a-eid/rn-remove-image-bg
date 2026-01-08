import {
  compressImage,
  generateThumbhash,
  removeBgImage,
  removeBackground,
  clearCache,
  getCacheSize,
  onLowMemory,
  configureCache,
  getCacheDirectory,
} from './ImageProcessing';
import type {
  CompressImageOptions,
  GenerateThumbhashOptions,
  RemoveBgImageOptions,
  OutputFormat,
} from './ImageProcessing';
import {
  BackgroundRemovalError,
  type BackgroundRemovalErrorCode,
} from './errors';
import type { CacheConfig } from './cache';

export {
  // Functions
  compressImage,
  generateThumbhash,
  removeBgImage,
  removeBackground,
  clearCache,
  getCacheSize,
  // Memory management
  onLowMemory,
  configureCache,
  getCacheDirectory,
  // Errors
  BackgroundRemovalError,
};

export type {
  // Options types
  CompressImageOptions,
  GenerateThumbhashOptions,
  RemoveBgImageOptions,
  OutputFormat,
  BackgroundRemovalErrorCode,
  // Cache types
  CacheConfig,
};
