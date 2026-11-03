// components/Modal.tsx
'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ModalContext } from '../context/ModalContext';
import { useTheme } from '../contexts/ThemeContext';
import { useHydrated } from '@/hooks/useHydrated';

type ModalProps = {
  isOpen: boolean;
  onCloseAction: () => void;
  children: React.ReactNode;
  variant?: 'default' | 'wide' | 'tall';
};

export default function Modal({ isOpen, onCloseAction, children, variant = 'default' }: ModalProps) {
  const { colorValue } = useTheme();
  const mounted = useHydrated();

  // ESC key & body scroll management
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseAction();
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
  }, [isOpen, onCloseAction]);

  // Layout styles based on variant — every variant is height-bounded and
  // internally scrollable so content taller than the viewport (tables,
  // long lists) never overflows past the fixed overlay.
  const layoutClass = {
    default: 'max-w-lg max-h-[90vh] overflow-y-auto',
    wide: 'max-w-4xl max-h-[90vh] overflow-y-auto',
    tall: 'max-w-3xl max-h-[90vh] overflow-y-auto',
  }[variant];

  // Don't render during SSR or when modal is closed
  if (!isOpen || !mounted) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-sm" 
      style={{ backgroundColor: 'var(--background)' }}
      onClick={onCloseAction}
    >
      {/* Modal Content */}
      <div
        className={`animate-in fade-in slide-in-from-bottom-4 vh-card-elevated relative w-full rounded-xl border p-6 duration-200 ${layoutClass}`}
        style={{ 
          borderColor: `${colorValue}40`,
          backgroundColor: 'var(--background)'
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          onClick={onCloseAction}
          className="absolute right-4 top-3 flex size-10 items-center justify-center rounded-lg transition-colors"
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
          <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <ModalContext.Provider value={true}>
          {children}
        </ModalContext.Provider>
      </div>
    </div>,
    document.body
  );
}
