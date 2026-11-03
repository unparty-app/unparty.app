'use client';

import Link from 'next/link';
import { track } from '@vercel/analytics';
import { useTheme } from '../../contexts/ThemeContext';
import type { FounderCta as FounderCtaType } from '../../constants/organization';

/**
 * The one thing /founders asks a visitor to do (FoundersConfig founder.cta, or
 * the founder's first link). Drawn like the Fab: a theme ring, a background
 * gap, and a theme-color pill.
 *
 * Clicks send `cta_clicked` { cta, placement } to Vercel Analytics, the same
 * event the Fab sends, so one funnel shows which ask people take. Consent-gated
 * by AnalyticsGate: a no-op until the visitor accepts analytics cookies.
 */
export default function FounderCta({ cta, placement, className = '' }: { cta: FounderCtaType; placement: string; className?: string }) {
  const { colorValue } = useTheme();
  const onClick = () => track('cta_clicked', { cta: cta.label, placement });
  const external = /^(https?:|mailto:)/.test(cta.href);
  const pill = (
    <span
      className="inline-flex h-11 items-center gap-2 rounded-full px-5 font-vt323 text-xl leading-none transition-transform duration-200 group-hover:scale-[1.02] motion-reduce:transition-none"
      style={{ backgroundColor: colorValue, color: 'var(--background)' }}
    >
      {cta.label}
      <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none">→</span>
    </span>
  );
  const shellClass = `group inline-flex rounded-full border-2 p-1 shadow-md ${className}`;
  const shellStyle = { backgroundColor: 'var(--background)', borderColor: colorValue };

  return external ? (
    <a href={cta.href} target={cta.href.startsWith('mailto:') ? undefined : '_blank'} rel="noopener noreferrer" onClick={onClick} className={shellClass} style={shellStyle}>
      {pill}
    </a>
  ) : (
    <Link href={cta.href} onClick={onClick} className={shellClass} style={shellStyle}>
      {pill}
    </Link>
  );
}
