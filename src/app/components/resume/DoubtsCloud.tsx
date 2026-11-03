'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useUser } from '@/lib/auth-stub.client';
import { useTheme } from '../../contexts/ThemeContext';
import InkStage from '../ink/InkStage';
import { InkWord } from '../ink/primitives';
import { InkCircle } from '../depend/ink';
import type { DoubtReferences } from '@/lib/doubt-references';

const MIN_PX = 16;
const MAX_PX = 48;
const LABEL = 'font-google-sans-code text-[10px] uppercase tracking-wide text-[var(--text-muted)]';

/** A text fragment link: the browser scrolls to the phrase and highlights it */
const toPhrase = (href: string, doubt: string) => `${href}#:~:text=${encodeURIComponent(doubt)}`;

// A steady place for each doubt, so the field reads as a cloud, not a ranking
const scatter = (word: string) => [...word].reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 7);

/**
 * DoubtsCloud - the founder's doubts (src/lib/doubts.ts), as a cloud in ink:
 * each struck through, sized by how often it surfaces in their published
 * stories and articles. Tap one and its pieces open below, each a link
 * straight to the phrase in that piece. A doubt not found in the writing sits
 * small and faint.
 *
 * Only the founder sees it: for anyone not signed in as an admin it renders
 * nothing and asks for nothing (doubts are private; /api/admin/doubts is admin
 * only). On /founders it sits under WORDS.: what you keep saying, then what
 * you've said you doubt.
 */
export default function DoubtsCloud() {
  const { colorValue } = useTheme();
  const { user, isLoaded } = useUser();
  const isFounder = user?.publicMetadata?.role === 'admin';
  const [doubts, setDoubts] = useState<DoubtReferences[] | null>(null);
  const [chosen, setChosen] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !isFounder) return;
    let cancelled = false;
    fetch('/api/admin/doubts')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => !cancelled && setDoubts(data?.doubts ?? []))
      .catch(() => !cancelled && setDoubts([]));
    return () => {
      cancelled = true;
    };
  }, [isLoaded, isFounder]);

  const field = useMemo(() => {
    const list = doubts ?? [];
    const max = Math.max(1, ...list.map((d) => d.count));
    return list
      .map((d, rank) => {
        const weight = d.count === 0 ? 0 : Math.sqrt(d.count) / Math.sqrt(max);
        return { ...d, rank, weight, size: Math.round(MIN_PX + weight * (MAX_PX - MIN_PX)) };
      })
      .sort((a, b) => scatter(a.doubt) - scatter(b.doubt));
  }, [doubts]);

  if (!isFounder || doubts === null) return null;
  const open = doubts.find((d) => d.doubt === chosen);

  return (
    <section aria-label="Your doubts" className="mt-14">
      <div className="mb-6 flex items-baseline gap-3">
        <h3 className="font-vt323 text-3xl text-[var(--foreground)]">your doubts.</h3>
        <span className={LABEL}>only you see this</span>
      </div>

      {doubts.length === 0 ? (
        <p className="max-w-xl font-space-grotesk text-sm text-[var(--text-muted)]">
          no doubts yet. write some down and delete them in{' '}
          <Link href="/theunpartyunppp" className="underline decoration-dotted underline-offset-4 hover:text-[var(--foreground)]">delete your doubts</Link>
          , or add them in{' '}
          <Link href="/admin" className="underline decoration-dotted underline-offset-4 hover:text-[var(--foreground)]">/admin</Link>
          . each one shows here with every place it turns up in your writing.
        </p>
      ) : (
        <>
          <InkStage>
            <ul className="flex flex-wrap items-baseline gap-x-6 gap-y-2" aria-label="Your doubts, by how often they appear in your writing">
              {field.map((entry) => (
                <li key={entry.doubt}>
                  <InkWord beat={entry.rank * 0.35} className="relative font-vt323 leading-none">
                    <button
                      type="button"
                      onClick={() => setChosen(chosen === entry.doubt ? null : entry.doubt)}
                      aria-pressed={chosen === entry.doubt}
                      aria-label={`${entry.doubt}: ${entry.count === 0 ? 'not in your writing' : `${entry.count} times in ${entry.pieces.length} ${entry.pieces.length === 1 ? 'piece' : 'pieces'}`}`}
                      className="relative rounded px-1 outline-none transition-opacity focus-visible:ring-2"
                      style={{
                        fontSize: `${entry.size}px`,
                        color: entry.count === 0 ? 'var(--text-muted)' : 'var(--foreground)',
                        opacity: entry.count === 0 ? 0.5 : 0.65 + entry.weight * 0.35,
                        textDecoration: 'line-through',
                        textDecorationColor: colorValue,
                        textDecorationThickness: entry.count === 0 ? 1 : 2,
                      }}
                    >
                      {chosen === entry.doubt && <InkCircle key={entry.doubt} color={colorValue} className="absolute -inset-x-3 -inset-y-1" />}
                      {entry.doubt}
                    </button>
                  </InkWord>
                </li>
              ))}
            </ul>
          </InkStage>

          {open && (
            <div className="mt-8 max-w-2xl border-t pt-4" style={{ borderColor: `${colorValue}33` }}>
              <p className={LABEL}>
                {open.count === 0
                  ? `"${open.doubt}" isn't in your writing`
                  : `"${open.doubt}" · ${open.count} ${open.count === 1 ? 'time' : 'times'} in ${open.pieces.length} ${open.pieces.length === 1 ? 'piece' : 'pieces'}`}
              </p>
              <ul className="mt-2">
                {open.pieces.map((piece) => (
                  <li key={piece.href} className="border-b py-3" style={{ borderColor: `${colorValue}20` }}>
                    <a href={toPhrase(piece.href, open.doubt)} className="group flex items-start gap-4">
                      <span className="min-w-0 flex-1">
                        <span className="block font-vt323 text-xl leading-none text-[var(--foreground)] group-hover:text-[var(--theme-color)]">{piece.title}</span>
                        <span className="mt-1 block font-space-grotesk text-xs text-[var(--text-muted)]">{piece.snippet}</span>
                      </span>
                      <span className={LABEL}>{piece.count}×</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  );
}
