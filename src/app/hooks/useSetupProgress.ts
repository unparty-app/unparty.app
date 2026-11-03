'use client';

import { useCallback, useEffect, useState } from 'react';
import { useUser } from '@/lib/auth-stub.client';

// One check of the self-checking SETUP. steps per page, however many
// challenges are on it (src/lib/setup-verify.ts)
let verifying: Promise<unknown> | null = null;

/**
 * The SETUP. steps a builder has done, of `ids` (`setup-github`…), and a
 * toggle to tick one (#589): the onboarding challenges read and set them
 * through the same routes as GoalBudget's milestones (GET /api/steps/progress,
 * POST / DELETE /api/steps/[id]/complete). For an admin the steps that check
 * themselves are checked off first. Signed out, nothing is done and nothing
 * ticks
 */
export function useSetupProgress(ids: string[]) {
  const { isSignedIn, user } = useUser();
  const [done, setDone] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState<string | null>(null);
  const key = ids.join(',');

  useEffect(() => {
    if (!isSignedIn || !key) return;
    let cancelled = false;
    const admin = (user?.publicMetadata as { role?: string } | undefined)?.role === 'admin';
    if (admin && !verifying) verifying = fetch('/api/admin/setup/verify', { method: 'POST' }).catch(() => null);
    Promise.resolve(admin ? verifying : null)
      .then(() => fetch(`/api/steps/progress?ids=${key}`))
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { progress?: Record<string, { completed: boolean }> } | null) => {
        if (!cancelled && data?.progress) setDone(new Set(Object.entries(data.progress).filter(([, p]) => p.completed).map(([id]) => id)));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isSignedIn, key, user]);

  const toggle = useCallback(
    async (id: string) => {
      if (!isSignedIn) return;
      const wasDone = done.has(id);
      const next = new Set(done);
      if (wasDone) next.delete(id);
      else next.add(id);
      setDone(next);
      setNotice(null);
      const res = await fetch(`/api/steps/${id}/complete`, { method: wasDone ? 'DELETE' : 'POST' }).catch(() => null);
      if (!res?.ok) {
        setDone(done);
        setNotice(res?.status === 404 ? 'that SETUP. step isn’t on this copy yet (npm run db:seed:setup).' : 'couldn’t save that. try again.');
      }
    },
    [isSignedIn, done]
  );

  return { signedIn: Boolean(isSignedIn), done, toggle, notice };
}
