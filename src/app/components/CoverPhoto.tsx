"use client";

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Check } from '@/app/components/icons';
import UnpppsConfig from '../../data/UnpppsConfig.json';
import CoverSchema from '../../utils/CoverSchema';
import StorySchema from '../../utils/StorySchema';
import Badge from './Badge';
import CoverPreviewModal from './CoverPreviewModal';
import CoverVideo from './CoverVideo';
import { useCover } from '../contexts/CoverContext';
import { useStepImageRegistry } from '@/hooks/useStepImageRegistry';
import { useAsyncData, useFetch } from '@/hooks/useFetch';
import { useUser } from '@/lib/auth-stub.client';

interface CoverPhotoProps {
  className?: string;
}

// Cover ids are extensionless (the extension is resolved below), but story
// frontmatter can carry one (e.g. `cover: cover-032.png`), which produced
// /covers/cover-032.png.png. Strip it so both forms resolve.
function stripImageExtension(coverId: string | undefined): string | undefined {
  return coverId?.replace(/\.(png|jpe?g|webp|gif|svg)$/i, '');
}

const CoverPhoto = ({ className = '' }: CoverPhotoProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const { coverData } = useCover();
  const { isSignedIn } = useUser();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Find the current unppp based on pathname
  const currentUnppp = UnpppsConfig.unppps.find(unppp => {
    const route = unppp.id === 'theunpartyapp' ? '/' : `/${unppp.id}`;
    return route === pathname;
  });

  // Use context data if available, otherwise fall back to unppp data
  const displayData = coverData || currentUnppp;
  
  // Use display data properties with appropriate fallbacks
  const unpppColor = displayData?.color || '#F9C22E';
  const unpppName = displayData?.name || 'UNPARTY';
  const coverImage = stripImageExtension(coverData?.coverId || currentUnppp?.cover);
  // Demo videos live on the unppp entry for the current route (CoverContext
  // only carries coverId/color/name, not video) - EditorialArticle scopes
  // coverData to this same page via mount/unmount, so this stays in sync.
  const coverVideo = currentUnppp?.coverVideo;
  
  // Get cover photo source information
  const coverSource = coverImage ? CoverSchema.getSecureCoverSource(coverImage) : null;

  // Registry lookup: if this cover is registered as a photo-upload Step
  // (see useStepImageRegistry), clicking the frame opens its upload modal
  // instead of/in addition to the story preview, with a completion badge -
  // a no-op for any cover that isn't registered.
  const stepRegistry = useStepImageRegistry(coverImage ? [coverImage] : []);
  const stepEntry = coverImage ? stepRegistry[coverImage] : undefined;

  // Once the viewer has completed this cover's step, show the photo they
  // actually uploaded instead of the static placeholder cover - otherwise
  // this always rendered the same photo regardless of who's looking
  // or whether they'd completed it. Reuses the same scope=mine endpoint
  // StepPhotoScrollRow already calls.
  const stepId = stepEntry?.completed ? stepEntry.stepId : undefined;
  const { data: myPhotos } = useFetch<{ photos?: { blobUrl: string }[] }>(
    stepId && isSignedIn ? `/api/steps/photos?scope=mine&stepId=${stepId}` : null
  );
  const myPhotoUrl = myPhotos?.photos?.[0]?.blobUrl ?? null;

  // Load story information asynchronously; a failure reads as "no story"
  const { data: story } = useAsyncData(coverImage || null, async (cover) => {
    const [title, author, builder, hasStoryData] = await Promise.all([
      StorySchema.getStoryTitle(cover),
      StorySchema.getStoryAuthor(cover),
      StorySchema.getStoryBuilder(cover),
      StorySchema.hasCoverStory(cover)
    ]);
    return { title, author, builder, hasStory: hasStoryData };
  });
  const storyTitle = story?.title ?? null;
  const storyAuthor = story?.author ?? null;
  const storyBuilder = story?.builder ?? null;
  const hasStory = story?.hasStory ?? false;

  // Any cover id is attempted - onError below (already wired) catches a
  // real 404 the same way it already handles a bad coverVideo, so no
  // allowlist of known-good ids needs to be maintained here. myPhotoUrl
  // (the viewer's own upload, once completed) takes priority over the
  // static cover when both are available.
  const hasValidCover = Boolean(myPhotoUrl) || (Boolean(coverImage) && !imageError);
  const shouldShowImage = hasValidCover && imageLoaded && !imageError;
  const shouldShowVideo = Boolean(coverVideo) && !videoError;
  const shouldShowMedia = shouldShowVideo || shouldShowImage;

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

  return (
    <div className={`relative mx-auto w-full max-w-5xl overflow-hidden ${className}`}>
      {/* Beautiful cover frame with image or color fallback */}
      <div
        className={`group relative overflow-hidden transition-all duration-500 ease-out ${stepEntry ? 'cursor-pointer' : ''}`}
        style={{
          aspectRatio: '16/9',
          borderRadius: '0.75rem',
          maxHeight: '600px',
          background: shouldShowMedia
            ? 'transparent'
            : `linear-gradient(135deg, ${unpppColor} 100%, ${unpppColor}30 100%, ${unpppColor}30 100%)`,
          boxShadow: `0 8px 32px ${unpppColor}30, inset 0 0.3px 6.8 rgba(255,255,255,0.3)`
        }}
        onClick={() => {
          if (stepEntry) {
            router.push(`/steps/${stepEntry.stepId}`, { scroll: false });
          }
        }}
      >
        {stepEntry?.completed && (
          <div className="absolute right-3 top-3 z-10 flex size-7 items-center justify-center rounded-full bg-emerald-500/90 text-white">
            <Check className="size-4" />
          </div>
        )}

        {/* Cover Image - the viewer's own uploaded photo once they've
            completed this cover's step, else the static cover */}
        {myPhotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- blob storage host isn't configured for next/image
          <img
            src={myPhotoUrl}
            alt={`${unpppName} cover`}
            className={`absolute inset-0 size-full object-cover transition-opacity duration-500 ${shouldShowImage && !shouldShowVideo ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        ) : (
          hasValidCover &&
          coverImage && (
            <Image
              src={`/covers/${coverImage}.${getCoverImageExtension(coverImage)}`}
              alt={`${unpppName} cover`}
              fill
              className={`${coverImage.startsWith('gatekeeper') ? 'object-contain' : 'object-cover'} transition-opacity duration-500 ${shouldShowImage && !shouldShowVideo ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
            />
          )
        )}

        {/* Cover Video - takes priority over the static cover image when present */}
        {coverVideo && !videoError && (
          <CoverVideo
            src={coverVideo}
            poster={coverImage ? `/covers/${coverImage}.${getCoverImageExtension(coverImage)}` : undefined}
            alt={`${unpppName} demo video`}
            className={`absolute inset-0 size-full object-cover transition-opacity duration-500 ${videoLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoadedData={() => setVideoLoaded(true)}
            onError={() => setVideoError(true)}
          />
        )}

        {/* Elegant gradient overlay for enhanced text readability */}
        <div
          className="absolute inset-0 transition-opacity duration-500"
          style={{
            background: shouldShowMedia
              ? `linear-gradient(135deg, ${unpppColor}40 0%, transparent 00%, transparent 70%, ${unpppColor}20 100%)`
              : 'transparent'
          }}
        />

        {/* Elegant unppp name overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="font-900 font-['Brandon-Grotesque'] text-4xl uppercase tracking-wider opacity-0 md:text-6xl lg:text-7xl"
            style={{
              color: shouldShowMedia ? '#FFFFFF' : '#000605',
              textShadow: shouldShowMedia
                ? `0 2px 8px rgba(0,0,0,0.5), 0 4px 16px ${unpppColor}50`
                : `0 2px 8px ${unpppColor}30`
            }}
          >
            
          </div>
        </div>

        {/* Premium depth border */}
        <div 
          className="absolute inset-0 rounded-xl"
          style={{
            border: `1px solid ${unpppColor}30`,
            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.1)`
          }}
        />

        {/* Story and credit info on hover */}
        {(coverSource || hasStory) && (
          <div className="absolute bottom-3 right-3 opacity-0 transition-all duration-300 group-hover:opacity-100">
            <div className="flex flex-col items-end gap-2">
              {/* Story information - primary navigation element */}
              {hasStory && storyTitle && storyAuthor ? (
                <button
                  onClick={(e) => {
                    // Without this, a click here would also bubble to the
                    // frame's own onClick above when the cover is also a
                    // registered step, double-handling the click.
                    e.stopPropagation();
                    setIsPreviewOpen(true);
                  }}
                  className="block text-right"
                >
                  <Badge 
                    variant="header" 
                    size="sm"
                    className="cursor-pointer font-google-sans-code backdrop-blur-sm bg-black/20 border-white/30 text-white/90 transition-all duration-200 hover:bg-black/40"
                  >
                    <div className="leading-tight">
                      <div className="font-bold">{storyTitle}</div>
                      <div className="mt-0.5 text-xs opacity-80">
                        by @{storyAuthor}{storyBuilder && ` • built by @${storyBuilder}`}
                      </div>
                    </div>
                  </Badge>
                </button>
              ) : null}
              
              {/* Photographer credit badge - secondary element */}
             
            </div>
          </div>
        )}
      </div>

      {/* Cover Preview Modal */}
      {coverImage && (
        <CoverPreviewModal 
          coverId={coverImage}
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
        />
      )}
    </div>
  );
};

export default CoverPhoto;