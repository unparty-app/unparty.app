'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from '../contexts/ThemeContext';
import EditorialSection from './editorial/EditorialSection';
import HighlightCards, { HighlightCardsLoading, HIGHLIGHTS, pickHighlights } from './editorial/HighlightCards';
import { ArrowRight } from './icons';
import coverColors from '../covers/cover-colors.json';
import { getCoverIdFromFilename } from '../covers/covers-data';
import type { EditorialArticle } from '../constants/editorial-articles';

interface ArticlePreviewProps {
  slug: string;
  sectionIds?: string[]; // Specific section IDs to show (e.g., ['hero', 'about-me']) — fragile for MD-sourced articles, see sourceComponentName
  sourceComponentName?: string; // Show the 'component' section(s) whose metadata.componentName matches (e.g. 'ColorPalette') — survives edits/reordering in the source article, unlike positional sectionIds
  sectionRange?: { start: number; end: number }; // Show sections by index range
  maxSections?: number; // Limit number of sections to show
  showMetadata?: boolean; // Show article title, author, category header
  className?: string;
}

/**
 * ArticlePreview - another article inside this one, in one of two ways:
 * - its highlights (the default): the shared card row StoryPreview uses
 *   (editorial/HighlightCards) on the theme band: the article's card, its
 *   cover under glass, then the lines it set big, each opening the article
 *   at that line
 * - a live component from it (sourceComponentName): the component itself,
 *   as its own article runs it, with a quiet "from <title>" link
 *
 * The article-slug counterpart to StoryPreview (which is reserved
 * for the Story/coverId model at /story/[slug] and can't reference an
 * article). Works for both TS-authored and .md-based articles alike, since
 * GET /api/articles/[slug] already resolves either through the shared
 * registry and returns pre-parsed sections - no markdown parsing needed
 * here.
 *
 * Used in markdown via: :::component[name=ArticlePreview,slug=some-article-slug,maxSections=2]:::
 * Used in TS-authored articles by setting a 'component' section's
 * metadata.componentProps directly, e.g.:
 *   { componentName: 'ArticlePreview', componentProps: { slug: '...', maxSections: 2 } }
 *
 * Prefer sourceComponentName over sectionIds when targeting a 'component'
 * section in an MD-sourced article: mdArticleUtils.ts assigns section ids
 * from a single counter shared across every block type in document order
 * (e.g. 'component-1', 'section-2'), so a positional id silently points at
 * the wrong block (or nothing) after the source article is edited.
 * sourceComponentName matches on metadata.componentName instead, which is
 * stable across reordering/edits elsewhere in the doc.
 */
const ArticlePreview: React.FC<ArticlePreviewProps> = ({
  slug,
  sectionIds,
  sourceComponentName,
  sectionRange,
  maxSections,
  showMetadata = true,
  className = ''
}) => {
  const { colorValue } = useTheme();
  const [article, setArticle] = useState<EditorialArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadArticle = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/articles/${slug}`);
        if (!response.ok) {
          setError(`Article not found for ${slug}`);
          setLoading(false);
          return;
        }

        const data = (await response.json()) as { article: EditorialArticle };
        setArticle(data.article);
        setLoading(false);
      } catch (err) {
        console.error('[ArticlePreview] Error loading article:', err);
        setError(err instanceof Error ? err.message : 'Failed to load article');
        setLoading(false);
      }
    };

    loadArticle();
  }, [slug]);

  // Loading: the shape of what's coming, so the page doesn't jump
  if (loading) return sourceComponentName ? <div className={`h-40 ${className}`} aria-busy="true" /> : <HighlightCardsLoading className={className} />;

  // Not there: say so plainly, in the article's own type
  if (error || !article) {
    return (
      <p className={`px-4 font-google-sans-code text-sm sm:px-0 ${className}`} style={{ color: 'var(--foreground)' }}>
        this article isn&apos;t here yet ({error || slug}).
      </p>
    );
  }

  // A live component from it (sourceComponentName): the component itself,
  // as its own article runs it, with a quiet way to where it lives
  if (sourceComponentName) {
    let live = article.sections.filter((section) => section.type === 'component' && section.metadata?.componentName === sourceComponentName);
    if (maxSections && maxSections > 0) live = live.slice(0, maxSections);
    if (live.length === 0) {
      return (
        <p className={`px-4 font-google-sans-code text-sm sm:px-0 ${className}`} style={{ color: 'var(--text-muted)' }}>
          {article.title} doesn&apos;t show {sourceComponentName} right now.
        </p>
      );
    }
    return (
      <div className={className}>
        {live.map((section) => (
          <EditorialSection key={section.id} section={section} isVisible={true} articleSlug={slug} />
        ))}
        <Link
          href={`/article/${slug}`}
          className="group mt-2 inline-flex items-center gap-2 font-google-sans-code text-[10px] uppercase tracking-wide transition-colors hover:text-[var(--foreground)]"
          style={{ color: colorValue }}
        >
          from {article.title}
          <ArrowRight size={14} strokeWidth={1.4} className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    );
  }

  // Otherwise the article as its highlights: its card, then the lines it set
  // big, each opening the article at that line (the shared card row)
  let highlights = pickHighlights(article.sections, sectionIds, article.title);
  if (sectionRange) highlights = highlights.slice(sectionRange.start, sectionRange.end);
  highlights = highlights.slice(0, maxSections && maxSections > 0 ? maxSections : HIGHLIGHTS);
  const cover = article.coverImage ?? article.coverImages?.[0];
  const coverColor = cover ? (coverColors as Record<string, string[]>)[getCoverIdFromFilename(cover.split('/').pop() ?? '')]?.[0] : undefined;
  const date = article.updated || article.date;

  return (
    <HighlightCards
      title={article.title}
      subtitle={article.subtitle}
      href={`/article/${slug}`}
      coverSrc={cover}
      coverColor={coverColor}
      details={
        showMetadata && (article.category || date) ? (
          <p className="font-google-sans-code text-[10px] uppercase tracking-wide" style={{ color: 'var(--foreground)', opacity: 0.8 }}>
            {[article.category, date && new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })].filter(Boolean).join(' · ')}
          </p>
        ) : null
      }
      highlights={highlights}
      label={`${article.title}: the article and its highlights`}
      className={className}
    />
  );
};

export default ArticlePreview;
