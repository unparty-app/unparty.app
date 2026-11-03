'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Check } from '@/app/components/icons';
import StorySchema from '../../utils/StorySchema';
import Badge from './Badge';
import type { StepImageRegistryEntry } from '@/hooks/useStepImageRegistry';

interface CoverImageItemProps {
  filename: string;
  basePath?: string;
  alt?: string;
  aspectRatio?: '1:1' | '16:9' | '4:3';
  enableStories?: boolean;
  objectFit?: 'cover' | 'contain' | 'auto';
  onStoryClick?: (coverId: string) => void;
  // When this cover is registered as a photo-upload Step (see
  // useStepImageRegistry), the tile links to the upload modal instead of
  // its usual story behavior, and shows a completion badge.
  stepEntry?: StepImageRegistryEntry;
}

const CoverImageItem: React.FC<CoverImageItemProps> = ({
  filename,
  basePath = '',
  alt = 'Cover image',
  aspectRatio = '16:9',
  enableStories = false,
  objectFit = 'auto',
  onStoryClick,
  stepEntry
}) => {
  const router = useRouter();
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [storyData, setStoryData] = useState<{ title: string; author: string; hasStory: boolean } | null>(null);

  const photoUrl = filename.startsWith('/') ? filename : `${basePath}/${filename}`;

  // Extract cover ID from filename (e.g., 'cover-001.JPG' -> 'cover-001')
  const getCoverId = (filename: string): string | null => {
    const nameWithoutPath = filename.split('/').pop() || '';
    const match = nameWithoutPath.match(/^(cover-\d+)/);
    return match ? match[1] : null;
  };

  const coverId = getCoverId(filename);

  // Load story data for this cover if enableStories is true
  useEffect(() => {
    if (!enableStories || !coverId) return;

    const loadStory = async () => {
      try {
        const [title, author, hasStory] = await Promise.all([
          StorySchema.getStoryTitle(coverId),
          StorySchema.getStoryAuthor(coverId),
          StorySchema.hasCoverStory(coverId)
        ]);

        if (hasStory && title && author) {
          setStoryData({ title, author, hasStory });
        }
      } catch (error) {
        console.warn(`Failed to load story for ${coverId}:`, error);
      }
    };

    loadStory();
  }, [coverId, enableStories]);

  const aspectRatioClasses = {
    '1:1': 'pb-[100%]',
    '16:9': 'pb-[56.25%]',
    '4:3': 'pb-[75%]'
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

  const hasStory = storyData?.hasStory || false;

  const handleClick = () => {
    if (stepEntry) {
      router.push(`/steps/${stepEntry.stepId}`, { scroll: false });
      return;
    }
    if (enableStories && hasStory && coverId && onStoryClick) {
      onStoryClick(coverId);
    }
  };

  return (
    <div
      className={`group relative w-full overflow-hidden rounded-lg ${aspectRatioClasses[aspectRatio]} ${(hasStory || stepEntry) ? 'cursor-pointer' : ''}`}
      onMouseEnter={() => enableStories && setIsHovered(true)}
      onMouseLeave={() => enableStories && setIsHovered(false)}
      onClick={handleClick}
    >
      {/* Skeleton Loading State */}
      {!imageLoaded && !imageError && (
        <div className="absolute inset-0 animate-pulse bg-gray-200 dark:bg-gray-800">
          <div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-300/50 to-transparent dark:via-gray-700/50" 
            style={{
              animation: 'shimmer 2s infinite',
              backgroundSize: '200% 100%'
            }}
          />
        </div>
      )}

      {/* Image */}
      {!imageError ? (
        <Image
          src={photoUrl}
          alt={alt}
          fill
          sizes="280px"
          className={`${getObjectFitClass(filename)} transition-opacity duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onError={() => setImageError(true)}
          onLoad={() => setImageLoaded(true)}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-sm text-gray-500 dark:bg-gray-900 dark:text-gray-400">
          🥲 ❌ 📸
        </div>
      )}

      {stepEntry?.completed && (
        <div className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-emerald-500/90 text-white">
          <Check className="size-3.5" />
        </div>
      )}

      {/* Story Badge Overlay - Only shown on hover if story exists */}
      {enableStories && hasStory && storyData && isHovered && (
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
  );
};

export default CoverImageItem;
