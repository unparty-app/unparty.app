'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-stub.client';
import { useLocalStorageValue, writeLocalStorage } from '@/hooks/useLocalStorage';
import { COMPONENT_NAMES, makeStepId, type ComponentName } from '@/lib/component-portfolio';

export type ComponentVote = 'more' | 'meh' | 'nah';
type Votes = Partial<Record<ComponentName, ComponentVote>>;

const KEY = 'component_votes';
const VOTES: ComponentVote[] = ['more', 'meh', 'nah'];

function parse(raw: string | null): Votes {
  if (!raw) return {};
  try {
    const value = JSON.parse(raw);
    return value && typeof value === 'object' ? value : {};
  } catch {
    return {};
  }
}

// The latest saved votes at the moment of a click, not the last render's
function readSaved(): string | null {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function save(name: ComponentName, vote: ComponentVote | null) {
  return fetch(`/api/steps/${makeStepId(name)}/vote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vote }),
  }).catch(() => undefined);
}

/**
 * The person's votes on the component portfolio.
 *
 * Signed in, each vote is saved in their progress on the component's MAKE.
 * step (POST /api/steps/<id>/vote), so it follows them across devices; on
 * sign-in their saved votes load (GET /api/steps/progress), and any cast
 * while signed out are carried up once. Signed out, votes stay in this
 * browser. Either way every reader on the page shares one localStorage key,
 * so the portfolio and an article's vote stay in step. Voting the same way
 * again takes the vote back.
 *
 * On a copy that hasn't run npm run db:seed:make there are no MAKE. steps to
 * save to yet; the votes still count in the browser.
 */
export function useComponentVotes() {
  const votes = parse(useLocalStorageValue(KEY));
  const { isSignedIn } = useAuth();
  const loaded = useRef(false);

  useEffect(() => {
    if (!isSignedIn || loaded.current) return;
    loaded.current = true;
    const ids = COMPONENT_NAMES.map(makeStepId).join(',');
    fetch(`/api/steps/progress?ids=${ids}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { progress?: Record<string, { userAnswer: string | null }> } | null) => {
        if (!data?.progress) return;
        const saved: Votes = {};
        for (const name of COMPONENT_NAMES) {
          try {
            const vote = JSON.parse(data.progress[makeStepId(name)]?.userAnswer ?? 'null')?.vote;
            if (VOTES.includes(vote)) saved[name] = vote;
          } catch {
            // Not a vote (an older answer on the step)
          }
        }
        // Votes cast while signed out go up once
        for (const [name, vote] of Object.entries(parse(readSaved())) as [ComponentName, ComponentVote][]) {
          if (!saved[name] && VOTES.includes(vote)) {
            saved[name] = vote;
            save(name, vote);
          }
        }
        writeLocalStorage(KEY, JSON.stringify(saved));
      })
      .catch(() => {});
  }, [isSignedIn]);

  const vote = useCallback(
    (name: ComponentName, choice: ComponentVote) => {
      const current = parse(readSaved());
      const next = { ...current };
      const taken = current[name] === choice;
      if (taken) delete next[name];
      else next[name] = choice;
      writeLocalStorage(KEY, JSON.stringify(next));
      if (isSignedIn) save(name, taken ? null : choice);
    },
    [isSignedIn]
  );

  return { votes, vote, signedIn: Boolean(isSignedIn) };
}
