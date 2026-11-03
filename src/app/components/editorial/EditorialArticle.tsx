'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useTheme } from '../../contexts/ThemeContext';
import { useCover } from '../../contexts/CoverContext';
import { useArticleHeader } from '../../contexts/ArticleHeaderContext';
import { ArticleBackgroundProvider, getContrastForeground, getContrastTextMuted } from '../../contexts/ArticleBackgroundContext';
import { EditorialArticle as EditorialArticleType } from '../../constants/editorial-articles';
import OutlineRail from './OutlineRail';
import { readPinLine } from '../../utils/pinLine';
import StickyHeroStack, { groupSectionsByHero } from './StickyHeroStack';
import Thoughts from './Thoughts';
import ArticleCover from './ArticleCover';
import StickyCover from './StickyCover';
import UnpppsConfig from '../../../data/UnpppsConfig.json';
import { getVideoEntryForUnppp, getVideoEntryByContentUrl } from '../../constants/video-registry';
import Image from 'next/image';
import Link from 'next/link';
import { withResolvedCovers } from '../../utils/articleCovers';
import ArticleComponentVote from '../portfolio/ArticleComponentVote';

interface EditorialArticleProps {
  article: EditorialArticleType;
  className?: string;
  coverId?: string; // Optional cover ID for context integration
  /** THOUGHTS. thread; off for content the thoughts API doesn't serve (stories) */
  showThoughts?: boolean;
  /** What a page puts before the article's sections, under its cover (/build's stack and components) */
  lead?: React.ReactNode;
}

const EditorialArticle: React.FC<EditorialArticleProps> = ({ article: rawArticle, className = '', coverId, showThoughts = true, lead }) => {
  // `cover` shorthand -> coverImage/coverImages, before the cover, the Banner
  // (via setArticle) or anything else below reads them
  const article = useMemo(() => withResolvedCovers(rawArticle), [rawArticle]);
  const { colorValue } = useTheme();
  const { setCoverData, clearCoverData } = useCover();
  const { setArticle, clearArticle } = useArticleHeader();
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  // Independent of colorValue/ThemeContext by design — BrandPalette taps set
  // this, and only this, to recolor the page while reading. Plain state, so
  // it resets on reload/navigation instead of persisting anywhere.
  const [backgroundOverride, setBackgroundOverride] = useState<string | null>(null);
  const articleRef = useRef<HTMLElement>(null);
  const sectionRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const sectionGroups = useMemo(() => groupSectionsByHero(article.sections), [article.sections]);
  const pathname = usePathname();
  // Cover video takes priority over the static coverImage for the article's
  // full-bleed hero, from either of two sources: the article's own
  // coverVideo (set via MD frontmatter or directly on a TS article — looked
  // up by asset path, since this article may not be UNPPP-sourced at all)
  // or, when unset, the UNPPP this route belongs to (matched by pathname
  // against UnpppsConfig, the original/only source before #956 added
  // article-level coverVideo). watchHref is separate: only set when a
  // video-registry entry exists for whichever video is actually showing.
  const { coverVideo, watchHref } = useMemo(() => {
    if (article.coverVideo) {
      const videoEntry = getVideoEntryByContentUrl(article.coverVideo);
      return {
        coverVideo: article.coverVideo,
        watchHref: videoEntry?.published ? `/watch/${videoEntry.slug}` : undefined,
      };
    }

    // An article that set its own cover (a color or a live motion) chose it:
    // it doesn't inherit its route's demo video
    if (article.coverColor || article.coverMotion) return { coverVideo: undefined, watchHref: undefined };

    const unppp = UnpppsConfig.unppps.find(u => {
      const route = u.id === 'theunpartyapp' ? '/' : `/${u.id}`;
      return route === pathname;
    });
    const videoEntry = unppp ? getVideoEntryForUnppp(unppp.id) : null;
    return {
      coverVideo: unppp?.coverVideo,
      watchHref: videoEntry?.published ? `/watch/${videoEntry.slug}` : undefined,
    };
  }, [article.coverVideo, article.coverColor, article.coverMotion, pathname]);

  // Set cover data when component mounts or coverId changes
  useEffect(() => {
    if (coverId) {
      setCoverData({
        coverId,
        color: colorValue,
        name: 'STORY'
      });
    }

    // Cleanup: clear cover data when component unmounts
    return () => {
      clearCoverData();
    };
  }, [coverId, colorValue, setCoverData, clearCoverData]);

  // Publish this article to the global chrome: the fixed Banner row renders
  // the byline (avatar, title, category, subtitle, theme song, mood button)
  // so the reading column stays uncramped. Same publish-upward pattern as
  // CoverContext above.
  useEffect(() => {
    setArticle(article);
    return () => {
      clearArticle(article);
    };
  }, [article, setArticle, clearArticle]);

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const sectionId = entry.target.getAttribute('data-section-id');
            if (sectionId) {
              setVisibleSections(prev => new Set([...prev, sectionId]));
            }
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '50px 0px -50px 0px'
      }
    );

    sectionRefs.current.forEach((element) => {
      observer.observe(element);
    });

    return () => observer.disconnect();
  }, [article.sections]);

  // Deep link: /story/slug?mention=repoName scrolls to the first section that
  // mentions the term (used by RepoStats STORIES. tab to jump to the reference).
  // A section's id as the hash (/build#rhythm) lands on that section the same
  // way, so a page can link straight to another's chapter.
  // Reads window.location directly — useSearchParams would force a Suspense
  // bailout on these statically generated pages.
  useEffect(() => {
    const hash = decodeURIComponent(window.location.hash.slice(1));
    const mention = new URLSearchParams(window.location.search).get('mention')?.toLowerCase();
    if (!hash && !mention) return;

    const sectionText = (s: EditorialArticleType['sections'][number]): string =>
      [
        s.content ?? '',
        ...(s.leftSections?.map(n => n.content ?? '') ?? []),
        ...(s.rightSections?.map(n => n.content ?? '') ?? []),
      ].join(' ').toLowerCase();

    const target = (hash && article.sections.find(s => s.id === hash)) || (mention && article.sections.find(s => sectionText(s).includes(mention)));
    if (!target) return;

    // Land under whatever is pinned (the header, or a sticky cover band), the
    // way OutlineRail jumps: a headline pins rather than taking room, so its
    // pinned height comes off too, and its first lines sit just below it. A
    // cover band shrinks as the page scrolls, so once the scroll settles it
    // lines up again against where the band ends up
    const align = (behavior: ScrollBehavior) => {
      const el = sectionRefs.current.get(target.id);
      if (!el) return;
      const heroId = el.getAttribute('data-hero-sentinel');
      const pinned = heroId ? document.querySelector(`[data-hero-display="${CSS.escape(heroId)}"]`) : null;
      const pinnedHeight = pinned && el.offsetHeight === 0 ? pinned.getBoundingClientRect().height : 0;
      const top = el.getBoundingClientRect().top + window.scrollY - readPinLine() - pinnedHeight;
      window.scrollTo({ top: Math.max(0, top), behavior });
    };
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Let layout settle (fonts/images) before measuring scroll position
    const timers = [
      setTimeout(() => align(reduce ? 'auto' : 'smooth'), 150),
      setTimeout(() => align('auto'), 1100),
      // and once more after the pinned headline's 700ms fade-in, when it has
      // its full height
      setTimeout(() => align('auto'), 2000),
    ];

    return () => timers.forEach(clearTimeout);
  }, [article.sections]);

  return (
    <ArticleBackgroundProvider backgroundOverride={backgroundOverride} setBackgroundOverride={setBackgroundOverride}>
    <div
      className={`relative ${className}`}
      style={backgroundOverride ? {
        backgroundColor: backgroundOverride,
        ['--foreground' as string]: getContrastForeground(backgroundOverride),
        ['--text-muted' as string]: getContrastTextMuted(backgroundOverride),
      } as React.CSSProperties : undefined}
    >
      {/* Reading Progress Bar — its own component so per-scroll state updates
          re-render just the bar, not the whole article tree. */}

      {/* Floating outline navigator (issue #538) */}
      <OutlineRail sections={article.sections} sectionRefs={sectionRefs} />

      <article
        ref={articleRef}
        className="mx-auto max-w-4xl px-6 pb-12"
      >
        {/* Cover Image/Video - full-bleed, breaks out of the article's max-w-4xl
            container. The article's first child (not inside a <header>) so the
            sticky cover stays pinned for the whole article, shrunk to a band
            under the frosted header (StickyCover). Gated on either, not just
            coverImage - an article can have coverVideo with no coverImage at
            all (e.g. MD frontmatter that only sets coverVideo), or only a
            coverColor (ArticleColorCover). The byline lives
            in the fixed Banner row via ArticleHeaderContext. */}
        {(article.coverImage || coverVideo || article.coverColor) ? (
          <StickyCover>
            <ArticleCover
              article={article}
              videoSrc={coverVideo}
              watchHref={watchHref}
            />
          </StickyCover>
        ) : (
          <div className="mb-16" />
        )}

        {lead}

        {/* Article Content */}
        <div className="prose-custom">
          <StickyHeroStack
            groups={sectionGroups}
            articleSlug={article.slug}
            visibleSections={visibleSections}
            registerSectionRef={(id, el) => {
              if (el) {
                sectionRefs.current.set(id, el);
              } else {
                sectionRefs.current.delete(id);
              }
            }}
          />
        </div>

        {/* Article Footer */}
        <footer className="mt-20 border-t border-border pt-12">
          {/* A component's home article: vote on making it yours (#1433) */}
          {article.presents && <ArticleComponentVote component={article.presents.component} needs={article.presents.needs} color={colorValue} />}

          {/* Article Tags: each opens /article narrowed to that tag, across every unppp */}
          {article.tags && article.tags.length > 0 && (
            <ul aria-label="Tags" className="mb-6 mt-6 flex flex-wrap gap-2">
              {article.tags.map((tag, index) => (
                <li key={`${tag}-${index}`}>
                  <Link
                    href={`/article?tag=${encodeURIComponent(tag)}`}
                    className="inline-block rounded-full border px-3 py-1 font-google-sans-code text-xs transition-colors duration-200 hover:bg-[var(--background-highlight)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-color)] motion-reduce:transition-none"
                    style={{ borderColor: `${colorValue}66`, color: 'var(--foreground)' }}
                  >
                    <span style={{ color: colorValue }}>#</span>{tag}
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {/* Article BUILDER */}
            {article.builder ? (
              <div className="flex items-center gap-2">
                {article.builderImage && (
                  <div className="relative size-6 rounded-full overflow-hidden flex-shrink-0">
                    <Image
                      src={article.builderImage.startsWith('/') ? article.builderImage : `/${article.builderImage}`}
                      alt={article.builder ?? ''}
                      width={24}
                      height={24}
                      className="size-full object-cover"
                    />
                  </div>
                )}

              </div>
            ) : (
              <p className="font-vt323 text-sm" style={{ color: 'var(--text-muted)' }}>
                🧗🏾‍♂️ in progress
              </p>
            )}

          {/* Not on an unpublished article embedded in an unppp page: its
              thoughts API 404s like its /article route */}
          {showThoughts && article.published !== false && <Thoughts articleSlug={article.slug} />}

        </footer>
      </article>
    </div>
    </ArticleBackgroundProvider>
  );
};

export default EditorialArticle;
