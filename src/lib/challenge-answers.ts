import { useSyncExternalStore } from 'react';
import { MAX_ANSWER_LENGTH } from '@/lib/answer-slots';

/**
 * What a reader has said in their own words so far, waiting in this tab until
 * it goes with their worksheet (/api/problem/send). Never through FoundersConfig,
 * which ships in every page's JavaScript.
 *
 * - Answers to a challenge's steps (#265), keyed by the question. The owner's
 *   own are public, one set per copy: FoundersConfig `answers`, saved from
 *   /api/admin/answers and counted with their writing (word-counts.ts)
 * - Word rankings (WordRanking, #1310), keyed by the prompt, most first
 */

/** A store that lives in this tab, and in memory too: private windows can refuse storage */
function tabStore<T>(key: string) {
  const empty: Record<string, T> = {};
  const listeners = new Set<() => void>();
  let current: Record<string, T> | null = null;

  const read = (): Record<string, T> => {
    if (current) return current;
    try {
      const parsed = JSON.parse(sessionStorage.getItem(key) ?? '{}');
      current = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : empty;
    } catch {
      current = empty;
    }
    return current as Record<string, T>;
  };

  const write = (next: Record<string, T>) => {
    current = next;
    try {
      sessionStorage.setItem(key, JSON.stringify(next));
    } catch {
      // Private windows can refuse storage; it still works on this page
    }
    listeners.forEach((listener) => listener());
  };

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  return {
    read,
    write,
    /** Bring back what they last sent, under anything written in this tab */
    fillMissing: (saved: Record<string, T>) => {
      const now = read();
      const next = { ...saved, ...now };
      if (Object.keys(next).length !== Object.keys(now).length) write(next);
    },
    /** Live, so anything else on the page follows as they write */
    use: () => useSyncExternalStore(subscribe, read, () => empty),
  };
}

/** A reader's answers in this tab: question → what they wrote */
export type ReaderAnswers = Record<string, string>;

const answers = tabStore<string>('challenge-answers');
const rankings = tabStore<string[]>('word-rankings');

/** Set one answer; a blank one is no answer */
export function setReaderAnswer(prompt: string, text: string) {
  const { [prompt]: _replaced, ...rest } = answers.read();
  answers.write(text.trim() ? { ...rest, [prompt]: text.slice(0, MAX_ANSWER_LENGTH) } : rest);
}

export const fillMissingReaderAnswers = answers.fillMissing;
export const useReaderAnswers = answers.use;

/** Set one ranking, most first; no words is no ranking */
export function setReaderRanking(prompt: string, words: string[]) {
  const { [prompt]: _replaced, ...rest } = rankings.read();
  rankings.write(words.length ? { ...rest, [prompt]: words } : rest);
}

export const fillMissingReaderRankings = rankings.fillMissing;
export const useReaderRankings = rankings.use;
