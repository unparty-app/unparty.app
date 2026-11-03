'use client';

/**
 * Pen strokes for the stack builder, in the same hand as HandDrawnArrow: each
 * draws itself in when it mounts (.ink-draw in globals.css), so mounting one
 * is the animation. A new key replays it. Reduced motion shows them drawn.
 * `--ink-delay` on a path staggers it.
 */

interface InkProps {
  color: string;
  className?: string;
}

/** A loose loop around a word, its tail overshooting the start: the chosen one. */
export function InkCircle({ color, className = '' }: InkProps) {
  return (
    <svg viewBox="0 0 100 40" preserveAspectRatio="none" fill="none" aria-hidden="true" className={`pointer-events-none overflow-visible ${className}`}>
      <path
        className="ink-draw ink-draw--slow"
        pathLength={1}
        d="M57 4.6C35 3.4 9.5 7.6 5.2 18.4c-3.8 9.6 17 16.9 42.6 17.1 26.2.2 48.6-6.2 47.4-16.4C94 10.6 74.3 4.4 50.8 4.9 37 5.2 24.6 7.4 17.2 10.6"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/** A quick tick, short stroke then the long one. */
export function InkCheck({ color, className = 'size-4' }: InkProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        className="ink-draw"
        pathLength={1}
        d="M4 12.8c1.9 1.3 3.6 3.1 5.2 5.4C12 12.4 15.6 7.4 20.4 3.8"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * The toggle: a ring drawn in one wobbly pass, with a tick inside when on.
 * The ring draws once; the tick draws each time the service is turned on.
 */
export function InkRing({ color, on, className = 'size-7' }: InkProps & { on: boolean }) {
  return (
    <svg viewBox="0 0 28 28" fill="none" aria-hidden="true" className={`shrink-0 overflow-visible ${className}`}>
      <circle cx="14" cy="14" r="11.5" fill={color} opacity={on ? 0.14 : 0} className="transition-opacity duration-300" />
      <path
        className="ink-draw"
        pathLength={1}
        d="M15.2 2.6C8.6 2.2 2.9 7 2.6 13.6c-.3 6.7 4.9 11.9 11.4 11.9 6.4 0 11.6-5 11.4-11.6C25.2 7.6 20.6 3 14.8 2.7c-2-.1-4 .4-5.6 1.2"
        stroke={color}
        strokeWidth={1.3}
        strokeLinecap="round"
      />
      {on && (
        <path
          className="ink-draw"
          pathLength={1}
          d="M8.6 14.6c1.4 1 2.6 2.3 3.6 4C14.2 14 16.7 10.4 20 7.9"
          stroke={color}
          strokeWidth={1.9}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

/** A slightly uneven underline, for the total. */
export function InkUnderline({ color, className = '' }: InkProps) {
  return (
    <svg viewBox="0 0 200 10" preserveAspectRatio="none" fill="none" aria-hidden="true" className={`pointer-events-none overflow-visible ${className}`}>
      <path
        className="ink-draw ink-draw--slow"
        pathLength={1}
        d="M2 6.4c30-2.6 64-3.6 98-3 34 .5 64 1.8 98 .6"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
