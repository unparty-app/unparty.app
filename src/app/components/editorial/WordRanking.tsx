'use client';

import { useDeferredValue, useMemo } from 'react';
import Link from 'next/link';
import { useTheme } from '../../contexts/ThemeContext';
import { FOUNDER_ANSWERS } from '../../constants/organization';
import InkWords from '../resume/InkWords';
import { useSiteCloud, wordField, type FieldEntry } from '../YourWords';
import { wordsOf } from '@/lib/words';
import { setReaderRanking, useReaderAnswers, useReaderRankings } from '@/lib/challenge-answers';
import { RANKING_LABEL, RANKING_PROMPT, RankingDone, useIsOwner, WriteYourWords } from './RankingParts';

/**
 * WordRanking - a ranking with no question to set up (#1310): the choices are
 * the words in this copy's cloud (wordField), so an article can ask it on any
 * site, with no database row for a new owner to recreate.
 *
 * Tap a word and its ring draws with its place in it; tap again to let it go,
 * and the rest close up. The words don't move, and there's no save and no
 * results screen: picking, saved and changing your mind are the one view.
 *
 * Until someone has written, these are the site's words, and that's the point:
 * the page reads as somebody else's until you write (WriteYourWords). Their
 * ranking waits in the tab and goes with their worksheet.
 */
export default function WordRanking({ prompt, words: wanted = 5 }: { prompt: string; words?: number }) {
  const { colorValue } = useTheme();
  const isOwner = useIsOwner();
  const { words: site, loaded } = useSiteCloud();
  const answers = useDeferredValue(useReaderAnswers());
  const ranked = useReaderRankings()[prompt] ?? [];

  const field = useMemo(() => {
    // The owner's answers are theirs too, however little of their writing they are
    const mine = isOwner ? Object.values(FOUNDER_ANSWERS).join(' ') : Object.values(answers).join(' ');
    return wordField(site, mine, new Set([...Object.keys(answers), prompt].flatMap(wordsOf))).field;
  }, [site, answers, isOwner, prompt]);

  // A word they ranked stays on the page to let go of, even once their answers change
  const here = new Set(field.map((entry) => entry.word));
  const shown = [...field, ...ranked.filter((word) => !here.has(word)).map((word): FieldEntry => ({ word, weight: 0.2, kind: 'yours', size: 18 }))];
  const needed = Math.min(wanted, shown.length);
  const done = needed > 0 && ranked.length >= needed;

  const toggle = (word: string) =>
    setReaderRanking(prompt, ranked.includes(word) ? ranked.filter((w) => w !== word) : ranked.length < wanted ? [...ranked, word] : ranked);

  return (
    <div className="w-full text-left">
      <h3 className={RANKING_PROMPT}>{prompt}</h3>

      <div className="mt-4">
        <WriteYourWords cloudIsEmpty={loaded && !site.length && !field.length} />
      </div>

      {shown.length > 0 && (
        <div className="mt-6">
          <InkWords filter={false} field={shown} selected={ranked} onToggle={toggle} max={wanted} numbered />
        </div>
      )}

      {needed > 0 && (
        <p className={`${RANKING_LABEL} mt-6`} style={{ color: done ? colorValue : 'var(--text-muted)' }} aria-live="polite">
          {ranked.length} of {needed}.
        </p>
      )}

      {done && (
        <>
          <p className="mt-2 font-space-grotesk text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            this stays in this tab until you{' '}
            <Link href="/waitlist/apply" className="underline underline-offset-4" style={{ color: colorValue }}>send your problem</Link>
            . once sent, whoever runs this site can read it.
          </p>
          <RankingDone />
        </>
      )}
    </div>
  );
}
