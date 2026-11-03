'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import CoverVideo from '../CoverVideo';
import coverColors from '../../covers/cover-colors.json';
import ArticleColorCover from './ArticleColorCover';

// /covers/cover-023.png -> its dominant color (cover-colors.json), if it has one
function dominantCoverColor(src?: string): string | undefined {
  const coverId = src?.split('/').pop()?.replace(/\.[^./]+$/, '') ?? '';
  return (coverColors as Record<string, string[]>)[coverId]?.[0];
}

/** The color a cover falls back to when its file isn't there: the article's own, the cover's dominant one, else the theme's */
export function fallbackCoverColor(src?: string, coverColor?: string): string {
  return coverColor ?? dominantCoverColor(src) ?? 'theme';
}

/**
 * ArticleCoverImage - Full-bleed hero image for editorial articles.
 * Breaks out of the parent's max-w-4xl container via negative margins
 * while the surrounding header content stays constrained.
 *
 * Nothing else on the page actually waits on this image — React renders the
 * rest of the article regardless of image load state, so route transitions
 * were never blocked by it. What the color-matched skeleton fixes is the
 * *perceived* gap: instead of a generic shimmer, the placeholder is tinted
 * with the cover's own dominant color (from cover-colors.json) while the
 * real photo streams in, so the page reads as "already there" instead of
 * "still loading" for that first beat. When the file isn't there (a copy that
 * didn't ship this cover), the same frame holds a color instead.
 */
const ArticleCoverImage: React.FC<{ src?: string; alt: string; videoSrc?: string; watchHref?: string; coverColor?: string }> = ({ src, alt, videoSrc, watchHref, coverColor }) => {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const [videoErrored, setVideoErrored] = useState(false);

  const dominantColor = dominantCoverColor(src);
  const showVideo = Boolean(videoSrc) && !videoErrored;

  if ((errored || !src) && !showVideo) return <ArticleColorCover coverColor={fallbackCoverColor(src, coverColor)} />;

  return (
    <div className="mb-8 w-screen mx-[calc(50%-50vw)]">
      <div className="image-container-responsive image-container-cover border border-border">
        {!loaded && !showVideo && (
          dominantColor ? (
            <div className="absolute inset-0 animate-pulse" style={{ backgroundColor: dominantColor }} />
          ) : (
            <div className="image-loading-skeleton" />
          )
        )}
        {src && !errored && (
          <Image
            src={src}
            alt={alt}
            fill
            sizes="100vw"
            quality={90}
            className={`object-cover image-fade-in ${loaded && !showVideo ? 'loaded' : ''} ${showVideo ? 'opacity-0' : ''}`}
            onLoad={() => setLoaded(true)}
            onError={() => setErrored(true)}
            priority
          />
        )}
        {showVideo && videoSrc && (
          <CoverVideo
            src={videoSrc}
            poster={src}
            alt={alt}
            className="absolute inset-0 size-full object-cover"
            watchHref={watchHref}
            onError={() => setVideoErrored(true)}
          />
        )}
      </div>
    </div>
  );
};

export default ArticleCoverImage;
