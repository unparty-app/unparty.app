'use client';
import React, { useState } from 'react';
import { useFetch } from '@/hooks/useFetch';
import { useTheme } from '../contexts/ThemeContext';
import BookModal from './BookModal';

interface Book {
  id: string;
  title: string;
  author: string;
  quote: string;
  page: number;
  publisher: string;
  condition: string;
}

interface BookSectionProps {
  maxBooks?: number;
  compact?: boolean;
}

const BookSection: React.FC<BookSectionProps> = ({
  maxBooks = 1,
  compact = true
}) => {
  const { colorValue } = useTheme();
  const { data: allBooks, loading, error } = useFetch<Book[]>('/api/book');
  const books = (allBooks ?? []).slice(0, maxBooks);
  const [openBookId, setOpenBookId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="animate-pulse rounded-lg border border-gray-300/20 p-4"
           style={{ borderColor: colorValue, backgroundColor: `${colorValue}05` }}>
        <div className="mb-2 h-4 w-3/4 rounded bg-gray-300"></div>
        <div className="h-3 w-1/2 rounded bg-gray-200"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-gray-300/20 p-4"
           style={{ borderColor: colorValue, backgroundColor: `${colorValue}05` }}>
        <p className="font-google-sans-code text-xs opacity-60" style={{ color: 'var(--foreground)' }}>
          Unable to load books: {error}
        </p>
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <div className="rounded-lg border border-gray-300/20 p-4"
           style={{ borderColor: colorValue, backgroundColor: `${colorValue}05` }}>
        <p className="font-google-sans-code text-xs opacity-60" style={{ color: 'var(--foreground)' }}>
          No books available
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {books.map((book) => (
        <button
          key={book.id}
          onClick={() => setOpenBookId(book.id)}
          className={`w-full rounded-lg border border-gray-300/20 p-4 text-left transition-all duration-200 hover:shadow-lg ${
            compact ? '' : ''
          }`}
          style={{ borderColor: colorValue, backgroundColor: `${colorValue}05` }}
        >
          {compact ? (
            // Compact view - just quote and author
            <>
              <blockquote className="mb-2 font-google-sans-code text-xs italic opacity-80" style={{ color: 'var(--foreground)' }}>
                &ldquo;{book.quote}&rdquo;
              </blockquote>
              <cite className="font-google-sans-code text-xs opacity-60" style={{ color: 'var(--foreground)' }}>
                — {book.author}
                {book.title && (
                  <span className="ml-1">
                    <em>{book.title}</em>
                    {book.page > 0 && `, p. ${book.page}`}
                  </span>
                )}
              </cite>
            </>
          ) : (
            // Full view - complete book information
            <div className="space-y-3">
              <div>
                <h3 className="font-rounded text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                  {book.title}
                </h3>
                <p className="font-google-sans-code text-xs opacity-70" style={{ color: 'var(--foreground)' }}>
                  by {book.author}
                </p>
              </div>

              {book.quote && (
                <blockquote className="border-l-2 pl-3 font-google-sans-code text-xs italic opacity-80"
                           style={{ borderColor: colorValue, color: 'var(--foreground)' }}>
                  &ldquo;{book.quote}&rdquo;
                  {book.page > 0 && <span className="ml-1 opacity-60">— p. {book.page}</span>}
                </blockquote>
              )}

              <div className="flex items-center justify-between font-google-sans-code text-xs opacity-60"
                   style={{ color: 'var(--foreground)' }}>
                <span>{book.publisher}</span>
                {book.condition && <span>Condition: {book.condition}</span>}
              </div>

              <span
                className="font-google-sans-code text-xs font-semibold"
                style={{ color: colorValue }}
              >
                View book →
              </span>
            </div>
          )}
        </button>
      ))}

      {openBookId && (
        <BookModal
          bookId={openBookId}
          isOpen={!!openBookId}
          onClose={() => setOpenBookId(null)}
        />
      )}
    </div>
  );
};

export default BookSection;
