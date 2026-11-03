'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@/lib/auth-stub.client';
import { useTheme } from '@/app/contexts/ThemeContext';
import { InkCircle } from '../depend/ink';
import MissingQuestion from './MissingQuestion';
import { RANKING_LABEL, RANKING_PROMPT, RankingDone } from './RankingParts';

interface Question {
  id: string;
  text: string;
  type: string;
  choices: string[];
  userResponse?: {
    responseData: string[];
    completedAt: string;
  };
}

interface EditorialRankingProps {
  questionId: string;
  categoryId?: string;
}

type Save = 'idle' | 'saving' | 'saved' | 'error';

// A moment after the last tap, so ranking five things is one save
const SAVE_AFTER_MS = 600;

// Signed out, the order waits in the tab for sign in
const waitingKey = (questionId: string) => `ranking-${questionId}`;
const loadWaiting = (questionId: string): string[] => {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(waitingKey(questionId)) ?? '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};
const storeWaiting = (questionId: string, ranking: string[]) => {
  try {
    if (ranking.length) sessionStorage.setItem(waitingKey(questionId), JSON.stringify(ranking));
    else sessionStorage.removeItem(waitingKey(questionId));
  } catch {
    // Private windows can refuse storage; the order still works on this page
  }
};

/**
 * EditorialRanking - a ranking question from the site's Question system, with
 * written choices (/admin/questions). A ranking with no question is
 * WordRanking, which needs no setup.
 *
 * Tap a choice and its ring draws with its place in it; tap again to let it go,
 * and the rest close up. Nothing moves, and picking, saved and changing your
 * mind are the one view. Signed in, it saves itself. Signed out, it waits in
 * the tab and saves after sign in.
 */
export default function EditorialRanking({ questionId, categoryId = 'core' }: EditorialRankingProps) {
  const { isSignedIn } = useUser();
  const { colorValue } = useTheme();
  const pathname = usePathname();
  const [question, setQuestion] = useState<Question | null>(null);
  const [ranking, setRanking] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [save, setSave] = useState<Save>('idle');
  // Why the question didn't load: MissingQuestion shows it to the owner only
  const [missing, setMissing] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const send = (next: string[]) => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(async () => {
      setSave('saving');
      try {
        const response = await fetch('/api/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questionId, responseData: next }),
        });
        if (!response.ok) throw new Error('Failed to save the ranking');
        storeWaiting(questionId, []);
        setSave('saved');
      } catch (err) {
        console.error('Error saving ranking:', err);
        setSave('error');
      }
    }, SAVE_AFTER_MS);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setMissing(null);
      try {
        // Fetch questions from the category and find the specific one
        const response = await fetch(`/api/questions?category=${categoryId}`);
        if (!response.ok) throw new Error("couldn't be loaded");
        const data = await response.json();
        const found: Question | undefined = data.questions.find((q: Question) => q.id === questionId);
        if (!found) throw new Error("isn't in your database yet");
        if (found.type !== 'ranking') throw new Error("isn't a ranking question");
        if (cancelled) return;
        setQuestion(found);
        // What they saved, or what's been waiting since before they signed in
        const waiting = loadWaiting(questionId);
        const saved = found.userResponse?.responseData;
        if (saved?.length) {
          setRanking(saved);
        } else if (waiting.length) {
          setRanking(waiting);
          if (isSignedIn) send(waiting);
        }
      } catch (err) {
        if (!cancelled) setMissing(err instanceof Error ? err.message : "couldn't be loaded");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // send only reads questionId
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionId, categoryId, isSignedIn]);

  if (loading) {
    return (
      <div className="w-full animate-pulse space-y-3" aria-hidden="true">
        <div className="h-6 w-2/3 rounded" style={{ backgroundColor: 'var(--background-highlight)' }} />
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-11 w-full rounded" style={{ backgroundColor: 'var(--background-highlight)' }} />
        ))}
      </div>
    );
  }

  if (missing || !question) return <MissingQuestion questionId={questionId} reason={missing ?? "couldn't be loaded"} />;

  const toggle = (choice: string) => {
    const next = ranking.includes(choice) ? ranking.filter((c) => c !== choice) : [...ranking, choice];
    setRanking(next);
    if (!isSignedIn) {
      storeWaiting(questionId, next);
    } else if (next.length) {
      send(next);
    } else {
      window.clearTimeout(timer.current);
      setSave('idle');
    }
  };

  // Only what's still a choice: a choice an admin removed can't be tapped off
  const ranked = ranking.filter((choice) => question.choices.includes(choice));
  const done = ranked.length > 0 && ranked.length === question.choices.length;

  return (
    <div className="w-full text-left">
      <h3 className={RANKING_PROMPT}>{question.text.trim()}</h3>

      <ul className="mt-4">
        {question.choices.map((choice) => {
          const place = ranked.indexOf(choice) + 1;
          return (
            <li key={choice}>
              <button
                type="button"
                onClick={() => toggle(choice)}
                aria-pressed={place > 0}
                aria-label={place > 0 ? `${choice.trim()}, ranked ${place}` : choice.trim()}
                className="flex min-h-11 w-full items-center gap-3 rounded py-1.5 text-left outline-none transition-opacity hover:opacity-80 focus-visible:ring-2"
                style={{ ['--tw-ring-color' as string]: colorValue }}
              >
                <span className="relative grid size-8 shrink-0 place-items-center font-vt323 text-lg leading-none" style={{ color: colorValue }}>
                  {place > 0 ? (
                    <>
                      <InkCircle key={place} color={colorValue} className="absolute inset-0 size-full" />
                      {place}
                    </>
                  ) : (
                    <span aria-hidden="true" className="size-6 rounded-full border" style={{ borderColor: `${colorValue}40` }} />
                  )}
                </span>
                <span className="min-w-0 font-space-grotesk text-sm leading-snug text-[var(--foreground)] md:text-base">{choice.trim()}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <p className={`${RANKING_LABEL} mt-6 min-h-4`} style={{ color: save === 'error' ? colorValue : 'var(--text-muted)' }} aria-live="polite">
        {ranked.length === 0 ? (
          'tap them, most first.'
        ) : !isSignedIn ? (
          <>
            {ranked.length} of {question.choices.length}.{' '}
            <Link href={`/sign-in?redirect_url=${encodeURIComponent(pathname)}`} className="underline underline-offset-4" style={{ color: colorValue }}>sign in</Link>{' '}
            to keep it.
          </>
        ) : save === 'error' ? (
          "that didn't save. tap one to try again."
        ) : (
          <>
            {ranked.length} of {question.choices.length}.{save === 'saved' ? ' saved.' : ''}
          </>
        )}
      </p>

      {done && <RankingDone />}
    </div>
  );
}
