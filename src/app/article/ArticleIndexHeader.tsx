'use client';

import { useTheme } from '../contexts/ThemeContext';

interface ArticleIndexHeaderProps {
  articleCount: number;
  categoryCount: number;
}

/**
 * The /article header. The counts come from the server page: only the
 * server loads the markdown and JSON articles, so counting in the browser
 * gave a smaller number than the server rendered (125 vs 71), a hydration
 * mismatch and a wrong count
 */
export default function ArticleIndexHeader({ articleCount, categoryCount }: ArticleIndexHeaderProps) {
  const { colorValue } = useTheme();

  return (
    <div className="mb-12">
      <div className="mb-4 inline-flex items-center gap-3 rounded-full border px-4 py-2" style={{ borderColor: colorValue, backgroundColor: `${colorValue}10` }}>
        <span
          className="font-google-sans-code text-xs uppercase tracking-widest opacity-60"
          style={{ color: 'var(--foreground)' }}
        >
          DOC.
        </span>
        <div className="h-px flex-1 opacity-10" style={{ backgroundColor: 'var(--foreground)' }} />
      </div>

      <h1
        className="font-vt323 text-4xl uppercase sm:text-5xl"
        style={{ color: 'var(--foreground)' }}
      >
        learning in unparty.app
      </h1>

      <p
        className="mt-3 max-w-xl font-google-sans-code text-sm leading-relaxed opacity-60"
        style={{ color: 'var(--foreground)' }}
      >
        unparty.app is a step by step approach to human-in-the-know machine learning. Explore, learn, and build using guides, docs, and templates inspired by what unparty.app is building out loud.
      </p>

      {/* Meta row */}
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <span className="font-google-sans-code text-xs" style={{ color: 'var(--text-muted)' }}>
          <span className="font-vt323 text-base">{articleCount}</span>
          {' '}thinking.
        </span>
        <span className="opacity-20" style={{ color: 'var(--foreground)' }}>·</span>
        <span className="font-google-sans-code text-xs" style={{ color: 'var(--text-muted)' }}>
          <span className="font-vt323 text-base">{categoryCount}</span>
          {' '}classified.
        </span>
      </div>
    </div>
  );
}
