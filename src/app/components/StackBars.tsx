'use client';

/**
 * StackBars — STACK chapter chart, replacing LanguageVisualization's D3
 * pie/bar toggle. Two lenses, deliberately different shapes:
 *
 * BY LANGUAGE — ranked bars, org-wide bytes per language. A real
 * aggregate across all 43 repos, so ranking by magnitude is honest here.
 *
 * BY PRODUCT — NOT a ranked-by-size chart. Every unppp product maps to
 * exactly one repo (checked: 0 of 43 buckets have >1 repo), so "rank
 * products by bytes" is just repo size relabeled, and raw bytes turned
 * out to be dominated by non-authored content (Crawler's 61% "share" was
 * 97.9% scraped HTML; the runner-up was 85.7% vendored Makefile) — not a
 * real product-size story. Instead each row shows that repo's own
 * language composition as a mini strip (same mechanic as the org-wide
 * strip below this chart), ordered by activity_score so it reads
 * alongside the ACTIVITY chapter rather than inventing a third metric.
 *
 * Both lenses share the "All languages / Programming only" filter that
 * lived on the old D3 chart (MARKUP_LANGUAGES via filterLanguages) —
 * directly useful here since markup (HTML chief among it) is exactly
 * what was distorting the byte counts.
 */

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTheme } from '../contexts/ThemeContext';
import type { RepositoryMetadata } from '@/types/repository-metadata';
import { getAggregatedStats, formatBytes, processLanguages, filterLanguages } from '@/utils/language-calculations';
import { getUnpppForRepoName } from '@/utils/unppp-repo-mapping';

interface StackBarsProps {
  repositories: RepositoryMetadata[];
  height?: string;
  className?: string;
}

type Lens = 'language' | 'product';

interface LanguageRow {
  key: string;
  label: string;
  color: string;
  bytes: number;
  percentage: number;
}

interface ProductSegment {
  name: string;
  color: string;
  percentage: number;
}

interface ProductRow {
  key: string;
  label: string;
  repoName: string;
  color: string;
  coverUrl: string | null;
  href: string | null;
  segments: ProductSegment[];
  topLanguage: string | null;
  activityScore: number;
  daysSincePush: number;
}

const toAlphaHex = (opacity: number): string =>
  Math.round(Math.max(0, Math.min(1, opacity)) * 255)
    .toString(16)
    .padStart(2, '0');

const formatRecency = (days: number): string => {
  if (days <= 0) return 'today';
  if (days === 1) return '1d ago';
  return `${days}d ago`;
};

function buildLanguageRows(repositories: RepositoryMetadata[], includeMarkup: boolean): LanguageRow[] {
  const stats = getAggregatedStats(repositories, includeMarkup);
  return stats.languages.map(lang => ({
    key: lang.name,
    label: lang.name,
    color: lang.color,
    bytes: lang.bytes,
    percentage: lang.percentage,
  }));
}

function buildProductRows(repositories: RepositoryMetadata[], includeMarkup: boolean, fallbackColor: string): ProductRow[] {
  const rows = repositories.map(repo => {
    const unppp = getUnpppForRepoName(repo.name);
    const segments = filterLanguages(
      processLanguages(repo.enhanced_metrics?.languages_detail ?? {}),
      includeMarkup
    );

    return {
      key: repo.name,
      label: unppp ? (unppp.tagline || `${unppp.name.toUpperCase()}.`) : repo.name,
      repoName: repo.name,
      color: unppp?.color && unppp.color !== 'null' ? unppp.color.trim() : fallbackColor,
      coverUrl: unppp?.cover && unppp.cover !== 'null' ? `/covers/${unppp.cover}.png` : null,
      href: unppp ? `/${unppp.id}` : null,
      segments: segments.map(s => ({ name: s.name, color: s.color, percentage: s.percentage })),
      topLanguage: segments[0]?.name ?? null,
      activityScore: repo.activity_score,
      daysSincePush: repo.days_since_push,
    };
  });

  return rows.sort((a, b) => {
    if (b.activityScore !== a.activityScore) return b.activityScore - a.activityScore;
    if (a.daysSincePush !== b.daysSincePush) return a.daysSincePush - b.daysSincePush;
    return a.label.localeCompare(b.label);
  });
}

const rowClassName = 'grid w-full grid-cols-[minmax(120px,180px)_1fr_auto] items-center gap-3 px-3 py-2 text-left transition-colors duration-150';

function IdentityMark({ coverUrl, color, label }: { coverUrl: string | null; color: string; label: string }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      {coverUrl ? (
        <span className="relative size-5 shrink-0 overflow-hidden rounded-full" style={{ boxShadow: `0 0 0 1px ${color}` }}>
          <Image src={coverUrl} alt="" fill sizes="20px" className="object-cover" />
        </span>
      ) : (
        <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
      )}
      <span className="truncate font-google-sans-code text-xs" style={{ color: 'var(--foreground)' }} title={label}>
        {label}
      </span>
    </span>
  );
}

interface LanguageRowItemProps {
  row: LanguageRow;
  isHovered: boolean;
  onHover: () => void;
  onUnhover: () => void;
}

function LanguageRowItem({ row, isHovered, onHover, onUnhover }: LanguageRowItemProps) {
  return (
    <button
      type="button"
      onMouseEnter={onHover}
      onMouseLeave={onUnhover}
      onFocus={onHover}
      onBlur={onUnhover}
      className={rowClassName}
      style={{ backgroundColor: isHovered ? 'var(--background-highlight)' : 'transparent' }}
    >
      <IdentityMark coverUrl={null} color={row.color} label={row.label} />
      <span className="h-2.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: 'var(--background-highlight)' }}>
        <span
          className="block h-full rounded-full"
          style={{ width: `${Math.max(row.percentage, row.bytes > 0 ? 1.5 : 0)}%`, backgroundColor: `${row.color}${toAlphaHex(0.75)}` }}
        />
      </span>
      <span className="font-google-sans-code text-xs font-bold tabular-nums whitespace-nowrap" style={{ color: 'var(--foreground)' }}>
        {row.percentage}%
      </span>
    </button>
  );
}

interface ProductRowItemProps {
  row: ProductRow;
  isHovered: boolean;
  onHover: () => void;
  onUnhover: () => void;
}

function ProductRowItem({ row, isHovered, onHover, onUnhover }: ProductRowItemProps) {
  const style = { backgroundColor: isHovered ? 'var(--background-highlight)' : 'transparent' };
  const hasData = row.segments.length > 0;

  const inner = (
    <>
      <IdentityMark coverUrl={row.coverUrl} color={row.color} label={row.label} />
      <span className="flex h-2.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: 'var(--background-highlight)' }}>
        {hasData ? (
          row.segments.map(seg => (
            <span
              key={seg.name}
              className="block h-full"
              style={{ width: `${seg.percentage}%`, backgroundColor: seg.color }}
              title={`${seg.name} ${seg.percentage}%`}
            />
          ))
        ) : null}
      </span>
      <span className="font-google-sans-code text-xs tabular-nums whitespace-nowrap" style={{ color: hasData ? 'var(--foreground)' : 'var(--text-muted)' }}>
        {hasData ? row.topLanguage : 'no data'}
      </span>
    </>
  );

  if (row.href) {
    return (
      <Link href={row.href} onMouseEnter={onHover} onMouseLeave={onUnhover} onFocus={onHover} onBlur={onUnhover} className={rowClassName} style={style}>
        {inner}
      </Link>
    );
  }

  return (
    <button type="button" onMouseEnter={onHover} onMouseLeave={onUnhover} onFocus={onHover} onBlur={onUnhover} className={rowClassName} style={style}>
      {inner}
    </button>
  );
}

export default function StackBars({ repositories, height = '480px', className = '' }: StackBarsProps) {
  const { colorValue } = useTheme();
  const [lens, setLens] = useState<Lens>('language');
  const [includeMarkup, setIncludeMarkup] = useState(true);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [showTable, setShowTable] = useState(false);

  const languageRows = useMemo(() => buildLanguageRows(repositories, includeMarkup), [repositories, includeMarkup]);
  const productRows = useMemo(() => buildProductRows(repositories, includeMarkup, colorValue), [repositories, includeMarkup, colorValue]);

  const hoveredLanguage = useMemo(
    () => (lens === 'language' && hoveredKey ? languageRows.find(r => r.key === hoveredKey) ?? null : null),
    [lens, hoveredKey, languageRows]
  );
  const hoveredProduct = useMemo(
    () => (lens === 'product' && hoveredKey ? productRows.find(r => r.key === hoveredKey) ?? null : null),
    [lens, hoveredKey, productRows]
  );

  return (
    <div className={className}>
      {/* Header — lens toggle, markup filter, table-view toggle */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          {(['language', 'product'] as const).map(id => (
            <button
              key={id}
              type="button"
              onClick={() => { setLens(id); setHoveredKey(null); }}
              aria-pressed={lens === id}
              className="relative py-1 font-google-sans-code text-xs uppercase tracking-wide transition-colors duration-200"
              style={{ color: lens === id ? 'var(--foreground)' : 'var(--text-muted)', fontWeight: lens === id ? 700 : 400 }}
            >
              {id === 'language' ? 'BY LANGUAGE.' : 'BY PRODUCT.'}
              <span
                className="absolute inset-x-0 -bottom-1.5 h-0.5 transition-opacity duration-200"
                style={{ backgroundColor: colorValue, opacity: lens === id ? 1 : 0 }}
              />
            </button>
          ))}
          <button
            type="button"
            onClick={() => setIncludeMarkup(v => !v)}
            aria-pressed={!includeMarkup}
            className="font-google-sans-code text-xs uppercase tracking-wide transition-colors duration-200"
            style={{ color: 'var(--text-muted)' }}
            title="Toggle markup/config languages (HTML, CSS, JSON, YAML...)"
          >
            {includeMarkup ? 'ALL LANGUAGES.' : 'PROGRAMMING ONLY.'}
          </button>
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
          color: hoveredLanguage || hoveredProduct ? 'var(--foreground)' : 'var(--text-muted)',
          minHeight: '2.5rem',
        }}
      >
        {lens === 'language' && hoveredLanguage && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="font-bold" style={{ color: colorValue }}>{hoveredLanguage.label}</span>
            <span style={{ color: 'var(--text-muted)' }}>{formatBytes(hoveredLanguage.bytes)} across the org</span>
            <span style={{ color: 'var(--text-muted)' }}>{hoveredLanguage.percentage}% of org bytes</span>
          </div>
        )}
        {lens === 'product' && hoveredProduct && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="font-bold" style={{ color: colorValue }}>{hoveredProduct.label}</span>
            <span style={{ color: 'var(--text-muted)' }}>{hoveredProduct.repoName}</span>
            <span style={{ color: 'var(--text-muted)' }}>
              {hoveredProduct.segments.length > 0
                ? hoveredProduct.segments.map(s => `${s.name} ${s.percentage}%`).join(' · ')
                : 'no language data on file'}
            </span>
            <span style={{ color: 'var(--text-muted)' }}>{formatRecency(hoveredProduct.daysSincePush)}</span>
          </div>
        )}
        {!hoveredLanguage && !hoveredProduct && <span>hover or focus a row for the full breakdown</span>}
      </div>

      {showTable ? (
        <div className="overflow-x-auto rounded-lg border" style={{ borderColor: `${colorValue}66` }}>
          {lens === 'language' ? (
            <table className="w-full min-w-[480px] font-google-sans-code text-xs">
              <thead>
                <tr className="border-b text-left uppercase tracking-wide" style={{ borderColor: `${colorValue}33`, color: 'var(--text-muted)' }}>
                  <th className="px-3 py-2 font-normal">Language</th>
                  <th className="px-3 py-2 font-normal text-right">Share</th>
                  <th className="px-3 py-2 font-normal text-right">Bytes</th>
                </tr>
              </thead>
              <tbody>
                {languageRows.map(row => (
                  <tr key={row.key} className="border-b last:border-0" style={{ borderColor: `${colorValue}33` }}>
                    <td className="px-3 py-2" style={{ color: 'var(--foreground)' }}>{row.label}</td>
                    <td className="px-3 py-2 text-right tabular-nums" style={{ color: 'var(--foreground)' }}>{row.percentage}%</td>
                    <td className="px-3 py-2 text-right tabular-nums" style={{ color: 'var(--text-muted)' }}>{formatBytes(row.bytes)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full min-w-[560px] font-google-sans-code text-xs">
              <thead>
                <tr className="border-b text-left uppercase tracking-wide" style={{ borderColor: `${colorValue}33`, color: 'var(--text-muted)' }}>
                  <th className="px-3 py-2 font-normal">Product</th>
                  <th className="px-3 py-2 font-normal">Repository</th>
                  <th className="px-3 py-2 font-normal">Top language</th>
                  <th className="px-3 py-2 font-normal text-right">Last push</th>
                </tr>
              </thead>
              <tbody>
                {productRows.map(row => (
                  <tr key={row.key} className="border-b last:border-0" style={{ borderColor: `${colorValue}33` }}>
                    <td className="px-3 py-2" style={{ color: 'var(--foreground)' }}>{row.label}</td>
                    <td className="px-3 py-2" style={{ color: 'var(--text-muted)' }}>{row.repoName}</td>
                    <td className="px-3 py-2" style={{ color: 'var(--text-muted)' }}>{row.topLanguage ?? '—'}</td>
                    <td className="px-3 py-2 text-right tabular-nums" style={{ color: 'var(--text-muted)' }}>{formatRecency(row.daysSincePush)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div
          className="space-y-1 overflow-y-auto rounded-lg border pr-1"
          style={{ borderColor: `${colorValue}66`, maxHeight: height }}
        >
          {lens === 'language'
            ? languageRows.map(row => (
                <LanguageRowItem
                  key={row.key}
                  row={row}
                  isHovered={hoveredKey === row.key}
                  onHover={() => setHoveredKey(row.key)}
                  onUnhover={() => setHoveredKey(null)}
                />
              ))
            : productRows.map(row => (
                <ProductRowItem
                  key={row.key}
                  row={row}
                  isHovered={hoveredKey === row.key}
                  onHover={() => setHoveredKey(row.key)}
                  onUnhover={() => setHoveredKey(null)}
                />
              ))}
        </div>
      )}
    </div>
  );
}
