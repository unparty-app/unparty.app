'use client';

/**
 * ValuationLedger — the interactive body of /valuation (#1000).
 *
 * Everything rendered here is derived from data, not asserted in copy:
 *  - live Polar list prices stream in per `polarProductId` from
 *    GET /api/unppp/price (the same path Stats.tsx uses) and roll up into
 *    list-vs-build aggregates that update as each price lands;
 *  - the portfolio composition bar shows what actually builds the estimate
 *    (labor / infra / premiums / llm) with real dollar magnitudes;
 *  - each ledger row expands into the pricing formula instantiated with that
 *    unppp's own measured inputs — replacing the old static methodology
 *    modal with a per-unppp, data-backed walkthrough;
 *  - checkout is the same embedded Polar flow as the Stats pill (#993),
 *    gated identically: anonymous visitors get the static price-only pill,
 *    signed-in users can buy in place (usePolarCheckout).
 *
 * Estimate vs live price: the build estimate is the WHY (measured cost,
 * frozen in a dated snapshot); the live Polar price is the WHAT-YOU'D-PAY
 * (current list price, never checked in). Rows and tiles show both and
 * derive the ratio between them. See src/utils/valuation.ts.
 */

import { useEffect, useMemo, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '@/lib/auth-stub.client';
import UnpppCircle from '../components/UnpppCircle';
import { CHECKOUT_ON } from '../constants/organization';
import {
  formatPolarPrice,
  usePolarCheckout,
  type PolarPrice,
} from '../hooks/usePolarCheckout';
import type {
  ValuationBreakdown,
  ValuationPortfolio,
  ValuationRow,
} from '@/utils/valuation';

interface ValuationLedgerProps {
  portfolio: ValuationPortfolio;
  rows: ValuationRow[];
}

/** undefined = still loading, null = no live price (unlisted / Polar offline). */
type PriceMap = Record<string, PolarPrice | null | undefined>;

const PRICE_FETCH_CONCURRENCY = 6;
const COLLAPSED_ROW_COUNT = 10;

/** Same key → same fill opacity on every composition bar, so the portfolio
 * bar and each row's mini bar speak one visual language. */
const COMPONENT_ALPHAS: Record<keyof ValuationBreakdown, number> = {
  labor: 1,
  infra: 0.72,
  health: 0.55,
  size: 0.42,
  lang: 0.3,
  llm: 0.2,
};

/** Two-digit hex alpha suffix for a `${color}${alpha}` string (ActivityBars convention). */
const toAlphaHex = (opacity: number): string =>
  Math.round(Math.max(0, Math.min(1, opacity)) * 255)
    .toString(16)
    .padStart(2, '0');

const fmtUsd = (n: number): string => `$${Math.round(n).toLocaleString('en-US')}`;
const fmtRate = (n: number): string => `$${n.toFixed(2)}`;
const fmtHours = (n: number): string => (n > 0 && n < 10 ? `${n.toFixed(1)}h` : `${Math.round(n)}h`);
const fmtInt = (n: number): string => n.toLocaleString('en-US');
// Fixed locale + UTC so server render and client hydration agree.
const fmtMonth = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });

/** live list price as a share of the build estimate, e.g. "0.2%" / "104%". */
function fmtListShare(priceAmountCents: number, buildEstimate: number): string | null {
  if (buildEstimate <= 0) return null;
  const pct = (priceAmountCents / 100 / buildEstimate) * 100;
  if (pct < 1) return `${pct.toFixed(2)}%`;
  if (pct < 10) return `${pct.toFixed(1)}%`;
  return `${Math.round(pct)}%`;
}

function CompositionBar({
  breakdown,
  color,
  heightClass = 'h-3',
}: {
  breakdown: ValuationBreakdown;
  color: string;
  heightClass?: string;
}) {
  const total = Object.values(breakdown).reduce((sum, n) => sum + n, 0);
  if (total <= 0) return null;
  const keys = Object.keys(COMPONENT_ALPHAS) as (keyof ValuationBreakdown)[];
  return (
    <div
      className={`flex w-full overflow-hidden rounded-full ${heightClass}`}
      style={{ backgroundColor: 'var(--background-highlight)' }}
      aria-hidden="true"
    >
      {keys.map(key => {
        const share = breakdown[key] / total;
        if (share <= 0) return null;
        return (
          <div
            key={key}
            title={`${key} ${fmtUsd(breakdown[key])}`}
            style={{
              width: `${Math.max(share * 100, 0.5)}%`,
              backgroundColor: `${color}${toAlphaHex(COMPONENT_ALPHAS[key])}`,
            }}
          />
        );
      })}
    </div>
  );
}

/** One formula line of an expanded row: measured input → priced output. */
function FormulaLine({
  input,
  label,
  amount,
  colorValue,
}: {
  input: string;
  label: string;
  amount: string;
  colorValue: string;
}) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="font-vt323 shrink-0 text-sm tabular-nums" style={{ color: 'var(--text-muted)' }}>
        {input}
      </span>
      <span
        className="flex-1 border-b border-dotted"
        style={{ borderColor: `${colorValue}20` }}
        aria-hidden="true"
      />
      <span className="font-google-sans-code shrink-0 text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
        {label}
      </span>
      <span className="font-vt323 w-16 shrink-0 text-right text-sm tabular-nums" style={{ color: 'var(--foreground)' }}>
        {amount}
      </span>
    </div>
  );
}

export default function ValuationLedger({ portfolio, rows }: ValuationLedgerProps) {
  const { colorValue } = useTheme();
  // Embedded checkout is live only for signed-in users. While Clerk is still
  // loading — and for anonymous visitors — isSignedIn is falsy, so every
  // pill renders as the static price-only variant (same gate as
  // StatsLayoutWrapper's disableCheckout={!isSignedIn}).
  // With checkout off (FoundersConfig `checkout`), prices stay as what each
  // unppp cost, never for sale.
  const { isSignedIn } = useAuth();
  const disableCheckout = !isSignedIn || !CHECKOUT_ON;
  const { checkoutState, activeProductId, purchasedProductIds, openCheckout } = usePolarCheckout();

  const [prices, setPrices] = useState<PriceMap>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const productIds = useMemo(
    () => rows.map(r => r.polarProductId).filter((id): id is string => !!id),
    [rows],
  );

  useEffect(() => {
    let cancelled = false;
    const queue = [...productIds];
    const fetchOne = async (productId: string) => {
      let price: PolarPrice | null = null;
      try {
        const res = await fetch(`/api/unppp/price?productId=${productId}`);
        const data = res.ok ? await res.json() : null;
        if (data?.priceAmount != null) price = data as PolarPrice;
      } catch {
        // no live price — the row falls back to build estimate only
      }
      if (!cancelled) setPrices(prev => ({ ...prev, [productId]: price }));
    };
    const workers = Array.from({ length: PRICE_FETCH_CONCURRENCY }, async () => {
      while (queue.length > 0 && !cancelled) {
        const productId = queue.shift();
        if (productId) await fetchOne(productId);
      }
    });
    void Promise.all(workers);
    return () => { cancelled = true; };
  }, [productIds]);

  // Live aggregates — recomputed as each price lands, so the tiles literally
  // fill in from the store while you watch.
  const live = useMemo(() => {
    let resolved = 0;
    let listedCount = 0;
    let listTotal = 0;
    let coveredBuildTotal = 0;
    let min: { row: ValuationRow; price: PolarPrice } | null = null;
    const listedRows: { id: string; amount: number }[] = [];
    for (const row of rows) {
      if (!row.polarProductId) continue;
      const price = prices[row.polarProductId];
      if (price === undefined) continue;
      resolved += 1;
      if (price === null) continue;
      listedCount += 1;
      listTotal += price.priceAmount / 100;
      coveredBuildTotal += row.buildEstimate;
      listedRows.push({ id: row.id, amount: price.priceAmount });
      if (!min || price.priceAmount < min.price.priceAmount) min = { row, price };
    }
    listedRows.sort((a, b) => b.amount - a.amount);
    const liveRankById = new Map(listedRows.map((r, i) => [r.id, i + 1]));
    return {
      resolved,
      pending: productIds.length - resolved,
      listedCount,
      listTotal,
      coveredBuildTotal,
      min,
      liveRankById,
    };
  }, [rows, prices, productIds]);

  const visibleRows = showAll ? rows : rows.slice(0, COLLAPSED_ROW_COUNT);
  const maxBuildEstimate = rows[0]?.buildEstimate ?? 0;
  const premiumsShare = portfolio.components
    .filter(c => c.key === 'size' || c.key === 'health' || c.key === 'lang')
    .reduce((sum, c) => sum + c.share, 0);
  const unmeasuredCount = portfolio.unpppCount - portfolio.measuredCount;

  const renderPricePill = (row: ValuationRow) => {
    const pillClass =
      'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full border px-2.5 py-1.5 font-google-sans-code text-xs uppercase tracking-wide';
    if (!row.polarProductId) return null;
    const price = prices[row.polarProductId];
    if (price === undefined) {
      return (
        <div
          className={`${pillClass} w-16 animate-pulse`}
          style={{ borderColor: `${colorValue}20`, color: 'var(--text-muted)' }}
          aria-label="live price loading"
        >
          …
        </div>
      );
    }
    if (price === null) {
      return (
        <div
          className={pillClass}
          style={{ borderColor: `${colorValue}20`, color: 'var(--text-muted)' }}
          title="no live listing"
        >
          —
        </div>
      );
    }
    const formatted = formatPolarPrice(price.priceAmount, price.priceCurrency);
    if (disableCheckout) {
      return (
        <div className={pillClass} style={{ borderColor: colorValue, color: colorValue }}>
          <span>{formatted}</span>
        </div>
      );
    }
    if (purchasedProductIds.has(row.polarProductId)) {
      return (
        <div
          role="status"
          className={pillClass}
          style={{ backgroundColor: colorValue, borderColor: colorValue, color: '#000' }}
        >
          <span aria-hidden="true">✓</span>
          <span>YOURS.</span>
        </div>
      );
    }
    const isActive = activeProductId === row.polarProductId;
    const busy = isActive && (checkoutState === 'loading' || checkoutState === 'open');
    const errored = isActive && checkoutState === 'error';
    return (
      <button
        type="button"
        onClick={() => openCheckout(row.polarProductId as string)}
        disabled={busy}
        aria-busy={isActive && checkoutState === 'loading'}
        aria-label={
          errored
            ? 'Checkout could not start — tap to retry'
            : `Buy ${row.id} for ${formatted} — opens checkout without leaving this page`
        }
        className={`${pillClass} transition duration-150 hover:opacity-80 active:scale-[0.98] disabled:cursor-wait`}
        style={{ backgroundColor: colorValue, borderColor: colorValue, color: '#000' }}
      >
        <span>{formatted}</span>
        <span aria-hidden="true" className="inline-flex w-3 items-center justify-center">
          {isActive && checkoutState === 'loading' ? (
            <span className="size-3 animate-spin rounded-full border border-black/30 border-t-black" />
          ) : errored ? (
            '↻'
          ) : (
            '→'
          )}
        </span>
      </button>
    );
  };

  const renderRowDetail = (row: ValuationRow) => {
    const price = row.polarProductId ? prices[row.polarProductId] : null;
    const liveRank = live.liveRankById.get(row.id);
    const accent = row.color ?? colorValue;
    return (
      <div
        className="space-y-4 border-t px-3 py-4 sm:px-4"
        style={{ borderColor: `${colorValue}20` }}
      >
        {/* The pricing formula, instantiated with this unppp's measured inputs */}
        <div className="space-y-1.5">
          <FormulaLine
            input={`${fmtHours(row.devHours)} × ${fmtRate(portfolio.laborRatePerHour)}/hr`}
            label="labor"
            amount={fmtUsd(row.breakdown.labor)}
            colorValue={colorValue}
          />
          <FormulaLine
            input={`${fmtHours(row.devHours)} × ${fmtRate(portfolio.llmRatePerHour)}/hr`}
            label="llm"
            amount={fmtUsd(row.breakdown.llm)}
            colorValue={colorValue}
          />
          <FormulaLine
            input={`${fmtUsd(portfolio.infraPoolTotal)} ÷ ${portfolio.unpppCount}`}
            label="infra"
            amount={fmtUsd(row.breakdown.infra)}
            colorValue={colorValue}
          />
          {row.sizeKb != null && (
            <FormulaLine
              input={`${fmtInt(Math.round(row.sizeKb / 1000))} MB`}
              label="size"
              amount={fmtUsd(row.breakdown.size)}
              colorValue={colorValue}
            />
          )}
          {row.healthScore != null && (
            <FormulaLine
              input={`health ${row.healthScore}/100`}
              label="health"
              amount={fmtUsd(row.breakdown.health)}
              colorValue={colorValue}
            />
          )}
          {row.languagesCount != null && (
            <FormulaLine
              input={`${row.languagesCount} languages`}
              label="languages"
              amount={fmtUsd(row.breakdown.lang)}
              colorValue={colorValue}
            />
          )}
          <div className="flex items-baseline justify-between border-t pt-1.5" style={{ borderColor: `${colorValue}30` }}>
            <span className="font-google-sans-code text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
              = build estimate
            </span>
            <span className="font-vt323 text-lg tabular-nums" style={{ color: 'var(--foreground)' }}>
              {fmtUsd(row.buildEstimate)}
            </span>
          </div>
        </div>

        <CompositionBar breakdown={row.breakdown} color={accent} heightClass="h-2" />

        {/* Receipts: where the hours came from */}
        <p className="font-google-sans-code text-[11px]" style={{ color: 'var(--text-muted)' }}>
          {row.confidence === 'high' && row.firstCommit && row.lastCommit ? (
            <>
              {fmtInt(row.commitCount)} commits · {fmtInt(row.sessionCount)} sessions · {fmtMonth(row.firstCommit)} → {fmtMonth(row.lastCommit)}
            </>
          ) : (
            <>0 sessions in the git analysis — priced from shared costs only</>
          )}
          {row.daysSincePush != null && (
            <> · pushed {row.daysSincePush === 0 ? 'today' : `${row.daysSincePush}d ago`}</>
          )}
        </p>

        {/* What you'd pay, live — vs what it cost to build */}
        <p className="font-google-sans-code text-[11px]" style={{ color: 'var(--foreground)' }}>
          {price ? (
            <>
              listed live at{' '}
              <span className="font-bold" style={{ color: colorValue }}>
                {formatPolarPrice(price.priceAmount, price.priceCurrency)}
              </span>
              {fmtListShare(price.priceAmount, row.buildEstimate) && (
                <> — {fmtListShare(price.priceAmount, row.buildEstimate)} of its build estimate</>
              )}
              {liveRank != null && liveRank !== row.buildRank && (
                <> · #{liveRank} by list price, #{row.buildRank} by build cost</>
              )}
            </>
          ) : price === null ? (
            <span style={{ color: 'var(--text-muted)' }}>no live list price returned for this unppp</span>
          ) : (
            <span style={{ color: 'var(--text-muted)' }}>live list price loading…</span>
          )}
        </p>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      {/* Live list vs build cost — fills in as each Polar price lands */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border p-4 text-center" style={{ borderColor: `${colorValue}20` }}>
          <div className="font-vt323 text-3xl tabular-nums" style={{ color: colorValue }}>
            {live.listedCount > 0 ? fmtUsd(live.listTotal) : live.pending > 0 ? '…' : '$0'}
          </div>
          <div className="font-google-sans-code text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            live list total · {live.listedCount}/{productIds.length} listed
            {live.pending > 0 && ` · ${live.pending} loading`}
          </div>
        </div>
        <div className="rounded-lg border p-4 text-center" style={{ borderColor: `${colorValue}20` }}>
          <div className="font-vt323 text-3xl tabular-nums" style={{ color: 'var(--foreground)' }}>
            {live.listedCount > 0 && live.coveredBuildTotal > 0
              ? fmtListShare(live.listTotal * 100, live.coveredBuildTotal)
              : '…'}
          </div>
          <div className="font-google-sans-code text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            list price vs {fmtUsd(live.coveredBuildTotal)} build cost
          </div>
        </div>
        <div className="rounded-lg border p-4 text-center" style={{ borderColor: `${colorValue}20` }}>
          <div className="font-vt323 text-3xl tabular-nums" style={{ color: 'var(--foreground)' }}>
            {live.min ? formatPolarPrice(live.min.price.priceAmount, live.min.price.priceCurrency) : '…'}
          </div>
          <div className="font-google-sans-code text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            {live.min ? `entry price — ${live.min.row.id}` : 'entry price'}
          </div>
        </div>
      </div>

      {/* What builds the number — component magnitudes, not a bullet list */}
      <div>
        <h2 className="font-google-sans-code mb-3 text-sm font-bold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
          what builds {fmtUsd(portfolio.totalBuildEstimate)}.
        </h2>
        <CompositionBar
          breakdown={{
            labor: portfolio.components.find(c => c.key === 'labor')?.amount ?? 0,
            llm: portfolio.components.find(c => c.key === 'llm')?.amount ?? 0,
            infra: portfolio.components.find(c => c.key === 'infra')?.amount ?? 0,
            size: portfolio.components.find(c => c.key === 'size')?.amount ?? 0,
            health: portfolio.components.find(c => c.key === 'health')?.amount ?? 0,
            lang: portfolio.components.find(c => c.key === 'lang')?.amount ?? 0,
          }}
          color={colorValue}
          heightClass="h-4"
        />
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3">
          {portfolio.components.map(component => (
            <div key={component.key} className="flex items-center gap-2">
              <span
                className="size-2.5 shrink-0 rounded-sm"
                style={{ backgroundColor: `${colorValue}${toAlphaHex(COMPONENT_ALPHAS[component.key])}` }}
                aria-hidden="true"
              />
              <span className="font-google-sans-code min-w-0 truncate text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                {component.label}
              </span>
              <span className="font-vt323 ml-auto text-sm tabular-nums" style={{ color: 'var(--foreground)' }}>
                {fmtUsd(component.amount)}
              </span>
              <span className="font-vt323 w-12 shrink-0 text-right text-sm tabular-nums" style={{ color: 'var(--text-muted)' }}>
                {(component.share * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* The ledger — every unppp, its measured cost, and its live price */}
      <div>
        <h2 className="font-google-sans-code mb-3 text-sm font-bold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
          all {portfolio.unpppCount} unppps, priced.
        </h2>
        <ul className="overflow-hidden rounded-lg border" style={{ borderColor: `${colorValue}20` }}>
          {visibleRows.map(row => {
            const expanded = expandedId === row.id;
            const accent = row.color ?? colorValue;
            const sharePct = maxBuildEstimate > 0 ? (row.buildEstimate / maxBuildEstimate) * 100 : 0;
            return (
              <li key={row.id} className="border-b last:border-b-0" style={{ borderColor: `${colorValue}20` }}>
                <div className="flex items-center gap-2 px-3 py-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setExpandedId(expanded ? null : row.id)}
                    aria-expanded={expanded}
                    aria-label={`${row.id} — ${fmtHours(row.devHours)} measured, ${fmtUsd(row.buildEstimate)} build estimate. ${expanded ? 'Collapse' : 'Expand'} pricing walkthrough`}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left sm:gap-3"
                  >
                    <span className="font-vt323 w-6 shrink-0 text-sm tabular-nums" style={{ color: 'var(--text-muted)' }}>
                      {row.buildRank}
                    </span>
                    <UnpppCircle src={row.coverSrc ?? undefined} color={row.color} size={20} />
                    <span className="min-w-0 flex-1 truncate">
                      <span className="font-vt323 text-base" style={{ color: 'var(--foreground)' }}>
                        {row.id}
                      </span>
                      {row.confidence === 'low' && (
                        <span
                          className="font-google-sans-code ml-1.5 text-[9px] uppercase"
                          style={{ color: 'var(--text-muted)' }}
                          title="no measured git history — priced from shared costs only"
                        >
                          unmeasured
                        </span>
                      )}
                    </span>
                    <span className="font-vt323 hidden w-14 shrink-0 text-right text-sm tabular-nums sm:inline" style={{ color: 'var(--text-muted)' }}>
                      {fmtHours(row.devHours)}
                    </span>
                    <span className="font-vt323 w-[4.5rem] shrink-0 text-right text-base tabular-nums" style={{ color: 'var(--foreground)' }}>
                      {fmtUsd(row.buildEstimate)}
                    </span>
                    <span
                      aria-hidden="true"
                      className={`shrink-0 text-xs transition-transform duration-150 ${expanded ? 'rotate-90' : ''}`}
                      style={{ color: 'var(--text-muted)' }}
                    >
                      ▸
                    </span>
                  </button>
                  {renderPricePill(row)}
                </div>
                {/* magnitude channel: build estimate relative to the #1 unppp */}
                <div className="h-[3px] w-full" style={{ backgroundColor: 'var(--background-highlight)' }} aria-hidden="true">
                  <div
                    className="h-full"
                    style={{ width: `${Math.max(sharePct, 0.75)}%`, backgroundColor: `${accent}b8` }}
                  />
                </div>
                {expanded && renderRowDetail(row)}
              </li>
            );
          })}
        </ul>
        {rows.length > COLLAPSED_ROW_COUNT && (
          <button
            type="button"
            onClick={() => setShowAll(s => !s)}
            className="font-google-sans-code mt-3 w-full rounded-lg border px-4 py-2 text-xs font-bold uppercase tracking-wide transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
            style={{ borderColor: `${colorValue}30`, backgroundColor: `${colorValue}15`, color: colorValue }}
          >
            {showAll
              ? `top ${COLLAPSED_ROW_COUNT} only`
              : `show all ${rows.length} — ${fmtUsd(rows.slice(COLLAPSED_ROW_COUNT).reduce((sum, r) => sum + r.buildEstimate, 0))} more below the fold`}
          </button>
        )}
        <p className="font-google-sans-code mt-3 text-[10px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          premiums ({(premiumsShare * 100).toFixed(1)}% of total) are disclosed assumptions, not empirically derived
          multipliers · session detection is a heuristic · {unmeasuredCount} unppps without local git history are
          priced from shared costs only, not assumed zero.
        </p>
      </div>
    </div>
  );
}
