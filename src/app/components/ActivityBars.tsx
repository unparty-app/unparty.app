'use client';

/**
 * ActivityBars — the ACTIVITY chapter's chart, replacing the disco-ball orb
 * field (DiscoActivityVisualization). One repo, one row: bar length is the
 * magnitude channel (activity_score), a sequential fill built from the
 * active theme color reinforces it, and days_since_push rides along as
 * plain text — no WebGL, no party-mode toggle, themed via CSS variables
 * instead of hardcoded Tailwind grays.
 *
 * Both scales are long-tailed (one repo can dwarf the rest), so bar width
 * and fill intensity are log-scaled off activity_score; the exact value is
 * always the direct label at the bar's tip, never just implied by length.
 */

import { useMemo, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import type { RepositoryMetadata } from '@/types/repository-metadata';

interface ActivityBarsProps {
  repositories: RepositoryMetadata[];
  /** Max height of the scrollable row list (header + legend sit outside it) */
  height?: string;
  className?: string;
}

interface ActivityRow {
  repo: RepositoryMetadata;
  score: number;
  daysSincePush: number;
  contributors: number;
  velocityPerWeek: number;
  widthPct: number;
  fillOpacity: number;
}

/** Two-digit hex alpha suffix for a `${colorValue}${alpha}` string, e.g. 0.72 -> "b8" */
const toAlphaHex = (opacity: number): string =>
  Math.round(Math.max(0, Math.min(1, opacity)) * 255)
    .toString(16)
    .padStart(2, '0');

const formatRecency = (days: number): string => {
  if (days <= 0) return 'today';
  if (days === 1) return '1d ago';
  return `${days}d ago`;
};

const MIN_WIDTH_PCT = 2; // hairline stub for a 0-score repo, so the row still reads

export default function ActivityBars({ repositories, height = '560px', className = '' }: ActivityBarsProps) {
  const { colorValue } = useTheme();
  const [hoveredName, setHoveredName] = useState<string | null>(null);
  const [showTable, setShowTable] = useState(false);

  const rows: ActivityRow[] = useMemo(() => {
    const maxScore = Math.max(1, ...repositories.map(r => r.activity_score));
    const maxLog = Math.log1p(maxScore);

    const withMetrics = repositories.map(repo => {
      const score = repo.activity_score;
      const normalized = maxLog > 0 ? Math.log1p(score) / maxLog : 0;
      return {
        repo,
        score,
        daysSincePush: repo.days_since_push,
        contributors: repo.enhanced_metrics?.contributors_count ?? 0,
        velocityPerWeek: repo.enhanced_metrics?.commits_analysis?.commit_velocity_per_week ?? 0,
        widthPct: Math.max(MIN_WIDTH_PCT, normalized * 100),
        fillOpacity: 0.28 + normalized * 0.72,
      };
    });

    return withMetrics.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.daysSincePush !== b.daysSincePush) return a.daysSincePush - b.daysSincePush;
      return a.repo.name.localeCompare(b.repo.name);
    });
  }, [repositories]);

  const hovered = useMemo(
    () => (hoveredName ? rows.find(r => r.repo.name === hoveredName) ?? null : null),
    [hoveredName, rows]
  );

  return (
    <div className={className}>
      {/* Header — sequential legend + table-view toggle, the chart's only "chrome" */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="font-google-sans-code text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
            QUIET.
          </span>
          <div
            className="h-2 w-24 rounded-full"
            style={{ background: `linear-gradient(to right, ${colorValue}${toAlphaHex(0.28)}, ${colorValue})` }}
          />
          <span className="font-google-sans-code text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
            ACTIVE.
          </span>
        </div>
        <button
          type="button"
          onClick={() => setShowTable(v => !v)}
          aria-pressed={showTable}
          className="font-google-sans-code text-xs font-bold uppercase tracking-wide transition-colors duration-200"
          style={{ color: showTable ? colorValue : 'var(--text-muted)' }}
        >
          {showTable ? 'CHART.' : 'TABLE.'}
        </button>
      </div>

      {/* Hover/focus detail panel — supplements the row, never gates it */}
      <div
        className="mb-3 rounded-lg border px-3 py-2 font-google-sans-code text-xs"
        style={{
          borderColor: `${colorValue}66`,
          backgroundColor: 'var(--background-highlight)',
          color: hovered ? 'var(--foreground)' : 'var(--text-muted)',
          minHeight: '2.5rem',
        }}
      >
        {hovered ? (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="font-bold" style={{ color: colorValue }}>{hovered.repo.name}</span>
            {hovered.repo.description && <span style={{ color: 'var(--text-muted)' }}>{hovered.repo.description}</span>}
            <span style={{ color: 'var(--text-muted)' }}>{hovered.contributors} contributor{hovered.contributors === 1 ? '' : 's'}</span>
            <span style={{ color: 'var(--text-muted)' }}>{hovered.velocityPerWeek.toFixed(1)} commits/week</span>
            <span style={{ color: 'var(--text-muted)' }}>{formatRecency(hovered.daysSincePush)}</span>
          </div>
        ) : (
          <span>hover or focus a repository for its full metrics</span>
        )}
      </div>

      {showTable ? (
        <div className="overflow-x-auto rounded-lg border" style={{ borderColor: `${colorValue}66` }}>
          <table className="w-full min-w-[560px] font-google-sans-code text-xs">
            <thead>
              <tr className="border-b text-left uppercase tracking-wide" style={{ borderColor: `${colorValue}33`, color: 'var(--text-muted)' }}>
                <th className="px-3 py-2 font-normal">Repository</th>
                <th className="px-3 py-2 font-normal text-right">Activity</th>
                <th className="px-3 py-2 font-normal text-right">Last push</th>
                <th className="px-3 py-2 font-normal text-right">Contributors</th>
                <th className="px-3 py-2 font-normal text-right">Commits/wk</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.repo.name} className="border-b last:border-0" style={{ borderColor: `${colorValue}33` }}>
                  <td className="px-3 py-2" style={{ color: 'var(--foreground)' }}>{row.repo.name}</td>
                  <td className="px-3 py-2 text-right tabular-nums" style={{ color: 'var(--foreground)' }}>{row.score}</td>
                  <td className="px-3 py-2 text-right tabular-nums" style={{ color: 'var(--text-muted)' }}>{formatRecency(row.daysSincePush)}</td>
                  <td className="px-3 py-2 text-right tabular-nums" style={{ color: 'var(--text-muted)' }}>{row.contributors}</td>
                  <td className="px-3 py-2 text-right tabular-nums" style={{ color: 'var(--text-muted)' }}>{row.velocityPerWeek.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div
          className="space-y-1 overflow-y-auto rounded-lg border pr-1"
          style={{ borderColor: `${colorValue}66`, maxHeight: height }}
        >
          {rows.map(row => {
            const isHovered = hoveredName === row.repo.name;
            return (
              <button
                key={row.repo.name}
                type="button"
                onMouseEnter={() => setHoveredName(row.repo.name)}
                onMouseLeave={() => setHoveredName(null)}
                onFocus={() => setHoveredName(row.repo.name)}
                onBlur={() => setHoveredName(null)}
                className="grid w-full grid-cols-[minmax(120px,180px)_1fr_auto] items-center gap-3 px-3 py-2 text-left transition-colors duration-150"
                style={{ backgroundColor: isHovered ? 'var(--background-highlight)' : 'transparent' }}
              >
                <span
                  className="truncate font-google-sans-code text-xs"
                  style={{ color: 'var(--foreground)' }}
                  title={row.repo.name}
                >
                  {row.repo.name}
                </span>

                <span className="h-2.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: 'var(--background-highlight)' }}>
                  <span
                    className="block h-full rounded-full"
                    style={{
                      width: `${row.widthPct}%`,
                      backgroundColor: `${colorValue}${toAlphaHex(row.fillOpacity)}`,
                    }}
                  />
                </span>

                <span className="flex items-baseline gap-2 whitespace-nowrap">
                  <span className="font-google-sans-code text-xs font-bold tabular-nums" style={{ color: 'var(--foreground)' }}>
                    {row.score}
                  </span>
                  <span className="font-vt323 text-xs" style={{ color: 'var(--text-muted)' }}>
                    {formatRecency(row.daysSincePush)}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
