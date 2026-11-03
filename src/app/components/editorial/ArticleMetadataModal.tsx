'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { EditorialArticle as EditorialArticleType } from '../../constants/editorial-articles';
import { parseMarkdownText } from '../../utils/textParsing';

interface ArticleMetadataModalProps {
  article: EditorialArticleType;
  createdLabel: string | null;
  updatedLabel: string | null;
  colorValue: string;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Same tap-to-preview pattern as CoverPreviewModal.tsx (used by CoverPhoto/
 * PhotoGallery when tapping a cover image) — here surfaced for the header's
 * subtitle/dates, which truncate in the compact byline row. Shows the full,
 * untruncated title, subtitle, category, author, and dates.
 */
const ArticleMetadataModal: React.FC<ArticleMetadataModalProps> = ({
  article,
  createdLabel,
  updatedLabel,
  colorValue,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-sm"
      style={{ backgroundColor: 'var(--background)' }}
    >
      <div
        className="animate-in fade-in slide-in-from-bottom-4 vh-card-elevated w-full max-w-lg rounded-xl border duration-200"
        style={{
          borderColor: `${colorValue}40`,
          backgroundColor: 'var(--background)',
        }}
      >
        {/* Modal Header */}
        <div
          className="flex items-center justify-between border-b p-4"
          style={{ borderColor: `${colorValue}30` }}
        >
          <span
            className="inline-block rounded-full border px-3 py-1 font-vt323 text-xs font-bold uppercase tracking-wide"
            style={{
              backgroundColor: `${colorValue}20`,
              borderColor: `${colorValue}40`,
              color: colorValue,
            }}
          >
            {article.category}
          </span>
          <button
            onClick={onClose}
            className="rounded-lg p-2 transition-colors"
            style={{ color: 'var(--text-muted)', backgroundColor: 'transparent' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--background-highlight)';
              e.currentTarget.style.color = 'var(--foreground)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
            aria-label="Close article details"
          >
            <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Details */}
        <div className="space-y-4 p-6">
          <h2
            className="font-vt323 text-2xl font-bold leading-tight tracking-tight"
            style={{ color: colorValue }}
          >
            {article.title}
          </h2>

          {article.subtitle && (
            <p
              className="font-google-sans-code text-sm leading-relaxed"
              style={{ color: 'var(--foreground)' }}
              dangerouslySetInnerHTML={{ __html: parseMarkdownText(article.subtitle) }}
            />
          )}

          {(createdLabel || updatedLabel) && (
            <div
              className="flex flex-wrap items-center gap-3 border-t pt-3 font-google-sans-code text-xs"
              style={{ borderColor: `${colorValue}20`, color: 'var(--text-muted)' }}
            >
              {createdLabel && <span>{createdLabel}</span>}
              {updatedLabel && <span>updated {updatedLabel}</span>}
            </div>
          )}

          <div
            className="flex items-center justify-between border-t pt-3"
            style={{ borderColor: `${colorValue}10` }}
          >
            <span className="font-google-sans-code text-xs" style={{ color: 'var(--text-muted)' }}>
              BUILDER.
            </span>
            <span className="font-google-sans-code text-sm font-bold" style={{ color: 'var(--foreground)' }}>
              {article.author}
            </span>
          </div>
        </div>
      </div>

      {/* Click outside to close */}
      <div
        className="absolute inset-0 -z-10"
        onClick={onClose}
        aria-label="Close article details modal"
      />
    </div>,
    document.body
  );
};

export default ArticleMetadataModal;
