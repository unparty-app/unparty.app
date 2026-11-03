'use client';

import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { GoogleAnalytics } from '@next/third-parties/google';
import { useAnalyticsConsent } from '../contexts/AnalyticsConsentContext';

/**
 * Consent gate for the non-essential analytics scripts. Google Analytics,
 * Vercel Analytics and Speed Insights only mount after the user accepts the
 * cookie banner — nothing loads while the choice is undecided or denied.
 * Essential cookies (Clerk auth session) are unaffected. Google Analytics
 * needs the owner's own Measurement ID (NEXT_PUBLIC_GA_ID); without one it
 * is skipped.
 */
export default function AnalyticsGate({ gaId }: { gaId?: string }) {
  const { consent } = useAnalyticsConsent();

  if (consent !== 'granted') return null;

  return (
    <>
      <SpeedInsights />
      <Analytics />
      {gaId && <GoogleAnalytics gaId={gaId} />}
    </>
  );
}
