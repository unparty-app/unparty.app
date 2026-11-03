'use client';

import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { wordsOf } from '@/lib/words';
import InkStage from './ink/InkStage';
import { InkWord } from './ink/primitives';
import { InkUnderline } from './depend/ink';
import type { WordCount } from './resume/types';

/**
 * YourWords - what you keep coming back to, next to what this site does.
 *
 * The site's own most used words (/api/words: each copy counts its own
 * published stories and articles) sit faint in one ink field. As the visitor
 * writes, their words rise into the same field, and the ones the site also
 * keeps using light up in the theme color, with one line naming them. The
 * visitor's words are counted in the browser (src/lib/words.ts, the same
 * rules as the site's) and never sent anywhere.
 */

const PROMPT = 'what\'s your focus?';
// The prompt's own words echo back in answers ("i keep coming back to..."): not yours
const PROMPT_WORDS = new Set(wordsOf(PROMPT));
const SITE_SHOWN = 30;
const YOURS_SHOWN = 24;
const MIN_PX = 16;
const MAX_PX = 56;

// A steady place for each word, so the field reads as a cloud, not a ranking
const scatter = (word: string) => [...word].reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 7);

const list = (words: string[]) =>
  words.length < 2 ? words[0] ?? '' : `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;

/** This copy's own most used words (/api/words), empty until they load */
export function useSiteWords(): WordCount[] {
  return useSiteCloud().words;
}

/** The same, and whether they've loaded: an empty cloud is a copy with nothing written yet */
export function useSiteCloud(): { words: WordCount[]; loaded: boolean } {
  const [cloud, setCloud] = useState<{ words: WordCount[]; loaded: boolean }>({ words: [], loaded: false });
  useEffect(() => {
    let cancelled = false;
    fetch('/api/words?from=both&limit=200')
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!cancelled) setCloud({ words: data?.words ?? [], loaded: true });
      })
      .catch(() => {
        if (!cancelled) setCloud({ words: [], loaded: true });
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return cloud;
}

export type FieldEntry = { word: string; weight: number; kind: 'site' | 'yours' | 'both'; size: number };

/**
 * The site's top words and the visitor's, one entry a word, each sized within
 * its own side, and up to three of the visitor's that the site also uses.
 * `skip` leaves out words a prompt put in their mouth
 */
export function wordField(site: WordCount[], text: string, skip: Set<string> = PROMPT_WORDS, siteShown = SITE_SHOWN): { field: FieldEntry[]; shared: string[] } {
  const siteCounts = new Map(site.map((w) => [w.word, w.count]));
  const yours = new Map<string, number>();
  for (const word of wordsOf(text)) if (!skip.has(word)) yours.set(word, (yours.get(word) ?? 0) + 1);
  const yourTop = [...yours.entries()].sort((a, b) => b[1] - a[1]).slice(0, YOURS_SHOWN);
  const shared = yourTop.filter(([word]) => siteCounts.has(word)).map(([word]) => word);

  const siteMax = Math.sqrt(site[0]?.count ?? 1);
  const yourMax = Math.sqrt(yourTop[0]?.[1] ?? 1);
  const entries = new Map<string, Omit<FieldEntry, 'size'>>();
  for (const { word, count } of site.slice(0, siteShown)) entries.set(word, { word, weight: Math.sqrt(count) / siteMax, kind: 'site' });
  for (const [word, count] of yourTop) {
    const weight = Math.sqrt(count) / yourMax;
    const kind = siteCounts.has(word) ? 'both' : 'yours';
    entries.set(word, { word, weight: Math.max(weight, entries.get(word)?.weight ?? 0), kind });
  }
  const field = [...entries.values()]
    .map((entry) => ({ ...entry, size: Math.round(MIN_PX + entry.weight * (MAX_PX - MIN_PX)) }))
    .sort((a, b) => scatter(a.word) - scatter(b.word));
  return { field, shared: shared.slice(0, 3) };
}

/** The ink field: the site's words faint, the visitor's in ink, shared ones in the theme color */
export function WordField({ field, writing, label, className = '' }: { field: FieldEntry[]; writing: boolean; label: string; className?: string }) {
  const { colorValue } = useTheme();
  return (
    <InkStage className={className}>
      <ul className="flex flex-wrap items-baseline gap-x-5 gap-y-1" aria-label={label}>
        {field.map((entry, index) => (
          <li key={entry.word}>
            <InkWord
              beat={entry.kind === 'site' ? index * 0.2 : 0}
              className="font-vt323 leading-none transition-colors duration-300"
              style={{
                fontSize: `${entry.size}px`,
                color: entry.kind === 'both' ? colorValue : entry.kind === 'yours' ? 'var(--foreground)' : 'var(--text-muted)',
                opacity: entry.kind === 'site' ? (writing ? 0.3 : 0.45 + entry.weight * 0.4) : 1,
              }}
            >
              {entry.word}
            </InkWord>
          </li>
        ))}
      </ul>
    </InkStage>
  );
}

/** One line naming the words two sides share: "a, b and c" */
export const listWords = list;

export default function YourWords() {
  const { colorValue } = useTheme();
  const site = useSiteWords();
  const [text, setText] = useState('');
  const typed = useDeferredValue(text);
  const { field, shared } = useMemo(() => wordField(site, typed), [site, typed]);

  const writing = typed.trim().length > 0;

  return (
    <div className="my-12 w-screen mx-[calc(50%-50vw)] px-4 py-12 text-left sm:px-6 lg:px-12" style={{ backgroundColor: `${colorValue}08` }}>
      <div className="mx-auto max-w-3xl">
        <label className="relative block">
          <span className="sr-only">what do you keep focusing on?</span>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder={PROMPT}
            className="w-full resize-none bg-transparent font-space-grotesk text-base leading-relaxed text-[var(--foreground)] outline-none placeholder:text-[var(--text-muted)] md:text-lg"
          />
          <InkUnderline color={colorValue} className="pointer-events-none absolute -bottom-1 left-0 h-2.5 w-2/3" />
        </label>

        <p className="mt-6 min-h-[1.5rem] font-space-grotesk text-sm leading-relaxed text-[var(--foreground)] md:text-base" role="status">
          {!writing ? (
            <span className="text-[var(--text-muted)]">what this build is focusing on.</span>
          ) : shared.length > 0 ? (
            <>
              you and this site both keep coming back to <span style={{ color: colorValue }}>{list(shared)}</span>.
            </>
          ) : (
            <>none of these are here yet. maybe that’s what you build.</>
          )}
        </p>

        <WordField field={field} writing={writing} label="your words and this site's" className="mt-6" />
      </div>
    </div>
  );
}
