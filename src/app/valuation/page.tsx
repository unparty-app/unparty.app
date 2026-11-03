import type { Metadata } from 'next';
import { getValuationData } from '../../utils/valuation';
import { generatePageMetadata } from '../utils/ogMetadata';
import { SITE_TITLE } from '../constants/organization';
import ValuationLedger from './ValuationLedger';
import ValuationProvenanceChips from './ValuationProvenanceChips';
import ValuationAttribution from './ValuationAttribution';

export const metadata: Metadata = generatePageMetadata({
  title: `VALUATION | ${SITE_TITLE}`,
  description: 'Every unppp priced from measured git history, with its live Polar list price next to the build cost — the formula shown per unppp, not asserted.',
  category: 'VALUE',
  coverId: 'cover-003',
  path: '/valuation',
});

// The hero's snapshot-age line is computed at render time — revalidate so it
// stays honest instead of freezing at build (live Polar prices are fetched
// client-side and are always current).
export const revalidate = 3600;

// Fixed locale + UTC so output is deterministic wherever this renders.
const fmtMonth = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });

const fmtSnapshotAge = (iso: string): string => {
  const days = Math.max(0, Math.floor((Date.now() - Date.parse(iso)) / 86_400_000));
  if (days === 0) return 'today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
};

/**
 * /valuation — no hand-written framing (#1000). The headline is the computed
 * total, the subtitle is the dataset's own provenance, the attribution
 * phrases are bound to the measurements that back them, and everything below
 * (live Polar prices, composition, per-unppp formula walkthroughs, embedded
 * checkout) lives in ValuationLedger. Estimate = measured build cost (the
 * why); live Polar price = current list price (what you'd pay) — see
 * src/utils/valuation.ts for the full contract.
 */
export default function ValuationPage() {
  const { portfolio, rows } = getValuationData();

  const provenanceChips: string[] = [
    `${Math.round(portfolio.totalDevHours).toLocaleString('en-US')}h measured`,
    `${portfolio.totalCommits.toLocaleString('en-US')} commits`,
    `${portfolio.totalSessions.toLocaleString('en-US')} sessions`,
    `${portfolio.measuredCount}/${portfolio.unpppCount} from git history`,
    ...(portfolio.firstCommit && portfolio.lastCommit
      ? [`${fmtMonth(portfolio.firstCommit)} → ${fmtMonth(portfolio.lastCommit)}`]
      : []),
    `snapshot ${fmtSnapshotAge(portfolio.generatedAt)}`,
  ];

  return (
    <main className="mx-auto w-full max-w-5xl">
      <div className="flex w-full flex-col gap-6 px-2 py-8 md:gap-8">
        {/* Hero — the computed answer, then its receipts */}
        <div>
          <p className="font-google-sans-code text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            build cost, measured
          </p>
          <h1 className="font-vt323 text-6xl leading-tight md:text-7xl" style={{ color: 'var(--foreground)' }}>
            ${Math.round(portfolio.totalBuildEstimate).toLocaleString('en-US')}.
          </h1>
          <ValuationProvenanceChips chips={provenanceChips} />
        </div>

        {/* Attribution — each phrase bound to the measurement that backs it */}
        <ValuationAttribution
          totalDevHours={portfolio.totalDevHours}
          laborRatePerHour={portfolio.laborRatePerHour}
          llmBaselineCost={portfolio.llmBaselineCost}
          llmBaselineRange={portfolio.llmBaselineRange}
          llmRatePerHour={portfolio.llmRatePerHour}
        />

        <ValuationLedger portfolio={portfolio} rows={rows} />
      </div>
    </main>
  );
}
