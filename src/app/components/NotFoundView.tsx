'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import FounderCta from '../founders/components/FounderCta';
import HandDrawnArrow from './HandDrawnArrow';
import type { FounderCta as FounderCtaType } from '../constants/organization';
import type { NotFoundSuggestion } from '@/lib/not-found';

interface NotFoundViewProps {
  path: string; // The missing path ('' when the middleware didn't pass it)
  line: string; // One line from 404-errors.json, picked on the server
  suggestions: NotFoundSuggestion[];
  cta: FounderCtaType | null; // The site's one ask; null for scanner probes
}

// '/theme' -> 'theme', '/article/my_post.md' -> 'article my post'
const searchWords = (path: string) =>
  path
    .split('/')
    .map((s) => {
      try {
        return decodeURIComponent(s);
      } catch {
        return s;
      }
    })
    .join(' ')
    .replace(/\.(md|mdx|html?)$/i, '')
    .replace(/[-_.]+/g, ' ')
    .trim();

/**
 * NotFoundView - the 404 page's look and motion (data comes from the server
 * page, src/app/not-found.tsx).
 *
 * Left to right, top to bottom: a hand-circled 404, the missing path struck
 * through by hand, one line, "did you mean" rows, then the ask ("build yours",
 * with a hand-drawn arrow curving to it) and search. Every hand-drawn stroke
 * draws itself in, and the blocks rise in one after another
 * (globals.css .nf-rise / .nf-draw); reduced motion shows it all at once.
 */
export default function NotFoundView({ path, line, suggestions, cta }: NotFoundViewProps) {
  const { colorValue } = useTheme();
  const words = searchWords(path);

  // Count this 404 once it's actually shown. The server can't: it renders the
  // not-found page for every request. The ref keeps dev's Strict Mode double
  // effect to one count; keepalive lets it finish if the visitor leaves
  const counted = useRef(false);
  useEffect(() => {
    if (counted.current) return;
    counted.current = true;
    fetch('/api/not-found', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: window.location.pathname, referrer: document.referrer }),
      keepalive: true,
    }).catch(() => {});
  }, []);
  const rise = (step: number) => ({ className: 'nf-rise', style: { animationDelay: `${step * 90}ms` } });

  return (
    <div className="mx-auto w-full max-w-3xl px-6 pb-24 pt-32 text-left">
      <p {...rise(0)}>
        <span className="font-google-sans-code text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
          page missing.
        </span>
      </p>

      {/* 404, circled by hand */}
      <div {...rise(1)}>
        <h1 className="relative mt-2 inline-block px-4 font-vt323 text-8xl leading-none sm:text-9xl" style={{ color: 'var(--foreground)' }}>
          404
          <svg
            viewBox="0 0 200 100"
            preserveAspectRatio="none"
            fill="none"
            aria-hidden="true"
            className="pointer-events-none absolute -inset-x-3 -inset-y-2 h-[calc(100%+1rem)] w-[calc(100%+1.5rem)] overflow-visible"
          >
            <path
              className="nf-draw"
              style={{ animationDelay: '350ms' }}
              pathLength={1}
              d="M118 9C80 3 30 9 13 30 0 47 12 76 52 88c40 12 105 8 130-16 20-19 9-48-28-60C128 3 96 4 70 10"
              stroke={colorValue}
              strokeWidth={1.6}
              strokeLinecap="round"
            />
          </svg>
        </h1>
      </div>

      {/* The missing path, struck through by hand */}
      {path && (
        <p {...rise(2)}>
          <span className="relative mt-6 inline-block max-w-full break-all rounded-full border px-3 py-1 font-google-sans-code text-sm" style={{ borderColor: `${colorValue}40`, color: 'var(--text-muted)' }}>
            {path}
            <svg viewBox="0 0 130 12" preserveAspectRatio="none" fill="none" aria-hidden="true" className="pointer-events-none absolute inset-x-2 top-1/2 h-3 w-[calc(100%-1rem)] -translate-y-1/2 overflow-visible">
              <path
                className="nf-draw"
                style={{ animationDelay: '700ms' }}
                pathLength={1}
                d="M2 7.5c18-3.2 41 1.8 63-1.2 22-3 43 2.6 63-.8"
                stroke={colorValue}
                strokeWidth={1.4}
                strokeLinecap="round"
              />
            </svg>
          </span>
        </p>
      )}

      <p {...rise(3)}>
        <span className="mt-6 block max-w-xl font-google-sans-code text-base leading-relaxed" style={{ color: 'var(--foreground)' }}>
          {line}
        </span>
      </p>

      {/* Did you mean */}
      {suggestions.length > 0 && (
        <nav aria-label="Did you mean" {...rise(4)}>
          <div className="mt-12">
            <p className="mb-2 font-google-sans-code text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
              did you mean.
            </p>
            <ul>
              {suggestions.map((s, i) => (
                <li key={s.href}>
                  <Link
                    href={s.href}
                    className="group flex items-center gap-4 border-b py-3 transition-colors duration-200 hover:bg-[var(--background-highlight)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-color)] motion-reduce:transition-none"
                    style={{ borderColor: `${colorValue}1F` }}
                  >
                    <span className="min-w-0 flex-1">
                      <span className={`block font-google-sans-code ${i === 0 ? 'text-base' : 'text-sm'}`} style={{ color: 'var(--foreground)' }}>
                        {s.label}
                      </span>
                      <span className="block truncate font-google-sans-code text-xs" style={{ color: 'var(--text-muted)' }}>
                        {s.href}
                      </span>
                    </span>
                    <HandDrawnArrow className="h-5 w-8 shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      )}

      {/* The ask */}
      {cta && (
        <section aria-label={cta.label} {...rise(5)}>
          <div className="mt-14 max-w-xl">
            {cta.pitch && (
              <p className="font-google-sans-code text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                {cta.pitch}
              </p>
            )}
            <div className="mt-4 flex items-end gap-3">
              <svg viewBox="0 0 48 40" fill="none" aria-hidden="true" className="mb-1 h-10 w-12 shrink-0 overflow-visible" stroke={colorValue} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                <path className="nf-draw" style={{ animationDelay: '1100ms' }} pathLength={1} d="M4 3c-1.6 10.5 2.2 21.4 12.4 27.4 6.6 3.9 15 5.1 24.6 4" />
                <path className="nf-draw" style={{ animationDelay: '1500ms' }} pathLength={1} d="M35.2 28.3c2.3 2.2 4.4 4 6.4 6.1-2.6 1.4-5.2 2.4-7.6 3.9" />
              </svg>
              <FounderCta cta={cta} placement="404" />
            </div>
          </div>
        </section>
      )}

      {/* Search, already searching for the missing path's words */}
      <p {...rise(6)}>
        <span className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 font-google-sans-code text-sm">
          {words && (
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('openGlobalSearch', { detail: { query: words } }))}
              className="underline decoration-dotted underline-offset-4 transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-color)]"
              style={{ color: colorValue }}
            >
              search for “{words}”
            </button>
          )}
          <Link
            href="/"
            className="underline decoration-dotted underline-offset-4 transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-color)]"
            style={{ color: 'var(--text-muted)' }}
          >
            go home
          </Link>
        </span>
      </p>
    </div>
  );
}
