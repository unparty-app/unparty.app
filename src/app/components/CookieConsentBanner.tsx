'use client';

import Link from 'next/link';
import { useTheme } from '../contexts/ThemeContext';
import { useAnalyticsConsent } from '../contexts/AnalyticsConsentContext';
import { CLERK_ON } from '@/lib/clerk-on';

/**
 * Lightweight first-visit cookie notice. Shown until the visitor accepts or
 * rejects analytics cookies (Google Analytics + Vercel Analytics/Speed
 * Insights) — the choice is persisted by AnalyticsConsentContext so it only
 * prompts once. Essential Clerk session cookies are not gated and stay on.
 * Mounted at layout level (outside .page-transition-wrapper) so `fixed`
 * anchors to the viewport without needing a portal.
 */
export default function CookieConsentBanner() {
  const { colorValue } = useTheme();
  const { isBannerOpen, setConsent } = useAnalyticsConsent();

  if (!isBannerOpen) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-description"
      className="fixed inset-x-4 bottom-4 z-[60] rounded-2xl border bg-[var(--background)] p-4 shadow-lg backdrop-blur-sm sm:inset-x-auto sm:bottom-6 sm:left-6 sm:max-w-sm sm:p-5"
      style={{ borderColor: `${colorValue}66` }}
    >
      <span
        id="cookie-consent-title"
        className="w-fit rounded-full border px-2.5 py-1 font-vt323 text-xs font-bold uppercase tracking-wide"
        style={{
          color: colorValue,
          borderColor: colorValue,
          backgroundColor: `${colorValue}20`,
        }}
      >
        APP. COOKIES.
      </span>
      <p
        id="cookie-consent-description"
        className="mt-3 font-google-sans-code text-xs leading-relaxed"
        style={{ color: 'var(--text-muted)' }}
      >
        We use {process.env.NEXT_PUBLIC_GA_ID ? 'Google Analytics and ' : ''}Vercel Analytics to understand aggregate
        usage. {process.env.NEXT_PUBLIC_GA_ID ? 'They only run' : 'It only runs'} if you accept.{CLERK_ON ? ' Essential sign-in cookies are always on.' : ''} See our{' '}
        <Link href="/privacy" className="underline transition-opacity hover:opacity-80" style={{ color: colorValue }}>
          privacy policy
        </Link>
        .
      </p>
      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={() => setConsent('denied')}
          className="flex-1 rounded-full border px-4 py-2 font-vt323 text-sm font-bold uppercase tracking-wide transition-transform duration-200 hover:scale-105"
          style={{ borderColor: `${colorValue}66`, color: 'var(--text-muted)' }}
        >
          Reject
        </button>
        <button
          onClick={() => setConsent('granted')}
          className="flex-1 rounded-full px-4 py-2 font-vt323 text-sm font-bold uppercase tracking-wide text-white transition-transform duration-200 hover:scale-105"
          style={{ backgroundColor: colorValue }}
        >
          Accept
        </button>
      </div>
    </div>
  );
}
