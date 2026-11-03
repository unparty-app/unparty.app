'use client';

import { useCallback } from 'react';
import { useUser } from '@/lib/auth-stub.client';

// Deliberately separate from useUserTracking(), which auto-starts/ends a
// UserSession as a side effect of being called at all — fine for the four
// page-level call sites that hook already had (/about, /build, /connect,
// OnboardingFlow), but wrong for AboutComponent, which mounts on 40+ unppp
// pages and would spawn a spurious session per visit if it used that hook
// just to reach trackUnpppVisit.
export const useUnpppVisitTracking = () => {
  const { user } = useUser();

  const trackUnpppVisit = useCallback(async (unpppId: string) => {
    if (!user) return;

    try {
      const response = await fetch('/api/analytics/unppp-visit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ unpppId }),
      });
      // fetch() only rejects on network failure — an HTTP error status still
      // resolves normally, so it must be checked explicitly or a failed
      // visit (401, 400 unknown id, 500) silently looks like success.
      if (!response.ok) {
        console.error('Error tracking unppp visit:', response.status, await response.text());
      }
    } catch (error) {
      console.error('Error tracking unppp visit:', error);
    }
  }, [user]);

  return { trackUnpppVisit };
};
