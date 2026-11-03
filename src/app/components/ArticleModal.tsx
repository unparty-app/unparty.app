'use client';

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import Article from './Article';
import { useTheme } from '../contexts/ThemeContext';

interface ArticleModalProps {
  slug: string;
  title: string;
  isOpen: boolean;
  onClose: () => void;
}

const ArticleModal: React.FC<ArticleModalProps> = ({ slug, title, isOpen, onClose }) => {
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

  return createPortal(
    <div 
      className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto p-4 backdrop-blur-sm" 
      style={{ backgroundColor: 'var(--background)' }}
    >
      <div 
        className="animate-in fade-in slide-in-from-top-4 vh-card-elevated my-8 w-full max-w-4xl rounded-xl border duration-200"
        style={{ 
          borderColor: `${colorValue}40`,
          backgroundColor: 'var(--background)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b p-6"
             style={{ borderColor: `${colorValue}30` }}>
          <h2 className="font-google-sans-code text-lg font-bold" style={{ color: colorValue }}>
            {title}
          </h2>
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
            aria-label="Close article"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Modal Content */}
        <div className="max-h-[80vh] overflow-y-auto">
          <Article slug={slug} className="p-0" />
        </div>
      </div>
      
      {/* Click outside to close */}
      <div 
        className="absolute inset-0 -z-10" 
        onClick={onClose}
        aria-label="Close article modal"
      />
    </div>,
    document.body
  );
};

export default ArticleModal;