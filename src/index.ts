import {
  compressImage,
  generateThumbhash,
  removeBgImage,
  removeBackground,
  clearCache,
  getCacheSize,
} from "./ImageProcessing"
import type {
  CompressImageOptions,
  GenerateThumbhashOptions,
  RemoveBgImageOptions,
  OutputFormat,
} from "./ImageProcessing"
import {
  BackgroundRemovalError,
  type BackgroundRemovalErrorCode,
} from "./errors"

export {
  // Functions
  compressImage,
  generateThumbhash,
  removeBgImage,
  removeBackground,
  clearCache,
  getCacheSize,
  // Errors
  BackgroundRemovalError,
}

export type {
  // Options types
  CompressImageOptions,
  GenerateThumbhashOptions,
  RemoveBgImageOptions,
  OutputFormat,
  BackgroundRemovalErrorCode,
}
