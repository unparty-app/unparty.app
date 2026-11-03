'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { EditorialArticle } from '../constants/editorial-articles';
import { useTheme } from './../contexts/ThemeContext';
import ScrollRow from '../../components/HorizontalRow';
import ArticleCard from './ArticleCard';
import ArticleViewToggle, { type ArticleView } from './ArticleViewToggle';
import HandDrawnArrow from './HandDrawnArrow';

const PAGE_SIZE = 8; // List rows per page: about a phone screen and a half

interface ArticleListProps {
  unpppId?: string;
  className?: string;
  title?: string;
  description?: string;
  maxItems?: number; // Balls shown before the list takes over (default 4)
}

/**
 * ArticleList - an unppp's articles, newest first (#1017).
 *
 * Balls: the newest few, as stamped ArticleCard balls in a ScrollRow. Few
 * enough to take in at a glance on any screen (one or two on a phone, the
 * whole row on a laptop).
 * List: every article in two columns, title (with its description under it)
 * and date, PAGE_SIZE to a page with hand-drawn back / next arrows. The
 * hand-drawn toggle beside the title switches between them, and only shows
 * when there are more articles than balls.
 */
const ArticleList: React.FC<ArticleListProps> = ({
  unpppId,
  className = "",
  title,
  maxItems = 4
}) => {
  const [articles, setArticles] = useState<EditorialArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ArticleView>('balls');
  const [page, setPage] = useState(1);
  const listRef = useRef<HTMLDivElement>(null);
  const { colorValue } = useTheme();

  useEffect(() => {
    const loadArticles = async () => {
      try {
        // Fetch articles - all articles if no unpppId, otherwise filtered by UNPPP
        const apiUrl = unpppId
          ? `/api/articles/unppp/${unpppId}`
          : `/api/articles`;
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error('Failed to fetch articles');
        }

        const data = await response.json();
        setArticles(data.articles || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load articles');
      } finally {
        setLoading(false);
      }
    };

    loadArticles();
  }, [unpppId]);

  // Newest first. Dates are YYYY-MM-DD, so a string compare sorts them;
  // undated articles ('') land at the end (same as ArticleTable)
  const sorted = useMemo(
    () => [...articles].sort((a, b) => (b.date || '').localeCompare(a.date || '')),
    [articles]
  );

  const displayTitle = title || "DOC.";

  const header = (showToggle: boolean) => (
    <div className="mb-3 flex items-center gap-4 px-4">
      <h2 className="text-md font-vt323 font-bold">{displayTitle}</h2>
      {showToggle && <ArticleViewToggle view={view} onChange={setView} total={sorted.length} />}
    </div>
  );

  if (loading) {
    const loadingItems = Array.from({ length: 3 }).map((_, idx) => (
      <div
        key={`loading-${idx}`}
        className="size-64 shrink-0 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700"
      />
    ));

    return (
      <div className={className}>
        {header(false)}
        <ScrollRow items={loadingItems} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`px-4 ${className}`}>
        <div className="rounded-lg border border-red-300 p-6 dark:border-red-500">
          <h3 className="mb-2 font-bold text-red-600 dark:text-red-400">Error Loading Articles</h3>
          <p className="text-red-500 dark:text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  if (sorted.length === 0) {
    return null; // Don't show anything if no articles
  }

  const hasMore = sorted.length > maxItems;
  const pageCount = Math.ceil(sorted.length / PAGE_SIZE);
  const pageArticles = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Turn the page, and bring the section's top (title and toggle) back into
  // view if it scrolled away
  const goToPage = (next: number) => {
    setPage(next);
    const top = listRef.current?.getBoundingClientRect().top ?? 0;
    if (top < 0) {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      listRef.current?.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
    }
  };

  return (
    <div ref={listRef} className={`scroll-mt-32 ${className}`}>
      {header(hasMore)}

      {view === 'balls' || !hasMore ? (
        <div key="balls" className="article-view-enter">
          <ScrollRow
            items={sorted.slice(0, maxItems).map((article, idx) => (
              <ArticleCard key={article.slug} article={article} colorValue={colorValue} index={idx} />
            ))}
            // Room above and below: a row that scrolls sideways clips
            // vertically too, and the balls float, lift and glow
            itemClassName="w-64 py-6"
            ariaLabel={`${displayTitle} newest articles`}
          />
        </div>
      ) : (
        <div key="list" className="article-view-enter px-4">
          <div
            className="grid grid-cols-[1fr_auto] gap-4 border-b pb-2"
            style={{ borderColor: `${colorValue}40` }}
          >
            <span className="font-google-sans-code text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
              TITLE.
            </span>
            <span className="font-google-sans-code text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
              DATE.
            </span>
          </div>
          <ul key={page} className="article-view-enter">
            {pageArticles.map(article => (
              <li key={article.slug}>
                <Link
                  href={`/article/${article.slug}`}
                  className="group grid grid-cols-[1fr_auto] items-baseline gap-4 border-b py-3 transition-colors duration-200 hover:bg-[var(--background-highlight)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-color)] motion-reduce:transition-none"
                  style={{ borderColor: `${colorValue}1F` }}
                >
                  <span className="min-w-0">
                    <span className="flex items-baseline gap-2">
                      <span className="font-google-sans-code text-sm" style={{ color: 'var(--foreground)' }}>
                        {article.title}
                      </span>
                      <span
                        className="hidden font-google-sans-code text-xs uppercase tracking-wide opacity-0 transition-opacity duration-200 group-hover:opacity-80 group-focus-visible:opacity-80 sm:inline"
                        style={{ color: colorValue }}
                        aria-hidden="true"
                      >
                        open →
                      </span>
                    </span>
                    {article.description && (
                      <span className="mt-1 line-clamp-1 font-google-sans-code text-xs" style={{ color: 'var(--text-muted)' }}>
                        {article.description}
                      </span>
                    )}
                  </span>
                  <span className="font-vt323 text-sm tabular-nums" style={{ color: 'var(--text-muted)' }}>
                    {article.date ? article.date.replace(/-/g, '.') : '—'}
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          {pageCount > 1 && (
            <nav aria-label="Article pages" className="mt-4 flex items-center gap-4">
              <button
                type="button"
                onClick={() => goToPage(page - 1)}
                disabled={page === 1}
                aria-label="Newer articles"
                className="group flex h-10 w-12 items-center justify-start rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-color)] disabled:pointer-events-none disabled:opacity-30"
              >
                {/* Mirrored, so its hover nudge leans back */}
                <span className="-scale-x-100">
                  <HandDrawnArrow />
                </span>
              </button>
              <span className="font-vt323 text-sm tabular-nums" style={{ color: 'var(--text-muted)' }} aria-live="polite">
                <span className="sr-only">Page </span>{page}<span aria-hidden="true"> / </span><span className="sr-only"> of </span>{pageCount}
              </span>
              <button
                type="button"
                onClick={() => goToPage(page + 1)}
                disabled={page === pageCount}
                aria-label="Older articles"
                className="group flex h-10 w-12 items-center justify-start rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-color)] disabled:pointer-events-none disabled:opacity-30"
              >
                <HandDrawnArrow />
              </button>
            </nav>
          )}
        </div>
      )}
    </div>
  );
};

export default ArticleList;
