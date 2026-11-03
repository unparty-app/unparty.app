'use client';

import Link from 'next/link';
import { useUser } from '@/lib/auth-stub.client';
import { useTheme } from '../../contexts/ThemeContext';
import { InkUnderline } from '../depend/ink';
import { BuildYoursPill } from '../BuyPill';
import { ANSWER_SLOTS, MAX_ANSWER_LENGTH } from '@/lib/answer-slots';
import { setReaderAnswer, useReaderAnswers } from '@/lib/challenge-answers';

export const RANKING_LABEL = 'font-google-sans-code text-[10px] uppercase tracking-wide md:text-xs';
export const RANKING_PROMPT = 'font-space-grotesk text-lg font-medium leading-snug text-[var(--foreground)] md:text-xl';

// The first of the challenge's questions, the same answer wherever it's asked
const FIRST = ANSWER_SLOTS[0];

/** Whether this is the site's owner, whose words the site's already are */
export function useIsOwner(): boolean {
  const { user } = useUser();
  return user?.publicMetadata?.role === 'admin';
}

/**
 * The moment a site starts meaning something to someone: words that aren't
 * theirs yet, and a place to write until they are. What they write here is
 * their answer to the challenge's first question, so it follows them to the
 * challenge and the worksheet. Once they've answered more than that, it steps
 * aside. The owner's words come from their writing, so they get sent there,
 * and only when there's none yet.
 */
export function WriteYourWords({ cloudIsEmpty = false }: { cloudIsEmpty?: boolean }) {
  const { colorValue } = useTheme();
  const isOwner = useIsOwner();
  const answers = useReaderAnswers();
  const value = answers[FIRST.prompt] ?? '';
  const others = Object.keys(answers).some((prompt) => prompt !== FIRST.prompt);

  if (isOwner) {
    if (!cloudIsEmpty) return null;
    return (
      <p className="font-space-grotesk text-sm" style={{ color: 'var(--text-muted)' }}>
        no words here yet. they come from what you publish, so{' '}
        <Link href="/admin/stories" className="underline underline-offset-4" style={{ color: colorValue }}>write your first story</Link>.
      </p>
    );
  }
  if (others) return null;

  return (
    <label className="relative block">
      <span className="font-space-grotesk text-sm" style={{ color: 'var(--text-muted)' }}>
        {value.trim()
          ? 'those are yours now, in ink.'
          : cloudIsEmpty
            ? 'no words here yet. yours can be the first.'
            : "these are this site's words. write yours and they take over."}
      </span>
      <textarea
        value={value}
        onChange={(e) => setReaderAnswer(FIRST.prompt, e.target.value)}
        maxLength={MAX_ANSWER_LENGTH}
        rows={2}
        aria-label={FIRST.prompt}
        placeholder={FIRST.prompt.toLowerCase()}
        className="mt-2 w-full resize-none bg-transparent font-space-grotesk text-base leading-relaxed text-[var(--foreground)] outline-none placeholder:text-[var(--text-muted)]"
      />
      <InkUnderline color={colorValue} className="pointer-events-none absolute -bottom-1 left-0 h-2.5 w-44" />
    </label>
  );
}

/**
 * The end of a ranking: the site's one ask writes itself on and its bulb
 * lights, the same way "build yours" does everywhere (BuildYoursPill). Not for
 * the owner, who already has.
 */
export function RankingDone() {
  const isOwner = useIsOwner();
  if (isOwner) return null;
  return (
    <div className="mt-6">
      <BuildYoursPill />
    </div>
  );
}
