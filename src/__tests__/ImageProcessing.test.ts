import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock all dependencies before importing
vi.mock('react-native', () => ({
  Image: {
    getSize: vi.fn((uri, success) => success(1024, 768)),
  },
}))

vi.mock('expo-image-manipulator', () => ({
  manipulateAsync: vi.fn().mockResolvedValue({ uri: 'file:///mock/result.png' }),
  SaveFormat: { WEBP: 'webp', PNG: 'png', JPEG: 'jpeg' },
}))

vi.mock('expo-file-system/legacy', () => ({
  cacheDirectory: '/mock/cache/',
  getInfoAsync: vi.fn().mockResolvedValue({ exists: true, size: 1024 }),
  makeDirectoryAsync: vi.fn().mockResolvedValue(undefined),
  readAsStringAsync: vi.fn().mockResolvedValue('{}'),
  writeAsStringAsync: vi.fn().mockResolvedValue(undefined),
  deleteAsync: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('thumbhash', () => ({
  rgbaToThumbHash: vi.fn().mockReturnValue(new Uint8Array([1, 2, 3, 4])),
}))

vi.mock('upng-js', () => ({
  decode: vi.fn().mockReturnValue({ width: 32, height: 32 }),
  toRGBA8: vi.fn().mockReturnValue([new Uint8Array(32 * 32 * 4)]),
}))

// Mock Nitro modules
const mockRemoveBackground = vi.fn().mockResolvedValue('file:///mock/bg_removed.png')
vi.mock('react-native-nitro-modules', () => ({
  NitroModules: {
    createHybridObject: vi.fn(() => ({
      removeBackground: mockRemoveBackground,
    })),
  },
}))

// Import after mocking
import {
  removeBgImage,
  clearCache,
  getCacheSize,
  onLowMemory,
  configureCache,
  getCacheDirectory,
} from '../ImageProcessing'
import { BackgroundRemovalError } from '../errors'

describe('ImageProcessing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(async () => {
    await clearCache()
  })

  describe('removeBgImage', () => {
    describe('input validation', () => {
      it('should throw INVALID_PATH for empty string', async () => {
        await expect(removeBgImage('')).rejects.toThrow(BackgroundRemovalError)
        await expect(removeBgImage('')).rejects.toMatchObject({
          code: 'INVALID_PATH',
        })
      })

      it('should throw INVALID_PATH for whitespace-only string', async () => {
        await expect(removeBgImage('   ')).rejects.toMatchObject({
          code: 'INVALID_PATH',
        })
      })

      it('should throw INVALID_PATH for http URLs', async () => {
        await expect(removeBgImage('http://example.com/image.jpg')).rejects.toMatchObject({
          code: 'INVALID_PATH',
        })
      })

      it('should throw INVALID_PATH for https URLs', async () => {
        await expect(removeBgImage('https://example.com/image.jpg')).rejects.toMatchObject({
          code: 'INVALID_PATH',
        })
      })

      it('should accept file:// URIs', async () => {
        await expect(removeBgImage('file:///path/to/image.jpg')).resolves.toBeDefined()
      })

      it('should accept absolute paths starting with /', async () => {
        await expect(removeBgImage('/path/to/image.jpg')).resolves.toBeDefined()
      })
    })

    describe('options validation', () => {
      it('should throw INVALID_OPTIONS for maxDimension < 100', async () => {
        await expect(
          removeBgImage('file:///test.jpg', { maxDimension: 50 })
        ).rejects.toMatchObject({
          code: 'INVALID_OPTIONS',
        })
      })

      it('should throw INVALID_OPTIONS for maxDimension > 8192', async () => {
        await expect(
          removeBgImage('file:///test.jpg', { maxDimension: 10000 })
        ).rejects.toMatchObject({
          code: 'INVALID_OPTIONS',
        })
      })

      it('should throw INVALID_OPTIONS for quality < 0', async () => {
        await expect(
          removeBgImage('file:///test.jpg', { quality: -10 })
        ).rejects.toMatchObject({
          code: 'INVALID_OPTIONS',
        })
      })

      it('should throw INVALID_OPTIONS for quality > 100', async () => {
        await expect(
          removeBgImage('file:///test.jpg', { quality: 150 })
        ).rejects.toMatchObject({
          code: 'INVALID_OPTIONS',
        })
      })

      it('should throw INVALID_OPTIONS for invalid format', async () => {
        await expect(
          removeBgImage('file:///test.jpg', { format: 'JPEG' as any })
        ).rejects.toMatchObject({
          code: 'INVALID_OPTIONS',
        })
      })

      it('should accept valid options', async () => {
        await expect(
          removeBgImage('file:///test.jpg', {
            maxDimension: 1024,
            quality: 90,
            format: 'WEBP',
          })
        ).resolves.toBeDefined()
      })
    })

    describe('progress callback', () => {
      it('should call onProgress during processing', async () => {
        const onProgress = vi.fn()
        await removeBgImage('file:///test.jpg', { onProgress })

        // Should be called at least for start and end
        expect(onProgress).toHaveBeenCalled()
        expect(onProgress).toHaveBeenCalledWith(expect.any(Number))
      })
    })

    describe('caching', () => {
      it('should cache results when useCache is true', async () => {
        await removeBgImage('file:///test.jpg', { useCache: true })
        expect(getCacheSize()).toBe(1)
      })

      it('should not cache results when useCache is false', async () => {
        await removeBgImage('file:///test.jpg', { useCache: false })
        expect(getCacheSize()).toBe(0)
      })

      it('should return cached result on second call', async () => {
        const result1 = await removeBgImage('file:///test.jpg', { useCache: true })
        
        // Reset mock to verify it's not called again
        mockRemoveBackground.mockClear()
        
        const result2 = await removeBgImage('file:///test.jpg', { useCache: true })
        
        expect(result1).toBe(result2)
        // Native should not be called on second request (cache hit)
        expect(mockRemoveBackground).not.toHaveBeenCalled()
      })
    })

    describe('native call', () => {
      it('should call native removeBackground with correct options', async () => {
        await removeBgImage('file:///test.jpg', {
          maxDimension: 1024,
          format: 'WEBP',
          quality: 85,
          useCache: false, // Don't cache so we can verify the call
        })

        expect(mockRemoveBackground).toHaveBeenCalledWith(
          'file:///test.jpg',
          expect.objectContaining({
            maxDimension: 1024,
            format: 'WEBP',
            quality: 85,
          })
        )
      })

      it('should normalize result path to file:// URI', async () => {
        mockRemoveBackground.mockResolvedValueOnce('/path/without/scheme.png')
        
        const result = await removeBgImage('file:///test.jpg', { useCache: false })
        
        expect(result).toBe('file:///path/without/scheme.png')
      })
    })
  })

  describe('cache management functions', () => {
    describe('clearCache', () => {
      it('should clear all cache entries', async () => {
        await removeBgImage('file:///test1.jpg', { useCache: true })
        await removeBgImage('file:///test2.jpg', { useCache: true })
        expect(getCacheSize()).toBe(2)

        await clearCache()
        expect(getCacheSize()).toBe(0)
      })
    })

    describe('getCacheSize', () => {
      it('should return 0 for empty cache', () => {
        expect(getCacheSize()).toBe(0)
      })

      it('should return correct count after adding entries', async () => {
        await removeBgImage('file:///test1.jpg', { useCache: true })
        expect(getCacheSize()).toBe(1)
        
        await removeBgImage('file:///test2.jpg', { useCache: true })
        expect(getCacheSize()).toBe(2)
      })
    })

    describe('onLowMemory', () => {
      it('should clear cache and return count', async () => {
        await removeBgImage('file:///test1.jpg', { useCache: true })
        await removeBgImage('file:///test2.jpg', { useCache: true })
        
        const cleared = await onLowMemory()
        
        expect(cleared).toBe(2)
        expect(getCacheSize()).toBe(0)
      })

      it('should return 0 when cache is empty', async () => {
        const cleared = await onLowMemory()
        expect(cleared).toBe(0)
      })
    })

    describe('configureCache', () => {
      it('should not throw when configuring cache', () => {
        expect(() =>
          configureCache({
            maxEntries: 100,
            maxAgeMinutes: 60,
            persistToDisk: true,
          })
        ).not.toThrow()
      })
    })

    describe('getCacheDirectory', () => {
      it('should return a string containing bg-removal', () => {
        const dir = getCacheDirectory()
        expect(dir).toContain('bg-removal')
      })
    })
  })
})
