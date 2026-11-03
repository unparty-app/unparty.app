"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Check } from '@/app/components/icons';
import StorySchema from '../../utils/StorySchema';
import Badge from './Badge';
import { useTheme } from '../contexts/ThemeContext';

interface CoverPhotoCardProps {
  coverId: string;
  showStoryOnly?: boolean; // Only show if cover has a story
  className?: string;
  // When this cover is registered as a photo-upload Step (see
  // /api/steps/by-cover), the card links to the upload modal instead of its
  // usual story/covers destination, and shows a completion badge.
  stepEntry?: { stepId: string; completed: boolean };
  circle?: boolean; // A circle filling its tile (ScrollRow's grid layout) instead of a 16:9 card
}

const CoverPhotoCard: React.FC<CoverPhotoCardProps> = ({
  coverId,
  showStoryOnly = false,
  className = '',
  stepEntry,
  circle = false,
}) => {
  const { colorValue } = useTheme();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [storyTitle, setStoryTitle] = useState<string | null>(null);
  const [storyAuthor, setStoryAuthor] = useState<string | null>(null);
  const [hasStory, setHasStory] = useState(false);

  // Load story information
  useEffect(() => {
    const loadStoryData = async () => {
      try {
        const [title, author, hasStoryData] = await Promise.all([
          StorySchema.getStoryTitle(coverId),
          StorySchema.getStoryAuthor(coverId),
          StorySchema.hasCoverStory(coverId)
        ]);
        setStoryTitle(title);
        setStoryAuthor(author);
        setHasStory(hasStoryData);
      } catch (error) {
        console.warn('Failed to load story data:', error);
        setHasStory(false);
      }
    };
    loadStoryData();
  }, [coverId]);

  // If showStoryOnly is true and there's no story, don't render
  if (showStoryOnly && !hasStory) {
    return null;
  }

  // Get the appropriate file extension for the cover image
  const getCoverImageExtension = (cover: string) => {
    const svgCovers = [
      'gatekeeper-brand-icon',
      'gatekeeper-budget-icon',
      'gatekeeper-core-icon',
      'gatekeeper-grow-icon',
      'gatekeeper-product-icon',
      'gatekeeper-risk-icon'
    ];
    const jpgCovers: string[] = [];
    const upperJpgCovers: string[] = [];

    if (svgCovers.includes(cover)) return 'svg';
    if (jpgCovers.includes(cover)) return 'jpg';
    if (upperJpgCovers.includes(cover)) return 'JPG';
    return 'png';
  };

  const shouldShowImage = imageLoaded && !imageError;
  const linkHref = stepEntry ? `/steps/${stepEntry.stepId}` : hasStory ? `/story/${coverId}` : `/covers`;

  // A glass circle: no ring, so nothing competes with the photo. The photo
  // drifts slowly inside (the PhotoGallery circle motion), framed on its upper
  // third, under a faint sheen and a hairline edge (globals.css .glass-circle)
  if (circle) {
    return (
      <Link
        href={linkHref}
        aria-label={storyTitle ?? coverId}
        className={`glass-circle group relative block size-full overflow-hidden rounded-full transition-transform duration-300 hover:scale-[1.03] active:scale-95 motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--theme-color)] ${className}`}
      >
        <span className="relative block size-full">
          <Image
            src={`/covers/${coverId}.${getCoverImageExtension(coverId)}`}
            alt={storyTitle || coverId}
            fill
            // A tile is at most 18rem, half the row on a phone
            sizes="(max-width: 640px) 50vw, 288px"
            className={`photo-circle-drift ${coverId?.startsWith('gatekeeper') ? 'object-contain' : 'object-cover'} transition-opacity duration-500 ${shouldShowImage ? 'opacity-100' : 'opacity-0'}`}
            style={{ objectPosition: '50% 35%' }}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        </span>
        {stepEntry?.completed && (
          <span
            className="absolute bottom-[8%] right-[8%] flex size-7 items-center justify-center rounded-full border-2"
            style={{ backgroundColor: colorValue, borderColor: 'var(--background)', color: 'var(--background)' }}
          >
            <Check className="size-4" />
          </span>
        )}
      </Link>
    );
  }

  return (
    <Link href={linkHref} className={`block ${className}`}>
      <div className="group relative w-full overflow-hidden rounded-lg transition-all duration-300 hover:scale-105">
        {/* Cover Image */}
        <div 
          className="relative"
          style={{ 
            aspectRatio: '16/9',
            background: shouldShowImage ? 'transparent' : '#F9C22E20'
          }}
        >
          <Image
            src={`/covers/${coverId}.${getCoverImageExtension(coverId)}`}
            alt={storyTitle || coverId}
            fill
            className={`${coverId?.startsWith('gatekeeper') ? 'object-contain' : 'object-cover'} transition-opacity duration-300 ${shouldShowImage ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            sizes="280px"
          />

          {/* Gradient overlay on hover */}
          <div
            className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          />

          {stepEntry?.completed && (
            <div className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-emerald-500/90 text-white">
              <Check className="size-3.5" />
            </div>
          )}

          {/* Story info overlay */}
          {hasStory && storyTitle && storyAuthor && (
            <div className="absolute bottom-3 left-3 right-3 translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
              <Badge 
                variant="header" 
                size="sm"
                className="w-full backdrop-blur-sm bg-black/40 border-white/30 text-white"
              >
                <div className="text-left leading-tight">
                  <div className="font-bold text-xs">{storyTitle}</div>
                  <div className="mt-0.5 text-[10px] opacity-80">by {storyAuthor}</div>
                </div>
              </Badge>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default CoverPhotoCard;
