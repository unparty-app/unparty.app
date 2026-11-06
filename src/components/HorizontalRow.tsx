// src/components/HorizontalRow.tsx
'use client';

import Link from 'next/link';
import { ReactNode, useEffect, useRef } from 'react';
import { useTheme } from '../app/contexts/ThemeContext';
import HandDrawnArrow from '../app/components/HandDrawnArrow';
import { useDragScroll } from '../hooks/useDragScroll';

interface ScrollRowProps {
  items: ReactNode[];
  moreLink?: string;
  title?: string;
  maxItems?: number;
  onMoreClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  fullBleed?: boolean;
  itemClassName?: string; // Each item's slot (default 280px wide), sized to what the row holds
  ariaLabel?: string; // Names the row for screen readers when it has no title (defaults to the title)
  layout?: 'row' | 'grid'; // grid: square items, four to a page as a 2×2, a page per swipe
}

// Items per page in the grid layout: always 2×2, never 3×2
const PAGE = 4;

/**
 * ScrollRow - a titled, horizontally scrolling row.
 *
 * - fullBleed: the row spans the screen edge to edge, centered while it fits
 *   and scrolling out to both edges once it doesn't (safe centering keeps the
 *   first item reachable). Inside a story column it stays within the column
 *   (globals.css .scroll-row-bleed)
 * - The edges fade only on a side with more to scroll to, and a mouse can drag
 *   the row (touch and trackpads scroll it natively)
 * - maxItems cuts the row only when moreLink leads to the rest; with nowhere
 *   to go, every item stays reachable by scrolling (#460)
 * - The title links to moreLink when there is one, and is plain text otherwise
 * - Keyboard and screen readers: the row is one labeled region that arrow
 *   keys scroll; the links and buttons inside the items are the tab stops,
 *   not the item slots (#214)
 * - layout="grid": square items, four to a page as a 2×2, one page per swipe
 *   (pages snap). Two columns at every width; each square is the smallest of
 *   half the row, half the screen's height and 18rem (globals.css
 *   .scroll-row-grid), so a whole page fits on any screen and the next one
 *   peeks in where there's room. itemClassName is ignored
 */
export default function ScrollRow({
  items,
  moreLink,
  title,
  maxItems = 5,
  onMoreClick,
  fullBleed = false,
  itemClassName = 'w-[280px]',
  ariaLabel,
  layout = 'row'
}: ScrollRowProps) {
  const displayItems = moreLink ? items.slice(0, maxItems) : items;
  const { colorValue } = useTheme();
  const trackRef = useRef<HTMLDivElement>(null);

  // Edge fades: mark each side that has more to scroll to
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const update = () => {
      const max = track.scrollWidth - track.clientWidth;
      track.dataset.moreStart = String(track.scrollLeft > 1);
      track.dataset.moreEnd = String(track.scrollLeft < max - 1);
    };
    update();
    track.addEventListener('scroll', update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(track);
    return () => {
      track.removeEventListener('scroll', update);
      observer.disconnect();
    };
  }, [displayItems.length]);

  // Mouse drag to scroll, the same as RowTable's pages
  useDragScroll(trackRef);

  const heading = title && (
    <h2 className="text-md relative inline-block font-vt323 font-bold transition-all duration-200" style={{ color: 'inherit' }}>
      {title}
      {moreLink && (
        <span
          className="absolute bottom-0 left-0 h-0.5 w-0 transition-all duration-200 group-hover:w-full"
          style={{ backgroundColor: colorValue }}
        />
      )}
    </h2>
  );

  return (
    <div className="w-full">
      {title && (
        <div className="mb-3 px-4">
          {moreLink ? (
            <Link href={moreLink} className="group inline-block">
              {heading}
            </Link>
          ) : (
            heading
          )}
        </div>
      )}

      <div className={`${fullBleed ? 'scroll-row-bleed' : ''} ${layout === 'grid' ? 'scroll-row-grid' : ''}`}>
        <div
          ref={trackRef}
          role="region"
          aria-label={title || ariaLabel || 'Scrollable row'}
          tabIndex={0}
          className={`scroll-row-track flex snap-x snap-mandatory items-center gap-4 overflow-x-auto scrollbar-hide scroll-pl-4 px-4 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--theme-color)] ${
            fullBleed ? 'sm:scroll-pl-6 sm:px-6' : ''
          }`}
        >
          {layout === 'grid'
            ? Array.from({ length: Math.ceil(displayItems.length / PAGE) }, (_, page) => (
                <div key={page} className="scroll-row-grid__page grid shrink-0 snap-start grid-cols-2">
                  {displayItems.slice(page * PAGE, page * PAGE + PAGE).map((item, idx) => (
                    <div key={idx} className="scroll-row-grid__tile">
                      {item}
                    </div>
                  ))}
                </div>
              ))
            : displayItems.map((item, idx) => (
                <div key={idx} className={`shrink-0 snap-start ${itemClassName}`}>
                  {item}
                </div>
              ))}

          {moreLink && (
            <Link
              href={moreLink}
              onClick={onMoreClick}
              aria-label={title ? `More ${title}` : 'More'}
              className="group flex h-12 w-16 shrink-0 snap-start items-center justify-center self-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-color)]"
            >
              <HandDrawnArrow />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
