'use client';

import React, { useState, useEffect } from 'react';

const FOUNDER_HANDLE = 'founder';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Camera } from '@/app/components/icons';
import { useTheme } from '../contexts/ThemeContext';
import Badge from './Badge';
import CoverSchema from '../../utils/CoverSchema';
import StorySchema, { Story } from '../../utils/StorySchema';
import UnpppsConfig from '../../data/UnpppsConfig.json';
import storiesManifest from '@/data/storiesManifest.json';

interface CoverPreviewModalProps {
  coverId: string;
  isOpen: boolean;
  onClose: () => void;
}

const CoverPreviewModal: React.FC<CoverPreviewModalProps> = ({ 
  coverId, 
  isOpen, 
  onClose 
}) => {
  const { colorValue } = useTheme();
  const router = useRouter();
  const [story, setStory] = useState<Story | null>(null);
  const [hasStory, setHasStory] = useState(false);
  
  // Load story data when modal opens
  useEffect(() => {
    if (isOpen && coverId) {
      const loadStoryData = async () => {
        try {
          const [storyData, hasStoryData] = await Promise.all([
            StorySchema.getStoryByCoverId(coverId),
            StorySchema.hasCoverStory(coverId)
          ]);
          setStory(storyData);
          setHasStory(hasStoryData);
        } catch (error) {
          console.warn('Failed to load story data:', error);
          setStory(null);
          setHasStory(false);
        }
      };
      loadStoryData();
    }
  }, [isOpen, coverId]);
  
  if (!isOpen) return null;

  const coverSource = CoverSchema.getSecureCoverSource(coverId);
  const unppp = UnpppsConfig.unppps.find(u => u.cover === coverId);
  
  // Get the appropriate file extension for the cover image
  const getCoverImageExtension = (cover: string) => {
    const jpgCovers: string[] = [];
    const upperJpgCovers: string[] = [];
    
    if (jpgCovers.includes(cover)) return 'jpg';
    if (upperJpgCovers.includes(cover)) return 'JPG';
    return 'png';
  };

  const handleExternalLink = () => {
    if (!coverSource?.safeUrl) return;
    
    // If it's a founders user , navigate internally to /founders
    if (coverSource.photographer === FOUNDER_HANDLE) {
      onClose(); // Close modal first
      router.push('/founders');
    } else {
      // External link for Instagram profiles
      window.open(coverSource.safeUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-sm" 
      style={{ backgroundColor: 'var(--background)' }}
    >
      <div 
        className="animate-in fade-in slide-in-from-bottom-4 vh-card-elevated w-full max-w-lg rounded-xl border duration-200"
        style={{ 
          borderColor: `${colorValue}40`,
          backgroundColor: 'var(--background)'
        }}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b p-4"
             style={{ borderColor: `${colorValue}30` }}>
          <div className="flex items-center gap-3">
            <h2 className="font-google-sans-code text-lg font-bold uppercase" style={{ color: colorValue }}>
              {story?.metadata.title || 'Cover Story'}
            </h2>
            <Badge variant="header" size="sm">
              {story?.metadata.category || coverId}
            </Badge>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 transition-colors"
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
            aria-label="Close cover preview"
          >
            <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Cover Image Preview */}
        <div className="relative aspect-video overflow-hidden rounded-xl">
          <Image
            src={`/covers/${coverId}.${getCoverImageExtension(coverId)}`}
            alt={`Cover ${coverId}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 512px"
          />
          <div 
            className="absolute inset-0"
            style={{
              background: unppp?.color 
                ? `linear-gradient(135deg, ${unppp.color}20 0%, transparent 30%, transparent 70%, ${unppp.color}10 100%)`
                : `linear-gradient(135deg, ${colorValue}20 0%, transparent 30%, transparent 70%, ${colorValue}10 100%)`
            }}
          />
          
          {/* Premium depth border */}
          <div 
            className="absolute inset-0 rounded-xl"
            style={{
              border: `1px solid ${unppp?.color ? `${unppp.color}30` : `${colorValue}30`}`,
              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.1)`
            }}
          />

          {/* Photographer credit badge overlay */}
          {coverSource && (
            <div className="absolute bottom-3 right-3">
              <button
                onClick={handleExternalLink}
                className="block"
              >
                <Badge 
                  variant="header" 
                  size="sm"
                  className="cursor-pointer font-google-sans-code backdrop-blur-sm bg-black/20 text-white/90 opacity-75 transition-all duration-200 hover:bg-black/40 hover:opacity-100 border-0 flex items-center gap-1.5"
                >
                  <Camera size={12} />
                  @{coverSource.photographer}
                </Badge>
              </button>
            </div>
          )}
        </div>

        {/* Cover Details */}
        <div className="p-6">
          {/* Cover Story Content */}
          <div className="pt-2 border-t" style={{ borderColor: `${colorValue}20` }}>
            {hasStory && story ? (
              <div className="space-y-4">
                {/* Story Title */}
                <div>
                  <h3 
                    className="font-google-sans-code text-lg font-bold uppercase tracking-wide" 
                    style={{ 
                      color: colorValue,
                      fontFamily: 'var(--font-family, monospace)',
                      fontSize: 'var(--text-lg, 1.125rem)'
                    }}
                  >
                    {story.metadata.title}
                  </h3>
                  {story.metadata.subtitle && (
                    <p 
                      className="font-google-sans-code text-sm mt-1" 
                      style={{ 
                        color: 'var(--text-muted)',
                        fontFamily: 'var(--font-family, monospace)',
                        fontSize: 'var(--text-sm, 0.875rem)'
                      }}
                    >
                      {story.metadata.subtitle}
                    </p>
                  )}
                </div>

                {/* Story Description */}
                {story.metadata.description && (
                  <p 
                    className="font-google-sans-code text-sm leading-relaxed" 
                    style={{ 
                      color: 'var(--foreground)',
                      fontFamily: 'var(--font-family, monospace)',
                      fontSize: 'var(--text-sm, 0.875rem)'
                    }}
                  >
                    {story.metadata.description}
                  </p>
                )}

                {/* Story Metadata */}
                <div className="flex flex-wrap gap-4 text-xs">
                  {story.metadata.category && (
                    <span 
                      className="font-google-sans-code font-bold uppercase px-2 py-1 rounded"
                      style={{ 
                        backgroundColor: `${colorValue}20`,
                        color: colorValue,
                        fontFamily: 'var(--font-family, monospace)',
                        fontSize: 'var(--text-xs, 0.75rem)'
                      }}
                    >
                      {story.metadata.category}
                    </span>
                  )}
                  {story.metadata.date && (
                    <span 
                      className="font-google-sans-code"
                      style={{ 
                        color: 'var(--text-muted)',
                        fontFamily: 'var(--font-family, monospace)',
                        fontSize: 'var(--text-xs, 0.75rem)'
                      }}
                    >
                      {story.metadata.date}
                    </span>
                  )}
                </div>

                {/* Song Information */}
                {story.metadata.song && story.metadata['song-artist'] && (
                  <div 
                    className="border-l-2 pl-3"
                    style={{ borderColor: `${colorValue}40` }}
                  >
                    <p 
                      className="font-google-sans-code text-xs"
                      style={{ 
                        color: 'var(--text-muted)',
                        fontFamily: 'var(--font-family, monospace)',
                        fontSize: 'var(--text-xs, 0.75rem)'
                      }}
                    >
                      Featured Song: <span style={{ color: 'var(--foreground)' }}>{story.metadata.song}</span>
                    </p>
                    <p 
                      className="font-google-sans-code text-xs"
                      style={{ 
                        color: 'var(--text-muted)',
                        fontFamily: 'var(--font-family, monospace)',
                        fontSize: 'var(--text-xs, 0.75rem)'
                      }}
                    >
                      by {story.metadata['song-artist']}
                    </p>
                  </div>
                )}

                {/* Author Information */}
                <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: `${colorValue}10` }}>
                  <span 
                    className="font-google-sans-code text-xs"
                    style={{ 
                      color: 'var(--text-muted)',
                      fontFamily: 'var(--font-family, monospace)',
                      fontSize: 'var(--text-xs, 0.75rem)'
                    }}
                  >
                    BUILDER.
                  </span>
                  <span 
                    className="font-google-sans-code font-bold"
                    style={{ 
                      color: 'var(--foreground)',
                      fontFamily: 'var(--font-family, monospace)',
                      fontSize: 'var(--text-sm, 0.875rem)'
                    }}
                  >
                    @{story.metadata.author}
                    {story.metadata.author === FOUNDER_HANDLE && (
                      <span className="ml-1 text-xs opacity-75">→ founder</span>
                    )}
                  </span>
                </div>

               

                {/* Read More Button */}
                <div className="mt-4 pt-4 border-t" style={{ borderColor: `${colorValue}10` }}>
                  <button
                    onClick={() => {
                      onClose();
                      router.push(`/story/${(storiesManifest.coverIdToSlug as Record<string, string>)[coverId] ?? coverId}`);
                    }}
                    className="w-full font-google-sans-code font-bold uppercase px-4 py-3 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                    style={{ 
                      backgroundColor: `${colorValue}15`,
                      color: colorValue,
                      border: `1px solid ${colorValue}30`,
                      fontFamily: 'var(--font-family, monospace)',
                      fontSize: 'var(--text-sm, 0.875rem)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = `${colorValue}25`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = `${colorValue}15`;
                    }}
                  >
                    More →
                  </button>
                </div>
              </div>
            ) : coverSource?.photographer === FOUNDER_HANDLE ? (
              <p 
                className="font-google-sans-code text-xs" 
                style={{ 
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-family, monospace)',
                  fontSize: 'var(--text-xs, 0.75rem)'
                }}
              >
                Explore the founder&apos;s journey and vision in the 
                <span className="font-bold" style={{ color: colorValue }}> Founders</span> section.
              </p>
            ) : (
              <p 
                className="font-google-sans-code text-xs italic" 
                style={{ 
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-family, monospace)',
                  fontSize: 'var(--text-xs, 0.75rem)'
                }}
              >
                Cover stories coming soon...
              </p>
            )}
          </div>
        </div>
      </div>
      
      {/* Click outside to close */}
      <div 
        className="absolute inset-0 -z-10" 
        onClick={onClose}
        aria-label="Close cover preview modal"
      />
    </div>,
    document.body
  );
};

export default CoverPreviewModal;