'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { UNPPP_NAV_ITEMS, type NavCategory } from '../constants/unpppNav';
import { effortByType, type EffortByType, type TypeEffort } from '@/lib/type-effort';
import { inkOn } from './build-yours/BuildYours';

const LABEL = 'font-google-sans-code text-[10px] uppercase tracking-wide';
// Below this share a segment is too narrow to carry its circle and words on
// the line; it still shows in the line and in the legend
const ROOMY = 0.06;

export const percent = (share: number) => (share === 0 ? '0%' : share < 0.01 ? '<1%' : `${Math.round(share * 100)}%`);
export const typeName = (category: NavCategory) =>
  UNPPP_NAV_ITEMS.find((n) => n.category === category)?.label.replace(/\.$/, '').toLowerCase() ?? category;

/** "app · 8 projects · 340 commits a month · 3 rising" (or "· 175 hours in 12 weeks", measured) */
export function effortLine(t: TypeEffort, weeks?: number): string {
  const amount = t.hours !== undefined && weeks ? `${Math.round(t.hours)} hours in ${weeks} weeks` : `${Math.round(t.commitsPerMonth)} commits a month`;
  const parts = [typeName(t.type), `${t.projects} project${t.projects === 1 ? '' : 's'}`, amount];
  if (t.rising) parts.push(`${t.rising} rising`);
  return parts.join(' · ');
}

export function asOfLabel(generatedAt: string | null): string | null {
  return generatedAt
    ? new Date(generatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).toLowerCase()
    : null;
}

/** A type's mark, as the header draws it: its hand-drawn icon on its own color */
export function TypeMark({ type, color, size = 36 }: { type: NavCategory; color: string; size?: number }) {
  const Icon = UNPPP_NAV_ITEMS.find((n) => n.category === type)?.icon;
  return (
    <span className="flex shrink-0 items-center justify-center rounded-full shadow-md" style={{ backgroundColor: color, width: size, height: size }} aria-hidden="true">
      {Icon && <Icon size={Math.round(size * 0.5)} strokeWidth={1.6} color={inkOn(color)} />}
    </span>
  );
}

/**
 * TypeStatline - where the work goes, by kind of build, as one line: a
 * segment per type in the type's own color, as long as its share of all
 * commits a month, drawn in from the left when it scrolls into view. Each
 * roomy segment starts with the type's mark (the header's circle) and carries
 * its name and share; the narrow ones read from the legend under the line.
 *
 * `highlight` raises one type (a project page's own): its segment is thicker
 * and the others step back. Every mark, segment and legend entry opens its
 * type's hub; pointing at or focusing one reads its line underneath
 * ("framework · 15 projects · 197 commits a month · 5 rising"), with the
 * scores' date. With no scores at all, nothing shows.
 *
 * `effort` draws other numbers in the same line: /build's KINDS. passes the
 * builder's own hours by kind of build, measured from their commits
 * (src/lib/build-story.ts). Without it, the repo analysis's scores
 */
export default function TypeStatline({ highlight, effort: given }: { highlight?: NavCategory; effort?: EffortByType }) {
  const effort = useMemo(() => given ?? effortByType(), [given]);
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  const [focused, setFocused] = useState<NavCategory | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setSeen(true);
        observer.disconnect();
      }
    }, { threshold: 0.3 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (effort.total === 0) return null;

  // Biggest share first, so the line reads like a ranking left to right
  const types = [...effort.types].sort((a, b) => b.share - a.share);
  const shown = focused ?? highlight ?? types[0].type;
  const shownEffort = effort.types.find((t) => t.type === shown)!;
  const asOf = asOfLabel(effort.generatedAt);
  const dim = (t: TypeEffort) => (highlight && t.type !== highlight ? 0.45 : 1);
  const hover = (type: NavCategory) => ({
    onMouseEnter: () => setFocused(type),
    onFocus: () => setFocused(type),
    onBlur: () => setFocused(null),
  });

  return (
    <div ref={ref} className="text-left" onMouseLeave={() => setFocused(null)}>
      {/* The line: wide screens carry each roomy type's mark and words on it */}
      <div className="flex w-full items-end gap-1" aria-hidden="true">
        {types.filter((t) => t.share > 0).map((t) => (
          <Link
            key={t.type}
            href={`/unppp/${t.type}`}
            tabIndex={-1}
            {...hover(t.type)}
            className="group flex min-w-0 flex-col gap-2 transition-opacity"
            style={{ flexGrow: t.share, flexBasis: 0, opacity: dim(t) }}
          >
            {t.share >= ROOMY && (
              <span className="hidden items-center gap-2 md:flex">
                <TypeMark type={t.type} color={t.color} size={32} />
                <span className="flex min-w-0 flex-col">
                  <span className="font-vt323 text-xl leading-none text-[var(--foreground)]">{percent(t.share)}</span>
                  <span className={`${LABEL} truncate text-[var(--text-muted)]`}>{typeName(t.type)}</span>
                </span>
              </span>
            )}
            <span
              className="block w-full origin-left rounded-full transition-transform duration-700 ease-out group-hover:brightness-110 motion-reduce:transition-none"
              style={{
                height: t.type === highlight ? 10 : 6,
                backgroundColor: t.color,
                transform: `scaleX(${seen ? 1 : 0})`,
              }}
            />
          </Link>
        ))}
      </div>

      {/* Every type by its mark: the way in on a phone, and for the narrow ones */}
      <ul className="mt-5 grid grid-cols-4 gap-x-3 gap-y-3 sm:grid-cols-8" aria-label="Effort by kind of build">
        {types.map((t) => (
          <li key={t.type}>
            <Link
              href={`/unppp/${t.type}`}
              {...hover(t.type)}
              aria-label={`${effortLine(t, effort.weeks)}. Open the ${typeName(t.type)} hub`}
              className="group flex items-center gap-2 transition-opacity"
              style={{ opacity: dim(t) }}
            >
              <span className="transition-transform duration-200 group-hover:scale-105 motion-reduce:transition-none">
                <TypeMark type={t.type} color={t.color} size={24} />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="font-vt323 text-base leading-none text-[var(--foreground)]">{percent(t.share)}</span>
                <span className={`${LABEL} truncate`} style={{ color: t.type === highlight ? 'var(--foreground)' : 'var(--text-muted)' }}>{typeName(t.type)}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-5 min-h-5 font-space-grotesk text-sm text-[var(--foreground)]" aria-live="polite">
        {effortLine(shownEffort, effort.weeks)}
      </p>
      {asOf && (
        <p className={`${LABEL} mt-1 text-[var(--text-muted)]`}>
          {effort.weeks ? `share of hours in the last ${effort.weeks} weeks, measured from commits, as of ${asOf}` : `share of commits a month, as of ${asOf}`}
        </p>
      )}
    </div>
  );
}
