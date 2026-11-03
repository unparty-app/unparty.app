'use client';
import React, { useMemo, useState } from 'react';
import { useFetch } from '@/hooks/useFetch';
import { useTheme } from '../contexts/ThemeContext';

interface Book {
  id: string;
  sku: string;
  title: string;
  author: string;
  quote: string;
  page: number;
  publisher: string;
  publisherLink: string;
  inStock: boolean;
  claimedBy: string | null;
  claimedAt: string | null;
  condition: string;
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
}

interface BooksGalleryProps {
  maxBooks?: number;
  showAvailableOnly?: boolean;
  showQuotesOnly?: boolean;
  gridColumns?: 1 | 2 | 3 | 4;
}

const BooksGallery: React.FC<BooksGalleryProps> = ({
  maxBooks,
  showAvailableOnly = false,
  showQuotesOnly = false,
  gridColumns = 3
}) => {
  const { colorValue } = useTheme();
  const { data: allBooks, loading, error } = useFetch<Book[]>('/api/book');
  const [sortBy, setSortBy] = useState<'title' | 'author' | 'newest'>('title');

  // Filter, sort, and limit client-side; changing these doesn't refetch
  const books = useMemo(() => {
    let filteredBooks = allBooks ?? [];
    if (showAvailableOnly) {
      filteredBooks = filteredBooks.filter((book) => book.inStock);
    }
    if (showQuotesOnly) {
      filteredBooks = filteredBooks.filter((book) => book.quote && book.quote.trim() !== '');
    }
    // 'newest' keeps the API order (createdAt desc)
    if (sortBy === 'title') {
      filteredBooks = [...filteredBooks].sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'author') {
      filteredBooks = [...filteredBooks].sort((a, b) => a.author.localeCompare(b.author));
    }
    return maxBooks ? filteredBooks.slice(0, maxBooks) : filteredBooks;
  }, [allBooks, showAvailableOnly, showQuotesOnly, sortBy, maxBooks]);

  const getGridClass = () => {
    switch (gridColumns) {
      case 1: return 'grid-cols-1';
      case 2: return 'grid-cols-1 md:grid-cols-2';
      case 3: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
      case 4: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
      default: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className={`grid gap-4 ${getGridClass()}`}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-lg border border-gray-300/20 p-6"
              style={{ borderColor: colorValue, backgroundColor: `${colorValue}05` }}
            >
              <div className="mb-3 h-5 w-3/4 rounded bg-gray-300"></div>
              <div className="mb-2 h-4 w-1/2 rounded bg-gray-200"></div>
              <div className="h-3 w-full rounded bg-gray-200"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-gray-300/20 p-6"
           style={{ borderColor: colorValue, backgroundColor: `${colorValue}05` }}>
        <p className="font-google-sans-code text-sm opacity-60" style={{ color: 'var(--foreground)' }}>
          Unable to load books: {error}
        </p>
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <div className="rounded-lg border border-gray-300/20 p-6"
           style={{ borderColor: colorValue, backgroundColor: `${colorValue}05` }}>
        <p className="font-google-sans-code text-sm opacity-60" style={{ color: 'var(--foreground)' }}>
          No books found
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with stats and sorting */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h2 className="font-google-sans-code text-lg font-bold" style={{ color: 'var(--foreground)' }}>
            {books.length} {books.length === 1 ? 'Book' : 'Books'}
          </h2>
          {!showAvailableOnly && (
            <div className="flex gap-2 font-google-sans-code text-xs opacity-60" style={{ color: 'var(--foreground)' }}>
              <span>✅ {books.filter(b => b.inStock).length} REFERENCED.</span>
              <span>•</span>
              <span>📚 {books.filter(b => b.quote && b.quote.trim() !== '').length} with quotes</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="font-vt323 text-xs opacity-60" style={{ color: 'var(--foreground)' }}>
            SORT.
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'title' | 'author' | 'newest')}
            className="rounded border border-gray-300/20 bg-transparent px-3 py-1 font-google-sans-code uppercase text-xs transition-colors"
            style={{
              borderColor: colorValue,
              color: 'var(--foreground)',
              backgroundColor: `${colorValue}05`
            }}
          >
            <option value="title">Title (A-Z)</option>
            <option value="author">Author (A-Z)</option>
            <option value="newest">Newest First</option>
          </select>
        </div>
      </div>

      {/* Books Grid */}
      <div className={`grid gap-4 ${getGridClass()}`}>
        {books.map((book) => (
          <div
            key={book.id}
            className="group relative flex flex-col rounded-lg border border-gray-300/20 p-6 transition-all duration-200 hover:shadow-lg"
            style={{ borderColor: colorValue, backgroundColor: `${colorValue}05` }}
          >
            {/* Status Badge */}
            <div className="absolute right-4 top-4">
              <span
                className={`rounded-full px-2 py-1 font-vt323 text-xs ${
                  book.inStock
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400'
                }`}
              >
                {book.inStock ? '📮 CONNECT.' : '🎒'}
              </span>
            </div>

            {/* Book Info */}
            <div className="mb-4 flex-1">
              <h3 className="mb-2 pr-20 font-google-sans-code text-sm font-bold leading-tight" style={{ color: 'var(--foreground)' }}>
                {book.title}
              </h3>
              <p className="mb-3 font-google-sans-code text-xs opacity-70" style={{ color: 'var(--foreground)' }}>
                by {book.author}
              </p>

              {/* Quote */}
              {book.quote && book.quote.trim() !== '' && (
                <blockquote className="mb-3 border-l-2 pl-3 font-google-sans-code text-xs italic opacity-80"
                           style={{ borderColor: colorValue, color: 'var(--foreground)' }}>
                  &ldquo;{book.quote}&rdquo;
                  {book.page > 0 && (
                    <span className="ml-1 opacity-60">— p. {book.page}</span>
                  )}
                </blockquote>
              )}

              {/* Publisher Info */}
              {book.publisher && (
                <div className="mt-2 font-google-sans-code text-xs opacity-60" style={{ color: 'var(--foreground)' }}>
                  {book.publisherLink ? (
                    <a
                      href={book.publisherLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="transition-opacity hover:opacity-100"
                      style={{ color: colorValue }}
                    >
                      {book.publisher} →
                    </a>
                  ) : (
                    <span>{book.publisher}</span>
                  )}
                </div>
              )}

              {/* Condition */}
              {book.condition && (
                <div className="mt-2 font-google-sans-code text-xs opacity-60" style={{ color: 'var(--foreground)' }}>
                  Condition: {book.condition}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="mt-auto border-t border-gray-300/20 pt-3" style={{ borderColor: colorValue }}>
              <span className="font-vt323 text-xs opacity-50" style={{ color: 'var(--foreground)' }}>
                REF. {book.sku}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BooksGallery;
