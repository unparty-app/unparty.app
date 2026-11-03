'use client';

import React, { useState } from 'react';
import ArticleCoverImage, { fallbackCoverColor } from './ArticleCoverImage';
import PhotoGallery from '../PhotoGallery';
import { COVER_MOTIONS, motionForCover, StyledCover } from '../cover-motion';
import type { EditorialArticle } from '../../constants/editorial-articles/types';
import ArticleColorCover, { resolveCoverColor } from './ArticleColorCover';
import { useTheme } from '../../contexts/ThemeContext';

interface ArticleCoverProps {
  article: Pick<EditorialArticle, 'title' | 'coverImage' | 'coverImages' | 'coverAlt' | 'coverMotion' | 'coverStyle' | 'coverColor'>;
  videoSrc?: string;
  watchHref?: string;
}

/**
 * ArticleCover - picks the header cover treatment for an article.
 *
 * - cover video set        -> the existing video hero (poster is the first photo)
 * - coverMotion set, or a  -> that live animated cover (cover-motion/), same frame
 *   cover with a default
 *   motion (motionForCover)
 * - coverStyle set (one    -> that still seen through the bee's-eye shader
 *   photo)                    (cover-motion/StyledCover)
 * - two or more photos     -> PhotoGallery: the app's standard horizontal snap-scroll
 *                             row of 240px rounded tiles, tap opens its photo modal
 * - one photo              -> the existing single full-bleed hero
 * - coverColor, no photo    -> that color in the same frame (ArticleColorCover),
 *                             or through coverStyle's shader when one is set
 *
 * A photo that fails to load is dropped, and the treatment degrades with it:
 * two or more left keep the gallery, exactly one becomes the single hero, none
 * becomes a color in the same frame (a copy doesn't ship every cover).
 */
const ArticleCover: React.FC<ArticleCoverProps> = ({ article, videoSrc, watchHref }) => {
  const [failed, setFailed] = useState<Set<string>>(() => new Set());
  const { colorValue } = useTheme();
  const alt = article.coverAlt || article.title;
  // An article's own coverMotion, else the cover's default (motionForCover)
  const motionName = article.coverMotion ?? motionForCover(article.coverImage);
  const Motion = motionName && !videoSrc ? COVER_MOTIONS[motionName] : undefined;

  if (Motion) {
    return <Motion alt={alt} />;
  }

  if (article.coverColor && !article.coverImage && !videoSrc) {
    return article.coverStyle ? (
      <StyledCover color={resolveCoverColor(article.coverColor, colorValue)} alt={alt} coverStyle={article.coverStyle} />
    ) : (
      <ArticleColorCover coverColor={article.coverColor} />
    );
  }

  if (article.coverStyle && article.coverImage && !videoSrc && (article.coverImages?.length ?? 0) < 2) {
    return failed.has(article.coverImage) ? (
      <StyledCover color={resolveCoverColor(fallbackCoverColor(article.coverImage, article.coverColor), colorValue)} alt={alt} coverStyle={article.coverStyle} />
    ) : (
      <StyledCover
        src={article.coverImage}
        alt={alt}
        coverStyle={article.coverStyle}
        onImageError={() => setFailed((prev) => new Set(prev).add(article.coverImage!))}
      />
    );
  }

  if (videoSrc || (article.coverImages?.length ?? 0) < 2) {
    return <ArticleCoverImage src={article.coverImage} alt={alt} videoSrc={videoSrc} watchHref={watchHref} coverColor={article.coverColor} />;
  }

  const photos = (article.coverImages ?? []).filter((src) => !failed.has(src));
  if (photos.length >= 2) {
    // -mx-4 cancels PhotoGallery's own px-4 so the first tile lines up with the
    // article's text column. key remounts it when a photo is dropped: its
    // loaded/error state is keyed by index, which shifts when the list shrinks.
    return (
      <div className="-mx-4 mb-8">
        <PhotoGallery
          key={photos.join('|')}
          images={photos}
          alt={alt}
          onImageError={(src) => setFailed((prev) => new Set(prev).add(src))}
        />
      </div>
    );
  }
  if (photos.length === 1) {
    return <ArticleCoverImage src={photos[0]} alt={alt} coverColor={article.coverColor} />;
  }
  return <ArticleColorCover coverColor={fallbackCoverColor(article.coverImages?.[0], article.coverColor)} />;
};

export default ArticleCover;
