'use client';

import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import InkStage from './ink/InkStage';
import { InkMark, InkWord } from './ink/primitives';
import { wobble } from './ink/pen';
import { hourName, peakHour, rhythmYears, type BaselineRhythmYear } from '@/lib/baseline';
import { BASELINE } from '@/app/constants/organization';

const W = 240;
const H = 40;
const BASE = 36; // Each hour's stroke rises from here
const TOP = 3;
const HOURS = 24;

const shareOf = (year: BaselineRhythmYear, hour: number) => {
  const total = year.hours.reduce((sum, n) => sum + n, 0);
  return total ? year.hours[hour] / total : 0;
};
const percent = (share: number) => (share < 0.01 && share > 0 ? '<1%' : `${Math.round(share * 100)}%`);

/**
 * When the builder works, year over year (#1650): a row per year, a stroke an
 * hour as tall as that hour's share of the year's commits, the year's peak
 * hour in the theme color and the rest in muted ink, so the rows show the
 * work's shape changing as it grew. Each row ends on the year's commits.
 * Pointing at an hour reads it out.
 *
 * Drawn from FoundersConfig `baseline.rhythm`, which the owner measures from
 * their own git history (src/lib/baseline.ts); the sentence over it is the
 * article's (src/lib/build-story.ts). An article's component section passes
 * no years, so it draws the owner's own.
 */
export default function BuildRhythm({ years = rhythmYears(BASELINE) }: { years?: BaselineRhythmYear[] }) {
  const { colorValue } = useTheme();
  const [point, setPoint] = useState<{ row: number; hour: number } | null>(null);
  if (!years.length) return null;
  // One scale for every year: the shapes compare, not the totals
  const max = Math.max(0.01, ...years.flatMap((year) => year.hours.map((_, hour) => shareOf(year, hour))));
  const step = W / HOURS;
  const x = (hour: number) => (hour + 0.5) * step;

  const pointed = point ? years[point.row] : null;
  const readout =
    point && pointed
      ? `${pointed.year} · ${hourName(point.hour)} · ${percent(shareOf(pointed, point.hour))} of the year's commits`
      : `the busiest hour each year, in color`;

  return (
    <InkStage>
      <ul className="space-y-3" onMouseLeave={() => setPoint(null)}>
        {years.map((year, row) => {
          const peak = peakHour(year);
          return (
            <li key={year.year} className="grid grid-cols-[3rem_1fr_4.5rem] items-end gap-3 sm:grid-cols-[4rem_1fr_6rem]">
              <InkWord beat={row} className="pb-1 font-vt323 text-xl leading-none" style={{ color: 'var(--foreground)' }}>
                {year.year}
              </InkWord>
              <div className="relative h-11">
                <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="block size-full overflow-visible" aria-hidden="true">
                  <line x1={0} x2={W} y1={BASE + 1} y2={BASE + 1} stroke={`color-mix(in srgb, ${colorValue} 35%, transparent)`} strokeWidth={1} vectorEffect="non-scaling-stroke" />
                  {year.hours.map((count, hour) => {
                    if (!count) return null;
                    const lit = point ? point.row === row && point.hour === hour : hour === peak;
                    return (
                      <InkMark
                        key={hour}
                        d={`M${x(hour) + wobble(hour + row * 13) * 0.4} ${BASE} L${x(hour) + wobble(hour + row * 13 + 5) * 0.6} ${BASE - Math.max(2, (shareOf(year, hour) / max) * (BASE - TOP))}`}
                        beat={2 + row * 2 + hour * 0.15}
                        color={lit ? colorValue : 'var(--text-muted)'}
                        opacity={lit ? 1 : 0.55}
                        width={lit ? 4 : 3}
                        scaling={false}
                      />
                    );
                  })}
                  {/* Hit targets wider than the strokes: one per hour */}
                  {year.hours.map((_, hour) => (
                    <rect key={hour} x={hour * step} y={0} width={step} height={H} fill="transparent" onMouseEnter={() => setPoint({ row, hour })} onClick={() => setPoint({ row, hour })}>
                      <title>{`${year.year}, ${hourName(hour)}: ${percent(shareOf(year, hour))}`}</title>
                    </rect>
                  ))}
                </svg>
              </div>
              <InkWord beat={3 + row} className="pb-1 text-right font-vt323 text-lg leading-none" style={{ color: 'var(--foreground)' }}>
                {year.commits.toLocaleString('en-US')}
                <span className="block font-google-sans-code text-[10px] uppercase tracking-wide text-[var(--text-muted)]">{year.through ? 'so far' : 'commits'}</span>
              </InkWord>
            </li>
          );
        })}
      </ul>

      <div className="mt-3 grid grid-cols-[3rem_1fr_4.5rem] gap-3 font-vt323 text-sm sm:grid-cols-[4rem_1fr_6rem]" style={{ color: 'var(--text-muted)' }}>
        <span />
        <span className="flex justify-between">
          <span>midnight</span>
          <span>6am</span>
          <span>noon</span>
          <span>6pm</span>
          <span className="opacity-0" aria-hidden="true">.</span>
        </span>
      </div>

      <p className="mt-5 min-h-6 font-vt323 text-lg" style={{ color: 'var(--text-muted)' }} aria-live="polite">
        {readout}
      </p>

      {/* sr-only on a wrapper: a table sizes to its content and ignores
          sr-only's 1px width, which widened the page on phones */}
      <div className="sr-only">
        <table>
          <caption>Share of each year&apos;s commits by hour of the day</caption>
          <thead>
            <tr>
              <th scope="col">Year</th>
              <th scope="col">Busiest hour</th>
              <th scope="col">Commits</th>
            </tr>
          </thead>
          <tbody>
            {years.map((year) => (
              <tr key={year.year}>
                <th scope="row">{year.year}</th>
                <td>{hourName(peakHour(year))}</td>
                <td>{year.commits}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </InkStage>
  );
}
