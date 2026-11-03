'use client';

import { createContext, useContext, type CSSProperties, type ReactNode } from 'react';
import { useInView } from '../../hooks/useInView';

/**
 * Ink: the house motion for charts drawn by hand. Every chart composes the
 * same few primitives (InkLine, InkMark, InkDot, InkWord, InkSweep) inside an
 * InkStage, so they all move the same way:
 *
 * - Nothing moves until the stage scrolls into view; then the primitives
 *   mount, and mounting is the animation (.ink-draw and friends in
 *   globals.css), so it plays where the reader can see it.
 * - Order is told in beats: a primitive's `beat` is its place in the
 *   sequence, and the stage turns it into a delay. Strokes draw first, marks
 *   follow along their axis, words rise last.
 * - A stroke draws at a speed tied to its length (inkDuration), so a long
 *   line takes longer than a tick, like a pen.
 * - One thing per chart keeps moving: InkDot's `breathe`, for "now".
 * - Reduced motion shows the finished drawing (globals.css).
 *
 * The color is the theme color unless a primitive is given its own.
 */

export const BEAT_MS = 90;

const InkContext = createContext<{ inked: boolean }>({ inked: false });

/** True once the stage has been seen: primitives render only then */
export const useInked = () => useContext(InkContext).inked;

/** A beat's delay in milliseconds */
export const beatMs = (beat = 0) => Math.round(beat * BEAT_MS);

/** A beat's delay, as the CSS variable the ink animations read */
export const beatDelay = (beat = 0): CSSProperties => ({ ['--ink-delay' as string]: `${beatMs(beat)}ms` }) as CSSProperties;

/** How long a stroke of this length (in its own units) takes to draw */
export const inkDuration = (length: number) => Math.round(Math.min(1600, Math.max(450, length * 1.6)));

interface InkStageProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export default function InkStage({ children, className, style }: InkStageProps) {
  const [ref, inView] = useInView<HTMLDivElement>();
  return (
    <div ref={ref} className={className} style={style}>
      <InkContext.Provider value={{ inked: inView }}>{children}</InkContext.Provider>
    </div>
  );
}
