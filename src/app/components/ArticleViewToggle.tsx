'use client';

import { useTheme } from '../contexts/ThemeContext';

export type ArticleView = 'balls' | 'list';

interface ArticleViewToggleProps {
  view: ArticleView;
  onChange: (view: ArticleView) => void;
  total: number; // Every article, shown beside the list icon
}

// Pen-stroke icons, drawn a little unevenly on purpose
const BALLS_PATHS = [
  'M5.2 4.3c2.3-.4 4.1 1.2 4 3.6-.1 2.3-1.9 3.9-4.1 3.7C3 11.4 1.6 9.6 1.8 7.5c.2-1.7 1.5-3 3.4-3.2',
  'M14.1 4.1c2.4-.2 4 1.5 3.9 3.8-.2 2.2-2 3.8-4.2 3.6-2.1-.2-3.5-2-3.2-4.1.2-1.8 1.6-3.2 3.5-3.3',
  'M22.9 4.4c2.2-.1 3.7 1.6 3.5 3.7-.2 2.2-2 3.7-4.1 3.5-2-.2-3.4-1.9-3.2-4 .2-1.7 1.8-3.1 3.8-3.2',
];
const LIST_PATHS = [
  'M2 3.6c5.5-.4 10.6.2 15.9-.2',
  'M21.6 3.5c1.6.1 3 0 4.4.1',
  'M2.2 8.1c5.2.3 10.3-.3 15.6.1',
  'M21.4 8c1.7-.1 3.1.1 4.5 0',
  'M2 12.5c5.4-.2 10.6.3 15.8-.1',
  'M21.7 12.4c1.5.1 2.9-.1 4.3 0',
];
const UNDERLINE = 'M2 2.6c7.4-1.2 15.1-1.3 24.4-.2';

/**
 * ArticleViewToggle - switches the DOC. section between the newest articles
 * as balls and every article as a list. The active view is drawn in the
 * theme color with a scribbled underline that draws itself in
 * (globals.css .view-toggle); the other is muted until hovered.
 */
export default function ArticleViewToggle({ view, onChange, total }: ArticleViewToggleProps) {
  const { colorValue } = useTheme();

  const option = (value: ArticleView, label: string, paths: string[], count?: number) => {
    const active = view === value;
    return (
      <button
        type="button"
        aria-pressed={active}
        aria-label={label}
        onClick={() => onChange(value)}
        className="view-toggle group flex flex-col items-start gap-0.5 rounded px-1 py-1 transition-opacity duration-200 hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-color)] motion-reduce:transition-none"
        style={{ color: active ? colorValue : 'var(--text-muted)', opacity: active ? 1 : 0.6 }}
      >
        <span className="flex items-center gap-1.5">
          <svg viewBox="0 0 28 16" className="h-4 w-7" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" aria-hidden="true">
            {paths.map(d => <path key={d} d={d} />)}
          </svg>
          {count !== undefined && <span className="font-vt323 text-sm leading-none">{count}</span>}
        </span>
        <svg viewBox="0 0 28 4" className="h-1 w-7" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" aria-hidden="true">
          {active && <path key={`${value}-on`} className="view-toggle__underline" pathLength={1} d={UNDERLINE} />}
        </svg>
      </button>
    );
  };

  return (
    <div role="group" aria-label="Article view" className="flex items-center gap-2">
      {option('balls', 'Newest articles as balls', BALLS_PATHS)}
      {option('list', `All ${total} articles as a list`, LIST_PATHS, total)}
    </div>
  );
}
