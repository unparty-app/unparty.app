'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import StorySchema from '../../utils/StorySchema';
import { parseMarkdownToSections } from '../utils/storyToEditorialConverter';
import storiesManifest from '@/data/storiesManifest.json';
import { resolveCoverSrc } from '../utils/coverPath';
import UnpppCircle from './UnpppCircle';
import StepNumberOverlay from './editorial/StepNumberOverlay';
import HighlightCards, { HighlightCardsLoading, HIGHLIGHTS, pickHighlights, type Highlight } from './editorial/HighlightCards';
import MusicBanner from './MusicBanner';
import coverColors from '../covers/cover-colors.json';
import { useMusicTrackMetadata } from '@/hooks/useMusicTrackMetadata';

interface StoryPreviewProps {
  coverId: string;
  sectionIds?: string[]; // Specific section IDs to show (e.g., ['hero', 'about-me', 'why'])
  sectionRange?: { start: number; end: number }; // Show sections by index range
  maxSections?: number; // Limit number of sections to show
  showMetadata?: boolean; // Show story title, author, category header
  className?: string;
}

/**
 * StoryPreview - a story inside an article, as its highlights (#1647), in
 * the shared card row (editorial/HighlightCards, which ArticlePreview uses
 * too): the story's card first, its cover under a pane of glass with its
 * title, subtitle and, with showMetadata, the author, category, dates and
 * its song (playable, MusicBanner's card variant); then the lines its author
 * set big, each opening the story at that line.
 *
 * Used in articles via: :::component[name=StoryPreview,coverId=cover-001,maxSections=3]:::
 *
 * Props:
 * - coverId: the story's cover id (required, e.g. 'cover-001')
 * - sectionIds: hand-picks the highlights by section id, in story order
 * - sectionRange: highlights by index { start, end }, after picking
 * - maxSections: at most this many highlights (three when unset)
 * - showMetadata: the author, category, dates and song on the first card (default true)
 * - className: extra classes on the cards
 */
// Story template filler, e.g. song: "THIS IS A SONG" / song-artist: "THIS IS THE ARTIST OF THE SONG"
const PLACEHOLDER = /^this is (a song|the artist)/i;

// The story's song, playable, once its Apple Music details load
const CardSong: React.FC<{ appleMusicUrl: string }> = ({ appleMusicUrl }) => {
  const { track } = useMusicTrackMetadata({ appleUrl: appleMusicUrl, enhanced: true });
  return track ? <MusicBanner tracks={[track]} card /> : null;
};

// One item of the metadata row: a small circle (a photo, or a thin ring with a
// glyph), then its text. The key is read out for screen readers only
const MetaMark: React.FC<{ mark: string; image?: string; colorValue: string }> = ({ mark, image, colorValue }) =>
  image ? (
    <UnpppCircle src={image} color={colorValue} size={24} />
  ) : (
    <span className="relative size-6 shrink-0">
      <StepNumberOverlay number={mark} colorValue={colorValue} weight="thin" className="h-full w-full" />
    </span>
  );

const MetaText: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <span className="min-w-0 truncate font-space-grotesk text-xs leading-relaxed text-[var(--foreground)] md:text-sm">
    <span className="sr-only">{label}: </span>
    {children}
  </span>
);

const StoryPreview: React.FC<StoryPreviewProps> = ({
  coverId,
  sectionIds,
  sectionRange,
  maxSections,
  showMetadata = true,
  className = ''
}) => {
  const { colorValue } = useTheme();
  const [story, setStory] = useState<{
    metadata: {
      title: string;
      author: string;
      authorImage?: string;
      category?: string;
      subtitle?: string;
      cover?: string;
      date?: string;
      song?: string;
      'song-artist'?: string;
      appleMusicUrl?: string;
      'started-at'?: string;
      'updated-at'?: string;
    };
    content?: string;
  } | null>(null);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStory = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch story using StorySchema
        const storyData = await StorySchema.getStoryByCoverId(coverId);

        if (!storyData) {
          setError(`Story not found for ${coverId}`);
          setLoading(false);
          return;
        }

        setStory(storyData);

        // The story's highlights, then the article's range and cap
        let picked = pickHighlights(parseMarkdownToSections(storyData.content || ''), sectionIds, storyData.metadata.title);
        if (sectionRange) picked = picked.slice(sectionRange.start, sectionRange.end);
        picked = picked.slice(0, maxSections && maxSections > 0 ? maxSections : HIGHLIGHTS);
        setHighlights(picked);
        setLoading(false);
      } catch (err) {
        console.error('[StoryPreview] Error loading story:', err);
        setError(err instanceof Error ? err.message : 'Failed to load story');
        setLoading(false);
      }
    };

    loadStory();
  }, [coverId, sectionIds, sectionRange, maxSections]);

  // Loading: the cards' shape, so the page doesn't jump when the story arrives
  if (loading) return <HighlightCardsLoading className={className} />;

  // No story for this cover: say so plainly, in the article's own type
  if (error || !story) {
    return (
      <p className={`px-4 font-google-sans-code text-sm sm:px-0 ${className}`} style={{ color: 'var(--foreground)' }}>
        this story isn&apos;t here yet ({error || coverId}).
      </p>
    );
  }

  const href = `/story/${(storiesManifest.coverIdToSlug as Record<string, string>)[coverId] ?? coverId}`;
  // 'YYYY-MM-DD' is parsed as UTC midnight: format in UTC so it never slips a day
  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  const started = story.metadata['started-at'] || story.metadata.date;
  const updated = story.metadata['updated-at'];
  // One item per fact; the dates share one (started → updated) with an empty
  // ring, so no number ever sits in a ring and reads like a line number
  const metaItems: Array<{ label: string; value: string; mark: string; image?: string }> = [
    story.metadata.author && { label: 'By', value: `@${story.metadata.author}`, mark: '@', image: story.metadata.authorImage },
    story.metadata.category && { label: 'Category', value: story.metadata.category, mark: '#' },
    started && {
      label: updated && updated !== started ? 'Started, updated' : 'Started',
      value: updated && updated !== started ? `${formatDate(started)} → ${formatDate(updated)}` : formatDate(started),
      mark: '',
    },
  ].filter(Boolean) as Array<{ label: string; value: string; mark: string; image?: string }>;
  // The story's song, when it can play here (an Apple Music link that isn't
  // the template's "THIS IS A SONG")
  const songUrl = showMetadata && story.metadata.appleMusicUrl && !PLACEHOLDER.test(story.metadata.song ?? '')
    ? story.metadata.appleMusicUrl
    : null;

  return (
    <HighlightCards
      title={story.metadata.title}
      subtitle={story.metadata.subtitle}
      href={href}
      // The story's own cover (its `cover` override, else its paired coverId), on its own color
      coverSrc={resolveCoverSrc(story.metadata.cover || coverId)}
      coverColor={(coverColors as Record<string, string[]>)[story.metadata.cover || coverId]?.[0]}
      details={
        <>
          {showMetadata && metaItems.length > 0 && (
            <ul className="flex flex-col gap-1.5">
              {metaItems.map(item => (
                <li key={item.label} className="flex min-w-0 items-center gap-2">
                  <MetaMark mark={item.mark} image={item.image} colorValue={colorValue} />
                  <MetaText label={item.label}>{item.value}</MetaText>
                </li>
              ))}
            </ul>
          )}
          {songUrl && <CardSong appleMusicUrl={songUrl} />}
        </>
      }
      highlights={highlights}
      label={`${story.metadata.title}: the story and its highlights`}
      className={className}
    />
  );
};

export default StoryPreview;
