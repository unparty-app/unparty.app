'use client';

import { useTheme } from '../contexts/ThemeContext';
import PriorityTable from '../components/PriorityTable';

const METHODOLOGY_ROWS: { key: string; source: string; measures: string }[] = [
  { key: 'URL', source: 'UnpppsConfig.json → url', measures: 'Deploy tier — unparty.app (4) > TestFlight (3) > vercel.app (2) > other (1) > none (0).' },
  { key: 'CORE', source: 'UnpppsConfig.json → id', measures: 'Flat bonus if the id is one of the 6 repos confirmed wired into the architecture (issue #621): theunpartyapp, theunpartyapi, theunpartybuilder, theunpartycore, theunpartycrawler, theunpartyrunway.' },
  { key: 'PRODUCT', source: 'UnpppsConfig.json → id', measures: 'Flat bonus for shipped consumer-facing products (theunpartyunppp, theunpartycharette).' },
  { key: 'KEYS', source: 'UnpppsConfig.json → 25 expected fields', measures: 'How much of the config is actually filled in — story metadata, branding, pricing, etc.' },
  { key: 'ACTIVE', source: 'raw-repo-metadata.json → enhanced_metrics.active_period_metrics', measures: 'Weeks with commits, burst weeks, active-period ratio — is this repo consistently worked on, or was it a one-time push?' },
  { key: 'BOUNDED', source: 'raw-repo-metadata.json → enhanced_metrics.time_bounded_commits', measures: 'Recency-weighted commit volume — last 5 days weighted 2x, last 30 days weighted 0.3x. Answers "what is being worked on right now."' },
  { key: 'REPO', source: 'ACTIVE + BOUNDED', measures: 'The real-activity half of the score, matched to each unppp via the unppp_id field (issue: theunpartycharette’s repo is actually named uncolor-ios — matching by name alone silently dropped it until repo-metadata-analyzer was fixed to preserve the match).' },
  { key: 'COMBINED', source: 'UNPPP total + REPO total', measures: 'The single sortable number PriorityTable ranks by — config completeness and shipped-ness, plus what is actually being built right now.' },
];

const PriorityPage = () => {
  const { colorValue } = useTheme();

  return (
    <main className="mx-auto w-full max-w-5xl px-4 sm:px-6">
      <div className="flex flex-col gap-10 py-10">
        {/* Hero */}
        <div>
          <h1
            className="text-left font-vt323 font-bold leading-none tracking-tight text-6xl sm:text-7xl md:text-8xl"
            style={{ color: colorValue }}
          >
            PRIORITY.
          </h1>
          <p className="mt-6 max-w-3xl font-google-sans-code text-base leading-relaxed sm:text-lg" style={{ color: 'var(--text-muted)' }}>
            unppps used to carry a hand-set <code>priority</code> field in config. This page replaces that
            with an effort-driven score — config completeness plus real, recency-weighted commit activity —
            built to help answer the question this whole investigation started with: what does unparty-app
            actually focus on?
          </p>
        </div>

        {/* Methodology breakdown */}
        <div>
          <h2 className="mb-4 font-vt323 text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: colorValue }}>
            HOW IT&apos;S CALCULATED.
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200/20 dark:border-gray-700/20">
                  <th className="py-3 pl-0 pr-4 text-left">
                    <span className="font-google-sans-code text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>KEY</span>
                  </th>
                  <th className="py-3 px-4 text-left">
                    <span className="font-google-sans-code text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>SOURCE</span>
                  </th>
                  <th className="py-3 px-4 text-left">
                    <span className="font-google-sans-code text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>MEASURES</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {METHODOLOGY_ROWS.map((row) => (
                  <tr key={row.key} className="border-b border-gray-200/10 dark:border-gray-700/10">
                    <td className="py-3 pl-0 pr-4 align-top">
                      <span className="font-vt323 text-lg font-bold" style={{ color: colorValue }}>{row.key}</span>
                    </td>
                    <td className="py-3 px-4 align-top">
                      <span className="font-google-sans-code text-xs" style={{ color: 'var(--text-muted)' }}>{row.source}</span>
                    </td>
                    <td className="py-3 px-4 align-top">
                      <span className="font-google-sans-code text-sm" style={{ color: 'var(--foreground)' }}>{row.measures}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* What this surfaces */}
        <div>
          <h2 className="mb-4 font-vt323 text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: colorValue }}>
            WHAT IT&apos;S ALREADY SURFACING.
          </h2>
          <div className="space-y-3 font-google-sans-code text-sm leading-relaxed sm:text-base" style={{ color: 'var(--foreground)' }}>
            <p>
              <span className="font-bold" style={{ color: colorValue }}>theunpartyapp</span> and{' '}
              <span className="font-bold" style={{ color: colorValue }}>unparty-docs</span> lead on combined
              score — consistent with{' '}
              <a href="https://github.com/unparty-app/theunpartyapp/issues/619" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: colorValue }}>#619</a>
              {' '}and{' '}
              <a href="https://github.com/unparty-app/theunpartyapp/issues/620" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: colorValue }}>#620</a>
              {' '}finding that 2026&apos;s center of gravity moved from mobile toward the web platform and its
              documentation layer.
            </p>
            <p>
              <span className="font-bold" style={{ color: colorValue }}>theunpartyunppp</span> sits mid-pack
              despite its PRODUCT bonus — the ACTIVE/BOUNDED columns are where its -54% YTD slowdown
              (<a href="https://github.com/unparty-app/theunpartyapp/issues/619" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: colorValue }}>#619</a>)
              actually shows up as a number, not just a narrative claim.
            </p>
            <p>
              CORE-bonus repos (theunpartyapi, theunpartybuilder, theunpartycore, theunpartycrawler,
              theunpartyrunway) — the wired architecture confirmed in{' '}
              <a href="https://github.com/unparty-app/theunpartyapp/issues/621" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: colorValue }}>#621</a>
              {' '}— cluster together on REPO score too, which is itself a small piece of evidence that
              &quot;architecturally load-bearing&quot; and &quot;actively worked on&quot; correlate here, rather than being
              two unrelated claims.
            </p>
            <p>
              Rows marked <span className="font-google-sans-code text-xs uppercase" style={{ color: 'var(--text-muted)' }}>unmatched</span>{' '}
              have no corresponding entry in raw-repo-metadata.json — either genuinely no repo yet, or a
              repo/id mismatch this page hasn&apos;t caught. theunpartycharette was exactly this bug until its
              repo-metadata-analyzer fix landed — worth treating every unmatched row as a question, not a zero.
            </p>
          </div>
        </div>

        {/* Table */}
        <div>
          <h2 className="mb-4 font-vt323 text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: colorValue }}>
            THE TABLE.
          </h2>
          <PriorityTable />
        </div>
      </div>
    </main>
  );
};

export default PriorityPage;
