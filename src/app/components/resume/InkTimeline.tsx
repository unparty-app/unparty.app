'use client';

import { useTheme } from '../../contexts/ThemeContext';
import InkStage, { beatDelay, useInked } from '../ink/InkStage';
import { InkDot, InkLine, InkMark, InkWord } from '../ink/primitives';
import { monthName, penPath, wobble } from '../ink/pen';
import type { TimelineMonth, TimelineSeries } from './types';

interface InkTimelineProps {
  label: string; // What the chart shows, for screen readers
  months?: TimelineMonth[]; // One running total
  series?: TimelineSeries[]; // Or several lines, one per area: where the effort goes
}

const W = 640;
const H = 200;
const PAD_X = 10;
const TOP = 14;
const BASE = 150; // The floor; tally marks hang below it

// A series with no color of its own: the theme color, each next one lighter
const SERIES_OPACITY = [1, 0.62, 0.42, 0.28, 0.2];

/**
 * A timeline drawn in ink (components/ink): the line draws first, the marks
 * follow along the months, the labels rise last, and the latest point
 * breathes.
 *
 * - `months`: one running total, with a tally mark under each month as tall
 *   as what landed that month.
 * - `series`: one running total per area, on one scale, named at its end.
 *   The steepest line is where the work goes now, and a line overtaking
 *   another is effort shifting.
 *
 * The numbers are the article's to say.
 */
export default function InkTimeline({ label, months, series }: InkTimelineProps) {
  const { colorValue } = useTheme();
  const lines = series?.length ? series : months?.length ? [{ name: '', months }] : [];
  if (lines.length === 0) return null;
  const multi = !!series?.length;

  // Every line on the same months: from the earliest to the latest any line has
  const keys = [...new Set(lines.flatMap(line => line.months.map(month => month.month)))].sort();
  const span = monthsBetween(keys[0], keys[keys.length - 1]);
  const values = lines.map(line => {
    const counts = new Map(line.months.map(month => [month.month, month.count]));
    let total = 0;
    return span.map(month => (total += counts.get(month) ?? 0));
  });
  const max = Math.max(1, ...values.flat());
  const step = span.length > 1 ? (W - PAD_X * 2) / (span.length - 1) : 0;
  const x = (index: number) => (span.length > 1 ? PAD_X + index * step : W / 2);
  const y = (value: number) => TOP + (1 - value / max) * (BASE - TOP);
  const strokes = values.map((row, lineIndex) =>
    row.map((value, index) => [x(index), y(value) + wobble(index + lineIndex * 31)] as const)
  );
  const last = span.length - 1;

  // Each area is named where its line ends. Two that end close stack a line
  // apart in pixels, not in percent, so they hold apart on a short phone chart
  const ends = strokes
    .map((points, lineIndex) => ({ lineIndex, top: (points[last][1] / H) * 100, below: 0 }))
    .sort((a, b) => a.top - b.top);
  for (let index = 1; index < ends.length; index++) {
    const above = ends[index - 1];
    if (ends[index].top - above.top < 9) Object.assign(ends[index], { top: above.top, below: above.below + 1 });
  }

  const tallies = !multi ? lines[0].months : [];
  const maxCount = Math.max(1, ...tallies.map(month => month.count));
  const colorOf = (lineIndex: number) => lines[lineIndex].color ?? colorValue;
  const opacityOf = (lineIndex: number) => (lines[lineIndex].color ? 1 : SERIES_OPACITY[lineIndex] ?? 0.2);

  return (
    <InkStage>
      <div className={multi ? 'relative pr-24 sm:pr-28' : 'relative'}>
        <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full overflow-visible" role="img" aria-label={label}>
          {!multi && <AreaFill d={`${penPath(strokes[0])} L${x(last)} ${BASE} L${x(0)} ${BASE} Z`} />}
          {strokes.map((points, lineIndex) => (
            <InkLine
              key={lineIndex}
              d={span.length === 1 ? `M${PAD_X} ${points[0][1]} L${W - PAD_X} ${points[0][1]}` : penPath(points)}
              beat={lineIndex * 3}
              length={W * 1.4}
              color={colorOf(lineIndex)}
              opacity={opacityOf(lineIndex)}
            />
          ))}
          {tallies.map(month => {
            const index = span.indexOf(month.month);
            if (month.count === 0 || index < 0) return null;
            const isLast = index === last;
            return (
              <InkMark
                key={month.month}
                d={`M${x(index) + wobble(index + 7) * 0.5} ${BASE + 8} l${wobble(index + 3) * 0.6} ${6 + (month.count / maxCount) * 30}`}
                beat={6 + (index / span.length) * 10}
                color={isLast ? colorValue : 'var(--text-muted)'}
                opacity={isLast ? 1 : 0.55}
                width={isLast ? 2.6 : 1.8}
              />
            );
          })}
          {strokes.map((points, lineIndex) => (
            <InkDot
              key={lineIndex}
              cx={points[last][0]}
              cy={points[last][1]}
              r={lineIndex === 0 ? 5 : 3.5}
              beat={14 + lineIndex}
              color={colorOf(lineIndex)}
              breathe={lineIndex === 0}
            />
          ))}
        </svg>

        {multi &&
          ends.map(({ lineIndex, top, below }) => (
            // The wrapper places the name; InkWord's rise animates inside it
            <div key={lineIndex} className="absolute right-0 w-24 -translate-y-1/2 sm:w-28" style={{ top: `calc(${top}% + ${below * 20}px)` }}>
              <InkWord
                beat={16 + lineIndex}
                className="max-w-full truncate font-vt323 text-lg leading-none"
                style={{ color: lineIndex === 0 || lines[lineIndex].color ? colorOf(lineIndex) : 'var(--foreground)', opacity: lineIndex === 0 ? 1 : 0.75 }}
              >
                {lines[lineIndex].name}
              </InkWord>
            </div>
          ))}
      </div>

      <div className={`mt-1 flex justify-between font-vt323 text-sm ${multi ? 'pr-24 sm:pr-28' : ''}`} style={{ color: 'var(--text-muted)' }}>
        <InkWord beat={18}>{monthName(span[0])}</InkWord>
        {span.length > 1 && <InkWord beat={18}>{monthName(span[last])}</InkWord>}
      </div>
    </InkStage>
  );
}

/** The faint wash under a running total, fading in as its line draws */
function AreaFill({ d }: { d: string }) {
  const { colorValue } = useTheme();
  if (!useInked()) return null;
  return <path d={d} fill={colorValue} fillOpacity={0.08} className="ink-fade" style={beatDelay(4)} />;
}

/** Every month from first to last, inclusive ("2025-11" … "2026-10") */
function monthsBetween(first: string, last: string): string[] {
  const out: string[] = [];
  let [year, month] = first.split('-').map(Number);
  for (;;) {
    const key = `${year}-${String(month).padStart(2, '0')}`;
    out.push(key);
    if (key >= last) break;
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return out;
}
