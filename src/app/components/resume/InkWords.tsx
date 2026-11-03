'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import InkStage from '../ink/InkStage';
import { InkWord } from '../ink/primitives';
import { InkCircle } from '../depend/ink';
import type { FieldEntry } from '../YourWords';
import type { WordCount, WordSource } from './types';

const SOURCES: WordSource[] = ['stories', 'articles', 'both'];
const MIN_PX = 15;
const MAX_PX = 64;

interface InkWordsProps {
  words?: WordCount[]; // The first list, counted on the server; fetched when missing
  from?: WordSource; // Which writing `words` counts (both by default)
  limit?: number; // How many words to show (40 by default)
  filter?: boolean; // Show the stories / articles / both switch (on by default)
  // Picking words (the worksheet's answers, the tag step): with onToggle each
  // word is a button, ringed in ink once picked, and up to `max` can be
  selected?: string[];
  onToggle?: (word: string) => void;
  max?: number;
  tags?: Record<string, string>; // A word's kind of build, shown beside it (#389)
  // A field already sized and sorted (wordField): someone's own words among the
  // site's, in place of the site's alone (#265). Nothing is fetched
  field?: FieldEntry[];
  // Picking in order (a ranking): a picked word carries its place beside it
  numbered?: boolean;
}

type ShownWord = { word: string; size: number; weight: number; rank: number; count?: number; kind?: FieldEntry['kind'] };

// A steady place for each word, so the field reads as a cloud, not a ranking
const scatter = (word: string) => [...word].reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 7);

/**
 * The words someone keeps coming back to, in ink (components/ink): a field
 * of words, each sized by how often it appears in their stories, articles or
 * both (/api/words). The biggest rise first wherever they sit, then the rest
 * fill in, and the most used word keeps a slow pulse. Hover or focus a word
 * for its count. Switching what it counts replays the rise.
 *
 * Given onToggle, the field is something to answer with: tap a word to pick
 * it (an ink ring draws around it), again to let it go, until `max` are
 * picked. A tagged word carries its kind of build beside it.
 *
 * Given a field, the words are someone's own among the site's: theirs in ink,
 * the site's faint, the ones they share in the theme color.
 */
export default function InkWords({ words: initial, from: initialFrom = 'both', limit = 40, filter = true, selected = [], onToggle, max, tags, field: given, numbered = false }: InkWordsProps) {
  const { colorValue } = useTheme();
  const [from, setFrom] = useState<WordSource>(initialFrom);
  const [lists, setLists] = useState<Partial<Record<WordSource, WordCount[]>>>(initial ? { [initialFrom]: initial } : {});
  const words = lists[from];

  useEffect(() => {
    if (given || lists[from]) return;
    let cancelled = false;
    fetch(`/api/words?from=${from}&limit=${limit}`)
      .then(response => (response.ok ? response.json() : null))
      .then(data => {
        if (!cancelled && data?.words) setLists(current => ({ ...current, [from]: data.words }));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [from, limit, lists, given]);

  const field = useMemo((): ShownWord[] => {
    if (given) return given.map((entry, rank) => ({ ...entry, rank }));
    const shown = (words ?? []).slice(0, limit);
    if (shown.length === 0) return [];
    const max = shown[0].count;
    const min = shown[shown.length - 1].count;
    return shown
      .map((entry, rank) => {
        // Square-root scale: a word used four times as often reads twice as big
        const weight = max === min ? 1 : (Math.sqrt(entry.count) - Math.sqrt(min)) / (Math.sqrt(max) - Math.sqrt(min));
        return { ...entry, rank, weight, size: Math.round(MIN_PX + weight * (MAX_PX - MIN_PX)) };
      })
      .sort((a, b) => scatter(a.word) - scatter(b.word));
  }, [given, words, limit]);

  return (
    <div>
      {filter && (
        <div role="radiogroup" aria-label="Count words in" className="mb-8 flex gap-6">
          {SOURCES.map(source => (
            <button
              key={source}
              type="button"
              role="radio"
              aria-checked={source === from}
              onClick={() => setFrom(source)}
              className="relative px-1 font-vt323 text-xl transition-colors"
              style={{ color: source === from ? 'var(--foreground)' : 'var(--text-muted)' }}
            >
              {source === from && <InkCircle key={source} color={colorValue} className="absolute -inset-x-3 -inset-y-1" />}
              {source}
            </button>
          ))}
        </div>
      )}

      <InkStage key={from}>
        <ul className={`flex flex-wrap items-baseline gap-x-5 ${numbered ? 'gap-y-3' : 'gap-y-1'}`} aria-label={`Most used words in ${from === 'both' ? 'stories and articles' : from}`}>
          {field.map(entry => {
            const picked = selected.includes(entry.word);
            const full = max !== undefined && selected.length >= max && !picked;
            const tag = tags?.[entry.word];
            const place = numbered && picked ? selected.indexOf(entry.word) + 1 : 0;
            return (
            <li key={entry.word}>
              <InkWord
                beat={entry.kind ? (entry.kind === 'site' ? entry.rank * 0.2 : 0) : entry.rank * 0.35}
                className="group relative font-vt323 leading-none"
                style={{
                  fontSize: `${entry.size}px`,
                  // Picking, only the picked words take the theme color; reading, the top five do
                  color: entry.kind
                    ? picked || entry.kind === 'both' ? colorValue : entry.kind === 'yours' ? 'var(--foreground)' : 'var(--text-muted)'
                    : (onToggle ? picked : entry.rank < 5 || picked) ? colorValue : 'var(--foreground)',
                  opacity: entry.kind
                    ? picked || entry.kind !== 'site' ? 1 : 0.45 + entry.weight * 0.4
                    : picked || (!onToggle && entry.rank < 5) ? 1 : 0.4 + entry.weight * 0.5,
                }}
              >
                {onToggle ? (
                  <button
                    type="button"
                    onClick={() => onToggle(entry.word)}
                    disabled={full}
                    aria-pressed={picked}
                    aria-label={`${entry.word}${place ? `, ranked ${place}` : ''}${tag ? `, ${tag}` : ''}`}
                    className="relative inline-block rounded px-1 outline-none transition-opacity focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-25"
                    style={picked ? { color: colorValue, opacity: 1 } : undefined}
                  >
                    {picked && <InkCircle color={colorValue} className="absolute -inset-x-2 -inset-y-1" />}
                    {entry.word}
                  </button>
                ) : (
                  <span tabIndex={0} className={`inline-block rounded outline-none focus-visible:ring-2 ${entry.rank === 0 ? 'ink-pulse' : ''}`} aria-label={`${entry.word}, ${entry.count} times`}>
                    {entry.word}
                  </span>
                )}
                <sup
                  aria-hidden
                  className={`font-vt323 transition-opacity ${place ? 'ml-2 text-2xl' : 'ml-0.5 text-xs'} ${tag || place ? '' : 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100'}`}
                  style={{ color: tag || place ? colorValue : 'var(--text-muted)' }}
                >
                  {place || (tag ? `${tag}.` : entry.count)}
                </sup>
              </InkWord>
            </li>
            );
          })}
        </ul>
      </InkStage>
    </div>
  );
}
