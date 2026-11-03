'use client';

import Link from 'next/link';
import type { HandDrawnIconComponent } from '../icons';
import { BuildLettering, inkOn } from './BuildYours';
import { PHRASES } from './phrases';

interface ActionPillProps {
  // A phrase in phrases.ts ("try it", "price yours"), written by hand
  verb: string;
  // What it acts on or gives back, in small type after it ("BRAND PALETTE", "$21,842")
  note?: string;
  // Where it goes, or what it does (a button: start the clock)
  href?: string;
  onClick?: () => void;
  icon: HandDrawnIconComponent;
  color: string;
  // Its full name, for screen readers and agents ("Try Brand Palette, released as …")
  label: string;
  // When its pen starts, so pills along a row write one after another
  delayMs?: number;
  // `line`: drawn in `color` on the page instead of filled with it, for the
  // quieter of two choices ("nah" beside "take it")
  variant?: 'fill' | 'line';
}

/**
 * ActionPill - "build yours" made into any action: the same theme-colored
 * pill, a hand-drawn icon where the brain is (popping in the same way), the
 * verb written on in the same single-stroke hand, then a short note in small
 * type. The write-on waits while an ancestor `.build-yours` is data-paused,
 * so a row can hold it until it's seen. With `onClick` instead of `href` it's
 * a button.
 */
export default function ActionPill({ verb, note, href, onClick, icon: Icon, color, label, delayMs, variant = 'fill' }: ActionPillProps) {
  const line = variant === 'line';
  const ink = line ? 'var(--foreground)' : inkOn(color);
  const lettering = PHRASES[verb];
  const pill = {
    'aria-label': label,
    title: label,
    className:
      'inline-flex h-10 shrink-0 items-center gap-2 rounded-full pl-2.5 pr-4 transition duration-150 hover:opacity-85 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4',
    style: line ? { border: `1px solid ${color}`, outlineColor: color } : { backgroundColor: color, outlineColor: color },
  };
  const body = (
    <>
      <Icon size={22} color={ink} className="build-yours__brain size-6 shrink-0" />
      {lettering ? (
        <BuildLettering ink={ink} lettering={lettering} delayMs={delayMs} className="h-[26px] w-auto" />
      ) : (
        <span className="font-vt323 text-xl leading-none" style={{ color: ink }}>{verb}</span>
      )}
      {note && (
        <span className="whitespace-nowrap font-google-sans-code text-[10px] uppercase tracking-wide" style={{ color: ink, opacity: 0.75 }}>
          {note}
        </span>
      )}
    </>
  );
  return href ? (
    <Link href={href} {...pill}>
      {body}
    </Link>
  ) : (
    <button type="button" onClick={onClick} {...pill}>
      {body}
    </button>
  );
}
