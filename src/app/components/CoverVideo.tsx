'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

import { Volume2, VolumeX, Maximize2 } from '@/app/components/icons';
import { useWatchModal } from '../contexts/WatchModalContext';
import videoMetadata from '../../data/videoMetadata.json';

interface CoverVideoProps {
  src: string;
  poster?: string;
  alt: string;
  className?: string;
  onLoadedData?: () => void;
  onError?: () => void;
  /** Hide the unmute tap target - for small/compact renders (e.g. a circle
   * thumbnail) where the badge has no room and the video is muted-preview
   * only, not the primary way this content gets watched. Silent videos
   * (videoMetadata.json hasAudio: false) hide it on their own. */
  hideMuteToggle?: boolean;
  /** Expand-to-watch destination (/watch/[slug]) - renders a tap target
   * next to the mute toggle. Only pass this where a video-registry entry
   * actually exists for the content (see #956); omitting it renders no
   * expand icon. */
  watchHref?: string;
}

// Shared by CoverPhoto and EditorialArticle's ArticleCoverImage - both play
// the same kind of chrome-less, autoplaying cover video (no native
// <video controls>), so browsers require it to start muted. This adds the
// one thing a chrome-less muted video needs: a tap target to unmute, styled
// like CoverPhoto's existing black/white overlay badge since it has to stay
// legible over arbitrary video content, not the app's themed chrome.
const CoverVideo: React.FC<CoverVideoProps> = ({ src, poster, alt, className = '', onLoadedData, onError, hideMuteToggle = false, watchHref }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  // Nothing to unmute: a motion cover or a screen recording without sound
  const silent = (videoMetadata as Record<string, { hasAudio?: boolean }>)[src]?.hasAudio === false;
  const showMuteToggle = !hideMuteToggle && !silent;
  const [isMuted, setIsMuted] = useState(true);
  const { isWatchModalOpen } = useWatchModal();

  // Pause this ambient loop for as long as any /watch lightbox is open
  // (including the one this video itself expands into) so it doesn't keep
  // playing muted behind the modal's own unmuted video; resume on close.
  // .play() on a muted, already-playsInline video isn't gated by browser
  // autoplay policy, so this doesn't need the same play()-rejection
  // handling as WatchLightbox's unmuted attempt.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isWatchModalOpen) {
      video.pause();
    } else {
      video.play().catch(() => {});
    }
  }, [isWatchModalOpen]);

  const toggleMute = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  return (
    <>
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={alt}
        className={className}
        onLoadedData={onLoadedData}
        onError={onError}
      />
      {(showMuteToggle || watchHref) && (
        // Single flex row with `gap`, not two independently bottom/left-
        // offset absolute badges - two buttons that both had to compute
        // matching-but-different `left` values were observed landing on
        // the exact same position in Safari (never reproduced in Chromium
        // or Playwright's WebKit, so the precise mechanism is unconfirmed),
        // silently hiding the mute button under the expand icon. Flex
        // children with a gap can't collide this way regardless of cause -
        // grouped here rather than the opposite corner because that
        // overlaps OutlineRail's fixed rail (right-3/right-5, z-40, above
        // this row's z-10) at some scroll positions and swallows clicks.
        <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2">
          {showMuteToggle && (
            <button
              type="button"
              onClick={toggleMute}
              aria-label={isMuted ? 'Unmute video' : 'Mute video'}
              title={isMuted ? 'Unmute' : 'Mute'}
              className="flex size-9 items-center justify-center rounded-full backdrop-blur-sm transition-all duration-200 hover:scale-105 active:scale-95"
              style={{ backgroundColor: 'rgba(0,0,0,0.45)', color: 'rgba(255,255,255,0.9)' }}
            >
              {isMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
            </button>
          )}
          {watchHref && (
            <Link
              href={watchHref}
              scroll={false}
              onClick={(e) => e.stopPropagation()}
              aria-label={`Watch ${alt}`}
              title="Watch"
              className="flex size-9 cursor-pointer items-center justify-center rounded-full backdrop-blur-sm transition-all duration-200 hover:scale-105 active:scale-95"
              style={{ backgroundColor: 'rgba(0,0,0,0.45)', color: 'rgba(255,255,255,0.9)' }}
            >
              <Maximize2 className="size-4" />
            </Link>
          )}
        </div>
      )}
    </>
  );
};

export default CoverVideo;
