'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../contexts/ThemeContext';
import Badge from './Badge';
import SpaceDemo from './space-demo/SpaceDemo';
import type { WidgetConfig } from './widgetRegistry';

interface WidgetPanelProps {
  widget: WidgetConfig;
  onClose: () => void;
  // Where the visitor was heading, for a space demo's sign-in
  next?: string | null;
}

const WidgetPanel = ({ widget, onClose, next }: WidgetPanelProps) => {
  const { colorValue } = useTheme();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-end sm:p-4">
      {/* Panel — full-height sheet on mobile, anchored card on ≥sm */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={widget.label}
        className="widget-panel-enter vh-card-elevated relative flex h-[calc(100dvh-4rem)] w-full flex-col rounded-t-2xl border pb-[env(safe-area-inset-bottom)] sm:h-[600px] sm:max-h-[80vh] sm:max-w-md sm:rounded-xl sm:pb-0"
        style={{
          borderColor: `${colorValue}40`,
          backgroundColor: 'var(--background)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between border-b px-4 py-3"
          style={{ borderColor: `${colorValue}30` }}
        >
          <Badge style={{ color: colorValue }}>
            {widget.label}
          </Badge>

          <button
            ref={closeButtonRef}
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
            aria-label={`Close ${widget.label}`}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* A space's demo (party, admin) for a visitor who can't open it yet,
            or an outside app's iframe; either fills the remaining height */}
        {widget.kind === 'space' ? (
          <SpaceDemo space={widget} next={next ?? widget.href} />
        ) : (
          <iframe
            src={widget.src}
            className="min-h-0 w-full flex-1 rounded-b-xl border-0"
            title={widget.title}
          />
        )}
      </div>

      {/* Transparent backdrop — click outside to close */}
      <div
        className="absolute inset-0 -z-10"
        onClick={onClose}
        aria-hidden="true"
      />
    </div>,
    document.body
  );
};

export default WidgetPanel;
