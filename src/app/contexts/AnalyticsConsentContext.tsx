"use client";

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useHydrated } from '@/hooks/useHydrated';
import { useLocalStorageValue, writeLocalStorage } from '@/hooks/useLocalStorage';

// 'granted' | 'denied' once the user has chosen; null while undecided (first
// visit, or storage unavailable). Essential cookies (Clerk auth session) are
// never gated by this — it only controls analytics/tracking.
export type AnalyticsConsent = 'granted' | 'denied' | null;

type AnalyticsConsentContextType = {
  consent: AnalyticsConsent;
  isLoaded: boolean;
  isBannerOpen: boolean;
  setConsent: (choice: 'granted' | 'denied') => void;
  openBanner: () => void;
};

const AnalyticsConsentContext = createContext<AnalyticsConsentContextType | undefined>(undefined);

// Same per-origin localStorage pattern as the theme sync ('unpartySelectedColor').
const STORAGE_KEY = 'unpartyAnalyticsConsent';

export function AnalyticsConsentProvider({ children }: { children: React.ReactNode }) {
  // The stored choice reads as null on the server and during hydration, so
  // there's no hydration mismatch; the banner only appears once loaded and
  // no valid choice was stored. A choice made this session wins, which also
  // covers blocked storage (the in-memory choice still applies).
  const isLoaded = useHydrated();
  const stored = useLocalStorageValue(STORAGE_KEY);
  const [pickedConsent, setConsentState] = useState<AnalyticsConsent>(null);
  const consent: AnalyticsConsent =
    pickedConsent ?? (stored === 'granted' || stored === 'denied' ? stored : null);
  const [bannerRequested, setBannerRequested] = useState(false);
  const isBannerOpen = isLoaded && (bannerRequested || consent === null);

  const setConsent = useCallback((choice: 'granted' | 'denied') => {
    setConsentState(choice);
    setBannerRequested(false);
    // Best-effort — if storage is blocked the banner just re-prompts next visit
    writeLocalStorage(STORAGE_KEY, choice);
  }, []);

  // Lets the footer "cookie preferences" affordance re-open the banner so a
  // stored choice can be changed (consent withdrawal) at any time.
  const openBanner = useCallback(() => setBannerRequested(true), []);

  const value = useMemo(
    () => ({ consent, isLoaded, isBannerOpen, setConsent, openBanner }),
    [consent, isLoaded, isBannerOpen, setConsent, openBanner]
  );

  return (
    <AnalyticsConsentContext.Provider value={value}>
      {children}
    </AnalyticsConsentContext.Provider>
  );
}

export function useAnalyticsConsent() {
  const context = useContext(AnalyticsConsentContext);
  if (context === undefined) {
    throw new Error('useAnalyticsConsent must be used within an AnalyticsConsentProvider');
  }
  return context;
}
