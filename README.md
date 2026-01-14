# rn-remove-image-bg

[![GitHub](https://img.shields.io/badge/GitHub-a--eid%2Frn--remove--image--bg-blue)](https://github.com/a-eid/rn-remove-image-bg)
[![license](https://img.shields.io/badge/license-MIT-green.svg)](https://github.com/a-eid/rn-remove-image-bg/blob/main/LICENSE)

**Offline background removal for React Native** using native ML models. Works completely on-device with no internet connection required.

| Platform | Technology | Min Version |
|----------|------------|-------------|
| **iOS** | Vision Framework / CoreML | iOS 16+ |
| **Android** | ML Kit Subject Segmentation | API 21+ |
| **Web** | @imgly/background-removal (WASM) | Modern browsers |

---

## Installation

```bash
npm install rn-remove-image-bg react-native-nitro-modules
```

### Peer Dependencies

This library requires the following peer dependencies for image manipulation:

```bash
npx expo install expo-file-system expo-image-manipulator
```

### iOS Setup

```bash
cd ios && pod install
```

> **Note:** The library bundles a ~4.5MB CoreML model for iOS 16 support. iOS 17+ uses the built-in Vision Framework.

### Android Setup

No additional setup required. The ML Kit model (~10MB) downloads automatically on first use.

> **Important:** Android requires Google Play Services. The first call may take 10-15 seconds while the model downloads.

---

## Quick Start

### Basic Usage

```typescript
import { removeBgImage } from 'rn-remove-image-bg'

const resultUri = await removeBgImage('file:///path/to/photo.jpg')
// Returns: file:///path/to/cache/bg_removed_xxx.png (native)
// Returns: data:image/png;base64,... (web)
```

### With React Query (Recommended)

```typescript
import { useMutation } from '@tanstack/react-query'
import { removeBgImage } from 'rn-remove-image-bg'
import { Alert } from 'react-native'

function useRemoveBackground() {
  return useMutation({
    mutationFn: async (imageUri: string) => {
      return await removeBgImage(imageUri, {
        maxDimension: 1024,  // Faster processing
        format: 'PNG',       // Best for transparency
        useCache: true,      // Cache results
      })
    },
    onError: (error) => {
      Alert.alert('Error', error.message)
    },
  })
}

// In your component:
function ImageEditor() {
  const removeBackground = useRemoveBackground()
  
  const handleRemoveBackground = () => {
    removeBackground.mutate(selectedImageUri, {
      onSuccess: (resultUri) => {
        setProcessedImage(resultUri)
      },
    })
  }
  
  return (
    <Button 
      onPress={handleRemoveBackground}
      disabled={removeBackground.isPending}
      title={removeBackground.isPending ? 'Processing...' : 'Remove Background'}
    />
  )
}
```

### With Expo Image Picker

```typescript
import * as ImagePicker from 'expo-image-picker'
import { removeBgImage } from 'rn-remove-image-bg'

async function pickAndProcessImage() {
  // Pick image
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 1,
  })
  
  if (result.canceled) return null
  
  // Remove background
  const processedUri = await removeBgImage(result.assets[0].uri)
  return processedUri
}

---

## API Reference

### `removeBgImage(uri, options?)`

Remove background from an image using native ML models.

```typescript
import { removeBgImage } from 'rn-remove-image-bg'

const result = await removeBgImage('file:///path/to/image.jpg', {
  maxDimension: 2048,
  format: 'PNG',
  quality: 100,
  useCache: true,
  debug: false,
  onProgress: (progress) => console.log(`${progress}%`)
})
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `uri` | `string` | File path or `file://` URI to the source image |
| `options` | `RemoveBgImageOptions` | Optional processing options |

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `maxDimension` | `number` | `2048` | Max width/height. Larger images are downsampled. |
| `format` | `'PNG' \| 'WEBP'` | `'PNG'` | Output format. WEBP gives smaller files. |
| `quality` | `number` | `100` | Quality 0-100 (only affects WEBP). |
| `useCache` | `boolean` | `true` | Use in-memory cache for repeated calls. |
| `debug` | `boolean` | `false` | Enable debug logging. |
| `onProgress` | `(n: number) => void` | — | Progress callback (0-100). |

#### Returns

`Promise<string>` — A URI suitable for use as an `<Image>` source. The format varies by platform:
- **iOS/Android**: File path (`file:///path/to/cache/bg_removed_xxx.png`)
- **Web**: Data URL (`data:image/png;base64,...`)

Both formats work directly with React Native's `<Image>` component.

#### Example with Options

```typescript
import { removeBgImage } from 'rn-remove-image-bg'

const processImage = async (imageUri: string) => {
  try {
    const result = await removeBgImage(imageUri, {
      maxDimension: 1024,      // Faster processing
      format: 'WEBP',          // Smaller file size
      quality: 90,             // Good quality, smaller size
      onProgress: (p) => {
        console.log(`Processing: ${p}%`)
      }
    })
    
    console.log('Background removed:', result)
    return result
  } catch (error) {
    if (error instanceof BackgroundRemovalError) {
      console.error('Error code:', error.code)
      console.error('User message:', error.toUserMessage())
    }
    throw error
  }
}
```

---

### `compressImage(uri, options?)`

Compress and resize an image to a target file size.

```typescript
import { compressImage } from 'rn-remove-image-bg'

const compressedUri = await compressImage('file:///path/to/image.jpg', {
  maxSizeKB: 250,
  width: 1024,
  height: 1024,
  quality: 0.85,
  format: 'WEBP'
})
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `maxSizeKB` | `number` | `250` | Target max file size in KB. |
| `width` | `number` | `1024` | Target width. |
| `height` | `number` | `1024` | Target height. |
| `quality` | `number` | `0.85` | Compression quality (0-1). |
| `format` | `SaveFormat` | `WEBP` | Output format. |

---

### `generateThumbhash(uri, options?)`

Generate a compact [thumbhash](https://evanw.github.io/thumbhash/) placeholder for an image.

```typescript
import { generateThumbhash } from 'rn-remove-image-bg'

const hash = await generateThumbhash('file:///path/to/image.jpg', {
  size: 32
})
// Returns base64 string like "YTkGJwaRhWWIeHiogohYV4r..."
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `size` | `number` | `32` | Thumbnail size for hash generation. |

---

### Cache Management

```typescript
import { clearCache, getCacheSize } from 'rn-remove-image-bg'

// Get number of cached results
const size = getCacheSize()
console.log(`${size} items in cache`)

// Clear all cached results
clearCache()
```

---

## Error Handling

The library throws `BackgroundRemovalError` with specific error codes:

```typescript
import { removeBgImage, BackgroundRemovalError } from 'rn-remove-image-bg'

try {
  await removeBgImage(imageUri)
} catch (error) {
  if (error instanceof BackgroundRemovalError) {
    switch (error.code) {
      case 'INVALID_PATH':
        console.log('Invalid file path format')
        break
      case 'FILE_NOT_FOUND':
        console.log('Image file not found')
        break
      case 'DECODE_FAILED':
        console.log('Could not decode image')
        break
      case 'ML_PROCESSING_FAILED':
        console.log('ML model failed to process')
        break
      case 'SAVE_FAILED':
        console.log('Could not save result')
        break
      case 'INVALID_OPTIONS':
        console.log('Invalid options provided')
        break
      default:
        console.log('Unknown error')
    }
    
    // Get user-friendly message
    console.log(error.toUserMessage())
  }
}
```

---

## Platform Notes

### iOS

| iOS Version | Technology | Notes |
|-------------|------------|-------|
| iOS 17+ | Vision Framework | Built-in, fastest |
| iOS 16 | CoreML U2Netp | Bundled ~4.5MB model |

- **Output**: PNG (WEBP requested → HEIC on iOS 17+, PNG on iOS 16)
- **Processing**: Hardware-accelerated via Metal
- **Memory**: ~2-3x image size during processing

### Android

- **Technology**: ML Kit Subject Segmentation (beta)
- **Model**: Downloads ~10MB on first use (handled automatically)
- **Output**: PNG or WEBP (lossy/lossless based on quality)
- **Requires**: Google Play Services

> **First-time Use**: On Android, the ML Kit model downloads automatically on first use. The library waits for the download to complete (up to ~15 seconds with retries) before processing. Subsequent calls are instant.

### Web (React Native Web)

This package supports **React Native Web** via the `@imgly/background-removal` library loaded from CDN.

#### Setup (Required)

Add this script tag to your `index.html` (before your app bundle):

```html
<script type="module">
  import { removeBackground } from "https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.7.0/+esm";
  window.imglyRemoveBackground = removeBackground;
</script>
```

> **Why CDN?** The `@imgly/background-removal` library uses dynamic imports that Metro bundler doesn't support. Loading from CDN bypasses this limitation.

#### Usage

Use `removeBgImage` exactly like on native platforms:

```typescript
import { removeBgImage } from 'rn-remove-image-bg';

const result = await removeBgImage(uri, {
  maxDimension: 1024,
  onProgress: (p) => console.log(`Progress: ${p}%`),
});
```

#### First-Time Use

On first use, the library downloads AI models (~30MB) from the CDN and caches them in IndexedDB. Subsequent uses are much faster.

#### Compatibility

- **Browsers**: Chrome, Edge, Firefox, Safari (with WebGPU or WebGL2)
- **Expo Web**: ✅ Works with Metro bundler
- **CORS**: Remote images must have `Access-Control-Allow-Origin: *` headers

#### Troubleshooting (Web)

| Error | Solution |
|-------|----------|
| `Background removal library not loaded` | Add the script tag to your HTML |
| `"Resource not found"` (404s) | Check internet connection (models download from CDN) |
| `"Tainted canvas"` / CORS errors | Ensure image server sends CORS headers |

---

## Performance

| Metric | iOS | Android |
|--------|-----|---------|
| **Processing Time** | 300-1500ms | 500-2000ms |
| **Peak Memory** | 2-3x image size | 2-3x image size |
| **First Load** | Instant | ~10MB download |

### Optimization Tips

1. **Use `maxDimension`** to downsample large images:
   ```typescript
   await removeBgImage(uri, { maxDimension: 1024 })
   ```

2. **Use WEBP format** for smaller output files:
   ```typescript
   await removeBgImage(uri, { format: 'WEBP', quality: 85 })
   ```

3. **Enable caching** for repeated operations:
   ```typescript
   await removeBgImage(uri, { useCache: true })
   ```

---

## Best Practices for Quality Results

### Photography Tips

| Do ✅ | Don't ❌ |
|------|---------|
| Even, diffused lighting | Harsh shadows |
| Plain backgrounds | Busy patterns |
| Subject 1-2m from backdrop | Subject touching background |
| Sharp focus on subject | Motion blur |
| High contrast vs background | Similar colors to background |

### What Works Best

- ✅ Single, well-defined subjects (people, products, pets)
- ✅ Solid, opaque objects
- ✅ Clear edges and outlines
- ✅ High resolution images (1600x1200+)

### Challenging Cases

- ⚠️ Transparent/translucent objects (glass, liquids)
- ⚠️ Very fine details (hair, fur, thin straps)
- ⚠️ Multiple overlapping subjects
- ⚠️ Low contrast between subject and background

---

## Troubleshooting

### Poor Results?

1. Check lighting conditions
2. Try a simpler, contrasting background
3. Ensure subject is in sharp focus
4. Increase distance between subject and background

### Partial Subject Cutoff?

1. Ensure clear boundaries around subject
2. Try repositioning or changing background
3. Avoid busy patterns near edges

### Android Model Not Loading?

1. Ensure device has Google Play Services installed
2. Check internet connection (model downloads on first use)
3. Wait 10-15 seconds - the library automatically retries during download
4. Clear app cache and retry: `adb shell pm clear com.yourapp`

### Web Not Working?

1. **CSP Errors**: If you see "Content Security Policy" errors, ensure your app allows loading scripts/workers from `https://cdn.jsdelivr.net` and `blob:` URLs.
2. **CORS Errors**: If loading an image from a URL, the server *must* return `Access-Control-Allow-Origin: *`. If not, download the image to a Blob first or use a proxy.
3. **Data URL**: Remember that the web result is a `data:` URL. You can use it directly in `<Image source={{ uri: result }} />`.

### Native Module Not Found?

```bash
# iOS
cd ios && pod install && cd ..
npx expo run:ios --device

# Android  
npx expo run:android --device

# For Expo managed workflow
npx expo prebuild --clean
```

### TypeScript Errors?

Ensure peer dependencies match:
```bash
npx expo install expo-file-system expo-image-manipulator
npm install react-native-nitro-modules@0.31.10
```

---

## TypeScript Support

Full TypeScript support with exported types:

```typescript
import type {
  RemoveBgImageOptions,
  CompressImageOptions,
  GenerateThumbhashOptions,
  OutputFormat,
  BackgroundRemovalErrorCode
} from 'rn-remove-image-bg'
```

---

## License

MIT © [Ahmed Eid](https://github.com/a-eid)
