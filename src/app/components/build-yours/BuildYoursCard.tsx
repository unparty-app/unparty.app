'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { track } from '@vercel/analytics';
import { useTheme } from '../../contexts/ThemeContext';
import { FOUNDER_CTA } from '../../constants/organization';
import HandDrawnArrow from '../HandDrawnArrow';
import { BuildBrain, BuildLettering, BUILD_YOURS_DONE, inkOn } from './BuildYours';

interface BuildYoursCardProps {
  label?: string; // Defaults to FoundersConfig founder.cta.label
  href?: string; // Defaults to founder.cta.href
  pitch?: string; // Defaults to founder.cta.pitch; '' hides it
  action?: string; // The link's words (default "start here")
  placement?: string; // cta_clicked placement (default: the page's path)
  // Line the words up with a full-width page's left edge instead of centering
  // them in the reading column (a full-bleed page like /about)
  alignStart?: boolean;
  // Fill its container (a panel, a card) instead of breaking out to the
  // screen's edges as a band
  fill?: boolean;
}

/**
 * BuildYoursCard - the site's ask as a full-bleed band inside an article, for
 * readers who never see the Fab's "build yours" (phones show only its brain).
 *
 * The theme-colored band holds the brand brain and the hand-written words,
 * which write themselves in when the band scrolls into view, with the bulb
 * lighting as they finish (the same motion as the Fab, held until seen).
 * Then the pitch and a "start here" link with the hand-drawn arrow.
 *
 * Every prop defaults to the site's one ask (FoundersConfig founder.cta), so
 * any article can add a conversion point with no props, or point one
 * elsewhere. Clicks send the same consent-gated `cta_clicked` event as the
 * Fab and /founders, so one funnel compares every placement.
 *
 * The lettering spells "build yours"; another label shows as set text.
 */
export default function BuildYoursCard({ label, href, pitch, action = 'start here', placement, alignStart = false, fill = false }: BuildYoursCardProps) {
  const { colorValue } = useTheme();
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);

  // Hold the write-on until the band is on screen, so readers see it happen
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          observer.disconnect();
        }
      },
      { threshold: 0.45 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [seen]);

  const words = label ?? FOUNDER_CTA?.label ?? 'build yours';
  const target = href ?? FOUNDER_CTA?.href;
  const line = pitch ?? FOUNDER_CTA?.pitch;
  if (!target) return null;

  const ink = inkOn(colorValue);
  const lettered = words.trim().toLowerCase() === 'build yours';
  const external = /^(https?:|mailto:)/.test(target);
  const onClick = () => track('cta_clicked', { cta: words, placement: placement || pathname || 'article' });
  const linkClass =
    'group mt-8 inline-flex items-center gap-3 rounded-full border-2 px-5 py-2.5 font-google-sans-code text-sm uppercase tracking-wider transition-transform duration-200 hover:-translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 motion-reduce:transition-none';
  const linkStyle = { borderColor: ink, color: ink, outlineColor: ink };
  const link = (
    <>
      {action}
      <HandDrawnArrow className="h-5 w-8" color={ink} />
    </>
  );

  return (
    <section
      aria-label={words}
      className={fill ? 'w-full rounded-xl px-5 py-8' : 'my-12 w-screen mx-[calc(50%-50vw)] px-4 py-12 sm:px-6 sm:py-16 lg:px-12'}
      style={{ backgroundColor: colorValue, color: ink }}
    >
      <div ref={ref} className={`build-yours max-w-2xl ${alignStart ? '' : 'mx-auto'}`} data-paused={!seen || undefined} style={BUILD_YOURS_DONE}>
        <div className="flex items-center gap-4 sm:gap-6">
          <BuildBrain color={colorValue} ink={ink} className="size-16 shrink-0 sm:size-24" />
          {lettered ? (
            <BuildLettering ink={ink} strokeWidth={2.6} className="h-12 w-auto sm:h-[72px]" />
          ) : (
            <span className="font-vt323 text-5xl leading-none sm:text-6xl">{words}</span>
          )}
          {lettered && <span className="sr-only">{words}</span>}
        </div>
        {line && <p className="mt-6 max-w-xl font-google-sans-code text-base leading-relaxed sm:text-lg">{line}</p>}
        {external ? (
          <a href={target} target={target.startsWith('mailto:') ? undefined : '_blank'} rel="noopener noreferrer" onClick={onClick} className={linkClass} style={linkStyle}>
            {link}
          </a>
        ) : (
          <Link href={target} onClick={onClick} className={linkClass} style={linkStyle}>
            {link}
          </Link>
        )}
      </div>
    </section>
  );
}
