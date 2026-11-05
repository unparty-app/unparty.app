'use client';

import { useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from '../contexts/ThemeContext';
import InkStage from './ink/InkStage';
import { InkMark, InkWord } from './ink/primitives';
import { wobble } from './ink/pen';
import ActionPill from './build-yours/ActionPill';
import PriceYours from './build-yours/PriceYours';
import { BUILD_YOURS_DONE } from './build-yours/BuildYours';
import { ChevronRight, Package } from './icons';
import type { FocusData, FocusRow } from './resume/types';

const ReleasesModal = dynamic(() => import('./ReleasesModal'), { ssr: false });

const W = 480;
const H = 96;
const BASE = 88; // Each week's stroke rises from here
const TOP = 6;

const hours = (n: number) => (n < 10 ? n.toFixed(1).replace(/\.0$/, '') : Math.round(n).toLocaleString('en-US'));
const weekName = (week: string) =>
  new Date(`${week}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).toLowerCase();

// A repo's trend in a word or two
function trendWord(row: FocusRow, weeks: string[]): string {
  if (row.trend === 'quiet') return row.lastWeek >= 0 && row.lastWeek + 1 < weeks.length ? `quiet since ${weekName(weeks[row.lastWeek + 1])}` : 'quiet';
  return { rising: 'rising', steady: 'steady', easing: 'easing off', new: 'new' }[row.trend];
}

/**
 * Where the owner's hours went (#453): one sentence on how the focus moved,
 * then one repo in focus and the rest beneath it, each a row to tap. Each
 * repo the sentence names is a link that puts it in focus too.
 *
 * The repo in focus (where the hours are now, to begin with) shows its weeks
 * as pen strokes as tall as their hours: the last weeks in the theme color,
 * the ones before in muted ink, a dot under a week it released in. Pointing
 * at a week reads it out. It ends on what to do with it: "price yours" opens
 * Goal Budget with its hours, and when it has released something, "take it"
 * opens those releases (ReleasesModal) to try and take into your own repo.
 *
 * Hours are measured from commits on every build (src/lib/focus.ts).
 */
export default function RepoFocus({ weeks, recent, rows, focus, totalHours, sentence }: FocusData) {
  const { colorValue } = useTheme();
  const [focused, setFocused] = useState(focus);
  const [week, setWeek] = useState<number | null>(null);
  const [taking, setTaking] = useState(false);
  const focusRef = useRef<HTMLDivElement>(null);
  const row = rows[focused] ?? rows[0];
  const max = Math.max(1, ...row.hours);
  const step = W / weeks.length;
  const x = (index: number) => (index + 0.5) * step;
  const isNow = (index: number) => index >= weeks.length - recent;
  const lineColor = `color-mix(in srgb, ${colorValue} 35%, transparent)`;

  const release = week === null ? null : row.releases.findLast(r => r.week === week);
  const readout =
    week === null
      ? `${hours(row.total)} hours in ${weeks.length} weeks · ${trendWord(row, weeks)}`
      : `week of ${weekName(weeks[week])} · ${hours(row.hours[week])} hours${release ? ` · released ${release.tag}` : ''}`;
  const priceHref = `/goal-budget?hours=${row.total}&of=${encodeURIComponent(row.folded ? `${row.folded} smaller repos` : row.name)}`;
  const others = rows.map((r, index) => ({ r, index })).filter(({ index }) => index !== focused);

  const focusOn = (index: number) => {
    setFocused(index);
    setWeek(null);
    // On a phone the focus is off screen above the list: bring it back
    if ((focusRef.current?.getBoundingClientRect().top ?? 0) < 0) focusRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // The sentence with each repo it names made a link that puts it in focus.
  // Longest names first, so one name inside another still matches whole
  const named = rows.map((r, index) => ({ name: r.name, index })).filter(({ index }) => !rows[index].folded);
  const pattern = named.length
    ? new RegExp(`(${[...named].sort((a, b) => b.name.length - a.name.length).map(({ name }) => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`)
    : null;
  const words = (pattern ? sentence.split(pattern) : [sentence]).map((part, i) => {
    const repo = named.find(({ name }) => name === part);
    if (!repo) return part;
    const isFocused = repo.index === focused;
    return (
      <button
        key={i}
        type="button"
        onClick={() => focusOn(repo.index)}
        aria-pressed={isFocused}
        className="underline decoration-2 underline-offset-4 transition-opacity hover:opacity-75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        style={{ textDecorationColor: colorValue, outlineColor: colorValue, color: isFocused ? colorValue : undefined }}
      >
        {part}
      </button>
    );
  });

  return (
    <div>
      <InkStage>
        <InkWord as="div" className="mb-10 font-space-grotesk text-xl leading-snug sm:text-2xl" style={{ color: 'var(--foreground)' }}>
          {words}
        </InkWord>
      </InkStage>

      {/* The repo in focus: drawn again whenever another is picked */}
      <div ref={focusRef} className="scroll-mt-40">
        <InkStage key={row.name}>
          <InkWord as="div" className="truncate font-vt323 text-3xl leading-none sm:text-4xl" style={{ color: 'var(--foreground)' }}>
            {row.name}
            {row.folded ? <span style={{ color: 'var(--text-muted)' }}> ({row.folded})</span> : null}
          </InkWord>

          <div className="relative mt-4" onMouseLeave={() => setWeek(null)}>
            <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="block h-24 w-full overflow-visible" role="img" aria-label={`${row.name}: ${hours(row.total)} hours over ${weeks.length} weeks, ${trendWord(row, weeks)}`}>
              <line x1={0} x2={W} y1={BASE + 1} y2={BASE + 1} stroke={lineColor} strokeWidth={1} vectorEffect="non-scaling-stroke" />
              {row.hours.map((value, index) => {
                if (value <= 0) return null;
                const lit = week === null ? isNow(index) : week === index;
                return (
                  <InkMark
                    key={index}
                    d={`M${x(index) + wobble(index) * 0.5} ${BASE} L${x(index) + wobble(index + 5) * 0.8} ${BASE - Math.max(3, (value / max) * (BASE - TOP))}`}
                    beat={1 + index * 0.6}
                    color={lit ? colorValue : 'var(--text-muted)'}
                    opacity={lit ? 1 : 0.55}
                    width={5}
                    scaling={false}
                  />
                );
              })}
              {/* Hit targets wider than the strokes: one per week */}
              {weeks.map((name, index) => (
                <rect key={name} x={index * step} y={0} width={step} height={H} fill="transparent" onMouseEnter={() => setWeek(index)} onClick={() => setWeek(index)}>
                  <title>{`${weekName(name)}: ${hours(row.hours[index])} hours`}</title>
                </rect>
              ))}
            </svg>
            {row.releases.map(r => (
              <span
                key={r.tag}
                title={r.tag}
                className="pointer-events-none absolute -bottom-2.5 size-2 -translate-x-1/2 rounded-full"
                style={{ left: `${((r.week + 0.5) / weeks.length) * 100}%`, background: colorValue }}
              />
            ))}
          </div>

          <div className="mt-4 flex justify-between font-vt323 text-sm" style={{ color: 'var(--text-muted)' }}>
            <span>{weekName(weeks[0])}</span>
            <span>this week</span>
          </div>
          <p className="mt-2 min-h-7 font-vt323 text-xl" style={{ color: 'var(--foreground)' }} aria-live="polite">
            {readout}
          </p>

          <div className="build-yours mt-5 flex flex-wrap gap-3" style={BUILD_YOURS_DONE}>
            {row.price !== null && (
              <PriceYours hours={row.total} name={row.folded ? `${row.folded} smaller repos` : row.name} href={priceHref} color={colorValue} />
            )}
            {row.take.length > 0 && (
              <ActionPill
                verb="take it"
                note={`${row.take.length} release${row.take.length === 1 ? '' : 's'}`}
                onClick={() => setTaking(true)}
                icon={Package}
                color={colorValue}
                label={`Take what ${row.name} released into your own repo`}
                delayMs={350}
                variant="line"
              />
            )}
          </div>
        </InkStage>
      </div>

      {/* The rest: tap one to put it in focus */}
      {others.length > 0 && (
        <ul className="mt-10">
          {others.map(({ r, index }) => (
            <li key={r.name} className="border-t" style={{ borderColor: lineColor }}>
              <button
                type="button"
                onClick={() => focusOn(index)}
                className="flex w-full items-baseline gap-3 px-1 py-3 text-left transition-colors hover:bg-[var(--background-highlight)] focus-visible:outline focus-visible:outline-2"
                style={{ outlineColor: colorValue }}
                aria-label={`Focus on ${r.name}: ${hours(r.total)} hours, ${trendWord(r, weeks)}`}
              >
                <span className="min-w-0 flex-1 truncate font-vt323 text-xl leading-none" style={{ color: 'var(--foreground)' }}>
                  {r.name}
                  {r.folded ? <span style={{ color: 'var(--text-muted)' }}> ({r.folded})</span> : null}
                </span>
                <span className="hidden font-vt323 text-base leading-none sm:inline" style={{ color: 'var(--text-muted)' }}>
                  {trendWord(r, weeks)}
                </span>
                <span className="w-14 text-right font-vt323 text-xl leading-none" style={{ color: 'var(--foreground)' }}>
                  {hours(r.total)}h
                </span>
                <ChevronRight className="size-4 shrink-0 self-center" style={{ color: colorValue }} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-6 font-vt323 text-base" style={{ color: 'var(--text-muted)' }}>
        {hours(totalHours)} hours across {rows.reduce((n, r) => n + (r.folded ?? 1), 0)} {rows.reduce((n, r) => n + (r.folded ?? 1), 0) === 1 ? 'repo' : 'repos'}.
      </p>

      {/* sr-only on a wrapper: a table sizes to its content and ignores
          sr-only's 1px width, which widened the page on phones */}
      <div className="sr-only">
        <table>
          <caption>Hours a week by repo, measured from commits</caption>
          <thead>
            <tr>
              <th scope="col">Repo</th>
              {weeks.map(name => (
                <th key={name} scope="col">{weekName(name)}</th>
              ))}
              <th scope="col">Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.name}>
                <th scope="row">{r.name}</th>
                {r.hours.map((value, index) => (
                  <td key={index}>{hours(value)}</td>
                ))}
                <td>{hours(r.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {taking && row.take.length > 0 && <ReleasesModal releases={row.take} color={colorValue} onClose={() => setTaking(false)} />}
    </div>
  );
}
