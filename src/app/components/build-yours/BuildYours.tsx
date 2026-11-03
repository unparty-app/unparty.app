'use client';

import { useEffect, useRef, useState } from 'react';
import { BRAIN_PATHS, type BrainRole } from './brain';
import { LETTERING_STROKES, LETTERING_VIEWBOX } from './lettering';
import type { Lettering } from './phrases';

// The pink of the brain's lightbulb, from build.svg
const BULB = '#cd7179';

// Total time the pen takes to write "build yours"
const WRITE_MS = 1300;
// The brain shows first, then the writing starts
const WRITE_DELAY_MS = 250;

// Idle accent: at most this often, and only after this long without the
// visitor scrolling, pointing or typing
const ACCENT_EVERY_MS = 18000;
const IDLE_FOR_MS = 4000;
const LIT_MS = 1400;

/**
 * Dark or light ink for text on the theme color: the one that contrasts more,
 * by WCAG relative luminance (0.179 is where black and white tie). The site is
 * always dark (FORCE_DARK_MODE), so --background is the dark ink and
 * --foreground the light one.
 */
export function inkOn(color: string): string {
  const hex = /^#?([0-9a-f]{6})$/i.exec(color.trim())?.[1];
  if (!hex) return 'var(--background)';
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.179 ? 'var(--background)' : 'var(--foreground)';
}

/**
 * The bulb flickers on every so often, but only while the visitor is idle
 * (not scrolling, pointing or typing), the tab is visible and the button is
 * on screen, so it catches a resting eye without interrupting reading.
 */
function useIdleAccent(ref: React.RefObject<HTMLElement | null>) {
  const [lit, setLit] = useState(false);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let lastActive = Date.now();
    const active = () => { lastActive = Date.now(); };
    const events = ['scroll', 'pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart'] as const;
    events.forEach((e) => window.addEventListener(e, active, { passive: true }));
    let off: number | undefined;
    const tick = window.setInterval(() => {
      const el = ref.current;
      if (!el || document.hidden || Date.now() - lastActive < IDLE_FOR_MS) return;
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight || r.width === 0) return;
      setLit(true);
      off = window.setTimeout(() => setLit(false), LIT_MS);
    }, ACCENT_EVERY_MS);
    return () => {
      events.forEach((e) => window.removeEventListener(e, active));
      window.clearInterval(tick);
      window.clearTimeout(off);
    };
  }, [ref]);
  return lit;
}

/** The brand brain: its yellow takes `color`, its outlines `ink`; the bulb animates (.build-yours__bulb). */
export function BuildBrain({ color, ink, className = '' }: { color: string; ink: string; className?: string }) {
  const fills: Record<BrainRole, string> = { fill: color, bulb: BULB, ink };
  return (
    <svg viewBox="0 0 256 256" aria-hidden="true" className={`build-yours__brain ${className}`}>
      {BRAIN_PATHS.map((p, i) => (
        <path key={i} d={p.d} fill={fills[p.role]} className={p.role === 'bulb' ? 'build-yours__bulb' : undefined} />
      ))}
    </svg>
  );
}

/**
 * "build yours" in the single-stroke script, each stroke timed to write in
 * at one pen speed after the brain shows (.build-yours__words). `lettering`
 * writes another phrase in the same hand (phrases.ts), and `delayMs` waits
 * longer before the pen starts (a pill further along a row).
 */
export function BuildLettering({
  ink,
  className = '',
  strokeWidth = 3.4,
  lettering,
  delayMs = WRITE_DELAY_MS,
}: {
  ink: string;
  className?: string;
  strokeWidth?: number;
  lettering?: Lettering;
  delayMs?: number;
}) {
  const strokes = lettering?.strokes ?? LETTERING_STROKES;
  const total = strokes.reduce((sum, s) => sum + s.len, 0);
  let written = 0;
  return (
    <svg
      viewBox={lettering?.viewBox ?? LETTERING_VIEWBOX}
      aria-hidden="true"
      fill="none"
      stroke={ink}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`build-yours__words ${className}`}
    >
      {strokes.map((s, i) => {
        const start = delayMs + (written / total) * WRITE_MS;
        const duration = Math.max(60, (s.len / total) * WRITE_MS);
        written += s.len;
        return (
          <path
            key={i}
            d={s.d}
            pathLength={1}
            style={{ animationDelay: `${Math.round(start)}ms`, animationDuration: `${Math.round(duration)}ms` }}
          />
        );
      })}
    </svg>
  );
}

/** Tells CSS when the bulb should light: as the writing finishes. */
export const BUILD_YOURS_DONE = { '--build-yours-done': `${WRITE_DELAY_MS + WRITE_MS}ms` } as React.CSSProperties;

/**
 * BuildYours - the Fab's "build yours": the unparty build brain beside the
 * words, hand-written in a single-stroke script.
 *
 * On first view the brain appears, the words write themselves in (one pen
 * speed across all strokes), and the brain's bulb lights up as they finish:
 * an idea, then "build yours". After that the bulb flickers on only now and
 * then while the visitor is idle, and whenever the button is hovered or
 * focused (globals.css .build-yours). Reduced motion shows it all finished
 * and still.
 *
 * The brain's yellow follows the theme (it takes `color`, the pill's own
 * color, so it reads as line art on any theme); its outlines and the words
 * use `inkOn(color)`. Below sm only the brain shows, as the icon, unless
 * `words="always"` (a pill in a row of written pills, ProjectBelt).
 */
export default function BuildYours({ color, words = 'wide' }: { color: string; words?: 'wide' | 'always' }) {
  const ref = useRef<HTMLSpanElement>(null);
  const lit = useIdleAccent(ref);
  const ink = inkOn(color);

  return (
    <span ref={ref} className="build-yours flex items-center gap-2" data-lit={lit || undefined} style={BUILD_YOURS_DONE}>
      <BuildBrain color={color} ink={ink} className="size-6 shrink-0 sm:size-7" />
      <BuildLettering ink={ink} className={words === 'always' ? 'h-[26px] w-auto' : 'hidden h-[26px] w-auto sm:block'} />
    </span>
  );
}
