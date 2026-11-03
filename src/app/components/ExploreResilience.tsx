'use client';

import { useMemo, useRef, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { BASELINE, BASELINE_SITE_HOST } from '../constants/organization';
import { WEEKDAYS, baselineProjects, buildCost, peakHour, rhythmYears, type Baseline, type BaselineProject, type BaselineRhythmYear } from '@/lib/baseline';
import { describeBaselineProject } from '../utils/baselineProject';
import SleekTabs from './SleekTabs';
import UnpppCircle from './UnpppCircle';
import ActionPill from './build-yours/ActionPill';
import InkStage from './ink/InkStage';
import { InkDot, InkLine, InkMark, InkWord } from './ink/primitives';
import { penPath, wobble } from './ink/pen';
import { Hammer } from './icons';

/**
 * ExploreResilience - what it took, and what it means for yours.
 *
 * Everything comes from FoundersConfig `baseline` (src/lib/baseline.ts), which
 * a copy ships with as unparty's and its owner replaces
 * (/article/setup-baseline):
 *
 * - What it took: `rhythm`, the owner's commits by hour of the day and day of
 *   the week, a year at a time. One ink line for the day, seven marks for the
 *   week; switching years redraws them, so the day moving shows.
 * - What you have: the visitor drags across the hours they can give, right
 *   under that line, and taps their days under the week. Their time sits next
 *   to the owner's instead of being described.
 * - What it means for yours: hours a week against a `projects` build's
 *   measured hours, as how long it would take at that pace. It starts on the
 *   project marked `site` (named by the site's address), and a few others of other sizes are a
 *   tap away. "price yours" takes that project to Goal Budget (?like=).
 *
 * Nothing is scored and nothing leaves the browser. With no rhythm, nothing
 * renders.
 */

// The site by its address ("unparty.app"): the project marked "site" goes by it
const SITE = BASELINE_SITE_HOST;

const W = 600;
const H = 120;
const CELL = W / 24;

const hourLabel = (hour: number) => {
  const h = ((hour % 24) + 24) % 24;
  if (h === 0) return '12am';
  if (h === 12) return 'noon';
  return h < 12 ? `${h}am` : `${h - 12}pm`;
};
const hoursOf = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

/** How long `hours` take at `perWeek`, said the way a person would */
function howLong(hours: number, perWeek: number): string {
  const weeks = hours / perWeek;
  if (weeks < 1.5) return `about ${Math.max(1, Math.round(weeks * 7))} days`;
  if (weeks < 9) return `about ${Math.round(weeks)} weeks`;
  const months = weeks / 4.345;
  if (months < 21) return `about ${Math.round(months)} months`;
  const years = months / 12;
  return `about ${years < 10 ? years.toFixed(1).replace(/\.0$/, '') : Math.round(years)} years`;
}

/** The site itself first, then a few others of other sizes, so the scale shows */
function projectChoices(baseline: Baseline): BaselineProject[] {
  const sorted = baselineProjects(baseline);
  const site = sorted.find((p) => p.site) ?? sorted[0];
  const rest = sorted.filter((p) => p !== site && p.hours > 0);
  const picks = [rest[0], rest[Math.floor(rest.length / 4)], rest[Math.floor(rest.length / 2)]];
  return [site, ...picks.filter((p, i) => p && picks.indexOf(p) === i)].filter(Boolean) as BaselineProject[];
}

function DayLine({ year, color }: { year: BaselineRhythmYear; color: string }) {
  const max = Math.max(1, ...year.hours);
  const points = year.hours.map((n, hour) => [(hour + 0.5) * CELL, H - 6 - (n / max) * (H - 20) + wobble(hour, 1.6)] as const);
  const peak = peakHour(year);
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="block h-auto w-full overflow-visible"
      role="img"
      aria-label={`${year.year}: commits by hour of the day, busiest around ${hourLabel(peak)}`}
    >
      <InkLine d={penPath(points)} length={W * 1.4} color={color} />
      <InkDot cx={points[peak][0]} cy={points[peak][1]} beat={12} breathe color={color} />
    </svg>
  );
}

/**
 * The visitor's hours, under the day line on the same scale: drag across to
 * mark (or unmark) a stretch, tap one, or tab to an hour and press enter
 */
function HourStrip({ hours, onChange, color }: { hours: Set<number>; onChange: (next: Set<number>) => void; color: string }) {
  const stripRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ from: number; add: boolean; base: Set<number> } | null>(null);

  const hourAt = (clientX: number) => {
    const rect = stripRef.current!.getBoundingClientRect();
    return Math.min(23, Math.max(0, Math.floor(((clientX - rect.left) / rect.width) * 24)));
  };
  const paint = (to: number) => {
    const d = drag.current!;
    const next = new Set(d.base);
    for (let h = Math.min(d.from, to); h <= Math.max(d.from, to); h++) {
      if (d.add) next.add(h);
      else next.delete(h);
    }
    onChange(next);
  };

  return (
    <div
      ref={stripRef}
      className="flex h-11 cursor-pointer select-none gap-px"
      style={{ touchAction: 'pan-y' }}
      role="group"
      aria-label="the hours you have"
      onPointerDown={(e) => {
        const from = hourAt(e.clientX);
        drag.current = { from, add: !hours.has(from), base: new Set(hours) };
        e.currentTarget.setPointerCapture(e.pointerId);
        paint(from);
      }}
      onPointerMove={(e) => drag.current && paint(hourAt(e.clientX))}
      onPointerUp={() => (drag.current = null)}
      onPointerCancel={() => (drag.current = null)}
    >
      {Array.from({ length: 24 }, (_, h) => {
        const on = hours.has(h);
        return (
          <button
            key={h}
            type="button"
            aria-pressed={on}
            aria-label={hourLabel(h)}
            // Pointers paint on the strip; this is the keyboard's way in
            onClick={(e) => {
              if (e.detail !== 0) return;
              const next = new Set(hours);
              if (on) next.delete(h);
              else next.add(h);
              onChange(next);
            }}
            className="flex-1 transition-colors duration-150 first:rounded-l-full last:rounded-r-full focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2"
            style={{ backgroundColor: on ? color : `${color}14`, outlineColor: color }}
          />
        );
      })}
    </div>
  );
}

export default function ExploreResilience() {
  const { colorValue } = useTheme();
  const years = useMemo(() => rhythmYears(BASELINE), []);
  const choices = useMemo(() => (BASELINE ? projectChoices(BASELINE) : []), []);
  const [chosenYear, setChosenYear] = useState<number | null>(null);
  const [hours, setHours] = useState<Set<number>>(new Set());
  const [days, setDays] = useState<Set<number>>(new Set());
  const [projectId, setProjectId] = useState<string | null>(null);

  if (!BASELINE || years.length === 0) return null;

  const first = years[0];
  const last = years[years.length - 1];
  const year = years.find((y) => y.year === chosenYear) ?? last;
  const dayMax = Math.max(1, ...year.days);
  const project = choices.find((p) => p.id === projectId) ?? choices[0];
  const perWeek = hours.size * days.size;
  const worth = project ? Math.round(buildCost(project.hours, BASELINE).total) : 0;
  const projectName = project ? (project.site ? SITE : describeBaselineProject(project).name) : '';

  const toggleDay = (i: number) =>
    setDays((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  return (
    <div className="my-12 w-screen mx-[calc(50%-50vw)] px-4 py-12 text-left sm:px-6 lg:px-12" style={{ backgroundColor: `${colorValue}08` }}>
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <p className="font-vt323 text-4xl leading-none sm:text-5xl" style={{ color: colorValue }}>what it took.</p>
          <SleekTabs
            label="year"
            tabs={years.map((y) => ({ id: String(y.year), label: String(y.year) }))}
            activeId={String(year.year)}
            onChange={(id) => setChosenYear(Number(id))}
            accent={colorValue}
          />
        </div>
        <p className="mt-3 font-space-grotesk text-xs leading-relaxed text-[var(--text-muted)] md:text-sm">
          {year.commits.toLocaleString()} commits{year.through ? ' so far' : ''} in {year.year}, by the hour they were made.
          {years.length > 1 && year === last && peakHour(first) !== peakHour(last) && <> in {first.year} the work peaked around {hourLabel(peakHour(first))}. now, {hourLabel(peakHour(last))}.</>}
        </p>

        {/* The day: mine as a line, yours as the strip under it */}
        <InkStage key={year.year} className="mt-6">
          <DayLine year={year} color={colorValue} />
          <div className="mt-3">
            <HourStrip hours={hours} onChange={setHours} color={colorValue} />
          </div>
          <div className="mt-2 flex justify-between font-vt323 text-sm text-[var(--text-muted)]">
            {[0, 6, 12, 18].map((h) => (
              <InkWord key={h} beat={13}>{hourLabel(h)}</InkWord>
            ))}
            <InkWord beat={13}>12am</InkWord>
          </div>

          {/* The week: mine as marks, yours as the days under them */}
          <div className="mt-8 flex items-end justify-between gap-1 sm:justify-start sm:gap-4" role="group" aria-label="the days you have">
            {WEEKDAYS.map((day, i) => {
              const on = days.has(i);
              const height = 6 + (year.days[i] / dayMax) * 40;
              return (
                <div key={day} className="flex flex-col items-center gap-2">
                  <svg viewBox="0 0 12 48" className="h-12 w-3 overflow-visible" aria-hidden>
                    <InkMark d={`M6 48 L${6 + wobble(i, 1.4)} ${48 - height}`} beat={14 + i * 0.6} width={3} color={colorValue} />
                  </svg>
                  <button
                    type="button"
                    onClick={() => toggleDay(i)}
                    aria-pressed={on}
                    aria-label={day}
                    className="flex size-11 items-center justify-center rounded-full font-google-sans-code text-[11px] uppercase transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                    style={{
                      backgroundColor: on ? colorValue : `${colorValue}14`,
                      color: on ? 'var(--background)' : 'var(--foreground)',
                      outlineColor: colorValue,
                    }}
                  >
                    {day.slice(0, 2)}
                  </button>
                </div>
              );
            })}
          </div>
        </InkStage>

        {/* What it means for yours */}
        {project && (
          <div className="mt-12 border-t pt-8" style={{ borderColor: `${colorValue}26` }}>
            {perWeek === 0 ? (
              <p className="font-space-grotesk text-sm leading-relaxed text-[var(--foreground)] md:text-base">
                {projectName} took <span style={{ color: colorValue }}>{hoursOf(project.hours)} hours</span>. drag across the hours you have, then tap your days.
              </p>
            ) : (
              <div role="status">
                <p className="font-space-grotesk text-sm leading-relaxed text-[var(--foreground)] md:text-base">
                  {projectName} took {hoursOf(project.hours)} hours. at your {perWeek} a week, that’s
                </p>
                <p className="mt-1 font-vt323 text-5xl leading-none sm:text-6xl" style={{ color: colorValue }}>
                  {howLong(project.hours, perWeek)}.
                </p>
                {project.site && (
                  <p className="mt-3 font-space-grotesk text-xs leading-relaxed text-[var(--text-muted)] md:text-sm">
                    or start from all {hoursOf(project.hours)} of them: a copy of {SITE} comes with every one.
                  </p>
                )}
              </div>
            )}

            {choices.length > 1 && (
              <div className="mt-6 flex flex-wrap gap-x-5 gap-y-3" role="group" aria-label="measure against">
                {choices.map((p) => {
                  const { name, cover, color } = describeBaselineProject(p);
                  const on = p === project;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setProjectId(p.id)}
                      aria-pressed={on}
                      className="flex items-center gap-2 rounded-full py-1 pr-2 transition-opacity duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                      style={{ opacity: on ? 1 : 0.55, outlineColor: colorValue }}
                    >
                      <UnpppCircle src={cover} color={color ?? colorValue} />
                      <span className="font-vt323 text-lg leading-none" style={{ color: on ? colorValue : 'var(--foreground)' }}>
                        {p.site ? SITE : name}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="mt-8">
              <ActionPill
                verb="price yours"
                note={`$${worth.toLocaleString()}`}
                href={`/goal-budget?like=${encodeURIComponent(project.id)}`}
                icon={Hammer}
                color={colorValue}
                label={`Price yours in Goal Budget, like ${projectName}: ${hoursOf(project.hours)} hours, worth $${worth.toLocaleString()}`}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
