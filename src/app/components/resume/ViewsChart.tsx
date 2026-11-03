'use client';

import Link from 'next/link';
import { useTheme } from '../../contexts/ThemeContext';
import UnpppCircle from '../UnpppCircle';
import InkStage from '../ink/InkStage';
import { InkDot, InkLine, InkWord } from '../ink/primitives';
import { penPath, wobble } from '../ink/pen';
import type { ViewsData } from './types';

const W = 600;
const H = 120;

const dayLabel = (daysAgo: number) =>
  new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();

/**
 * The last thirty days of traffic, drawn in ink (components/ink): pageviews a
 * day as one pen line ending on a breathing "today", then the five pages
 * people read most rising in. `labels` names the line's two ends when they
 * aren't days (an hour line); a page with a `title` shows it, and its cover
 * when it has one, instead of its path
 */
export default function ViewsChart({ days, top, labels }: Pick<ViewsData, 'days' | 'top'> & { labels?: [string, string] }) {
  const { colorValue } = useTheme();
  const max = Math.max(1, ...days);
  const step = W / Math.max(1, days.length - 1);
  const points = days.map((value, index) => [index * step, H - 6 - (value / max) * (H - 18) + wobble(index, 1.6)] as const);
  const [lastX, lastY] = points[points.length - 1];

  return (
    <InkStage>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mb-2 block h-auto w-full overflow-visible"
        role="img"
        aria-label={`Pageviews a day for the last ${days.length} days, from ${days[0]} to ${days[days.length - 1]}, at most ${max}`}
      >
        <InkLine d={penPath(points)} length={W * 1.4} />
        <InkDot cx={lastX} cy={lastY} beat={12} breathe />
      </svg>
      <div className="mb-10 flex justify-between font-vt323 text-sm" style={{ color: 'var(--text-muted)' }}>
        <InkWord beat={13}>{labels?.[0] ?? dayLabel(days.length - 1)}</InkWord>
        <InkWord beat={13}>{labels?.[1] ?? dayLabel(0)}</InkWord>
      </div>

      <ol className="space-y-2">
        {top.map((page, index) => (
          <li key={page.path} className="flex items-baseline gap-4">
            <InkWord beat={14 + index} className="w-14 shrink-0 text-right font-vt323 text-xl" style={{ color: colorValue }}>
              {page.views.toLocaleString()}
            </InkWord>
            <InkWord beat={14.5 + index} className="!flex min-w-0 items-center gap-2">
              {page.cover && <UnpppCircle src={page.cover} color={colorValue} />}
              <Link
                href={page.path}
                className="truncate font-space-grotesk text-sm transition-colors hover:text-[var(--theme-color)]"
                style={{ color: 'var(--foreground)' }}
              >
                {page.title ?? page.path}
              </Link>
            </InkWord>
          </li>
        ))}
      </ol>
    </InkStage>
  );
}
