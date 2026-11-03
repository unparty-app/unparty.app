import { useState, useEffect } from 'react';
import { getImageDimensions, type ImageDimensions, type ImageManifest } from '../utils/imageCache';

/**
 * Production-grade hook for managing image dimensions with caching and error handling
 * 
 * Supports multiple image sources:
 * - Static images from build-time manifest
 * - Dynamic images from APIs/databases
 * - External CDN resources
 * 
 * Features:
 * - In-memory caching with TTL
 * - Graceful fallbacks for missing dimensions
 * - Loading states for UI feedback
 * - Error handling with detailed messages
 * 
 * @example
 * ```tsx
 * // Static image with build manifest
 * const { dimensions, loading, error } = useImageDimensions(
 *   "/image-product-cover.png", 
 *   buildTimeManifest
 * );
 * 
 * // Dynamic API image
 * const { dimensions, loading } = useImageDimensions(
 *   "https://api.example.com/images/123.jpg"
 * );
 * 
 * // Usage in component
 * if (loading) return <ImageSkeleton />;
 * return <Image width={dimensions.width} height={dimensions.height} ... />;
 * ```
 */
export const useImageDimensions = (
  /**
   * Image source URL or path
   * - Absolute URLs: "https://cdn.example.com/image.jpg"
   * - Relative paths: "/image-cover.png"
   * - API endpoints: "/api/images/123"
   */
  imageSrc: string,
  
  /**
   * Optional build-time generated manifest for static images
   * - Provides instant dimensions for known images
   * - Falls back to runtime detection if image not in manifest
   * - Pass undefined for purely dynamic images
   */
  manifest?: ImageManifest
) => {
  const [dimensions, setDimensions] = useState<ImageDimensions>({
    width: 800,
    height: 600,
    aspectRatio: 1.333
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    
    const loadDimensions = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const dims = await getImageDimensions(imageSrc, manifest);
        
        if (mounted) {
          setDimensions(dims);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load image dimensions');
          // Keep fallback dimensions for graceful degradation
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadDimensions();

    return () => {
      mounted = false;
    };
  }, [imageSrc, manifest]);

  return { 
    /** Image dimensions with fallback values */
    dimensions, 
    /** Loading state - true while fetching dimensions */
    loading, 
    /** Error message if dimension loading failed */
    error 
  };
};