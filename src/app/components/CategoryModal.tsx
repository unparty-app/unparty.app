'use client';

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import PhotoGallery from './PhotoGallery';
import { useTheme } from '../contexts/ThemeContext';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: string;
  categoryLabel: string;
  covers: string[]; // Array of cover filenames
}

const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  categoryLabel,
  covers
}) => {
  const { colorValue } = useTheme();

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      // Prevent body scroll when modal is open
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
      {/* Modal Content */}
      <div 
        className="animate-in fade-in slide-in-from-bottom-4 vh-card-elevated relative w-full max-w-7xl max-h-[90vh] overflow-y-auto rounded-xl border duration-200"
        style={{ 
          borderColor: `${colorValue}40`,
          backgroundColor: 'var(--background)'
        }}
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        {/* Header */}
        <div 
          className="border-b px-6 py-4"
          style={{ borderColor: `${colorValue}30` }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 
                className="font-google-sans-code text-2xl font-bold uppercase tracking-tight"
                style={{ color: colorValue }}
              >
                {categoryLabel}
              </h2>
              <p 
                className="font-google-sans-code text-sm mt-1"
                style={{ color: 'var(--text-muted)' }}
              >
                <span className="font-vt323 text-base">{covers.length}</span> {covers.length === 1 ? 'cover' : 'covers'}
              </p>
            </div>
            
            {/* Close Button */}
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
              aria-label="Close modal"
            >
              <svg 
                className="w-5 h-5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M6 18L18 6M6 6l12 12" 
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Gallery Content */}
        <div className="p-6">
          {covers.length > 0 ? (
            <PhotoGallery 
              images={covers}
              basePath="/covers"
              alt={`${categoryLabel} cover`}
              aspectRatio="16:9"
              enableStories={true}
            />
          ) : (
            <div className="py-20 text-center">
              <p 
                className="font-google-sans-code text-sm"
                style={{ color: 'var(--text-muted)' }}
              >
                👾 No covers in this category yet.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close */}
      <div 
        className="absolute inset-0 -z-10" 
        onClick={onClose}
        aria-label="Close category modal"
      />
    </div>,
    document.body
  );
};

export default CategoryModal;
