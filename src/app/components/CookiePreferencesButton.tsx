'use client';

import { useAnalyticsConsent } from '../contexts/AnalyticsConsentContext';

// Footer affordance to re-open the cookie consent banner, so an earlier
// accept/reject choice can be changed at any time (consent withdrawal).
export default function CookiePreferencesButton({ label = 'cookie preferences', className = 'underline decoration-dotted underline-offset-2 transition-opacity hover:opacity-100' }: { label?: string; className?: string } = {}) {
  const { openBanner } = useAnalyticsConsent();

  return (
    <button
      onClick={openBanner}
      className={className}
    >
      {label}
    </button>
  );
}
