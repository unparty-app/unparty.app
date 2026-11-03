'use client';

import React, { useEffect } from 'react';
import { useFetch } from '@/hooks/useFetch';
import { createPortal } from 'react-dom';
import { useTheme } from '../contexts/ThemeContext';

interface Book {
  id: string;
  title: string;
  author: string;
  quote: string;
  page: number;
  publisher: string;
  publisherLink: string;
}

interface BookModalProps {
  bookId: string;
  isOpen: boolean;
  onClose: () => void;
}

const BookModal: React.FC<BookModalProps> = ({ bookId, isOpen, onClose }) => {
  const { colorValue } = useTheme();
  const { data, loading } = useFetch<Book>(isOpen ? `/api/book/${bookId}` : null);
  const book = data ?? null;

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-sm"
      style={{ backgroundColor: 'var(--background)' }}
    >
      <div
        className="animate-in fade-in slide-in-from-bottom-4 vh-card-elevated w-full max-w-lg rounded-xl border-2 duration-200"
        style={{
          borderColor: colorValue,
          backgroundColor: 'var(--background)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b p-6" style={{ borderColor: `${colorValue}30` }}>
          <div>
            <h2 className="font-google-sans-code text-xl font-bold" style={{ color: colorValue }}>
              {loading ? 'Thinking…' : book?.title || 'Book not found'}
            </h2>
            {book?.author && (
              <p className="mt-1 font-google-sans-code text-sm" style={{ color: 'var(--text-muted)' }}>
                by {book.author}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-lg transition-colors"
            style={{ color: 'var(--text-muted)', backgroundColor: 'transparent' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--background-highlight)';
              e.currentTarget.style.color = 'var(--foreground)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
            aria-label="Close book citation"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {!loading && book?.quote && (
            <blockquote className="mb-4">
              <p
                className="font-vt323 text-xl uppercase leading-relaxed"
                style={{ color: colorValue }}
              >
                &ldquo;{book.quote}&rdquo;
              </p>
              {book.page > 0 && (
                <cite className="mt-2 block font-google-sans-code text-xs not-italic" style={{ color: 'var(--text-muted)' }}>
                  — page {book.page}
                </cite>
              )}
            </blockquote>
          )}

          {!loading && !book?.quote && book && (
            <p className="font-google-sans-code text-sm" style={{ color: 'var(--text-muted)' }}>
              Cited as inspiration behind unparty.
            </p>
          )}

          {!loading && book?.publisher && (
            <p className="font-google-sans-code text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
              {book.publisher}
            </p>
          )}
        </div>

        {/* Footer */}
        {!loading && book?.publisherLink && (
          <div className="border-t p-4" style={{ borderColor: `${colorValue}20` }}>
            <a
              href={book.publisherLink}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-lg px-4 py-2 text-center font-google-sans-code text-sm font-semibold transition-transform hover:scale-[1.02]"
              style={{ backgroundColor: colorValue, color: 'var(--background)' }}
            >
              Where I bought it →
            </a>
          </div>
        )}
      </div>

      {/* Click outside to close */}
      <div className="absolute inset-0 -z-10" onClick={onClose} aria-label="Close book citation" />
    </div>,
    document.body
  );
};

export default BookModal;
