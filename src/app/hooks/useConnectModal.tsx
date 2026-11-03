'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { track } from '@vercel/analytics';
import Chat from '../components/Chat';
import AuthorAvatar from '../components/editorial/AuthorAvatar';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Connect modal, usable from anywhere (the header's trigger, a page's "Send
 * Feedback" button, etc. - each call site gets its own instance). Embeds
 * <Chat> (which posts to /api/chat/send → Slack); Chat suppresses its own
 * success modal when given onClose, so the sent state renders an in-modal
 * confirmation instead of snapping shut. Pass a string to openModal() to tag
 * the Slack message with where it came from.
 */
export const useConnectModal = () => {
  const { colorValue } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [context, setContext] = useState<string | undefined>(undefined);

  // context (e.g. "Feedback from /color") is forwarded to Chat -> Slack so
  // callers (a page's "Send Feedback" button, the header's connect trigger,
  // etc.) can tag where a message came from without changing the form itself.
  const openModal = useCallback((ctx?: string) => {
    setSent(false);
    setContext(ctx);
    setIsOpen(true);
    // Funnel signal: did visitors even open the connect modal? (Consent-gated
    // by AnalyticsGate — a no-op when Vercel Analytics isn't mounted.)
    track('connect_modal_opened', { context: ctx ?? 'direct' });
  }, []);

  const closeModal = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
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
  }, [isOpen]);

  const ConnectModal = isOpen
    ? createPortal(
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-sm"
          style={{ backgroundColor: 'var(--background)' }}
          role="dialog"
          aria-modal="true"
          aria-label="Send us a message"
        >
          <div
            className="animate-in fade-in slide-in-from-bottom-4 vh-card-elevated max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border duration-200 sm:max-w-xl"
            style={{
              borderColor: `${colorValue}40`,
              backgroundColor: 'var(--background)',
            }}
            onClick={(e) => e.stopPropagation()}
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
                CONNECT
              </span>
              <button
                onClick={closeModal}
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
                aria-label="Close modal"
              >
                <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="space-y-4 p-6">
              {sent ? (
                <div className="flex flex-col items-start gap-4 py-4">
                  <h2
                    className="font-vt323 text-3xl font-bold leading-tight tracking-tight"
                    style={{ color: colorValue }}
                  >
                    MESSAGE SENT.
                  </h2>
                  <p className="font-vt323 text-sm" style={{ color: 'var(--text-muted)' }}>
                    connect soon!
                  </p>
                  <button
                    onClick={closeModal}
                    className="rounded-lg px-6 py-2 font-google-sans-code text-sm font-bold transition-transform hover:scale-[1.02] active:scale-[0.98]"
                    style={{ backgroundColor: colorValue, color: 'var(--background)' }}
                  >
                    bye.
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <div
                      className="shrink-0 overflow-hidden rounded-full p-1 shadow-sm"
                      style={{ backgroundColor: 'var(--background)' }}
                    >
                      <div
                        className="size-12 overflow-hidden rounded-full border-2 transition-transform duration-200 hover:scale-105"
                        style={{ borderColor: colorValue }}
                      >
                        <AuthorAvatar src="/covers/cover-001.png" alt="" />
                      </div>
                    </div>
                    <h2
                      className="font-vt323 text-2xl font-bold leading-tight tracking-tight"
                      style={{ color: colorValue }}
                    >
                      HELLO!
                    </h2>
                  </div>
                  <p className="font-vt323 text-sm" style={{ color: 'var(--text-muted)' }}>
                    Send me a &quot;hello&quot; and I will get back with you.
                  </p>
                  <Chat onClose={() => setSent(true)} context={context} />
                </>
              )}
            </div>
          </div>

          {/* Click outside to close */}
          <div
            className="absolute inset-0 -z-10"
            onClick={closeModal}
            aria-label="Close connect modal"
          />
        </div>,
        document.body
      )
    : null;

  return { isOpen, openModal, closeModal, ConnectModal };
};
