'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import RowTable from './RowTable';
import { useTheme } from '../contexts/ThemeContext';
import type { EditorialArticle } from '../constants/editorial-articles';

interface ArticleTableProps {
  className?: string;
}

// 'Oct 31, 2026' for a YYYY-MM-DD date; '' when undated
const shortDate = (date?: string) =>
  date ? new Date(`${date.slice(0, 10)}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

/**
 * ArticleTable - every article, newest first, as the house table (RowTable,
 * #572): its cover, title and description, and its date, category and author
 * as columns that sort (narrow, the labels pick which one shows). ?tag=
 * narrows it to one tag, shown with a × back to every article.
 */
export default function ArticleTable({ className }: ArticleTableProps) {
  const { colorValue } = useTheme();
  // ?tag=roi (from an article's tag links) narrows the table to that tag,
  // across every unppp; matched whole, ignoring case
  const activeTag = useSearchParams().get('tag')?.trim() || null;
  const [articles, setArticles] = useState<EditorialArticle[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const loadArticles = async () => {
      try {
        const response = await fetch('/api/articles');
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        // Newest first. /api/articles returns registry order, which buried new
        // articles on later pages. Dates are YYYY-MM-DD, so a string compare
        // sorts them; undated articles ('') land at the end.
        const sorted = [...((data.articles || []) as EditorialArticle[])].sort((a, b) =>
          (b.date || '').localeCompare(a.date || '')
        );
        setArticles(sorted);
      } catch {
        setArticles([]);
      } finally {
        setLoading(false);
      }
    };
    loadArticles();
  }, []);

  const tagged = activeTag
    ? articles.filter((a) => (a.tags || []).some((t) => t.toLowerCase() === activeTag.toLowerCase()))
    : articles;

  if (loading) {
    return (
      <div className={`w-full py-8 ${className || ''}`}>
        <span className="font-google-sans-code text-sm" style={{ color: 'var(--text-muted)' }}>
          loading...
        </span>
      </div>
    );
  }

  if (articles.length === 0) return null;

  return (
    <div className={`w-full ${className || ''}`}>
      {/* Active tag, with a hand-drawn × back to every article */}
      {activeTag && (
        <div className="mb-4 flex items-center gap-2">
          <span className="font-google-sans-code text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            tagged
          </span>
          <span
            className="inline-flex items-center gap-1.5 rounded-full border py-1 pl-3 pr-1.5 font-google-sans-code text-xs"
            style={{ borderColor: colorValue, color: colorValue }}
          >
            #{activeTag}
            <Link
              href="/article"
              scroll={false}
              aria-label={`Clear the ${activeTag} tag`}
              className="group rounded-full p-0.5 transition-colors hover:bg-[var(--background-highlight)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--theme-color)]"
            >
              <svg viewBox="0 0 12 12" className="size-3 transition-transform duration-300 group-hover:rotate-90 motion-reduce:transition-none" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" aria-hidden="true">
                <path d="M2.4 2.1c2.5 2.6 4.6 5 7.3 7.8" />
                <path d="M9.6 2.5c-2.7 2.3-4.9 4.6-7.1 7.2" />
              </svg>
            </Link>
          </span>
        </div>
      )}

      <RowTable
        // A new tag starts the table over, at its first rows
        key={activeTag ?? 'all'}
        rows={tagged}
        rowKey={(a) => a.slug}
        label="article"
        name={(a) => a.title}
        nameSort={(a) => a.title.toLowerCase()}
        meta={(a) => a.description}
        circle={(a) => (a.coverImage?.startsWith('/') ? { src: a.coverImage } : { text: a.title, color: a.coverColor?.startsWith('#') ? a.coverColor : undefined })}
        columns={[
          { id: 'date', label: 'date', value: (a) => shortDate(a.date), sort: (a) => a.date || undefined },
          { id: 'category', label: 'category', value: (a) => a.category, sort: (a) => a.category.toLowerCase(), dir: 'asc' },
          { id: 'by', label: 'by', value: (a) => a.author || '—', sort: (a) => (a.author || '').toLowerCase() || undefined, dir: 'asc' },
        ]}
        sort={{ by: 'date', dir: 'desc' }}
        href={(a) => `/article/${a.slug}`}
        search={(a, q) =>
          a.title.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          a.category.toLowerCase().includes(q) ||
          (a.author || '').toLowerCase().includes(q) ||
          (a.tags || []).some((t) => t.toLowerCase().includes(q))
        }
        searchLabel="search articles"
        pageSize={12}
        empty="no articles match."
      />
    </div>
  );
}
