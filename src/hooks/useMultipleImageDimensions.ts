import { useAsyncData } from '@/hooks/useFetch';
import { getImageDimensions, type ImageDimensions, type ImageManifest } from '../utils/imageCache';

const PLACEHOLDER_DIMENSIONS: ImageDimensions = { width: 800, height: 600, aspectRatio: 1.333 };

interface ImageWithDimensions {
  src: string;
  alt: string;
  type: 'cover' | 'supporting';
  dimensions: ImageDimensions;
  loading: boolean;
  error: string | null;
}

/**
 * Production-grade hook for managing multiple image dimensions efficiently
 * 
 * Optimized for masonry grids and dynamic image galleries where you need
 * dimensions for multiple images simultaneously with proper loading states.
 * 
 * Features:
 * - Parallel dimension loading for performance
 * - Individual loading states per image
 * - Graceful error handling per image
 * - Leverages existing caching infrastructure
 * 
 * @example
 * ```tsx
 * const projectImages = [
 *   { src: "/cover.png", alt: "Cover", type: "cover" },
 *   { src: "/brand.png", alt: "Brand", type: "supporting" }
 * ];
 * 
 * const { imagesWithDimensions, allLoaded } = useMultipleImageDimensions(
 *   projectImages, 
 *   imageManifest
 * );
 * 
 * // Render masonry grid when dimensions are ready
 * if (allLoaded) {
 *   return <MasonryGrid images={imagesWithDimensions} />;
 * }
 * ```
 */
export const useMultipleImageDimensions = (
  /**
   * Array of image objects with src, alt, and type
   */
  images: Array<{ src: string; alt: string; type: 'cover' | 'supporting' }>,
  
  /**
   * Optional build-time manifest for static images
   */
  manifest?: ImageManifest
) => {
  // Reload when the set of image sources changes
  const key = images.length > 0 ? JSON.stringify(images.map(img => img.src)) : null;
  const { data: results } = useAsyncData(key, (srcsKey) =>
    Promise.all(
      (JSON.parse(srcsKey) as string[]).map(async (src) => {
        try {
          return { dimensions: await getImageDimensions(src, manifest), error: null };
        } catch (error) {
          return {
            dimensions: PLACEHOLDER_DIMENSIONS,
            error: error instanceof Error ? error.message : 'Failed to load dimensions'
          };
        }
      })
    )
  );

  const allLoaded = images.length === 0 || results !== undefined;
  const imagesWithDimensions: ImageWithDimensions[] = images.map((img, index) => {
    const result = results?.[index];
    return result
      ? { ...img, dimensions: result.dimensions, loading: false, error: result.error }
      : { ...img, dimensions: PLACEHOLDER_DIMENSIONS, loading: true, error: null };
  });

  return { 
    /** Array of images with their dimensions and loading states */
    imagesWithDimensions, 
    /** True when all image dimensions have been loaded */
    allLoaded 
  };
};