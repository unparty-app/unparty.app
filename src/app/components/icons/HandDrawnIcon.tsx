'use client';

import { useSyncExternalStore, type ComponentType, type CSSProperties, type ReactNode } from 'react';
import founders from '../../../data/FoundersConfig.json';
import drawn from './drawn.json';
import { noVisitorIcons, subscribeVisitorIcons, visitorIcons } from './visitorIcons';

/**
 * The props every hand-drawn icon takes: `size`, `className`, `style` and
 * `strokeWidth` (the ones the lucide icons took, so #1391 swapped them by
 * import), plus `color` and `themed`. An icon draws in the text color
 * (currentColor), so it keeps whatever color its call site or parent gives it
 * (a white check on a green badge, a black + on a theme-colored button).
 * `themed` opts into the theme color.
 */
export interface HandDrawnIconProps {
  size?: number | string; // Width and height, like lucide's size (default 24)
  className?: string;
  style?: CSSProperties;
  strokeWidth?: number; // In the 24-unit grid, so it scales with size (default: see strokeFor)
  color?: string; // An explicit stroke color; wins over `themed`
  themed?: boolean; // Draw in the theme color (--theme-color, ThemeContext's colorValue) instead of the text color
}

/** The type of an icon passed around as a value (in nav and widget configs). */
export type HandDrawnIconComponent = ComponentType<HandDrawnIconProps>;

/**
 * The default stroke for an icon's rendered size. Strokes scale with the
 * icon, so a pen line that reads at 24px is too thin at 12-16px, where most
 * icons render: small icons get a heavier line. The size comes from `size`,
 * or from a Tailwind `h-N` / `size-N` class (h-4 = 16px), since many call
 * sites size icons with classes.
 */
function strokeFor(size: number | string, className: string): number {
  const fromClass = /(?:^|\s)(?:size|h)-(\d+(?:\.5)?)(?=\s|$)/.exec(className);
  const px = fromClass ? Number(fromClass[1]) * 4 : typeof size === 'number' ? size : parseFloat(size);
  if (Number.isNaN(px)) return 1.75;
  if (px <= 16) return 2.25;
  if (px <= 20) return 2;
  return 1.75;
}

// The theme color as ThemeContext publishes it (document --theme-color).
// Read as a CSS variable, not through useTheme(), so icons import nothing but
// React: config files that list icons (unpppNav) stay loadable by build
// scripts (generate-route-manifest). Before hydration it falls back to the
// text color.
const THEME_STROKE = 'var(--theme-color, currentColor)';

// Drawings made on the icon pad (IconDrawPad), by icon name, each a list of
// pen strokes on the 24×24 grid. The site owner's own (FoundersConfig.json
// `icons`) win over the app's defaults (drawn.json, drawn by unparty's
// founder and shipped with every copy), which win over the strokes in code.
// JSON, not useTheme-style context, for the same reason as THEME_STROKE
const OWNER_DRAWN = ((founders as { icons?: Record<string, string[]> }).icons ?? {});
const DEFAULT_DRAWN = drawn as Record<string, string[]>;

/** The pad drawing for an icon, the owner's first, or undefined */
export function drawingFor(name: string): string[] | undefined {
  const strokes = OWNER_DRAWN[name]?.length ? OWNER_DRAWN[name] : DEFAULT_DRAWN[name];
  return strokes?.length ? strokes : undefined;
}

interface HandDrawnIconBaseProps extends HandDrawnIconProps {
  children: ReactNode; // The pen strokes, drawn on a 24×24 grid
  name?: string; // The icon's export name, so a pad drawing of it replaces the strokes in code
  transform?: string; // Turns the drawing, for icons that are another icon facing a new way
}

/**
 * HandDrawnIcon - the shared frame for every hand-drawn icon: a 24×24 grid,
 * round pen strokes sized for how big the icon renders (strokeFor), no fill,
 * in the text color, or the theme color with `themed`. Icons are decorative
 * (`aria-hidden`); the button or link around them carries the label.
 * With a `name` that has a pad drawing, it draws that instead: the visitor's
 * own (kept in their browser, visitorIcons) first, then drawingFor.
 */
export default function HandDrawnIcon({
  size = 24,
  className = '',
  style,
  strokeWidth,
  color,
  themed = false,
  children,
  name,
  transform,
}: HandDrawnIconBaseProps) {
  const mine = useSyncExternalStore(subscribeVisitorIcons, visitorIcons, noVisitorIcons);
  const pad = name ? (mine[name]?.length ? mine[name] : drawingFor(name)) : undefined;
  const strokes = pad ? pad.map((d, i) => <path key={i} d={d} />) : children;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? (themed ? THEME_STROKE : 'currentColor')}
      strokeWidth={strokeWidth ?? strokeFor(size, className)}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      style={style}
    >
      {transform ? <g transform={transform}>{strokes}</g> : strokes}
    </svg>
  );
}
