/**
 * Helper to normalize React Native URIs for Web consumption.
 * Handles file://, asset://, and data: URIs.
 */
export async function normalizeUri(uri: string): Promise<string> {
  if (!uri) return '';

  // Handle data URIs (return as is)
  if (uri.startsWith('data:')) {
    return uri;
  }

  // Handle http/https (return as is)
  if (uri.startsWith('http')) {
    return uri;
  }

  // Handle Expo asset:// URIs (convert to http relative path if needed, or pass through)
  // In Expo Web, bundled assets are usually served from /assets/
  if (uri.startsWith('asset://')) {
     // NOTE: complex asset:// handling might require expo-asset, 
     // but often on web the uri passed is already resolved or a relative path.
     // For now, we return it. If it fails, we might need 'expo-asset' module.
     return uri.replace('asset://', '/assets/'); 
  }

  // Handle file:// URIs
  // On web, file:// is blocked for security unless it's a blob url created by the app
  if (uri.startsWith('file://')) {
    // If it's a local file picked by user, it might be a blob: reference in disguise or invalid.
    // We strip the protocol for relative paths check.
    return uri; 
  }

  // Relative paths
  return uri;
}

/**
 * Loads an image from a URI into an HTMLImageElement for processing.
 * Handles CORS cross-origin issues.
 */
export function loadImage(uri: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous'; // Enable CORS
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error(`Failed to load image at ${uri}: ${String(e)}`));
    img.src = uri;
  });
}
