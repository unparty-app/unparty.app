import React, { useState, useEffect, useEffectEvent, useRef } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import CoverPreviewModal from './CoverPreviewModal';
import PhotoSetViewer from './PhotoSetViewer';
import StorySchema from '../../utils/StorySchema';
import Badge from './Badge';
import { useTheme } from '../contexts/ThemeContext';

export interface ImageMetadata {
  filename: string;
  dimensions?: { width: number; height: number };
  alt: string;
  customData?: Record<string, string>; // For doc links, etc.
}

interface PhotoGalleryProps {
  images: string[]; // Array of image filenames or full paths (.svg, .png, .jpg)
  basePath?: string; // Optional base path (e.g., '/svgs', '/covers', '/images')
  alt?: string; // Optional alt text prefix
  aspectRatio?: '1:1' | '16:9' | '4:3'; // DEPRECATED: Always uses 1:1 in mobile-first scroll mode. Kept for backward compatibility.
  enableStories?: boolean; // Enable interactive story feature (only works for cover images)
  objectFit?: 'cover' | 'contain' | 'auto'; // Object-fit behavior: 'auto' detects SVGs and uses contain, otherwise uses cover
  enablePhotoModal?: boolean; // Enable photo modal for non-story images (default: true)
  onImageAction?: (filename: string, index: number, metadata: ImageMetadata) => void | string; // Flexible callback for doc linking
  imageActionLabel?: string; // Label for action button (default: "View Details")
  imageMetadata?: Record<string, Partial<ImageMetadata>>; // Custom metadata per image
  onImageError?: (filename: string) => void; // Called when an image fails to load, so a parent can drop it
  shape?: 'tile' | 'circle'; // 'circle': circle-then-text rows (the filename is the text), each photo drifting slowly
  labels?: string[]; // Text per image, same order as images; a missing entry falls back to the filename
  dates?: string[]; // Optional date per image (circle modal header): 'YYYY-MM-DD' is formatted, anything else shows as written
}

// 'maybe-i-was-just-hungry.webp' -> 'maybe i was just hungry'
const labelFromFilename = (filename: string): string =>
  (filename.split('/').pop() || filename).replace(/\.[^./]+$/, '').replace(/[-_]+/g, ' ');

/**
 * PhotoGallery - Mobile-first horizontal scroll gallery component
 *
 * Layout: Horizontal scroll on all screen sizes with 240px square cards, or
 * circle-then-text rows (shape="circle"). A circle's ring dims once its photo
 * has been opened, so the next unseen one is the one that still invites a tap.
 * Features: Story overlays, photo modal, keyboard navigation, custom actions, metadata
 */
const PhotoGallery: React.FC<PhotoGalleryProps> = ({ 
  images, 
  basePath = '', 
  alt = 'unparty-app development gallery',
  enableStories = false,
  objectFit = 'auto',
  enablePhotoModal = true,
  onImageAction,
  imageActionLabel = 'View Details',
  imageMetadata,
  onImageError,
  shape = 'tile',
  labels,
  dates
}) => {
  const { colorValue } = useTheme();
  const router = useRouter();
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedCoverId, setSelectedCoverId] = useState<string | null>(null);
  const [storiesData, setStoriesData] = useState<Map<string, { title: string; author: string; hasStory: boolean }>>(new Map());
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [imageDimensions, setImageDimensions] = useState<Map<number, { width: number; height: number }>>(new Map());
  const [seenIndexes, setSeenIndexes] = useState<Set<number>>(new Set());
  const lastFocusedElementRef = useRef<HTMLElement | null>(null);

  const photoUrls = images.map((filename) => {
    // If filename already starts with /, use as-is, otherwise prepend basePath
    return filename.startsWith('/') ? filename : `${basePath}/${filename}`;
  });

  // Extract cover ID from filename (e.g., 'cover-001.JPG' -> 'cover-001')
  const getCoverId = (filename: string): string | null => {
    const nameWithoutPath = filename.split('/').pop() || '';
    const match = nameWithoutPath.match(/^(cover-\d+)/);
    return match ? match[1] : null;
  };

  // Load story data for covers if enableStories is true
  useEffect(() => {
    if (!enableStories) return;

    const loadStories = async () => {
      const newStoriesData = new Map<string, { title: string; author: string; hasStory: boolean }>();

      for (const filename of images) {
        const coverId = getCoverId(filename);
        if (!coverId) continue;

        try {
          const [title, author, hasStory] = await Promise.all([
            StorySchema.getStoryTitle(coverId),
            StorySchema.getStoryAuthor(coverId),
            StorySchema.hasCoverStory(coverId)
          ]);

          if (hasStory && title && author) {
            newStoriesData.set(filename, { title, author, hasStory });
          }
        } catch (error) {
          console.warn(`Failed to load story for ${coverId}:`, error);
        }
      }

      setStoriesData(newStoriesData);
    };

    loadStories();
  }, [images, enableStories]);

  const handleImageError = (index: number) => {
    setImageErrors(prev => new Set([...prev, index]));
    onImageError?.(images[index]);
  };

  const handleImageLoad = (index: number, event?: React.SyntheticEvent<HTMLImageElement>) => {
    setLoadedImages(prev => new Set([...prev, index]));
    
    // Capture image dimensions if event provided
    if (event?.currentTarget) {
      const img = event.currentTarget;
      setImageDimensions(prev => new Map(prev).set(index, {
        width: img.naturalWidth,
        height: img.naturalHeight
      }));
    }
  };

  // Open a photo in the modal and remember it was seen
  const showImage = (index: number) => {
    setSelectedImageIndex(index);
    setSeenIndexes(prev => new Set(prev).add(index));
  };

  // Navigation handlers
  const handlePrevImage = () => {
    if (selectedImageIndex === null) return;
    showImage(selectedImageIndex === 0 ? images.length - 1 : selectedImageIndex - 1);
  };

  const handleNextImage = () => {
    if (selectedImageIndex === null) return;
    showImage((selectedImageIndex + 1) % images.length);
  };

  const labelFor = (index: number) => labels?.[index] || labelFromFilename(images[index]);

  // Close the photo modal and return focus to whatever opened it
  const closeModal = () => {
    setSelectedImageIndex(null);
    lastFocusedElementRef.current?.focus();
  };

  // Image click handler with priority logic
  const handleImageClick = (filename: string, index: number) => {
    lastFocusedElementRef.current = document.activeElement as HTMLElement;
    const imageMetaData = imageMetadata?.[filename];
    const metadata: ImageMetadata = {
      filename,
      dimensions: imageDimensions.get(index),
      alt: `${alt} ${index + 1}`,
      customData: imageMetaData?.customData
    };

    // Priority 1: Custom action callback
    if (onImageAction) {
      const result = onImageAction(filename, index, metadata);
      if (result && typeof result === 'string') {
        // Treat as navigation URL
        router.push(result);
        return;
      }
      // If void, continue to check other priorities (modal/story)
    }

    // Priority 2: Story preview (if enableStories)
    const coverId = getCoverId(filename);
    if (enableStories && coverId && storiesData.get(filename)?.hasStory) {
      setSelectedCoverId(coverId);
      return;
    }

    // Priority 3: Photo modal (if enablePhotoModal)
    if (enablePhotoModal) {
      showImage(index);
    }
  };


  // Detect if image is SVG (by extension or gatekeeper prefix)
  const isSvgImage = (filename: string): boolean => {
    const lowercaseFilename = filename.toLowerCase();
    return lowercaseFilename.endsWith('.svg') || lowercaseFilename.includes('gatekeeper');
  };

  // Determine object-fit class based on image type and objectFit prop
  const getObjectFitClass = (filename: string): string => {
    if (objectFit === 'cover') return 'object-cover';
    if (objectFit === 'contain') return 'object-contain';
    // Auto mode: detect SVGs and use contain, otherwise cover
    return isSvgImage(filename) ? 'object-contain' : 'object-cover';
  };

  // ESC key & keyboard navigation for PhotoModal. The effect event always
  // sees the latest handlers, so the listener only needs to track open/closed.
  // A circle set's viewer (PhotoSetViewer) handles its own keys.
  const handleModalKeyDown = useEffectEvent((e: KeyboardEvent) => {
    if (shape === 'circle') return;
    if (e.key === 'Escape') {
      closeModal();
    } else if (e.key === 'ArrowLeft') {
      handlePrevImage();
    } else if (e.key === 'ArrowRight') {
      handleNextImage();
    }
  });

  const isModalOpen = selectedImageIndex !== null;
  useEffect(() => {
    if (!isModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => handleModalKeyDown(e);
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);

  return (
    <>
      {/* Mobile-first horizontal scroll gallery with snap behavior */}
      <div
        className={
          shape === 'circle'
            ? 'flex gap-6 px-6 py-3 overflow-x-auto snap-x snap-mandatory scroll-pl-6 scrollbar-hide [mask-image:linear-gradient(to_right,transparent,#000_16px,#000_calc(100%-48px),transparent)]'
            : 'flex gap-4 px-4 overflow-x-auto snap-x snap-mandatory scroll-pl-4 scrollbar-hide pb-2'
        }
      >
        {photoUrls.map((url, index) => {
          const filename = images[index];

          if (shape === 'circle') {
            // A photo that fails to load is left out rather than shown broken
            if (imageErrors.has(index)) return null;
            const label = labelFor(index);
            const seen = seenIndexes.has(index);

            return (
              <button
                key={index}
                type="button"
                data-image-index={index}
                aria-label={`Open ${label}`}
                className="group flex w-[232px] flex-shrink-0 snap-start items-center gap-3 rounded-full text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--theme-color)]"
                onClick={() => handleImageClick(filename, index)}
              >
                <span
                  className="relative size-16 shrink-0 rounded-full p-[2px] transition-[transform,background-color,box-shadow] duration-300 group-hover:scale-105 group-active:scale-95 motion-reduce:transition-none"
                  style={{
                    backgroundColor: seen ? `${colorValue}40` : colorValue,
                    boxShadow: seen ? 'none' : `0 8px 16px -8px ${colorValue}99`
                  }}
                >
                  <span
                    className="relative block size-full overflow-hidden rounded-full border-2"
                    style={{ borderColor: 'var(--background)', backgroundColor: `${colorValue}20` }}
                  >
                    <Image
                      src={url}
                      alt=""
                      fill
                      sizes="64px"
                      className={`photo-circle-drift object-cover transition-opacity duration-500 ${
                        loadedImages.has(index) ? 'opacity-100' : 'opacity-0'
                      }`}
                      // Each circle starts at a different point in the loop, so the row never moves in step.
                      // Portrait photos frame the upper third (faces, titles) rather than the middle
                      style={{ animationDelay: `${index * -3.7}s`, objectPosition: '50% 35%' }}
                      onError={() => handleImageError(index)}
                      onLoad={(e) => handleImageLoad(index, e)}
                    />
                  </span>
                </span>
                <span
                  className="line-clamp-2 font-google-sans-code text-xs leading-snug transition-colors duration-300"
                  style={{ color: seen ? 'var(--text-muted)' : 'var(--foreground)' }}
                >
                  {label}
                </span>
              </button>
            );
          }
          const storyData = storiesData.get(filename);
          const hasStory = storyData?.hasStory || false;

          return (
            <div
              key={index}
              data-image-index={index}
              tabIndex={0}
              role={(hasStory || enablePhotoModal || onImageAction) ? 'button' : undefined}
              aria-label={(hasStory || enablePhotoModal || onImageAction) ? `Open ${alt} ${index + 1}` : undefined}
              className={`group relative w-[240px] h-[240px] flex-shrink-0 snap-start overflow-hidden rounded-xl ${(hasStory || enablePhotoModal || onImageAction) ? 'cursor-pointer' : ''}`}
              onMouseEnter={() => enableStories && setHoveredIndex(index)}
              onMouseLeave={() => enableStories && setHoveredIndex(null)}
              onClick={() => handleImageClick(filename, index)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleImageClick(filename, index);
                }
              }}
            >
              {/* Skeleton Loading State */}
              {!loadedImages.has(index) && !imageErrors.has(index) && (
                <div className="absolute inset-0 animate-pulse">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-300/50 to-transparent dark:via-gray-700/50" 
                       style={{
                         animation: 'shimmer 2s infinite',
                         backgroundSize: '200% 100%'
                       }}
                  />
                </div>
              )}

              {/* Image */}
              {!imageErrors.has(index) ? (
                <Image
                  src={url}
                  alt={`${alt} ${index + 1}`}
                  fill
                  sizes="240px"
                  className={`${getObjectFitClass(filename)} transition-opacity duration-300 ${
                    loadedImages.has(index) ? 'opacity-100' : 'opacity-0'
                  }`}
                  onError={() => handleImageError(index)}
                  onLoad={(e) => handleImageLoad(index, e)}
                  priority={index < 4} // Prioritize first 4 images
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-sm text-gray-500 dark:bg-gray-900 dark:text-gray-400">
                  🥲 ❌ 📸
                </div>
              )}

              {/* Story Badge Overlay - Only shown on hover if story exists */}
              {enableStories && hasStory && storyData && hoveredIndex === index && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity duration-300">
                  <div className="absolute bottom-3 right-3">
                    <Badge 
                      variant="header" 
                      size="sm"
                      className="cursor-pointer backdrop-blur-sm bg-black/20 border-white/30 text-white/90 transition-all duration-200 hover:bg-black/40"
                    >
                      <div className="leading-tight text-left">
                        <div className="font-bold">{storyData.title}</div>
                        <div className="mt-0.5 text-xs opacity-80">by {storyData.author}</div>
                      </div>
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Shimmer Animation Keyframes */}
        <style jsx>{`
          @keyframes shimmer {
            0% {
              background-position: -200% 0;
            }
            100% {
              background-position: 200% 0;
            }
          }
        `}</style>
      </div>

      {/* Circle set viewer - swipeable, full screen on phones */}
      {enablePhotoModal && shape === 'circle' && selectedImageIndex !== null && (
        <PhotoSetViewer
          urls={photoUrls}
          labels={images.map((_, i) => labelFor(i))}
          dates={dates}
          index={selectedImageIndex}
          onIndexChange={showImage}
          onClose={closeModal}
          colorValue={colorValue}
        />
      )}

      {/* Photo Modal - for non-story images */}
      {enablePhotoModal && shape !== 'circle' && selectedImageIndex !== null && (
        <PhotoModal
          images={images}
          photoUrls={photoUrls}
          selectedIndex={selectedImageIndex}
          onClose={closeModal}
          onPrev={handlePrevImage}
          onNext={handleNextImage}
          alt={alt}
          colorValue={colorValue}
          imageDimensions={imageDimensions}
          getObjectFitClass={getObjectFitClass}
          onImageAction={onImageAction}
          imageActionLabel={imageActionLabel}
          imageMetadata={imageMetadata}
          onImageLoad={handleImageLoad}
          router={router}
        />
      )}

      {/* Cover Preview Modal - for story images */}
      {enableStories && selectedCoverId && (
        <CoverPreviewModal 
          coverId={selectedCoverId}
          isOpen={!!selectedCoverId}
          onClose={() => setSelectedCoverId(null)}
        />
      )}
    </>
  );
};

/**
 * PhotoModal - Inline modal component for displaying images with metadata and navigation
 */
interface PhotoModalProps {
  images: string[];
  photoUrls: string[];
  selectedIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  alt: string;
  colorValue: string;
  imageDimensions: Map<number, { width: number; height: number }>;
  getObjectFitClass: (filename: string) => string;
  onImageAction?: (filename: string, index: number, metadata: ImageMetadata) => void | string;
  imageActionLabel: string;
  imageMetadata?: Record<string, Partial<ImageMetadata>>;
  onImageLoad: (index: number, event?: React.SyntheticEvent<HTMLImageElement>) => void;
  router: ReturnType<typeof useRouter>;
}

const PhotoModal: React.FC<PhotoModalProps> = ({
  images,
  photoUrls,
  selectedIndex,
  onClose,
  onPrev,
  onNext,
  alt,
  colorValue,
  imageDimensions,
  getObjectFitClass,
  onImageAction,
  imageActionLabel,
  imageMetadata,
  onImageLoad,
  router
}) => {
  const currentFilename = images[selectedIndex];
  const currentUrl = photoUrls[selectedIndex];
  const dimensions = imageDimensions.get(selectedIndex);
  const imageMetaData = imageMetadata?.[currentFilename];
  const customData = imageMetaData?.customData;
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = 'photo-modal-title';

  // Extract clean filename for display, without extension
  const displayFilename = (currentFilename.split('/').pop() || currentFilename).replace(/\.[^./]+$/, '');

  // Move focus into the dialog when it opens so keyboard/screen-reader users land somewhere sensible
  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  const handleAction = () => {
    if (!onImageAction) return;

    const metadata: ImageMetadata = {
      filename: currentFilename,
      dimensions,
      alt: `${alt} ${selectedIndex + 1}`,
      customData
    };

    const result = onImageAction(currentFilename, selectedIndex, metadata);
    if (result && typeof result === 'string') {
      onClose();
      router.push(result);
    }
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-sm" 
      style={{ backgroundColor: 'var(--background)' }}
    >
      {/* Modal Content */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="animate-in fade-in slide-in-from-bottom-4 vh-card-elevated relative w-full max-w-5xl rounded-xl border duration-200"
        style={{
          borderColor: `${colorValue}40`,
          backgroundColor: 'var(--background)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: `${colorValue}30` }}>
          <div className="flex items-center gap-3">
            <h2 id={titleId} className="font-google-sans-code text-lg font-bold uppercase" style={{ color: colorValue }}>
              {displayFilename}
            </h2>
            <Badge variant="header" size="sm">
              <span className="font-vt323">{selectedIndex + 1}</span> / <span className="font-vt323">{images.length}</span>
            </Badge>
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="flex items-center justify-center w-10 h-10 rounded-lg transition-colors"
            style={{ 
              color: 'var(--text-muted)',
              backgroundColor: 'transparent'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--background-highlight)';
              e.currentTarget.style.color = 'var(--foreground)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
            aria-label="Close photo modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Image Container */}
        <div className="relative flex items-center justify-center p-6" style={{ maxHeight: '70vh' }}>
          <div className="relative w-full" style={{ height: '60vh' }}>
            <Image
              src={currentUrl}
              alt={`${alt} ${selectedIndex + 1}`}
              fill
              className={`${getObjectFitClass(currentFilename)} rounded-lg`}
              style={{ objectFit: 'contain' }}
              sizes="(max-width: 1280px) 90vw, 1200px"
              onLoad={(e) => onImageLoad(selectedIndex, e)}
            />

            {/* Navigation Buttons - anchored to the image area so they never overlap the modal edges */}
            {images.length > 1 && (
              <>
                <button
                  onClick={onPrev}
                  className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full transition-all sm:h-12 sm:w-12"
                  style={{
                    backgroundColor: 'var(--background)',
                    borderColor: `${colorValue}40`,
                    border: '1px solid'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--background-highlight)';
                    e.currentTarget.style.borderColor = colorValue;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--background)';
                    e.currentTarget.style.borderColor = `${colorValue}40`;
                  }}
                  aria-label="Previous image"
                >
                  <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: colorValue }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <button
                  onClick={onNext}
                  className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full transition-all sm:h-12 sm:w-12"
                  style={{
                    backgroundColor: 'var(--background)',
                    borderColor: `${colorValue}40`,
                    border: '1px solid'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--background-highlight)';
                    e.currentTarget.style.borderColor = colorValue;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--background)';
                    e.currentTarget.style.borderColor = `${colorValue}40`;
                  }}
                  aria-label="Next image"
                >
                  <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: colorValue }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Metadata Panel */}
        <div className="border-t px-6 py-4" style={{ borderColor: `${colorValue}30` }}>
          <div className="flex flex-wrap items-center gap-4">
            {/* Custom Metadata */}
            {customData && Object.entries(customData).map(([key, value]) => (
              <Badge key={key} variant="secondary" size="sm">
                <span className="font-google-sans-code text-xs">{key}:</span>{' '}
                <span className="font-vt323">{String(value)}</span>
              </Badge>
            ))}

            {/* Action Button */}
            {onImageAction && (
              <button
                onClick={handleAction}
                className="ml-auto rounded-lg px-4 py-2 font-google-sans-code text-sm font-medium transition-all"
                style={{
                  backgroundColor: `${colorValue}20`,
                  color: colorValue,
                  borderColor: `${colorValue}40`,
                  border: '1px solid'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${colorValue}30`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = `${colorValue}20`;
                }}
              >
                {imageActionLabel}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close */}
      <div 
        className="absolute inset-0 -z-10" 
        onClick={onClose}
        aria-label="Close photo modal"
      />
    </div>,
    document.body
  );
};

export default PhotoGallery;
