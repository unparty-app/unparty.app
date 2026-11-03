import { useEffect, useCallback } from 'react';
import { useUser } from '@/lib/auth-stub.client';

interface TrackingOptions {
  pillar?: 'ABOUT' | 'BUILD' | 'CONNECT';
  action?: string;
  metadata?: Record<string, unknown>;
}

export const useUserTracking = () => {
  const { user } = useUser();

  const trackPillarUsage = useCallback(async (options: TrackingOptions) => {
    if (!user) return;

    try {
      await fetch('/api/analytics/user-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      });
    } catch (error) {
      console.error('Error tracking pillar usage:', error);
    }
  }, [user]);

  const trackIdeaProgress = useCallback(async (ideaData: {
    ideaTitle: string;
    currentStage: string;
    stepsCompleted: number;
    totalSteps: number;
  }) => {
    if (!user) return;

    try {
      await fetch('/api/analytics/idea-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ideaData),
      });
    } catch (error) {
      console.error('Error tracking idea progress:', error);
    }
  }, [user]);

  const startSession = useCallback(async () => {
    if (!user) return;

    try {
      await fetch('/api/analytics/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'start' }),
      });
    } catch (error) {
      console.error('Error starting session:', error);
    }
  }, [user]);

  const endSession = useCallback(async () => {
    if (!user) return;

    try {
      await fetch('/api/analytics/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'end' }),
      });
    } catch (error) {
      console.error('Error ending session:', error);
    }
  }, [user]);

  // Auto-start session when hook is used
  useEffect(() => {
    if (user) {
      startSession();
      
      // Auto-end session on page unload
      const handleBeforeUnload = () => {
        endSession();
      };

      window.addEventListener('beforeunload', handleBeforeUnload);
      
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        endSession();
      };
    }
  }, [user, startSession, endSession]);

  return {
    trackPillarUsage,
    trackIdeaProgress,
    startSession,
    endSession
  };
};