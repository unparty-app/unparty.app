// Production-grade image dimension caching utilities

export interface ImageDimensions {
  width: number;
  height: number;
  aspectRatio: number;
}

export interface ImageManifestEntry {
  name: string;
  path: string;
  width: number;
  height: number;
  aspectRatio: string;
}

export interface ImageManifest {
  images: Record<string, ImageManifestEntry>;
  generatedAt: string;
  totalImages: number;
}

// In-memory cache for runtime performance
const dimensionsCache = new Map<string, ImageDimensions>();
const cacheExpiry = new Map<string, number>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Safe type-checked lookup with caching
export const getImageDimensions = async (
  imageSrc: string, 
  manifest?: ImageManifest
): Promise<ImageDimensions> => {
  const imageKey = imageSrc.startsWith('/') ? imageSrc.slice(1) : imageSrc;
  
  // Check in-memory cache first
  if (dimensionsCache.has(imageKey)) {
    const expiry = cacheExpiry.get(imageKey);
    if (expiry && Date.now() < expiry) {
      return dimensionsCache.get(imageKey)!;
    }
  }
  
  let dimensions: ImageDimensions;
  
  try {
    // Try manifest lookup (build-time data)
    if (manifest && isValidImageKey(imageKey, manifest)) {
      const imageInfo = manifest.images[imageKey];
      dimensions = {
        width: imageInfo.width,
        height: imageInfo.height,
        aspectRatio: parseFloat(imageInfo.aspectRatio)
      };
    } else {
      // Fallback: Try runtime detection or API call
      dimensions = await fetchDynamicImageDimensions(imageSrc);
    }
    
    // Cache the result
    dimensionsCache.set(imageKey, dimensions);
    cacheExpiry.set(imageKey, Date.now() + CACHE_TTL_MS);
    
    return dimensions;
    
  } catch (error) {
    console.warn(`Failed to get dimensions for ${imageSrc}:`, error);
    
    // Ultra-safe fallback with reasonable aspect ratio
    const fallback: ImageDimensions = { 
      width: 800, 
      height: 600, 
      aspectRatio: 1.333 
    };
    
    // Cache fallback briefly to avoid repeated failures
    dimensionsCache.set(imageKey, fallback);
    cacheExpiry.set(imageKey, Date.now() + (CACHE_TTL_MS / 10)); // Shorter TTL for fallbacks
    
    return fallback;
  }
};

// Type-safe key validation
const isValidImageKey = (key: string, manifest: ImageManifest): key is keyof typeof manifest.images => {
  return key in manifest.images;
};

// Runtime dynamic image dimension fetching (for API/database images)
const fetchDynamicImageDimensions = async (imageSrc: string): Promise<ImageDimensions> => {
  // For production: This could call your image API or CDN
  // For now, return default dimensions for dynamic images
  
  if (typeof window !== 'undefined') {
    // Client-side: Use Image API to get dimensions
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
        aspectRatio: img.naturalWidth / img.naturalHeight
      });
      img.onerror = () => reject(new Error(`Failed to load image: ${imageSrc}`));
      img.src = imageSrc;
    });
  }
  
  // Server-side: Would typically call image service API
  throw new Error('Dynamic image dimensions not available server-side');
};

// Cache management utilities
export const clearImageCache = () => {
  dimensionsCache.clear();
  cacheExpiry.clear();
};

export const getCacheSize = () => dimensionsCache.size;