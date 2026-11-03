'use client';

import HandDrawnArrow from '../HandDrawnArrow';

interface PagerProps {
  page: number;
  pageCount: number;
  onPage: (page: number) => void;
  color: string;
  label: string;
}

/**
 * Pen arrows either side of dots and "2 / 3", for a list that pages instead of
 * growing (BuildYourStack's tabs, the component portfolio). Hidden when
 * everything fits on one page. The caller keeps the page and slides it in.
 */
export default function Pager({ page, pageCount, onPage, color, label }: PagerProps) {
  if (pageCount <= 1) return null;
  const arrowClass =
    'group rounded-full p-1 transition-opacity disabled:opacity-25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2';
  return (
    <nav className="mt-4 flex items-center gap-4" aria-label={label}>
      <button type="button" onClick={() => onPage(page - 1)} disabled={page === 0} aria-label="previous page" className={arrowClass} style={{ outlineColor: color }}>
        <HandDrawnArrow className="h-5 w-8 -scale-x-100" color={color} />
      </button>
      <span className="flex items-center gap-1.5" aria-hidden="true">
        {Array.from({ length: pageCount }, (_, i) => (
          <button
            key={i}
            type="button"
            tabIndex={-1}
            onClick={() => onPage(i)}
            className="h-1.5 rounded-full transition-all duration-300"
            style={{ width: i === page ? '1.25rem' : '0.375rem', backgroundColor: color, opacity: i === page ? 1 : 0.35 }}
          />
        ))}
      </span>
      <span className="font-google-sans-code text-[10px] uppercase tracking-wide text-[var(--text-muted)]" aria-live="polite">
        {page + 1} / {pageCount}
      </span>
      <button
        type="button"
        onClick={() => onPage(page + 1)}
        disabled={page === pageCount - 1}
        aria-label="next page"
        className={arrowClass}
        style={{ outlineColor: color }}
      >
        <HandDrawnArrow className="h-5 w-8" color={color} />
      </button>
    </nav>
  );
}
