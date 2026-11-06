'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from '../contexts/ThemeContext';
import { readPinLine } from '../utils/pinLine';
import SleekTabs from './SleekTabs';
import { useDragScroll } from '@/hooks/useDragScroll';

/**
 * RowTable - the house table, mobile first (#572), built around what people
 * do with a list: compare it, page through it, find in it.
 *
 * Every record is a circle-then-text row: a circle (cover, initial or dot),
 * its name and one quiet line, and a value on the right. The table measures
 * its own width, not the window's, so it reads the same on a phone and in an
 * article's column next to other content:
 *
 * - Narrow, the header is a lens. Its column labels swipe; tap one and every
 *   row's right-hand value becomes that column, sorted by it, and tap it
 *   again to flip the order. The label in view always says what the numbers
 *   are. The name label sorts a to z.
 * - From about 560px of its own width, every column shows, and every label
 *   sorts the same way.
 *
 * Pages swipe, like a ScrollRow: they sit side by side in one track that
 * snaps a page at a time, and a mouse can drag it (useDragScroll). The track
 * takes the height of the page in view. The controls stay in reach: while
 * the table is on screen, its bar (filter tabs with their counts, the page
 * and ‹ ›, the header labels) sticks under the site header, or under a
 * pinned article headline (--hero-line). Landing on a new page keeps its
 * first row under the bar.
 *
 * A row opens in place only when it has more to read than its columns (a
 * quote, where a score comes from); otherwise it is a link to its page.
 */

export interface RowColumn<T> {
  id: string;
  label: string; // House label, without the period (added)
  value: (row: T) => React.ReactNode;
  sort?: (row: T) => number | string | undefined; // How the column sorts; unsortable without it
  dir?: 'asc' | 'desc'; // The first tap's order: high to low by default
}

export interface RowField<T> {
  id: string;
  label: string;
  value: (row: T) => React.ReactNode;
}

export interface RowFilter<T> {
  id: string;
  label: string;
  test: (row: T) => boolean;
}

export interface RowCircle {
  node?: React.ReactNode; // A ready circle (UnpppCircle for an unppp's cover)
  src?: string; // An image (a cover); otherwise a dot in `color`, with `text`'s first letter
  color?: string;
  text?: string;
}

interface RowTableProps<T> {
  rows: T[];
  rowKey: (row: T) => string;
  label: string; // What a row is ("route"): the name column's label
  name: (row: T) => React.ReactNode;
  nameSort: (row: T) => string;
  meta?: (row: T) => React.ReactNode;
  circle?: (row: T) => RowCircle | null;
  columns: RowColumn<T>[];
  sort?: { by: string; dir: 'asc' | 'desc' }; // Opening order: a column id, or 'name'
  details?: RowField<T>[]; // More to read than the columns: rows open in place to these
  href?: (row: T) => string | undefined;
  hrefLabel?: string;
  external?: boolean;
  filters?: RowFilter<T>[];
  search?: (row: T, query: string) => boolean;
  searchLabel?: string;
  pageSize?: number;
  empty?: string;
  footer?: React.ReactNode;
}

type Sort = { by: string; dir: 'asc' | 'desc' };
type Value = number | string | undefined;

const LABEL = 'font-google-sans-code text-[10px] uppercase tracking-wide md:text-xs';
// Set once the swipe has been shown, or the visitor has swiped a table themselves
const SWIPE_SHOWN = 'row-table-swipe-shown';
const blank = (v: Value) => v === undefined || v === '';

function Circle({ circle, colorValue }: { circle: RowCircle; colorValue: string }) {
  if (circle.node) return <span className="grid size-8 shrink-0 place-items-center">{circle.node}</span>;
  if (circle.src) {
    return (
      <span className="relative block size-8 shrink-0 overflow-hidden rounded-full border" style={{ borderColor: `${colorValue}55` }}>
        <Image src={circle.src} alt="" fill sizes="32px" className="object-cover" />
      </span>
    );
  }
  const color = circle.color ?? colorValue;
  return (
    <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full border font-google-sans-code text-xs uppercase" style={{ borderColor: color, color, backgroundColor: `${color}14` }}>
      {circle.text ? Array.from(circle.text)[0] : null}
    </span>
  );
}

function Caret({ open, colorValue }: { open: boolean; colorValue: string }) {
  return (
    <span aria-hidden className="inline-block transition-transform duration-200 motion-reduce:transition-none" style={{ color: colorValue, transform: open ? 'rotate(180deg)' : undefined }}>
      ▾
    </span>
  );
}

export default function RowTable<T>({
  rows,
  rowKey,
  label,
  name,
  nameSort,
  meta,
  circle,
  columns,
  sort: initialSort,
  details = [],
  href,
  hrefLabel = 'open',
  external = false,
  filters,
  search,
  searchLabel,
  pageSize = 10,
  empty = 'nothing here yet.',
  footer,
}: RowTableProps<T>) {
  const { colorValue } = useTheme();
  const firstSortable = columns.find((c) => c.sort);
  const [filterId, setFilterId] = useState(filters?.[0]?.id ?? '');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<Sort>(initialSort ?? (firstSortable ? { by: firstSortable.id, dir: firstSortable.dir ?? 'desc' } : { by: 'name', dir: 'asc' }));
  // The column narrow rows show on the right: the one last tapped (or sorted by)
  const [lens, setLens] = useState(columns.find((c) => c.id === sort.by)?.id ?? columns[0]?.id);
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState<string | null>(null);
  // The site header's height: the line the bar sticks to when nothing else is pinned
  const [chromeTop, setChromeTop] = useState(72);
  const trackRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLUListElement | null)[]>([]);
  const [trackHeight, setTrackHeight] = useState<number | undefined>(undefined);
  const settleRef = useRef<{ timer?: ReturnType<typeof setTimeout>; page: number }>({ page: 0 });
  const barRef = useRef<HTMLDivElement>(null);
  const lensRef = useRef<HTMLDivElement>(null);
  // Which edges of the lens hide labels, so a fade there says it swipes
  const [lensEdges, setLensEdges] = useState({ left: false, right: false });
  const measureLens = () => {
    const el = lensRef.current;
    if (!el) return;
    setLensEdges({ left: el.scrollLeft > 1, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 1 });
  };

  // Where the bar sticks: under the site header, a pinned cover band (--pin-line,
  // live as a story's cover shrinks) or a pinned headline (--hero-line)
  useEffect(() => {
    const measure = () => {
      setChromeTop(document.getElementById('site-chrome')?.offsetHeight || 72);
      measureLens();
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const counts = useMemo(() => Object.fromEntries((filters ?? []).map((f) => [f.id, rows.filter(f.test).length])), [filters, rows]);

  const matching = useMemo(() => {
    const filter = filters?.find((f) => f.id === filterId);
    const q = query.trim().toLowerCase();
    const list = rows.filter((row) => (!filter || filter.test(row)) && (!q || !search || search(row, q)));
    const key: ((row: T) => Value) | undefined = sort.by === 'name' ? nameSort : columns.find((c) => c.id === sort.by)?.sort;
    if (!key) return list;
    const sign = sort.dir === 'asc' ? 1 : -1;
    return [...list].sort((a, b) => {
      const va = key(a);
      const vb = key(b);
      // Rows without a value stay last, whichever way the column reads
      if (blank(va) || blank(vb)) return blank(va) === blank(vb) ? 0 : blank(va) ? 1 : -1;
      const diff = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb));
      return sign * diff;
    });
  }, [rows, filters, filterId, query, search, sort, columns, nameSort]);

  const pages = Math.max(1, Math.ceil(matching.length / pageSize));
  const current = Math.min(page, pages - 1);
  const pageRows = useMemo(
    () => (matching.length ? Array.from({ length: Math.ceil(matching.length / pageSize) }, (_, i) => matching.slice(i * pageSize, i * pageSize + pageSize)) : [[]]),
    [matching, pageSize]
  );
  const from = matching.length ? current * pageSize + 1 : 0;
  const to = Math.min(matching.length, (current + 1) * pageSize);
  const lensColumn = columns.find((c) => c.id === lens) ?? columns[0];
  // Filter tabs only when there's more than one to pick between
  const tabbed = Boolean(filters && filters.length > 1);
  const template = ['minmax(0, 2fr)', ...columns.map(() => 'minmax(0, 1fr)')].join(' ');

  // A new sort, filter or search starts again from the first page
  const restart = () => {
    setPage(0);
    setOpen(null);
    settleRef.current.page = 0;
    trackRef.current?.scrollTo({ left: 0 });
  };

  // A tapped label sorts by its column (and, narrow, shows it); tapped again, it flips
  const sortBy = (id: string) => {
    const column = columns.find((c) => c.id === id);
    if (column) setLens(id);
    if (id !== 'name' && !column?.sort) return;
    setSort((now) => (now.by === id ? { by: id, dir: now.dir === 'asc' ? 'desc' : 'asc' } : { by: id, dir: id === 'name' ? 'asc' : column?.dir ?? 'desc' }));
    restart();
  };

  // A new page starts with its first row just under the bar
  const toTop = () => {
    const track = trackRef.current;
    const bar = barRef.current;
    if (!track || !bar) return;
    // Read now, not at load: a story's cover shrinks to a band as it scrolls
    const heroLine = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hero-line')) || 0;
    const target = track.getBoundingClientRect().top + window.scrollY - bar.offsetHeight - Math.max(readPinLine(), heroLine);
    if (window.scrollY > target) window.scrollTo({ top: target, behavior: 'smooth' });
  };

  // ‹ › glide to the page, the same as a swipe
  const goTo = (next: number) => {
    const track = trackRef.current;
    if (track) track.scrollTo({ left: next * track.clientWidth, behavior: 'smooth' });
  };

  // The page in view follows the track; once a swipe settles on a new page,
  // its first row comes up under the bar and any open row closes
  const onTrackScroll = () => {
    const track = trackRef.current;
    if (!track || !track.clientWidth) return;
    const inView = Math.round(track.scrollLeft / track.clientWidth);
    if (inView !== page) setPage(inView);
    const settle = settleRef.current;
    clearTimeout(settle.timer);
    settle.timer = setTimeout(() => {
      if (settle.page === inView) return;
      settle.page = inView;
      try {
        localStorage.setItem(SWIPE_SHOWN, '1');
      } catch {}
      setOpen(null);
      toTop();
    }, 140);
  };

  useDragScroll(trackRef);

  // The first time a paged table comes into view, its pages lean left far
  // enough to show the next one's edge, then settle back: the swipe, shown
  // once. Once per browser (any table), and never after a swipe of their own
  // or with reduced motion
  useEffect(() => {
    const track = trackRef.current;
    if (!track || pages < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    try {
      if (localStorage.getItem(SWIPE_SHOWN)) return;
    } catch {
      return;
    }
    let timer: ReturnType<typeof setTimeout> | undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        timer = setTimeout(() => {
          if (track.scrollLeft > 1) return; // they've swiped already
          Array.from(track.children).slice(0, 2).forEach((page) =>
            (page as HTMLElement).animate(
              [{ transform: 'translateX(0)' }, { transform: 'translateX(-56px)', offset: 0.45 }, { transform: 'translateX(0)' }],
              { duration: 1100, easing: 'cubic-bezier(0.65, 0, 0.35, 1)' }
            )
          );
          try {
            localStorage.setItem(SWIPE_SHOWN, '1');
          } catch {}
        }, 400);
      },
      { threshold: 0.5 }
    );
    observer.observe(track);
    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [pages]);

  // A new width (a phone turned, a window resized) keeps the same page in
  // view instead of landing between two
  const pageInView = useRef(0);
  useEffect(() => {
    pageInView.current = current;
  }, [current]);
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let width = track.clientWidth;
    const observer = new ResizeObserver(() => {
      if (track.clientWidth === width) return;
      width = track.clientWidth;
      track.scrollTo({ left: pageInView.current * width });
    });
    observer.observe(track);
    return () => observer.disconnect();
  }, []);

  // The track is as tall as the page in view, and follows it as rows open
  useEffect(() => {
    const ul = pageRefs.current[current];
    if (!ul) return;
    const measure = () => setTrackHeight(ul.offsetHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(ul);
    return () => observer.disconnect();
  }, [current, pageRows]);

  const arrow = (id: string) => (sort.by === id ? (sort.dir === 'asc' ? ' ↑' : ' ↓') : '');
  const sortLabel = (id: string, text: string) =>
    sort.by === id ? `${text}, sorted ${sort.dir === 'asc' ? 'low to high' : 'high to low'}` : `Sort by ${text}`;

  // The range and ‹ ›: in full beside the tabs when wide, '2/5' at the end of the label row when narrow
  const pager = (compact = false) => (
    <span className="flex shrink-0 items-center gap-1 font-google-sans-code text-xs" style={{ color: 'var(--text-muted)' }}>
      {compact ? (
        <span className="order-1 px-0.5 tabular-nums" aria-label={`Page ${current + 1} of ${pages}`}>
          {current + 1}/{pages}
        </span>
      ) : (
        <span className="mr-1 tabular-nums" aria-live="polite">{from}–{to} of {matching.length}</span>
      )}
      {(['‹', '›'] as const).map((glyph, i) => {
        const disabled = i === 0 ? current === 0 : current >= pages - 1;
        return (
          <button
            key={glyph}
            type="button"
            onClick={() => goTo(current + (i === 0 ? -1 : 1))}
            disabled={disabled}
            aria-label={i === 0 ? 'Previous page' : 'Next page'}
            className={`${compact && i === 1 ? 'order-2' : ''} grid size-8 place-items-center rounded-full border text-sm transition-transform duration-200 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:scale-100`}
            style={{ borderColor: `${colorValue}66`, color: disabled ? 'var(--text-muted)' : colorValue }}
          >
            {glyph}
          </button>
        );
      })}
    </span>
  );

  return (
    <div className="row-table w-full" style={{ ['--row-table-columns' as string]: template } as React.CSSProperties}>
      {search && (
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            restart();
          }}
          placeholder={searchLabel ?? `search ${label}s`}
          aria-label={searchLabel ?? `Search ${label}s`}
          className="mb-2 w-full border-b bg-transparent py-2 font-google-sans-code text-sm text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus-visible:outline-none"
          style={{ borderColor: query ? colorValue : `${colorValue}40` }}
        />
      )}

      {/* The bar: sticks while the table is on screen, so every control stays a tap away */}
      <div ref={barRef} className="sticky z-20" style={{ top: `max(var(--hero-line, 0px), var(--pin-line, 0px), ${chromeTop}px)`, backgroundColor: 'var(--background)' }}>
        {/* Filter tabs, with the range and ‹ › beside them when wide. With no
            tabs there's no row: the pager sits in the header row instead, at
            every width, so the table's name never shows twice */}
        {tabbed && filters && (
          <div className="flex items-center gap-4 border-b" style={{ borderColor: `${colorValue}25` }}>
            <div className="min-w-0 flex-1">
              <SleekTabs
                tabs={filters.map((f) => ({ id: f.id, label: <>{f.label}. <span style={{ color: colorValue }}>{counts[f.id]}</span></> }))}
                activeId={filterId}
                onChange={(id) => {
                  setFilterId(id);
                  restart();
                }}
                accent={colorValue}
                label={`Filter ${label}s`}
                className="border-b-0"
              />
            </div>
            <span className="row-table__wide-only">{pager()}</span>
          </div>
        )}

        {/* Narrow: the name label, and the column labels as a lens over the right-hand value */}
        <div className="row-table__lens flex items-center gap-4 border-b" style={{ borderColor: `${colorValue}25` }}>
          <button
            type="button"
            onClick={() => sortBy('name')}
            aria-label={sortLabel('name', label)}
            className={`${LABEL} shrink-0 whitespace-nowrap py-2`}
            style={{ color: sort.by === 'name' ? 'var(--foreground)' : 'var(--text-muted)' }}
          >
            {label}.<span style={{ color: colorValue }}>{arrow('name')}</span>
          </button>
          <div
            ref={lensRef}
            onScroll={measureLens}
            role="group"
            aria-label="Show and sort by"
            className="flex min-w-0 flex-1 overflow-x-auto scrollbar-hide"
            style={lensEdges.left || lensEdges.right ? {
              maskImage: `linear-gradient(to right, ${lensEdges.left ? 'transparent, black 1.5rem' : 'black'}, ${lensEdges.right ? 'black calc(100% - 1.5rem), transparent' : 'black'})`,
              WebkitMaskImage: `linear-gradient(to right, ${lensEdges.left ? 'transparent, black 1.5rem' : 'black'}, ${lensEdges.right ? 'black calc(100% - 1.5rem), transparent' : 'black'})`,
            } : undefined}
          >
            <div className="ml-auto flex shrink-0 gap-4">
            {columns.map((c) => {
              const shown = c.id === lensColumn?.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={(e) => {
                    sortBy(c.id);
                    // A label half under the fade slides fully into view
                    e.currentTarget.scrollIntoView({ inline: 'nearest', block: 'nearest', behavior: 'smooth' });
                  }}
                  aria-pressed={shown}
                  aria-label={`Show ${c.label}${c.sort ? (sort.by === c.id ? `, sorted ${sort.dir === 'asc' ? 'low to high' : 'high to low'}` : ', and sort by it') : ''}`}
                  className={`${LABEL} relative shrink-0 whitespace-nowrap py-2`}
                  style={{ color: shown ? 'var(--foreground)' : 'var(--text-muted)' }}
                >
                  {c.label}.<span style={{ color: colorValue }}>{arrow(c.id)}</span>
                  <span aria-hidden className="absolute inset-x-0 bottom-0 h-0.5" style={{ backgroundColor: colorValue, opacity: shown ? 1 : 0 }} />
                </button>
              );
            })}
            </div>
          </div>
          {pages > 1 && pager(true)}
        </div>

        {/* Wide: every column, and every label sorts */}
        <div className="row-table__head border-b" style={{ borderColor: `${colorValue}25` }}>
          {[{ id: 'name', label, sortable: true }, ...columns.map((c) => ({ id: c.id, label: c.label, sortable: Boolean(c.sort) }))].map((h, i) => {
            const button = (
              <button
                key={h.id}
                type="button"
                onClick={() => sortBy(h.id)}
                disabled={!h.sortable}
                aria-label={h.sortable ? sortLabel(h.id, h.label) : h.label}
                className={`${LABEL} whitespace-nowrap py-2 transition-colors disabled:cursor-default ${i === 0 ? 'text-left' : 'text-right'}`}
                style={{ color: sort.by === h.id ? 'var(--foreground)' : 'var(--text-muted)' }}
              >
                {h.label}.<span style={{ color: colorValue }}>{arrow(h.id)}</span>
              </button>
            );
            // No tab row to hold it: the pager shares the name's header cell, as on a phone
            return i === 0 && !tabbed && pages > 1 ? (
              <div key={h.id} className="flex min-w-0 items-center justify-between gap-2">
                {button}
                {pager(true)}
              </div>
            ) : (
              button
            );
          })}
        </div>
      </div>

      <div
        ref={trackRef}
        onScroll={onTrackScroll}
        role="region"
        aria-label={pages > 1 ? `${label}s, page ${current + 1} of ${pages}` : `${label}s`}
        tabIndex={pages > 1 ? 0 : undefined}
        className="row-table__track scrollbar-hide focus-visible:outline focus-visible:outline-1 focus-visible:-outline-offset-1 focus-visible:outline-[var(--theme-color)]"
        data-paged={pages > 1 || undefined}
        // The layout lives here, not only in a stylesheet, so the pages can
        // never stack and spill over what follows the table if the two load
        // out of step (the drag cursor and snap pause stay in globals.css)
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          overflowX: 'auto',
          overflowY: 'hidden',
          overscrollBehaviorX: 'contain',
          scrollSnapType: 'x mandatory',
          height: trackHeight,
        }}
      >
        {pageRows.map((rowsOfPage, pageIndex) => (
      <ul
        key={pageIndex}
        ref={(el) => { pageRefs.current[pageIndex] = el; }}
        aria-label={pages > 1 ? `page ${pageIndex + 1}` : undefined}
        inert={pageIndex !== current || undefined}
        style={{ flex: '0 0 100%', minWidth: 0, scrollSnapAlign: 'start', scrollSnapStop: 'always' }}
      >
        {rowsOfPage.map((row) => {
          const key = rowKey(row);
          const isOpen = open === key;
          const link = href?.(row);
          const c = circle?.(row);
          const opens = details.length > 0;
          const body = (
            <>
              <span className="flex min-w-0 items-center gap-3">
                {c && <Circle circle={c} colorValue={colorValue} />}
                <span className="min-w-0">
                  <span className="block truncate font-space-grotesk text-sm font-medium text-[var(--foreground)]">{name(row)}</span>
                  {meta && <span className="block truncate font-google-sans-code text-xs" style={{ color: 'var(--text-muted)' }}>{meta(row)}</span>}
                </span>
              </span>
              {/* Narrow: the lens column's value */}
              {lensColumn && (
                <span className="row-table__lens-value flex shrink-0 items-center gap-2 font-google-sans-code text-xs tabular-nums text-[var(--foreground)]">
                  {lensColumn.value(row)}
                  {opens && <Caret open={isOpen} colorValue={colorValue} />}
                </span>
              )}
              {/* Wide: every column */}
              {columns.map((col, i) => (
                <span key={col.id} className="row-table__cell items-center justify-end gap-2 font-google-sans-code text-xs tabular-nums text-[var(--foreground)]">
                  {col.value(row)}
                  {opens && i === columns.length - 1 && <Caret open={isOpen} colorValue={colorValue} />}
                </span>
              ))}
            </>
          );
          const rowClass = 'row-table__row w-full py-3 text-left transition-colors duration-200 hover:bg-[var(--background-highlight)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--theme-color)]';
          return (
            <li key={key} className="border-b" style={{ borderColor: `${colorValue}1a` }}>
              {opens ? (
                <button type="button" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : key)} className={rowClass}>
                  {body}
                </button>
              ) : link ? (
                <Link href={link} className={rowClass} {...(external && { target: '_blank', rel: 'noopener noreferrer' })}>
                  {body}
                </Link>
              ) : (
                <div className={rowClass}>{body}</div>
              )}
              {opens && (
                <div className="row-table__panel" data-open={isOpen || undefined} inert={!isOpen}>
                  <div className="min-h-0 overflow-hidden">
                    <dl className="grid gap-2 pb-4 pl-11 pr-2">
                      {details.map((f) => (
                        <div key={f.id} className="flex gap-4">
                          <dt className={`${LABEL} w-24 shrink-0 pt-0.5`} style={{ color: 'var(--text-muted)' }}>{f.label}.</dt>
                          <dd className="min-w-0 font-space-grotesk text-sm text-[var(--foreground)]">{f.value(row)}</dd>
                        </div>
                      ))}
                      {link && (
                        <div>
                          <Link
                            href={link}
                            {...(external && { target: '_blank', rel: 'noopener noreferrer' })}
                            className="mt-1 inline-flex h-9 items-center rounded-full border px-4 font-google-sans-code text-xs transition-transform duration-200 hover:scale-105"
                            style={{ borderColor: colorValue, color: colorValue }}
                          >
                            {hrefLabel} →
                          </Link>
                        </div>
                      )}
                    </dl>
                  </div>
                </div>
              )}
            </li>
          );
        })}
        {rowsOfPage.length === 0 && (
          <li className="py-6 font-google-sans-code text-sm" style={{ color: 'var(--text-muted)' }}>{empty}</li>
        )}
      </ul>
        ))}
      </div>

      {footer && <p className="mt-3 font-google-sans-code text-xs" style={{ color: 'var(--text-muted)' }}>{footer}</p>}
    </div>
  );
}
