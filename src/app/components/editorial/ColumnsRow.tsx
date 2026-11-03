'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface ColumnsRowProps {
  columns: React.ReactNode[];
  gridTemplate: string;        // md+ grid-template-columns, e.g. '1fr 1fr'
  peek: boolean;               // phones: swipe the columns sideways instead of stacking
  verticalAlignClass: string;
  stickyIndex: number;         // column that stays pinned from md up, -1 for none
  className?: string;
}

/**
 * ColumnsRow - a story/article row of columns (`:::columns`). Whenever the
 * row is wide enough for its columns (about 200px each, a container query on
 * the row, not a window breakpoint) they sit side by side and the text wraps
 * beside its neighbour. Narrower than that (phones), they stack, or with peek
 * they swipe sideways, each 85% wide so the next one peeks in, with an
 * indicator bar under the row (one segment per column, the one in view in the
 * theme color; tap a segment to go to it) so visitors know there's more.
 *
 * Each column is a size container (.editorial-column), so headings inside
 * it scale to the column instead of the page (globals.css).
 *
 * top-32 (128px) matches the site's fixed Header+Banner chrome height
 * (see StickyHeroStack's FALLBACK_TOP_OFFSET); still a static guess, so it
 * won't track the Banner growing (e.g. once the theme song loads).
 */
const ColumnsRow: React.FC<ColumnsRowProps> = ({
  columns,
  gridTemplate,
  peek,
  verticalAlignClass,
  stickyIndex,
  className = ''
}) => {
  const { colorValue } = useTheme();
  const rowRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const outerRef = useRef<HTMLDivElement>(null);
  // Side by side once the row has room (about 200px a column), measured here
  // and applied inline: the layout can't depend on a stylesheet a dev tab may
  // still hold an old copy of. Before the first measure, the classes below
  // (container query, md:) decide.
  const [sideBySide, setSideBySide] = useState<boolean | null>(null);
  const minRowWidth = columns.length >= 3 ? 520 : 440;

  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const measure = () => setSideBySide(el.clientWidth >= minRowWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [minRowWidth]);

  const swipe = peek && sideBySide === false;

  const columnEls = () => Array.from(rowRef.current?.children ?? []) as HTMLElement[];

  // The column whose left edge is nearest the row's (padded) left edge is the
  // one in view; the row is `relative`, so offsetLeft is measured from it
  const onScroll = () => {
    const row = rowRef.current;
    if (!row) return;
    const edge = row.scrollLeft + parseFloat(getComputedStyle(row).paddingLeft);
    let nearest = 0;
    columnEls().forEach((el, i) => {
      if (Math.abs(el.offsetLeft - edge) < Math.abs(columnEls()[nearest].offsetLeft - edge)) nearest = i;
    });
    setActive(nearest);
  };

  const goTo = (index: number) => {
    const row = rowRef.current;
    const el = columnEls()[index];
    if (!row || !el) return;
    row.scrollTo({ left: el.offsetLeft - parseFloat(getComputedStyle(row).paddingLeft), behavior: 'smooth' });
  };

  return (
    // The row, not the window, decides: side by side whenever it has room for
    // its columns (globals.css .columns-row), so column one's lines wrap beside
    // the next column in any pane wider than a phone. The md: classes are a
    // floor that doesn't depend on that container query (a tab still holding
    // an older stylesheet, a browser without container queries): from 768px
    // wide the columns are always side by side
    <div ref={outerRef} className={`columns-row my-8 ${className}`} data-columns={Math.min(columns.length, 4)}>
      <div
        ref={rowRef}
        onScroll={swipe ? onScroll : undefined}
        className={`columns-row__track relative ${
          peek
            ? '-mx-6 flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-pl-6 px-6 scrollbar-hide md:mx-0 md:grid md:snap-none md:gap-8 md:overflow-visible md:px-0'
            : 'grid grid-cols-1 gap-8'
        } md:grid-cols-[var(--column-template)] ${verticalAlignClass}`}
        style={{
          '--column-template': gridTemplate,
          ...(sideBySide
            ? { display: 'grid', gridTemplateColumns: gridTemplate, gap: '2rem', marginInline: 0, paddingInline: 0, overflow: 'visible', scrollSnapType: 'none' }
            : {})
        } as React.CSSProperties}
      >
        {columns.map((col, i) => (
          <div
            key={i}
            className={`editorial-column min-w-0 ${peek ? 'w-[85%] shrink-0 snap-start md:w-auto' : ''} ${i === stickyIndex ? 'md:sticky md:top-32' : ''}`}
            style={sideBySide ? { width: 'auto' } : undefined}
          >
            {col}
          </div>
        ))}
      </div>

      {peek && columns.length > 1 && sideBySide !== true && (
        <div className="columns-row__dots mt-4 flex items-center gap-1.5 md:hidden">
          {columns.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Column ${i + 1} of ${columns.length}`}
              aria-current={i === active ? 'true' : undefined}
              // A 24px tap area around each thin segment
              className="flex h-6 w-8 items-center"
            >
              <span
                className="h-1 w-full rounded-full transition-colors duration-300"
                style={{ backgroundColor: i === active ? colorValue : `${colorValue}33` }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ColumnsRow;
