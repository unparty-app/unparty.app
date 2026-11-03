'use client';

import type { CSSProperties, ReactNode } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { beatDelay, beatMs, inkDuration, useInked } from './InkStage';

/**
 * The ink primitives (see InkStage for how they move together). SVG ones go
 * inside an <svg>; InkWord and InkSweep are HTML.
 */

interface StrokeProps {
  d: string;
  beat?: number;
  length?: number; // The stroke's rough length in its own units: sets how long it draws
  width?: number;
  color?: string;
  opacity?: number;
  scaling?: boolean; // false: the stroke keeps its width in a stretched SVG
}

/** A pen stroke that draws itself in */
export function InkLine({ d, beat = 0, length = 600, width = 2.4, color, opacity = 1, scaling = true }: StrokeProps) {
  const { colorValue } = useTheme();
  if (!useInked()) return null;
  return (
    <path
      d={d}
      className="ink-draw"
      pathLength={1}
      fill="none"
      stroke={color ?? colorValue}
      strokeOpacity={opacity}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      vectorEffect={scaling ? undefined : 'non-scaling-stroke'}
      style={{ ...beatDelay(beat), animationDuration: `${inkDuration(length)}ms` }}
    />
  );
}

/** A short mark (a tally, a tick): a quick stroke */
export function InkMark(props: StrokeProps) {
  return <InkLine length={40} width={1.8} {...props} />;
}

interface DotProps {
  cx: number;
  cy: number;
  r?: number;
  beat?: number;
  color?: string;
  breathe?: boolean; // The one thing that keeps moving: "now"
}

/** A point that lands with a little overshoot; `breathe` sends a slow ring out of it */
export function InkDot({ cx, cy, r = 5, beat = 0, color, breathe = false }: DotProps) {
  const { colorValue } = useTheme();
  if (!useInked()) return null;
  const fill = color ?? colorValue;
  return (
    <g>
      {breathe && <circle className="ink-now" cx={cx} cy={cy} r={r + 1} fill="none" stroke={fill} strokeWidth={1.5} />}
      <circle className="ink-land" cx={cx} cy={cy} r={r} fill={fill} style={beatDelay(beat)} />
    </g>
  );
}

interface WordProps {
  children: ReactNode;
  beat?: number;
  className?: string;
  style?: CSSProperties;
  as?: 'span' | 'div';
}

/** A label that rises into place after the strokes it names */
export function InkWord({ children, beat = 0, className = '', style, as: Tag = 'span' }: WordProps) {
  const inked = useInked();
  return (
    <Tag className={`${inked ? 'ink-rise' : 'opacity-0'} ${className}`} style={{ ...beatDelay(beat), ...style }}>
      {children}
    </Tag>
  );
}

interface SweepProps {
  children: ReactNode;
  beat?: number;
  className?: string;
  style?: CSSProperties;
}

/** Something revealed left to right, like a bar drawn in one pass */
export function InkSweep({ children, beat = 0, className = '', style }: SweepProps) {
  const inked = useInked();
  return (
    <span
      className={`block transition-[clip-path] duration-700 ease-out motion-reduce:transition-none ${className}`}
      style={{
        clipPath: inked ? 'inset(-4px)' : 'inset(-4px 100% -4px -4px)',
        transitionDelay: `${beatMs(beat)}ms`,
        ...style,
      }}
    >
      {children}
    </span>
  );
}
