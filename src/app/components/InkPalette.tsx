'use client';

import { useTheme } from '../contexts/ThemeContext';
import InkStage from './ink/InkStage';
import { InkDot, InkLine, InkWord } from './ink/primitives';
import { penPath, wobble } from './ink/pen';
import { CSS_COLOR_ROLES, hasBrandInfo, ParsedCssBrandInfo } from '../utils/importColorsCss';

interface InkPaletteProps {
  colors: string[]; // 5 slots, '' = unset
  onRemove?: (index: number) => void; // Tap a line to clear it
  brand?: ParsedCssBrandInfo; // Whose palette it is, named above its lines
}

const W = 640;
const H = 30;
const POINTS = 9;
const START = 6;
const END = W - 12;
const STROKE = 10;

/** One color's pen stroke, the same hand every time, different for each role */
const strokeFor = (row: number) =>
  penPath(
    Array.from({ length: POINTS }, (_, i) => {
      const x = START + (i / (POINTS - 1)) * (END - START);
      return [x, H / 2 + wobble(i + row * 31, 5)] as const;
    })
  );

/**
 * A palette in ink (components/ink): one pen stroke per role, drawn in that
 * color, each named at its end the way InkTimeline names its lines. They draw
 * in one after another, and the primary keeps a slow pulse. A role with no
 * color yet is a faint line waiting for one.
 *
 * Every stroke has a faint one under it, so a color close to the page's own
 * (a dark purple on the dark site) still reads as a line.
 */
export default function InkPalette({ colors, onRemove, brand }: InkPaletteProps) {
  const { colorValue } = useTheme();
  const slots = colors.length === 5 ? colors : new Array<string>(5).fill('');
  const named = !!brand && hasBrandInfo(brand);

  return (
    <InkStage className="w-full text-left">
      {named && (
        <div className="mb-5 flex flex-col items-start">
          {brand.name && <InkWord as="div" className="font-vt323 text-3xl uppercase leading-none text-[var(--foreground)]">{brand.name}</InkWord>}
          {brand.tagline && <InkWord as="div" beat={2} className="mt-1 font-space-grotesk text-sm leading-snug text-[var(--foreground)]">{brand.tagline}</InkWord>}
          {brand.description && <InkWord as="div" beat={3} className="mt-2 font-space-grotesk text-xs leading-relaxed text-[var(--text-muted)]">{brand.description}</InkWord>}
        </div>
      )}

      <ul className="flex flex-col">
        {CSS_COLOR_ROLES.map(({ key, label }, index) => {
          const hex = slots[index];
          const canClear = !!hex && !!onRemove;
          const row = (
            <>
              {/* The key redraws a line when its color changes */}
              <svg key={hex || 'empty'} viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full min-w-0 overflow-visible sm:w-auto sm:flex-1" aria-hidden="true">
                {hex ? (
                  <>
                    <InkLine d={strokeFor(index)} beat={index * 4} length={W} width={STROKE + 4} color="var(--foreground)" opacity={0.14} />
                    <InkLine d={strokeFor(index)} beat={index * 4} length={W} width={STROKE} color={hex} />
                    <InkDot cx={END} cy={H / 2} r={7} beat={index * 4 + 8} color={hex} breathe={index === 0} />
                  </>
                ) : (
                  <InkLine d={strokeFor(index)} beat={index * 4} length={W} width={2} color="var(--text-muted)" opacity={0.3} />
                )}
              </svg>
              {/* Under its line on a phone, where the line needs the width; at its end above that */}
              <span className="flex shrink-0 items-baseline gap-2 sm:w-28 sm:flex-col sm:items-start sm:gap-0.5">
                <InkWord beat={index * 4 + 10} className="font-vt323 text-lg leading-none" style={{ color: hex ? 'var(--foreground)' : 'var(--text-muted)', opacity: hex ? 1 : 0.5 }}>
                  {hex || '—'}
                </InkWord>
                <InkWord beat={index * 4 + 10} className="font-google-sans-code text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                  {label}
                </InkWord>
              </span>
            </>
          );
          const rowClass = 'flex min-h-11 w-full flex-col gap-1 py-2 text-left sm:flex-row sm:items-center sm:gap-3 sm:py-1';
          return (
            <li key={key}>
              {canClear ? (
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  aria-label={`Clear ${label}, ${hex}`}
                  className={`${rowClass} rounded outline-none transition-opacity duration-150 hover:opacity-70 focus-visible:ring-2`}
                  style={{ ['--tw-ring-color' as string]: colorValue }}
                >
                  {row}
                </button>
              ) : (
                <div className={rowClass} aria-label={hex ? `${label}, ${hex}` : `${label}, not set`} role="group">
                  {row}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </InkStage>
  );
}

interface InkStripProps {
  colors: string[];
  onRemove?: (index: number) => void; // Tap a stroke to clear it
  className?: string;
}

/**
 * The same five strokes, small and side by side: a palette at a glance, where
 * InkPalette would take the whole page. A stroke with no color is faint.
 */
export function InkStrip({ colors, onRemove, className = '' }: InkStripProps) {
  const { colorValue } = useTheme();
  return (
    <InkStage className={`flex w-full items-center gap-2 ${className}`}>
      {CSS_COLOR_ROLES.map(({ key, label }, index) => {
        const hex = colors[index];
        const stroke = (
          <svg key={hex || 'empty'} viewBox="0 0 100 24" className="block h-auto w-full overflow-visible" aria-hidden="true">
            {hex ? (
              <>
                <InkLine d={stripStroke(index)} beat={index * 2} length={100} width={13} color="var(--foreground)" opacity={0.14} />
                <InkLine d={stripStroke(index)} beat={index * 2} length={100} width={10} color={hex} />
              </>
            ) : (
              <InkLine d={stripStroke(index)} beat={index * 2} length={100} width={3} color="var(--text-muted)" opacity={0.3} />
            )}
          </svg>
        );
        return hex && onRemove ? (
          <button
            key={key}
            type="button"
            onClick={() => onRemove(index)}
            aria-label={`Clear ${label}, ${hex}`}
            className="min-h-11 min-w-0 flex-1 rounded outline-none transition-opacity duration-150 hover:opacity-70 focus-visible:ring-2"
            style={{ ['--tw-ring-color' as string]: colorValue }}
          >
            {stroke}
          </button>
        ) : (
          <div key={key} className="min-w-0 flex-1">{stroke}</div>
        );
      })}
    </InkStage>
  );
}

const stripStroke = (index: number) =>
  penPath(Array.from({ length: 4 }, (_, i) => [4 + (i / 3) * 92, 12 + wobble(i + index * 17, 4)] as const));
