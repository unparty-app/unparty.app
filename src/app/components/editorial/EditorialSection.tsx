'use client';
import React from 'react';
import { useFetch } from '@/hooks/useFetch';
import type { ComponentName } from '@/lib/component-portfolio';
import { inkOn } from '../build-yours/BuildYours';

import Image from 'next/image';
import Link from 'next/link';

import { Check, Maximize2 } from '@/app/components/icons';
import PersonalMark from './PersonalMark';
import { useTheme } from '../../contexts/ThemeContext';
import { EditorialSection as EditorialSectionType } from '../../constants/editorial-articles';
import { getVideoEntryByContentUrl } from '../../constants/video-registry';
import ChallengePoll from './ChallengePoll';
import ChallengeSteps from './ChallengeSteps';
import { CHAPTERS, chapterSteps } from '../../constants/setup-path';
import TableTabs from './TableTabs';
import StepNumberOverlay from './StepNumberOverlay';
import type { ChallengeStep as ChallengeStepType } from '../../constants/editorial-articles/types';
import CodeBlock from './CodeBlock';
import PoemWalker from './PoemWalker';
import MermaidDiagram from './MermaidDiagram';
import EditorialRanking from './EditorialRanking';
import WordRanking from './WordRanking';
import EditorialText from './EditorialText';
import ColumnsRow from './ColumnsRow';
import FoundersQuestionEmbed from './FoundersQuestionEmbed';
import { parseMarkdownText } from '../../utils/textParsing';
import Badge from '../Badge';
import Strike from '../Strike';
import ReleaseRow from '../ReleaseRow';
import ScrollRow from '../../../components/HorizontalRow';
import CoverPhotoCard from '../CoverPhotoCard';
import PhotoGallery from '../PhotoGallery';
import MusicBanner from '../MusicBanner';
import { getTracksByIds } from '@/utils/musicRegistry';
import { useMusicTrackMetadata } from '@/hooks/useMusicTrackMetadata';
import CoverSchema from '@/utils/CoverSchema';
import KeywordWrapper from '../KeywordWrapper';
import CoverVideo from '../CoverVideo';
import BookModal from '../BookModal';
import { useStepImageRegistry, type StepImageRegistryEntry } from '@/hooks/useStepImageRegistry';
import NamedIcon, { hasNamedIcon } from '../icons/NamedIcon';

// Default avatar for `personal` sections when metadata.avatar is `true`
// rather than a specific image path - a tightly-cropped, rasterized (5.7KB
// WebP) version of svgs/trash/founders_rocket.svg. That source SVG is
// 2.7MB and a wide decorative illustration, not composed as a portrait -
// unsuitable to reference directly for a small repeated circular avatar.
const DEFAULT_PERSONAL_AVATAR = '/svgs/unparty/founders-rocket-avatar.webp';

/**
 * BookQuote component - Fetches and displays quotes from the Book database
 * Allows referencing book quotes by ID instead of manual copy-paste
 */
const BookQuote: React.FC<{
  section: EditorialSectionType;
  baseClasses: string;
  colorValue: string;
}> = ({ section, baseClasses, colorValue }) => {
  const metadata = section.metadata;
  const { data: bookData, loading } = useFetch<{
    quote: string;
    author: string;
    title: string;
    page: number;
    publisher?: string;
    publisherLink?: string;
  }>(
    metadata?.bookId ? `/api/book/${metadata.bookId}` : null
  );
  // On a failed fetch book stays null, so the section's manual quote renders instead
  const book = bookData ?? null;
  const [modalOpen, setModalOpen] = React.useState(false);

  // Loading state
  if (loading && metadata?.bookId) {
    return (
      <div
        className={`${baseClasses} my-8 w-screen mx-[calc(50%-50vw)] px-4 py-8 sm:px-6 lg:px-12`}
        style={{ backgroundColor: `${colorValue}10` }}
      >
        <div className="mx-auto max-w-2xl">
          <div className="h-32 animate-pulse rounded-lg bg-background-highlight" />
        </div>
      </div>
    );
  }

  // Use manual quote if no bookId or error
  const rawContent = book?.quote || section.content || '';
  // Strip surrounding quotes so the component's curly quotes don't double up
  const quoteContent = rawContent.replace(/^["“]/, '').replace(/["”]$/, '').trim();
  const author = book?.author || metadata?.author || '';
  const showDetails = metadata?.showBookDetails !== false;
  const clickable = !!(book && showDetails);

  return (
    <>
      <div
        className={`${baseClasses} my-8 w-screen mx-[calc(50%-50vw)] px-4 py-8 sm:px-6 lg:px-12 ${
          clickable ? 'cursor-pointer transition-colors hover:brightness-95' : ''
        }`}
        style={{ backgroundColor: `${colorValue}10` }}
        {...(clickable
          ? {
              role: 'button' as const,
              tabIndex: 0,
              onClick: () => setModalOpen(true),
              onKeyDown: (e: React.KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setModalOpen(true);
                }
              },
            }
          : {})}
      >
        <div className="mx-auto max-w-2xl">
          <blockquote>
            <p
              className="mb-3 font-vt323 text-2xl uppercase leading-relaxed md:text-3xl"
              style={{ color: colorValue }}
            >
              {quoteContent.includes('\n') ? (
                <>
                  &ldquo;
                  {quoteContent.split('\n').map((line, idx, arr) => (
                    <React.Fragment key={idx}>
                      <KeywordWrapper html={parseMarkdownText(line)} />
                      {idx < arr.length - 1 && <br />}
                    </React.Fragment>
                  ))}
                  &rdquo;
                </>
              ) : (
                <>&ldquo;<KeywordWrapper html={parseMarkdownText(quoteContent)} />&rdquo;</>
              )}
            </p>

            {/* Author attribution */}
            {author && (
              <cite className="block font-vt323 text-base not-italic tracking-wider" style={{ color: 'var(--text-muted)' }}>
                — {author}
                {book && showDetails && (
                  <>
                    , <span className="italic">{book.title}</span>
                    {book.page > 0 && <> (pg. {book.page})</>}
                  </>
                )}
              </cite>
            )}

            {clickable && (
              <span
                className="mt-3 inline-block font-google-sans-code text-xs font-semibold"
                style={{ color: colorValue }}
              >
                View book →
              </span>
            )}
          </blockquote>
        </div>
      </div>

      {clickable && metadata?.bookId && (
        <BookModal bookId={metadata.bookId} isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      )}
    </>
  );
};

/**
 * MusicSection component - Handles music track rendering with async metadata fetching
 * Extracted to separate component to allow hook usage within switch case
 */
const MusicSection: React.FC<{
  section: EditorialSectionType;
  baseClasses: string;
}> = ({ section, baseClasses }) => {
  const metadata = section.metadata;
  
  // Fetch track metadata with enhanced API data
  const { track, loading } = useMusicTrackMetadata({
    trackId: metadata?.musicTrackId,
    appleUrl: metadata?.appleMusicUrl,
    enhanced: true,
  });

  if (loading) {
    return (
      <div className={`${baseClasses} my-8`}>
        <div className="h-16 animate-pulse rounded-lg bg-background-highlight" />
      </div>
    );
  }

  if (!track) {
    console.warn('[EditorialSection] No valid music track found for section:', section.id);
    return null;
  }

  return (
    <div className={`${baseClasses} my-8`}>
      {metadata?.title && (
        <h3 className="mb-4 font-google-sans-code text-sm font-bold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
          {metadata.title}
        </h3>
      )}
      <MusicBanner tracks={[track]} />
      {section.content && (
        <p className="mt-4 font-google-sans-code text-xs" style={{ color: 'var(--text-muted)' }}>
          <KeywordWrapper html={parseMarkdownText(section.content)} />
        </p>
      )}
    </div>
  );
};

/**
 * GifSection component - Handles GIF rendering with preserved animation
 * Uses unoptimized={true} to preserve GIF animation
 */
const GifSection: React.FC<{
  section: EditorialSectionType;
  baseClasses: string;
}> = ({ section, baseClasses }) => {
  const { colorValue } = useTheme();
  const metadata = section.metadata;

  const aspectRatioClass = {
    '16:9': 'aspect-video',
    '4:3': 'aspect-[4/3]',
    '1:1': 'aspect-square',
    '9:16': 'aspect-[9/16]'
  }[metadata?.aspectRatio || '16:9'];

  const sizeClass = {
    small: 'max-w-2xl',
    medium: 'max-w-4xl',
    large: 'max-w-5xl',
    full: 'max-w-full'
  }[metadata?.size || 'large'];

  const alignmentClass = {
    center: 'text-center',
    right: 'text-right',
    left: 'text-left'
  }[metadata?.align || 'center'];

  return (
    <div className={`${baseClasses} my-12`}>
      <figure className={`mx-auto ${sizeClass} ${alignmentClass}`}>
        <div
          className={`relative overflow-hidden rounded-xl border bg-background ${aspectRatioClass}`}
          style={{ borderColor: colorValue }}
        >
          <Image
            src={section.content || ''}
            alt={metadata?.alt || 'GIF animation'}
            fill
            unoptimized={true}
            priority={metadata?.priority ?? false}
            className="object-contain"
          />
        </div>
        {metadata?.caption && (
          <figcaption className="mt-4 text-left font-google-sans-code text-sm italic" style={{ color: 'var(--text-muted)' }}>
            <KeywordWrapper html={parseMarkdownText(metadata.caption)} />
          </figcaption>
        )}
      </figure>
    </div>
  );
};

/**
 * VideoSection component - Handles video rendering with playback controls
 * Extracted to separate component to allow hook usage within switch case
 */
const VideoSection: React.FC<{
  section: EditorialSectionType;
  baseClasses: string;
}> = ({ section, baseClasses }) => {
  const { colorValue } = useTheme();
  const metadata = section.metadata;
  const videoRef = React.useRef<HTMLVideoElement>(null);

  // Same registry lookup CoverVideo uses for its expand-to-watch icon (#956)
  // — an inline body video gets the same affordance whenever a
  // VideoRegistryEntry happens to exist for this exact asset path, without
  // requiring the section to know about the registry itself.
  const videoEntry = React.useMemo(
    () => (section.content ? getVideoEntryByContentUrl(section.content) : null),
    [section.content]
  );
  const watchHref = videoEntry?.published ? `/watch/${videoEntry.slug}` : undefined;

  const aspectRatioClass = {
    '16:9': 'aspect-video',
    '4:3': 'aspect-[4/3]',
    '1:1': 'aspect-square',
    '9:16': 'aspect-[9/16]'
  }[metadata?.aspectRatio || '16:9'];

  const sizeClass = {
    small: 'max-w-2xl',
    medium: 'max-w-4xl',
    large: 'max-w-5xl',
    full: 'max-w-full'
  }[metadata?.size || 'large'];

  const alignmentClass = {
    center: 'text-center',
    right: 'text-right',
    left: 'text-left'
  }[metadata?.align || 'center'];

  const shape = metadata?.shape ?? 'rounded';

  // Much smaller than the rounded-rect sizeClass scale below - this is a
  // small ambient loop meant to sit beside a paragraph (e.g. in a `columns`
  // section), not a full-width block.
  const circleSizePx = {
    small: 96,
    medium: 140,
    large: 180
  }[metadata?.size || 'medium'];

  const justifyClass = {
    center: 'justify-center',
    right: 'justify-end',
    left: 'justify-start'
  }[metadata?.align || 'center'];

  // Enable playback speed controls if requested
  React.useEffect(() => {
    if (metadata?.playbackSpeed && videoRef.current) {
      const video = videoRef.current;
      video.setAttribute('controlsList', 'nodownload');
    }
  }, [metadata?.playbackSpeed]);

  if (shape === 'circle') {
    return (
      <div className={`${baseClasses} my-8`}>
        <figure className={`flex ${justifyClass}`}>
          <div className={alignmentClass} style={{ width: circleSizePx }}>
            <div
              className="relative shrink-0 overflow-hidden rounded-full border"
              style={{
                width: circleSizePx,
                height: circleSizePx,
                borderColor: colorValue,
                // Depth: a colored glow (reads on both the light and the
                // near-black dark --background) layered under a neutral
                // contact shadow - a plain black shadow alone disappears
                // against the dark theme.
                boxShadow: `0 10px 22px -6px ${colorValue}66, 0 6px 10px -4px rgba(0,0,0,0.45)`
              }}
            >
              <CoverVideo
                src={section.content || ''}
                poster={metadata?.poster}
                alt={metadata?.alt || 'Video content'}
                className="absolute inset-0 size-full object-cover"
                hideMuteToggle={circleSizePx < 120}
                watchHref={watchHref}
              />
            </div>
            {metadata?.caption && (
              <figcaption className="mt-3 font-google-sans-code text-xs italic" style={{ color: 'var(--text-muted)' }}>
                <KeywordWrapper html={parseMarkdownText(metadata.caption)} />
              </figcaption>
            )}
          </div>
        </figure>
      </div>
    );
  }

  return (
    <div className={`${baseClasses} my-12`}>
      <figure className={`mx-auto ${sizeClass} ${alignmentClass}`}>
        <div
          className={`relative overflow-hidden rounded-xl border bg-background ${aspectRatioClass}`}
          style={{ borderColor: colorValue }}
        >
          <video
            ref={videoRef}
            src={section.content || ''}
            controls={metadata?.controls ?? true}
            autoPlay={metadata?.autoplay ?? false}
            loop={metadata?.loop ?? false}
            muted={metadata?.muted ?? false}
            playsInline
            poster={metadata?.poster}
            preload={metadata?.preload || 'metadata'}
            className="size-full object-cover"
            aria-label={metadata?.alt || 'Video content'}
          >
            {metadata?.alt && <p>{metadata.alt}</p>}
          </video>
          {watchHref && (
            // top-right, not bottom (matches CoverVideo's badge) - native
            // <video controls> already occupies the bottom edge here.
            <div className="absolute top-3 right-3 z-10">
              <Link
                href={watchHref}
                scroll={false}
                aria-label={`Watch ${metadata?.alt || 'video'}`}
                title="Watch"
                className="flex size-9 cursor-pointer items-center justify-center rounded-full backdrop-blur-sm transition-all duration-200 hover:scale-105 active:scale-95"
                style={{ backgroundColor: 'rgba(0,0,0,0.45)', color: 'rgba(255,255,255,0.9)' }}
              >
                <Maximize2 className="size-4" />
              </Link>
            </div>
          )}
        </div>
        {metadata?.caption && (
          <figcaption className="mt-4 text-center font-google-sans-code text-sm italic" style={{ color: 'var(--text-muted)' }}>
            <KeywordWrapper html={parseMarkdownText(metadata.caption)} />
          </figcaption>
        )}
      </figure>
    </div>
  );
};

interface EditorialSectionProps {
  section: EditorialSectionType;
  isVisible?: boolean;
  articleSlug?: string;
}

const EditorialSection: React.FC<EditorialSectionProps> = ({ section, isVisible = true, articleSlug }) => {
  const { colorValue } = useTheme();

  const baseClasses = `transition-all duration-700 ${
    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
  }`;

  switch (section.type) {
    case 'hero': {
      const heroIcon = hasNamedIcon(section.metadata?.icon);
      return (
        <div className={`${baseClasses} mb-12 w-screen mx-[calc(50%-50vw)] px-4 sm:px-6 lg:px-12`}>
          <h1
            className={`
              article-title flex items-center gap-4 truncate text-left font-vt323 font-bold leading-none tracking-tight
              ${section.metadata?.size === 'large' ? 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl' : 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl'}
            `}
            style={{ color: 'var(--foreground)' }}
          >
            {/* A chapter's hand-drawn icon, as tall as the hero's words; it
                draws itself in each time its hero shows (.hero-icon) */}
            {heroIcon && <NamedIcon name={section.metadata?.icon} className="hero-icon size-[1em] shrink-0" strokeWidth={1.6} themed />}
            <span className={heroIcon && section.metadata?.iconOnly ? 'sr-only' : 'truncate'}>
              <KeywordWrapper html={section.content || ''} />
            </span>
          </h1>
          {section.metadata?.emphasis && (
            <div className="mt-6 flex justify-start">
              <div
                className="h-1 w-24 font-google-sans-code rounded-full"
                style={{ backgroundColor: colorValue }}
              />
            </div>
          )}
        </div>
      );
    }

    case 'heading':
      const HeadingTag = section.metadata?.size === 'large' ? 'h2' : 'h3';
      return (
        <div className={`${baseClasses} ${section.metadata?.line ? 'mb-6 mt-10' : 'my-12'}`}>
          <HeadingTag
            className={`
              article-title text-left font-vt323 font-bold leading-none tracking-tight
              ${section.metadata?.size === 'large' ? 'text-4xl sm:text-6xl md:text-7xl lg:text-8xl' : section.metadata?.line ? 'text-2xl sm:text-3xl md:text-4xl' : 'text-3xl sm:text-5xl md:text-6xl lg:text-7xl'}
            `}
            style={{ color: 'var(--foreground)' }}
          >
            <KeywordWrapper html={section.content || ''} />
          </HeadingTag>
        </div>
      );

    case 'paragraph':
      const isDropCap = section.metadata?.dropCap;
      const size = section.metadata?.size || 'medium';
      const isAccent = section.metadata?.style === 'accent';

      // A ```poem: its icon walks the story and unfolds it in place; the verse
      // stays in the page, hidden, for search and screen readers (PoemWalker)
      if (section.metadata?.preserveWhitespace) {
        return (
          <PoemWalker
            id={section.id}
            verseHtml={parseMarkdownText(section.content || '')}
            title={section.metadata.title}
            icon={section.metadata.icon}
            ink={section.metadata.ink}
            author={section.metadata.author}
          />
        );
      }

      // A markdown article's raw HTML can hold blocks, which a <p> can't
      const TextTag = /<(details|summary|div|p|ul|ol|table|h[1-6]|svg|aside|pre|blockquote)\b/.test(section.content || '') ? 'div' : 'p';
      // The first letter as a reader sees it: an emoji is two charAt()s
      const dropCap = Array.from(section.content || '')[0] ?? '';

      return (
        <div className={`${baseClasses} mb-6`}>
          <TextTag
            className={`
              font-space-grotesk leading-relaxed
              ${size === 'large' ? 'text-xl md:text-2xl' : size === 'small' ? 'text-sm md:text-base' : 'text-base md:text-lg'}
              ${isAccent ? 'text-xs font-medium uppercase tracking-wide' : ''}
              ${section.metadata?.emphasis ? 'font-medium' : ''}
              mx-auto max-w-4xl
            `}
            style={isDropCap ? {
              '--drop-cap-color': colorValue,
              color: 'var(--text-muted)'
            } as React.CSSProperties : { color: 'var(--text-muted)' }}
          >
            {isDropCap ? (
              <>
                <span
                  className="float-left mr-3 mt-1 text-6xl font-bold leading-none"
                  style={{ color: colorValue }}
                >
                  {dropCap}
                </span>
                <KeywordWrapper html={parseMarkdownText((section.content || '').slice(dropCap.length))} />
              </>
            ) : (
              <KeywordWrapper html={parseMarkdownText(section.content || '')} />
            )}
          </TextTag>
        </div>
      );

    case 'personal': {
      const avatarSetting = section.metadata?.avatar;
      const avatarSrc = typeof avatarSetting === 'string' ? avatarSetting : DEFAULT_PERSONAL_AVATAR;
      const storyLink = section.metadata?.storyLink;

      const content = (
        <p
          className={`font-space-grotesk text-xs leading-relaxed text-[var(--text-muted)] md:text-sm ${
            storyLink
              ? 'origin-left transition-transform duration-200 group-hover:scale-105 group-hover:text-[var(--theme-color,_#f9c22e)]'
              : ''
          }`}
        >
          <KeywordWrapper html={parseMarkdownText(section.content || '')} />
        </p>
      );

      const step = section.metadata?.step;
      const markIcon = section.metadata?.icon;
      const row = step !== undefined || markIcon ? (
        <div className="group flex items-center gap-3">
          <PersonalMark step={step} icon={markIcon} />
          {content}
        </div>
      ) : avatarSetting ? (
        <div className="flex items-center gap-3">
          <div className="relative size-8 shrink-0 overflow-hidden rounded-full border border-border">
            <Image src={avatarSrc} alt="" fill sizes="32px" className="object-cover" />
          </div>
          {content}
        </div>
      ) : (
        content
      );

      return (
        <div className={`${baseClasses} mb-6`}>
          <div className="mx-auto max-w-4xl">
            {storyLink ? (
              <Link href={storyLink} className="group inline-block">
                {row}
              </Link>
            ) : (
              row
            )}
          </div>
        </div>
      );
    }

    case 'quote':
      return <BookQuote section={section} baseClasses={baseClasses} colorValue={colorValue} />;

    case 'image':
      return (
        <div className={`${baseClasses} my-12`}>
          <figure 
            className={`
              ${section.metadata?.align === 'center' ? 'text-center' : 
                section.metadata?.align === 'right' ? 'text-right' : 'text-left'}
              mx-auto max-w-5xl
            `}
          >
            <div className="relative overflow-hidden rounded-xl border border-border bg-background">
              <Image
                src={section.content || ''}
                alt={section.metadata?.alt || ''}
                width={1200}
                height={600}
                className="h-auto w-full object-cover"
                priority={false}
              />
            </div>
            {section.metadata?.caption && (
              <figcaption className="mt-4 text-center font-google-sans-code text-sm italic" style={{ color: 'var(--text-muted)' }}>
                <KeywordWrapper html={parseMarkdownText(section.metadata.caption || '')} />
              </figcaption>
            )}
          </figure>
        </div>
      );

    case 'list':
      const items = (section.content || '').split('|');
      const listStyle = section.metadata?.style;
      const isNumbered = section.metadata?.numbered;
      const ListTag = isNumbered ? 'ol' : 'ul';

      return (
        <div className={`${baseClasses} mb-6`}>
          <ListTag
            className={`mx-auto max-w-4xl space-y-3 ${isNumbered ? 'list-decimal pl-6' : ''}`}
            style={isNumbered ? { color: colorValue } : {}}
          >
            {items.map((item, index) => (
              <li key={index} className={`flex items-start gap-3 ${isNumbered ? 'pl-2' : ''}`}>
                {!isNumbered && listStyle !== 'minimal' && (
                  <div
                    className="mt-2 size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: colorValue }}
                  />
                )}
                <KeywordWrapper
                  className={`
                    min-w-0 font-geist-mono-google leading-relaxed [overflow-wrap:anywhere]
                    ${listStyle === 'minimal' ? 'text-sm' : ''}
                    ${isNumbered ? 'flex-1' : ''}
                    ${listStyle === 'accent' ? 'text-[var(--theme-color)]' : ''}
                  `}
                  html={parseMarkdownText(item.trim())}
                />
              </li>
            ))}
          </ListTag>
        </div>
      );

    case 'code':
      if (section.metadata?.language === 'mermaid') {
        return (
          <div className={`${baseClasses} mb-8`}>
            <div className="mx-auto max-w-4xl">
              <MermaidDiagram content={section.content || ''} />
            </div>
          </div>
        );
      }
      return (
        <div className={`${baseClasses} mb-8`}>
          <div className="mx-auto max-w-4xl">
            <CodeBlock code={section.content || ''} language={section.metadata?.language} />
          </div>
        </div>
      );

    case 'sectionBreak':
      return (
        <div className={`${baseClasses} my-12`}>
          <hr className="w-full border-0 border-t border-border" />
        </div>
      );

    case 'divider':
      return (
        <div className={`${baseClasses} my-12`}>
          <div className="flex items-center justify-center">
            <div 
              className="h-0.5 w-16 rounded-full"
              style={{ backgroundColor: colorValue }}
            />
            <div 
              className="mx-4 size-2 rounded-full"
              style={{ backgroundColor: colorValue }}
            />
            <div 
              className="h-0.5 w-16 rounded-full"
              style={{ backgroundColor: colorValue }}
            />
            <div 
              className="mx-4 size-2 rounded-full"
              style={{ backgroundColor: colorValue }}
            />
          </div>
        </div>
      );

    case 'challenge':
      // Use interactive poll if enabled and articleSlug is provided
      if (section.pollEnabled && articleSlug) {
        return (
          <div
            className={`${baseClasses} my-8 w-screen mx-[calc(50%-50vw)] px-4 py-8 sm:px-6 lg:px-12`}
            style={{ backgroundColor: `${colorValue}10` }}
          >
            <div className="mx-auto max-w-4xl">
              <ChallengePoll
                challengeId={section.id}
                articleSlug={articleSlug}
                userPrompt={section.userPrompt}
                stepOne={section.stepOne}
                stepTwo={section.stepTwo}
                stepThree={section.stepThree}
                successMetric={section.successMetric}
              />
            </div>
          </div>
        );
      }

      // Fall back to static challenge display. A challenge that names a SETUP.
      // chapter walks its steps (#589); the others keep their own three
      const challengeSteps = section.content ? section.content.split('|') : [];
      const setupChapter = section.setup ? CHAPTERS.find((c) => c.id === section.setup) : undefined;
      const steps = setupChapter
        ? chapterSteps(setupChapter.id).map((step): ChallengeStepType => ({ step: step.key }))
        : [section.stepOne, section.stepTwo, section.stepThree].filter(Boolean);
      const hasSteps = steps.length > 0;

      // What done looks like, shown as rows under the steps; skipped when unset
      const hasCardContent = Boolean(section.successMetric || section.referenceUrl || section.authorSource);

      return (
        <div
          className={`${baseClasses} my-8 w-screen mx-[calc(50%-50vw)] px-4 py-8 sm:px-6 lg:px-12`}
          style={{ backgroundColor: `${colorValue}10` }}
        >
          <div className="mx-auto max-w-4xl">
          {/* The challenge's cover + caption (a `personal`-style row), then its
              steps as borderless cards, in normal flow above the card. Older
              challenges that only have `content` (steps separated by |) get
              the same cards, text only. */}
          <div className={hasCardContent ? 'mb-6 w-full' : 'w-full'}>
            <ChallengeSteps
              steps={
                hasSteps
                  ? (steps as ChallengeStepType[])
                  : challengeSteps.map((step) => ({ emoji: '', action: '', description: step.trim() }))
              }
              cover={section.coverId || setupChapter?.cover || 'cover-001'}
              caption={section.coverCaption || (setupChapter ? `${setupChapter.id}. ${setupChapter.promise}` : 'this is a work in progress')}
            />
          </div>

          {/* What done looks like: rows in the same voice as the steps (a thin
              ring, a vt323 label, Space Grotesk copy), no card around them */}
          {hasCardContent && (
            <ul className="space-y-3 text-left">
              {(section.successMetric || section.authorSource) && (
                <li className="flex items-start gap-3">
                  <span className="relative size-7 shrink-0">
                    <StepNumberOverlay number="✓" colorValue={colorValue} weight="thin" className="h-full w-full" />
                  </span>
                  <p className="min-w-0 flex-1 pt-0.5">
                    <span className="block font-vt323 text-lg uppercase leading-none" style={{ color: colorValue }}>
                      {section.successMetric ? 'Success.' : 'Source.'}
                    </span>
                    <span className="mt-1 block font-space-grotesk text-xs leading-relaxed text-[var(--text-muted)] md:text-sm">
                      {section.successMetric || section.authorSource}
                    </span>
                  </p>
                </li>
              )}
              {section.referenceUrl && (
                <li className="flex items-start gap-3">
                  <span className="relative size-7 shrink-0">
                    <StepNumberOverlay number="↗" colorValue={colorValue} weight="thin" className="h-full w-full" />
                  </span>
                  <p className="min-w-0 flex-1 pt-0.5">
                    <span className="block font-vt323 text-lg uppercase leading-none" style={{ color: colorValue }}>
                      Conversation.
                    </span>
                    <a
                      href={section.referenceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group mt-1 inline-flex items-center gap-1 font-space-grotesk text-xs leading-relaxed underline-offset-4 hover:underline md:text-sm"
                      style={{ color: colorValue }}
                    >
                      view the full conversation
                      <span className="transition-transform group-hover:translate-x-1">→</span>
                    </a>
                  </p>
                </li>
              )}
            </ul>
          )}
          </div>
        </div>
      );

    case 'table': {
      const headers = section.metadata?.headers || [];
      const rows = section.metadata?.rows || [];

      return (
        <div
          className={`${baseClasses} my-8 w-screen mx-[calc(50%-50vw)] px-4 py-8 sm:px-6 lg:px-12`}
          style={{ backgroundColor: `${colorValue}10` }}
        >
          {/* Unlike the prose sections sharing this full-bleed band pattern,
              a data table benefits from the extra width itself (not just a
              decorative backdrop) — capping it at the article's max-w-4xl
              prose column is what forced a long-text column to squeeze out
              the first one. No max-w here; it uses whatever room the band
              gives it, up to the band's own side padding. */}
          <div>
            {/* sm and up: standard table. Below sm, whatever the widest column
                needs forces horizontal scroll on content that's otherwise
                meant to be read top-to-bottom, so it switches to one tab per
                row instead (see the sm:hidden block below). */}
            <div className="hidden overflow-hidden rounded-lg border border-border bg-background sm:block">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead>
                    <tr
                      className="bg-clear"
                      style={{
                        borderBottom: `2px solid ${colorValue}`,
                      }}
                    >
                      {headers.map((header, index) => (
                        <th
                          key={index}
                          className="px-4 py-3 text-left font-google-sans-code text-xs font-bold uppercase tracking-wider"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          <KeywordWrapper html={parseMarkdownText(header)} />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-background">
                    {rows.map((row, rowIndex) => (
                      <tr
                        key={rowIndex}
                        className="transition-colors hover:bg-background-highlight"
                      >
                        {row.map((cell, cellIndex) => (
                          <td
                            key={cellIndex}
                            className="px-4 py-3 font-google-sans-code text-sm text-foreground"
                          >
                            <KeywordWrapper html={parseMarkdownText(cell)} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Below sm: one tab per row instead of every row stacked as a
                card (TableTabs, behind the house tab bar) */}
            <div className="sm:hidden">
              <TableTabs headers={headers} rows={rows} accent={colorValue} />
            </div>
          </div>
        </div>
      );
    }

    case 'badge': {
      const isBadgeLink = !!section.metadata?.badgeLink;
      // Badge's own cursor-pointer/hover styling assumes it's always
      // clickable, but a badge with no badgeLink is decorative - without
      // this override it'd show a pointer cursor and a hover color change
      // for nothing to click.
      const badgeContent = (
        <Badge
          variant={section.metadata?.badgeVariant || 'primary'}
          size={section.metadata?.badgeSize || 'md'}
          className={isBadgeLink ? '' : '!cursor-default hover:!bg-transparent'}
        >
          {section.metadata?.badgeText || ''}
        </Badge>
      );

      return (
        <div className={`${baseClasses} my-8 text-left`}>
          {isBadgeLink ? (
            <Link href={section.metadata!.badgeLink!} className="inline-block">
              {badgeContent}
            </Link>
          ) : (
            badgeContent
          )}
        </div>
      );
    }

    case 'scrollRow':
      return (
        <div className={`${baseClasses} -mx-6 my-12`}>
          <ScrollRowRenderer section={section} />
        </div>
      );

    case 'ranking':
      return (
        <div
          // A question this site's database doesn't have renders nothing
          // (MissingQuestion): the band goes with it
          className={`${baseClasses} my-8 w-screen mx-[calc(50%-50vw)] px-4 py-8 sm:px-6 lg:px-12 has-[>div:empty]:hidden`}
          style={{ backgroundColor: `${colorValue}10` }}
        >
          <div className="mx-auto max-w-4xl">
            {section.questionId ? (
              <EditorialRanking questionId={section.questionId} categoryId={section.categoryId || 'core'} />
            ) : (
              <WordRanking prompt={section.userPrompt || 'which of these matter most to you?'} words={section.rankWords} />
            )}
          </div>
        </div>
      );

    case 'text':
      return (
        <div
          // A question this site's database doesn't have renders nothing
          // (MissingQuestion): the band goes with it
          className={`${baseClasses} my-8 w-screen mx-[calc(50%-50vw)] px-4 py-8 sm:px-6 lg:px-12 has-[>div:empty]:hidden`}
          style={{ backgroundColor: `${colorValue}10` }}
        >
          <div className="mx-auto max-w-4xl">
            <EditorialText
              questionId={section.questionId || ''}
              categoryId={section.categoryId || 'core'}
            />
          </div>
        </div>
      );

    case 'foundersQuestion':
      return (
        <div
          className={`${baseClasses} my-8 w-screen mx-[calc(50%-50vw)] px-4 py-8 sm:px-6 lg:px-12`}
          style={{ backgroundColor: `${colorValue}10` }}
        >
          <div className="mx-auto max-w-4xl">
            <FoundersQuestionEmbed
              questionId={section.questionId || ''}
              categoryId={section.categoryId || 'core'}
            />
          </div>
        </div>
      );

    case 'profileImage':
      return (
        <div className={`${baseClasses} my-12`}>
          <ProfileImageRenderer section={section} colorValue={colorValue} />
        </div>
      );

    case 'component':
      // A story's highlights on a full-bleed band of the theme color, in the
      // type hubs' frame (up to 1920px wide), so its glass cards can use the
      // whole screen (StoryPreview, #1647). A phone's cards swipe to the edge
      // ArticlePreview's highlights sit on the same band; its live mode
      // (sourceComponentName) stays in the column like any component
      if (
        section.metadata?.componentName === 'StoryPreview' ||
        (section.metadata?.componentName === 'ArticlePreview' && !section.metadata?.componentProps?.sourceComponentName)
      ) {
        return (
          <div
            className={`${baseClasses} my-12 w-screen mx-[calc(50%-50vw)] py-10 sm:py-12`}
            style={{ backgroundColor: `${colorValue}70` }}
          >
            <div className="mx-auto w-full max-w-[1920px] sm:px-6 lg:px-12">
              <ComponentRenderer section={section} />
            </div>
          </div>
        );
      }
      return (
        <div className={`${baseClasses} my-12`}>
          <ComponentRenderer section={section} />
        </div>
      );

    case 'music':
      return <MusicSection section={section} baseClasses={baseClasses} />;

    case 'gif':
      return <GifSection section={section} baseClasses={baseClasses} />;

    case 'video':
      return <VideoSection section={section} baseClasses={baseClasses} />;

    case 'releases':
      // A component's latest release, to take, under the component itself
      // (src/lib/project-belt.ts withReleaseRow)
      return section.metadata?.release ? (
        <div className={`${baseClasses} my-6`}>
          <ReleaseRow release={section.metadata.release} />
        </div>
      ) : null;

    case 'strikeBlock':
      return (
        // size: the struck line as a statement ('large'), not an aside
        <div className={`${baseClasses} my-8 ${section.metadata?.size === 'large' ? 'text-4xl leading-tight sm:text-6xl' : section.metadata?.size === 'medium' ? 'text-2xl sm:text-3xl' : ''}`}>
          <Strike
            content={section.content}
            font={section.metadata?.font}
            variant={section.metadata?.variant}
            color={section.metadata?.color}
            animate={section.metadata?.animate}
            thickness={section.metadata?.thickness}
          />
        </div>
      );

    case 'columns': {
      // Any number of columns (columnSections), or the original two
      // (leftSections/rightSections); layout gives one width share per column
      const columns = section.columnSections
        ?? [section.leftSections || [], section.rightSections || []];
      const shares = (section.metadata?.layout || '1:1').split(':').map(Number);
      const stickyCol = section.metadata?.sticky;
      const verticalAlignClass = {
        start: 'items-start',
        center: 'items-center',
        end: 'items-end'
      }[section.metadata?.verticalAlign || 'start'];

      return (
        <ColumnsRow
          className={baseClasses}
          columns={columns.map(col => col.map(s => (
            <EditorialSection key={s.id} section={s} articleSlug={articleSlug} />
          )))}
          gridTemplate={columns.map((_, i) => `${shares[i] || 1}fr`).join(' ')}
          peek={section.metadata?.mobile === 'peek'}
          verticalAlignClass={verticalAlignClass}
          stickyIndex={stickyCol === 'left' ? 0 : stickyCol === 'right' ? columns.length - 1 : -1}
        />
      );
    }

    default:
      return null;
  }
};

// Step-image registry: derives the bare cover id from a `/covers/<id>.<ext>`
// path (used by the portrait/hearth/candid raw-image ScrollRow cases, whose
// sources are full paths rather than bare coverIds). Returns null for
// sources outside /covers/ (e.g. gif sources), which are never registrable.
function coverIdFromPath(src: string): string | null {
  const match = src.match(/^\/covers\/([^/]+)\.[a-zA-Z0-9]+$/);
  return match ? match[1] : null;
}

// Shared card for the raw-image ScrollRow cases (portrait/hearth/candid) - wraps
// the image in a Link to its registered step's upload modal when
// stepRegistry has a match, with a completion badge; unregistered images
// render exactly as before (no link, no behavior change).
const StepAwareScrollRowImage: React.FC<{
  src: string;
  alt: string;
  stepEntry?: StepImageRegistryEntry;
}> = ({ src, alt, stepEntry }) => {
  const image = (
    <div className="relative aspect-video w-full">
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover transition-transform duration-200 hover:scale-105"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
      {stepEntry?.completed && (
        <div className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-emerald-500/90 text-white">
          <Check className="size-3.5" />
        </div>
      )}
    </div>
  );

  return (
    <div className="relative w-full max-w-2xl overflow-hidden rounded-lg border border-border bg-background">
      {stepEntry ? (
        <Link href={`/steps/${stepEntry.stepId}`} scroll={false} className="block">
          {image}
        </Link>
      ) : (
        image
      )}
    </div>
  );
};

/**
 * ArticleCoverCard - an articles row's card: the stories row's 16:9 cover
 * (CoverPhotoCard), lifting on hover, with the title and a short line set
 * under it, so the row reads on a phone too, where nothing hovers. A piece
 * with no photo gets a type cover: its title set large on its color (or a
 * tint of the theme color), so the card reads as designed, not as missing
 */
const ArticleCoverCard: React.FC<{ href: string; cover?: string; color?: string; title: string; subtitle?: string }> = ({ href, cover, color, title, subtitle }) => {
  const fill = !color || color === 'theme' ? 'var(--theme-color)' : color;
  return (
    <Link href={href} className="group block">
      <div
        className="relative overflow-hidden rounded-lg transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none"
        style={{ aspectRatio: '16/9', background: cover ? undefined : `color-mix(in srgb, ${fill} ${color ? 100 : 16}%, var(--background))` }}
      >
        {cover ? (
          <Image src={cover} alt="" fill className="object-cover" sizes="280px" />
        ) : (
          <div
            className="absolute inset-x-4 bottom-3 line-clamp-2 font-vt323 text-3xl leading-none"
            // Ink that reads on the fill: a dark brand color takes light ink
            style={{ color: color && color !== 'theme' ? inkOn(color) : color ? 'var(--background)' : fill }}
          >
            {title}
          </div>
        )}
      </div>
      {cover && (
        <div className="mt-3 line-clamp-1 font-vt323 text-xl leading-tight transition-colors group-hover:text-[var(--theme-color)]" style={{ color: 'var(--foreground)' }}>
          {title}
        </div>
      )}
      {subtitle && (
        <p className={`${cover ? 'mt-0.5' : 'mt-3'} line-clamp-2 font-space-grotesk text-xs leading-relaxed`} style={{ color: 'var(--text-muted)' }}>
          {subtitle}
        </p>
      )}
    </Link>
  );
};

/**
 * ScrollRowRenderer - Renders different types of ScrollRows
 */
const ScrollRowRenderer: React.FC<{ section: EditorialSectionType }> = ({ section }) => {
  const metadata = section.metadata;

  const registryCoverIds = React.useMemo(() => {
    if (!metadata?.scrollRowType) return [];
    switch (metadata.scrollRowType) {
      case 'covers':
      case 'stories':
        return metadata.photographer
          ? CoverSchema.getCoversByPhotographer(metadata.photographer)
          : Array.isArray(metadata.coverIds)
            ? metadata.coverIds
            : [];
      case 'portrait':
        return (metadata.portraitSources || []).map(coverIdFromPath).filter((id): id is string => !!id);
      case 'hearth':
        return (metadata.hearthSources || []).map(coverIdFromPath).filter((id): id is string => !!id);
      case 'candid':
        return (metadata.candidSources || []).map(coverIdFromPath).filter((id): id is string => !!id);
      default:
        return [];
    }
  }, [metadata]);

  const stepRegistry = useStepImageRegistry(registryCoverIds);

  if (!metadata?.scrollRowType) {
    return null;
  }

  // Photos: circle-then-text rows. Each entry is `path|label|date`, the last
  // two optional: the label may hold apostrophes, never a comma or `]` (they end
  // the entry), and falls back to the filename; the date ('2024-01-11', or any
  // text) shows under the name in the photo modal. Tapping one opens PhotoGallery's photo
  // modal; no "more" link, since the next thing to do is open the next photo,
  // or keep reading.
  if (metadata.scrollRowType === 'photos') {
    const entries = (metadata.photoSources || []).map((entry) => {
      const [src, label = '', date = ''] = entry.split('|').map((part) => part.trim());
      return { src, label, date };
    });
    return (
      <div>
        {metadata.title && (
          <h2 className="mb-1 px-6 font-vt323 text-md font-bold">{metadata.title}</h2>
        )}
        <PhotoGallery
          images={entries.map((e) => e.src)}
          labels={entries.map((e) => e.label)}
          dates={entries.map((e) => e.date)}
          shape="circle"
          alt={metadata.title || 'photo'}
        />
      </div>
    );
  }

  // Cover and story rows are a 2×2 grid of circles, a page per swipe, unless
  // the directive keeps the single row (scrollRowLayout: 'row')
  const grid = (metadata.scrollRowType === 'covers' || metadata.scrollRowType === 'stories') && metadata.scrollRowLayout !== 'row';

  // Build items based on type
  const items: React.ReactNode[] = [];

  switch (metadata.scrollRowType) {
    case 'covers':
      // Render cover cards - use photographer filter if provided, otherwise use coverIds
      const coverIds = metadata.photographer
        ? CoverSchema.getCoversByPhotographer(metadata.photographer)
        : Array.isArray(metadata.coverIds)
          ? metadata.coverIds
          : ['cover-001', 'cover-002', 'cover-003', 'cover-004', 'cover-005'];
      coverIds.forEach((coverId, index) => {
        items.push(
          <CoverPhotoCard key={`cover-${index}`} coverId={coverId} stepEntry={stepRegistry[coverId]} circle={grid} />
        );
      });
      break;

    case 'articles':
      (metadata.articleCards || []).forEach((card) => {
        items.push(<ArticleCoverCard key={card.href} {...card} />);
      });
      break;

    case 'stories':
      // Render story cards (same as covers but filtered by hasStory)
      const storyIds = metadata.photographer
        ? CoverSchema.getCoversByPhotographer(metadata.photographer)
        : Array.isArray(metadata.coverIds)
          ? metadata.coverIds
          : ['cover-001', 'cover-002', 'cover-003', 'cover-004', 'cover-005'];
      storyIds.forEach((coverId, index) => {
        items.push(
          <CoverPhotoCard key={`story-${index}`} coverId={coverId} showStoryOnly stepEntry={stepRegistry[coverId]} circle={grid} />
        );
      });
      break;
      
    case 'music':
      // Render music banner with tracks from trackIds
      const tracks = metadata.trackIds && Array.isArray(metadata.trackIds)
        ? getTracksByIds(metadata.trackIds)
        : undefined;
      items.push(
        <div key="music-banner" className="w-full">
          <MusicBanner tracks={tracks} />
        </div>
      );
      break;
      
    case 'gif':
      // Render GIF cards
      const gifSources = metadata.gifSources && Array.isArray(metadata.gifSources)
        ? metadata.gifSources
        : ['/llm_baseline.gif']; // default fallback
      gifSources.forEach((gifSrc, index) => {
        items.push(
          <div key={`gif-${index}`} className="relative w-full max-w-md overflow-hidden rounded-lg border border-border bg-background">
            <div className="relative aspect-video w-full">
              <Image
                src={gifSrc}
                alt={`GIF ${index + 1}`}
                fill
                unoptimized={true}
                className="object-contain transition-transform duration-200 hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
          </div>
        );
      });
      break;
      
    case 'hearth':
      // Render hearth image cards
      const hearthSources = metadata.hearthSources && Array.isArray(metadata.hearthSources)
        ? metadata.hearthSources
        : []; // default fallback
      hearthSources.forEach((hearthSrc, index) => {
        const stepEntry = stepRegistry[coverIdFromPath(hearthSrc) || ''];
        items.push(
          <StepAwareScrollRowImage
            key={`hearth-${index}`}
            src={hearthSrc}
            alt={`Hearth ${index + 1}`}
            stepEntry={stepEntry}
          />
        );
      });
      break;

      case 'portrait':
      // Render portrait image cards
      const portraitSources = metadata.portraitSources && Array.isArray(metadata.portraitSources)
        ? metadata.portraitSources
        : []; // default fallback
      portraitSources.forEach((jmmSrc, index) => {
        const stepEntry = stepRegistry[coverIdFromPath(jmmSrc) || ''];
        items.push(
          <StepAwareScrollRowImage
            key={`portrait-${index}`}
            src={jmmSrc}
            alt={`Portrait ${index + 1}`}
            stepEntry={stepEntry}
          />
        );
      });
      break;

      case 'candid':
      // Render candid image cards
      const candidSources = metadata.candidSources && Array.isArray(metadata.candidSources)
        ? metadata.candidSources
        : []; // default fallback
      candidSources.forEach((candidSrc, index) => {
        const stepEntry = stepRegistry[coverIdFromPath(candidSrc) || ''];
        items.push(
          <StepAwareScrollRowImage
            key={`candid-${index}`}
            src={candidSrc}
            alt={`Candid ${index + 1}`}
            stepEntry={stepEntry}
          />
        );
      });
      break;
  }

  return (
    <ScrollRow
      items={items}
      // Only cover and story rows have somewhere obvious to go (the gallery);
      // music, GIF and image rows get a "more" link only when the directive
      // sets one
      moreLink={metadata.moreLink || (metadata.scrollRowType === 'covers' || metadata.scrollRowType === 'stories' ? '/covers' : undefined)}
      title={metadata.title}
      maxItems={metadata.maxItems || 5}
      // A grid stays under its title in the column; a row spans the screen
      fullBleed={!grid}
      layout={grid ? 'grid' : 'row'}
      // Slots sized to what the row holds: the music banner spans the row,
      // a GIF gets its natural max-w-md, covers and images stay 280px
      itemClassName={
        metadata.scrollRowType === 'music' ? 'w-full'
          : metadata.scrollRowType === 'gif' ? 'w-[min(28rem,80vw)]'
          : 'w-[280px]'
      }
    />
  );
};

/**
 * ProfileImageRenderer - Renders a circular profile image with optional link and caption
 */
const ProfileImageRenderer: React.FC<{
  section: EditorialSectionType;
  colorValue: string;
}> = ({ section, colorValue }) => {
  const metadata = section.metadata;
  const [imageError, setImageError] = React.useState(false);

  if (!metadata?.src) {
    return null;
  }

  // Size mapping (in pixels)
  const sizeMap = {
    small: 64,   // 4rem
    medium: 96,  // 6rem (default)
    large: 128,  // 8rem (matches founders page)
  };

  const size = metadata.size || 'medium';
  const sizePixels = sizeMap[size as keyof typeof sizeMap] || sizeMap.medium;
  const alt = metadata.alt || 'Profile';
  const align = metadata.align || 'center';
  const borderColor = metadata.borderColor || colorValue;

  // Alignment classes
  const alignmentClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  };

  // Extract initials from alt text for fallback
  const getInitials = (name: string): string => {
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const profileContent = (
    <div className="inline-block">
      <div
        className="overflow-hidden rounded-full border-4 transition-transform duration-200 hover:scale-105"
        style={{
          width: `${sizePixels}px`,
          height: `${sizePixels}px`,
          borderColor: borderColor
        }}
      >
        {metadata.src && !imageError ? (
          // eslint-disable-next-line @next/next/no-img-element -- src comes from story markdown and may be any host; next/image throws on unconfigured hosts
          <img
            src={metadata.src}
            alt={alt}
            className="size-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          // Fallback initials when image fails to load
          <div
            className="flex size-full items-center justify-center font-vt323 font-bold"
            style={{
              fontSize: `${sizePixels / 3}px`,
              color: borderColor
            }}
          >
            {getInitials(alt)}
          </div>
        )}
      </div>
      {metadata.caption && (
        <div className="mt-3 font-vt323 text-sm" style={{ color: 'var(--text-muted)' }}>
          {metadata.caption}
        </div>
      )}
    </div>
  );

  const containerClasses = `mx-auto max-w-4xl ${alignmentClasses[align as keyof typeof alignmentClasses] || alignmentClasses.center}`;

  return (
    <div className={containerClasses}>
      {metadata.link ? (
        <a
          href={metadata.link}
          className="inline-block transition-opacity duration-200 hover:opacity-80"
        >
          {profileContent}
        </a>
      ) : (
        profileContent
      )}
    </div>
  );
};

/**
 * Component registry - map component names to actual components
 * IMPORTANT: Must be outside ComponentRenderer to prevent re-creating lazy components on every render
 * Components are wrapped with required context providers in EmbeddableComponents.tsx
 */
const componentRegistry: Record<ComponentName, React.LazyExoticComponent<React.ComponentType<Record<string, unknown>>> | React.ComponentType<Record<string, unknown>>> = {
  ColorMatchingGame: React.lazy(() =>
    import('./EmbeddableComponents').then(m => ({
      default: m.EmbeddableColorMatchingGame
    }))
  ),
  ResilienceBuildActivity: React.lazy(() =>
    import('../ResilienceBuildActivity').then(m => ({
      default: m.default
    }))
  ),
  WaitlistInvite: React.lazy(() =>
    import('./EmbeddableComponents').then(m => ({
      default: m.EmbeddableInvite
    }))
  ),
  AboutComponent: React.lazy(() =>
    import('../AboutComponent').then(m => ({
      default: m.default
    }))
  ),
  Definitions: React.lazy(() =>
    import('../Defintions').then(m => ({
      default: m.default
    }))
  ),
  Logo3d: React.lazy(() =>
    import('./EmbeddableComponents').then(m => ({
      default: m.EmbeddableLogo3d
    }))
  ),
  // The owner's sponsor links and values (FoundersConfig sponsor / values),
  // the same cards as the homepage row
  SponsorCard: React.lazy(() =>
    import('../SponsorCard').then(m => ({
      default: m.default as React.ComponentType<Record<string, unknown>>
    }))
  ),
  ValuesBadge: React.lazy(() =>
    import('../ValuesBadge').then(m => ({
      default: m.default as React.ComponentType<Record<string, unknown>>
    }))
  ),
  // The 3D effort ball: off the project pages (#716), here for whoever opens its article
  EffortVisualization: React.lazy(() =>
    import('../EffortVisualization').then(m => ({
      default: m.default as React.ComponentType<Record<string, unknown>>
    }))
  ),
  IconDrawPad: React.lazy(() =>
    import('../icons/IconDrawPad').then(m => ({
      default: m.default as React.ComponentType<Record<string, unknown>>
    }))
  ),
  DiscoBall: React.lazy(() =>
    import('@/components/DiscoBallLazy').then(m => ({
      default: m.default as React.ComponentType<Record<string, unknown>>
    }))
  ),
  SplineEmbed: React.lazy(() =>
    import('./EmbeddableComponents').then(m => ({
      default: m.EmbeddableSplineEmbed
    }))
  ),
  FilmCalculator: React.lazy(() =>
    import('../FilmCalculator').then(m => ({
      default: m.default
    }))
  ),
  ProblemWorksheet: React.lazy(() =>
    import('../ProblemWorksheet').then(m => ({
      default: m.default
    }))
  ),
  // YouTube video embed
  YouTubeEmbed: React.lazy(() =>
    import('./EmbeddableComponents').then(m => ({
      default: m.EmbeddableYouTubeEmbed
    }))
  ),
  // TikTok video embed
  TikTokEmbed: React.lazy(() =>
    import('./EmbeddableComponents').then(m => ({
      default: m.EmbeddableTikTokEmbed
    }))
  ),
  // Formula display for math expressions
  FormulaDisplay: React.lazy(() =>
    import('./EmbeddableComponents').then(m => ({
      default: m.EmbeddableFormulaDisplay
    }))
  ),
  // Goal budget tracker - track costs toward 10,000 hour mastery
  GoalBudget: React.lazy(() =>
    import('../GoalBudget').then(m => ({
      default: m.default
    }))
  ),
  // Strike component - strikethrough text with vt323 font and animations
  Strike: React.lazy(() =>
    import('./EmbeddableComponents').then(m => ({
      default: m.EmbeddableStrike
    }))
  ),
  // Story table - displays all published stories with pagination
  StoryTable: React.lazy(() =>
    import('../StoryTable').then(m => ({
      default: m.default
    }))
  ),
  // A Google Sheet read as a database: the books sheet, filtered (/article/setup-google-sheet)
  BookTable: React.lazy(() =>
    import('../BookTable').then(m => ({
      default: m.default
    }))
  ),
  // UNPPP table - displays all UNPPPs with metadata, filtering, and sorting
  UnpppTable: React.lazy(() =>
    import('../UnpppTable').then(m => ({
      default: m.default
    }))
  ),
  // Expensd - time and expense tracking calculator for development work
  Expensd: React.lazy(() =>
    import('../Expensd').then(m => ({
      default: m.default
    }))
  ),
  // DatabaseCalculator - Neon plan cost calculator with sliders for storage, compute, and active hours
  DatabaseCalculator: React.lazy(() =>
    import('../DatabaseCalculator').then(m => ({
      default: m.default
    }))
  ),
  // BrandColors - the owner's five brand colors, tried on the page and saved to FoundersConfig
  BrandColors: React.lazy(() =>
    import('../brand-colors/BrandColorsSetup').then(m => ({
      default: m.default
    }))
  ),
  // LinkPreview - the site's real link preview card where it's shared (followTheme: wear the color on screen)
  LinkPreview: React.lazy(() =>
    import('../link-preview/LinkPreview').then(m => ({
      default: m.default
    }))
  ),
  // DeleteYourDoubts - the unppp exercise: two minutes to write doubts, then delete them (the founder can keep them)
  DeleteYourDoubts: React.lazy(() =>
    import('../doubts/DeleteYourDoubts').then(m => ({
      default: m.default
    }))
  ),
  // DoubtsCloud - the founder's doubts and where they surface in their writing (founder only)
  DoubtsCloud: React.lazy(() =>
    import('../resume/DoubtsCloud').then(m => ({
      default: m.default
    }))
  ),
  // SetupCurriculum - the SETUP. curriculum by chapter (variant: 'preview' | 'full')
  SetupCurriculum: React.lazy(() =>
    import('./SetupCurriculum').then(m => ({
      default: m.default
    }))
  ),
  // FiveThingsChallenge - fill-in challenge where users build a personal list of 5 items
  FiveThingsChallenge: React.lazy(() =>
    import('../FiveThingsChallenge').then(m => ({
      default: m.default
    }))
  ),
  // InstagramEmbed - Instagram post, reel, or TV embed
  InstagramEmbed: React.lazy(() =>
    import('./EmbeddableComponents').then(m => ({
      default: m.EmbeddableInstagramEmbed
    }))
  ),
  // VerseCardScroll - horizontal scroll row of Bible verse cards
  VerseCardScroll: React.lazy(() =>
    import('../VerseCardScroll').then(m => ({
      default: m.default
    }))
  ),
  // The resume charts (/founders): pen strokes that draw themselves in on view
  InkTimeline: React.lazy(() =>
    import('./EmbeddableComponents').then(m => ({
      default: m.EmbeddableInkTimeline
    }))
  ),
  StackLedger: React.lazy(() =>
    import('./EmbeddableComponents').then(m => ({
      default: m.EmbeddableStackLedger
    }))
  ),
  ViewsChart: React.lazy(() =>
    import('./EmbeddableComponents').then(m => ({
      default: m.EmbeddableViewsChart
    }))
  ),
  // /build's KINDS. and RHYTHM. (#1650): hours by kind of build, and when the work happens
  TypeStatline: React.lazy(() =>
    import('../TypeStatline').then(m => ({
      default: m.default as unknown as React.ComponentType<Record<string, unknown>>
    }))
  ),
  BuildRhythm: React.lazy(() =>
    import('../BuildRhythm').then(m => ({
      default: m.default as unknown as React.ComponentType<Record<string, unknown>>
    }))
  ),
  RepoFocus: React.lazy(() =>
    import('./EmbeddableComponents').then(m => ({
      default: m.EmbeddableRepoFocus
    }))
  ),
  InkPath: React.lazy(() =>
    import('./EmbeddableComponents').then(m => ({
      default: m.EmbeddableInkPath
    }))
  ),
  // InkSystem - how things connect while they run: a spine, a labeled stroke to each
  InkSystem: React.lazy(() =>
    import('./EmbeddableComponents').then(m => ({
      default: m.EmbeddableInkSystem
    }))
  ),
  InkWords: React.lazy(() =>
    import('./EmbeddableComponents').then(m => ({
      default: m.EmbeddableInkWords
    }))
  ),
  NextStep: React.lazy(() =>
    import('./EmbeddableComponents').then(m => ({
      default: m.EmbeddableNextStep
    }))
  ),
  // DependCardScroll - horizontal scroll row of real dependency cost cards
  DependCardScroll: React.lazy(() =>
    import('./EmbeddableComponents').then(m => ({
      default: m.EmbeddableDependCard
    }))
  ),
  // StepCard - a single unppp Step (cover/icon/title/description) inline
  StepCard: React.lazy(() =>
    import('./EmbeddableComponents').then(m => ({
      default: m.EmbeddableStepCard
    }))
  ),
  // StepScroll - horizontal scroll row of an unppp's Steps
  StepScroll: React.lazy(() =>
    import('./EmbeddableComponents').then(m => ({
      default: m.EmbeddableStepScroll
    }))
  ),
  // StoryPreview - embeds specific sections from a story into an article
  StoryPreview: React.lazy(() =>
    import('./EmbeddableComponents').then(m => ({
      default: m.EmbeddableStoryPreview
    }))
  ),
  // Cta - the site's call to action (the /founders and Fab pill, cta_clicked)
  Cta: React.lazy(() =>
    import('./EmbeddableComponents').then(m => ({
      default: m.EmbeddableCta
    }))
  ),
  // BuildYours - the site's ask as a full-bleed band that writes itself in
  // when scrolled to (BuildYoursCard): a conversion point for any article
  BuildYours: React.lazy(() =>
    import('./EmbeddableComponents').then(m => ({
      default: m.EmbeddableBuildYours
    }))
  ),
  // BuildYourStack - what a copy costs to run and what each service lets you
  // build (DependConfig.json), with TRY. / BUILD. / SELL. starting points
  BuildYourStack: React.lazy(() =>
    import('./EmbeddableComponents').then(m => ({
      default: m.EmbeddableBuildYourStack
    }))
  ),
  // ArticlePreview - embeds sections from another article (the article-slug
  // counterpart to StoryPreview, which is reserved for Story/coverId)
  ArticlePreview: React.lazy(() =>
    import('./EmbeddableComponents').then(m => ({
      default: m.EmbeddableArticlePreview
    }))
  ),
  // BusinessWorksheet - inline business planning worksheet with categories and questions
  BusinessWorksheet: React.lazy(() =>
    import('./EmbeddableComponents').then(m => ({
      default: m.EmbeddableBusinessWorksheet
    }))
  ),
  // AI Wrapped - Spotify-style visualization of AI conversation patterns
  AIWrappedVisualization: React.lazy(() =>
    import('./EmbeddableComponents').then(m => ({
      default: m.EmbeddableAIWrappedVisualization
    }))
  ),
  // HtmlEmbed - inline iframe for external HTML pages (theunpartyrunway and other unppps)
  HtmlEmbed: React.lazy(() =>
    import('./EmbeddableComponents').then(m => ({
      default: m.EmbeddableHtmlEmbed
    }))
  ),
  // BrandPalette - live color swatches from theunpartybrand releases
  BrandPalette: React.lazy(() =>
    import('./EmbeddableComponents').then(m => ({
      default: m.EmbeddableBrandPalette
    }))
  ),
  // ColorPalette - interactive 5-color picker (pick, import a .css, or tap a cover palette)
  ColorPalette: React.lazy(() =>
    import('./EmbeddableComponents').then(m => ({
      default: m.EmbeddableColorPalette
    }))
  ),
  // Blog - one of the owner's projects as a card (cover, name, tagline), its keywords lit
  Blog: React.lazy(() =>
    import('../Blog').then(m => ({
      default: m.default
    }))
  ),
  // ArticleTable - every published article in one sortable table (?tag= aware)
  ArticleTable: React.lazy(() =>
    import('../ArticleTable').then(m => ({
      default: m.default
    }))
  ),
  // PriorityTable - the YAH./MEH./NAH. priority-score dashboard as a table
  PriorityTable: React.lazy(() =>
    import('../PriorityTable').then(m => ({
      default: m.default
    }))
  ),
  // CommunicationStyleGame - pick how you'd say it: direct, story, or data
  CommunicationStyleGame: React.lazy(() =>
    import('../CommunicationStyleGame').then(m => ({
      default: m.default
    }))
  ),
  // MiniMaze - 5x5 maze in hand-drawn icons, by tap or arrow keys
  MiniMaze: React.lazy(() =>
    import('../MiniMaze').then(m => ({
      default: m.default
    }))
  ),
  // ExploreResilience - what this site took, and how long yours would take at the hours you have
  ExploreResilience: React.lazy(() =>
    import('../ExploreResilience').then(m => ({
      default: m.default
    }))
  ),
  // ArticleList - a project's markdown articles as stamped balls, with a list
  // view (the DOC. row of a project page)
  ArticleList: React.lazy(() =>
    import('../ArticleList').then(m => ({
      default: m.default
    }))
  ),
  // YourWords - what you keep coming back to, next to this site's own most used words
  YourWords: React.lazy(() =>
    import('../YourWords').then(m => ({
      default: m.default
    }))
  ),
  // ResilienceReflection - the ethos over three pillars, each an action written in ink that joins the reader's words
  ResilienceReflection: React.lazy(() =>
    import('../ResilienceReflection').then(m => ({
      default: m.default
    }))
  ),
  // LiveScale - a 1-10 slider that averages every vote in the room
  LiveScale: React.lazy(() =>
    import('../LiveScale').then(m => ({
      default: m.default
    }))
  ),
  // LanguageVisualization - D3 pie/bar of org languages from raw-repo-metadata
  LanguageVisualization: React.lazy(() =>
    import('../LanguageVisualization').then(m => ({
      default: m.default
    }))
  ),
  // ComponentTable - the component portfolio as the house table, with the
  // services each runs on as hand-drawn icons (without=claude: no AI needed)
  ComponentTable: React.lazy(() =>
    import('../portfolio/ComponentTable').then(m => ({
      default: m.default as React.ComponentType<Record<string, unknown>>
    }))
  ),
  // Add more components here as needed
};

/**
 * ComponentRenderer - Dynamically renders custom components
 */
/**
 * One embed can't take the article down with it: a component that throws while
 * rendering (a blocked CDN, no WebGL) shows a note instead of the page's error
 * screen, and the rest of the article stays up (#1433)
 */
class ComponentErrorBoundary extends React.Component<
  { componentName: string; children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.warn(`Component "${this.props.componentName}" failed to render:`, error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-lg border border-yellow-500 bg-yellow-50 p-4 text-sm text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200">
          {`⚠️ ${this.props.componentName} couldn't load here`}
        </div>
      );
    }
    return this.props.children;
  }
}

const ComponentRenderer: React.FC<{ section: EditorialSectionType }> = ({ section }) => {
  const metadata = section.metadata;
  
  if (!metadata?.componentName) {
    return null;
  }

  const Component = componentRegistry[metadata.componentName as ComponentName];

  if (!Component) {
    console.warn(`Component "${metadata.componentName}" not found in registry`);
    return (
      <div className="rounded-lg border border-yellow-500 bg-yellow-50 p-4 text-sm text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200">
        ⚠️ Component &quot;{metadata.componentName}&quot; not found
      </div>
    );
  }

  return (
    <ComponentErrorBoundary componentName={metadata.componentName}>
      <React.Suspense 
        fallback={
          <div className="flex items-center justify-center p-8">
            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading {metadata.componentName}...</div>
          </div>
        }
      >
        <Component {...(metadata.componentProps || {})} />
      </React.Suspense>
    </ComponentErrorBoundary>
  );
};

export default EditorialSection;
