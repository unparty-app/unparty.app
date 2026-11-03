'use client';

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import HandDrawnArrow from './HandDrawnArrow';
import { useTheme } from '../contexts/ThemeContext';
import { getKeywordDefinition, getKeywordLink, getKeywordMentionCount } from '../utils/keywordDetection';

interface KeywordModalProps {
  keyword: string;
  isOpen: boolean;
  onClose: () => void;
}

const KeywordModal: React.FC<KeywordModalProps> = ({ keyword, isOpen, onClose }) => {
  const { colorValue } = useTheme();

  // ESC key & body scroll management
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

  const definition = getKeywordDefinition(keyword);
  const mentionCount = getKeywordMentionCount(keyword);
  const link = getKeywordLink(keyword);

  // Extract the grammatical marker (n), (v), etc.
  const markerMatch = keyword.match(/\(([^)]+)\)$/);
  const marker = markerMatch ? markerMatch[1].toUpperCase() : '';
  const cleanTerm = keyword.replace(/\s*\([^)]+\)\s*$/g, '');

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
        <div className="flex items-center justify-between border-b p-6"
             style={{ borderColor: `${colorValue}30` }}>
          <div className="flex items-center gap-3">
            <h2 className="font-google-sans-code text-2xl font-bold" style={{ color: colorValue }}>
              {cleanTerm}
            </h2>
            {marker && (
              <span 
                className="rounded-full px-3 py-1 font-google-sans-code text-xs font-bold"
                style={{ 
                  backgroundColor: `${colorValue}20`,
                  color: colorValue
                }}
              >
                {marker}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-10 h-10 rounded-lg transition-colors"
            style={{ 
              color: 'var(--text-muted)',
              backgroundColor: 'transparent'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--background-highlight)';
              e.currentTarget.style.color = 'var(--foreground)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
            aria-label="Close keyword definition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Modal Content */}
        <div className="p-6">
          <p
            className="font-google-sans-code text-base leading-relaxed"
            style={{ color: 'var(--foreground)' }}
          >
            {definition}
          </p>
          {/* A keyword with a page of its own links there (KeywordsConfig.json "links") */}
          {link && (
            <Link
              href={link.href}
              onClick={onClose}
              className="group mt-5 inline-flex items-center gap-2 font-vt323 text-xl"
              style={{ color: colorValue }}
            >
              {link.label}
              <HandDrawnArrow className="h-5 w-8" />
            </Link>
          )}
          {mentionCount !== null && (
            <p
              className="mt-4 font-google-sans-code text-xs uppercase tracking-wide"
              style={{ color: 'var(--text-muted)' }}
            >
              Mentioned <span className="font-vt323 text-sm" style={{ color: colorValue }}>{mentionCount}</span> {mentionCount === 1 ? 'time' : 'times'} across articles and stories.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4" style={{ borderColor: `${colorValue}20` }}>
          <p 
            className="text-center font-google-sans-code text-xs"
            style={{ color: 'var(--text-muted)' }}
          >
            TAP. anywhere outside to close
          </p>
        </div>
      </div>

      {/* Click outside to close */}
      <div 
        className="absolute inset-0 -z-10" 
        onClick={onClose}
        aria-label="Close keyword modal"
      />
    </div>,
    document.body
  );
};

export default KeywordModal;
