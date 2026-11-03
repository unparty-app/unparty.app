'use client';

import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import filmData from '../data/mvp_roi_calculator_data.json';

type ScenarioId = 'traditional_distributor' | 'self_distribution' | 'straight_to_streaming';
type RevenueScenario = 'downside' | 'baseline' | 'upside';

interface CalculationResult {
  grossReceipts: number;
  distributionFeeDeducted: number;
  paCostsRecouped: number;
  otherExpensesRecouped: number;
  producerNetReceipts: number;
  grossProfitLoss: number;
  roiPct: number;
  recoupmentThreshold: number;
  paAsPctOfBudget: number;
  distributionDragTotal: number;
}

interface RevenueChannel {
  applicable_scenarios?: string[];
  producer_gross_baseline?: number;
  [key: string]: unknown;
}

interface WaterfallStep {
  type: string;
  basis?: string;
  value?: number;
  label?: string;
  [key: string]: unknown;
}

function scenarioPaSpend(scenario: ScenarioId): number {
  return filmData.distribution_deal_scenarios[scenario].pa_costs?.total || 0;
}

function scenarioFeePct(scenario: ScenarioId): number {
  return filmData.distribution_deal_scenarios[scenario].distribution_fee_pct || 0;
}

const FilmCalculator: React.FC = () => {
  const { colorValue } = useTheme();
  
  // State for user controls
  const [activeScenario, setActiveScenario] = useState<ScenarioId>('traditional_distributor');
  const [revenueScenario, setRevenueScenario] = useState<RevenueScenario>('baseline');
  const [revenueMultiplier, setRevenueMultiplier] = useState(1.0);
  // P&A spend and distribution fee start from the scenario's deal terms
  const [paSpend, setPaSpend] = useState(() => scenarioPaSpend('traditional_distributor'));
  const [distributionFeePct, setDistributionFeePct] = useState(() => scenarioFeePct('traditional_distributor'));
  const [contingencyPct, setContingencyPct] = useState(0.10);

  // Picking a distribution scenario resets P&A spend and fee to its terms
  const selectScenario = (scenario: ScenarioId) => {
    setActiveScenario(scenario);
    setPaSpend(scenarioPaSpend(scenario));
    setDistributionFeePct(scenarioFeePct(scenario));
  };

  // Calculate revenue multiplier based on scenario
  const getRevenueMultiplier = () => {
    const multipliers = {
      downside: filmData.revenue_projections.downside.multiplier,
      baseline: filmData.revenue_projections.baseline.multiplier,
      upside: filmData.revenue_projections.upside.multiplier,
    };
    return revenueMultiplier * multipliers[revenueScenario];
  };

  // Calculate gross receipts from all applicable channels
  const calculateGrossReceipts = (): number => {
    const channels = filmData.revenue_projections.channels;
    const multiplier = getRevenueMultiplier();
    let total = 0;

    Object.values(channels).forEach((channel: RevenueChannel) => {
      if (channel.applicable_scenarios?.includes(activeScenario)) {
        total += (channel.producer_gross_baseline || 0) * multiplier;
      }
    });

    return total;
  };

  // Main calculation engine following recoupment waterfall
  const calculateROI = (): CalculationResult => {
    const grossReceipts = calculateGrossReceipts();
    const baseBudget = filmData.production_budget.total;
    // Apply contingency percentage to production budget
    const productionBudget = baseBudget * (1 + contingencyPct);

    let remaining = grossReceipts;
    let distributionFeeDeducted = 0;
    let paCostsRecouped = 0;
    let otherExpensesRecouped = 0;

    // Apply recoupment waterfall based on scenario
    const waterfall = filmData.recoupment_waterfall[activeScenario];

    waterfall.forEach((step: WaterfallStep) => {
      if (remaining <= 0) return;

      switch (step.type) {
        case 'percentage':
          if (step.basis === 'gross_receipts') {
            // Use user-controlled distribution fee percentage
            const deduction = grossReceipts * distributionFeePct;
            distributionFeeDeducted += deduction;
            remaining -= deduction;
          }
          break;

        case 'fixed':
          let fixedAmount = step.value || 0;

          // Override with user-controlled values
          if (step.label?.includes('P&A')) {
            fixedAmount = paSpend;
          }

          const recouped = Math.min(remaining, fixedAmount);

          if (step.label?.includes('P&A')) {
            paCostsRecouped += recouped;
          } else if (step.label?.includes('Distribution Expenses') ||
                     step.label?.includes('Market Expenses') ||
                     step.label?.includes('Aggregator')) {
            otherExpensesRecouped += recouped;
          }

          remaining -= recouped;
          break;

        case 'split':
          // Net profit split - not deducted, just allocated
          break;
      }
    });

    const producerNetReceipts = Math.max(0, remaining);
    const grossProfitLoss = producerNetReceipts - productionBudget;
    const roiPct = (grossProfitLoss / productionBudget) * 100;

    const totalDeductions = distributionFeeDeducted + paCostsRecouped + otherExpensesRecouped;
    const recoupmentThreshold = totalDeductions + productionBudget;
    const paAsPctOfBudget = (paSpend / productionBudget) * 100;
    const distributionDragTotal = totalDeductions;

    return {
      grossReceipts,
      distributionFeeDeducted,
      paCostsRecouped,
      otherExpensesRecouped,
      producerNetReceipts,
      grossProfitLoss,
      roiPct,
      recoupmentThreshold,
      paAsPctOfBudget,
      distributionDragTotal,
    };
  };

  const results = calculateROI();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  // Compact currency formatter for tight spaces (e.g. sticky bar)
  const formatCurrencyCompact = (value: number) => {
    const abs = Math.abs(value);
    const sign = value < 0 ? '−' : '';
    if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
    if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(0)}K`;
    return `${sign}$${abs.toFixed(0)}`;
  };

  return (
    // text-left overrides text-right inherited from the page parent wrapper
    <div className="mx-auto w-full max-w-7xl space-y-6 px-3 py-4 text-left sm:space-y-8 sm:p-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="mb-2 font-google-sans-code text-xl font-bold uppercase text-gray-900 sm:text-2xl lg:text-4xl dark:text-white">
          CONNECT. THEUNPARTYRUNWAY - LLM. BUDGET
        </h1>
        <h2 className="mb-1 font-google-sans-code text-sm uppercase text-gray-700 dark:text-gray-300">
          FILMCALCULATOR IS THE BASELINE MEASUREMENT OF IDEA TO BUILD.
        </h2>
        <p className="font-google-sans-code text-xs text-gray-600 dark:text-gray-400">
          {filmData.film.title} • {filmData.film.genre} • ${filmData.production_budget.total.toLocaleString()} Budget
        </p>
      </div>

      {/* Sticky Mobile Results Summary */}
      {results && (
        <div className="sticky top-0 z-10 rounded-xl border border-gray-200 bg-white/95 p-3 shadow-lg backdrop-blur-sm lg:hidden dark:border-gray-700 dark:bg-black/90">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1 text-center">
              <div className="font-google-sans-code text-[10px] uppercase text-gray-500 dark:text-gray-400">ROI</div>
              <div
                className="mt-0.5 font-google-sans-code text-sm font-bold tabular-nums sm:text-base"
                style={{ color: results.roiPct >= 0 ? '#10b981' : '#ef4444' }}
              >
                {formatPercent(results.roiPct)}
              </div>
            </div>
            <div className="h-8 w-px bg-gray-200 dark:bg-gray-700" />
            <div className="min-w-0 flex-1 text-center">
              <div className="font-google-sans-code text-[10px] uppercase text-gray-500 dark:text-gray-400">Net</div>
              <div className="mt-0.5 font-google-sans-code text-sm font-bold tabular-nums sm:text-base" style={{ color: colorValue }}>
                {formatCurrencyCompact(results.producerNetReceipts)}
              </div>
            </div>
            <div className="h-8 w-px bg-gray-200 dark:bg-gray-700" />
            <div className="min-w-0 flex-1 text-center">
              <div className="font-google-sans-code text-[10px] uppercase text-gray-500 dark:text-gray-400">Break-Even</div>
              <div className="mt-0.5 font-google-sans-code text-sm font-bold tabular-nums sm:text-base" style={{ color: colorValue }}>
                {formatCurrencyCompact(results.recoupmentThreshold)}
              </div>
            </div>
            <div className="h-8 w-px bg-gray-200 dark:bg-gray-700" />
            <div className="min-w-0 flex-1 text-center">
              <div className="font-google-sans-code text-[10px] uppercase text-gray-500 dark:text-gray-400">Gross</div>
              <div className="mt-0.5 font-google-sans-code text-sm font-bold tabular-nums sm:text-base" style={{ color: colorValue }}>
                {formatCurrencyCompact(results.grossReceipts)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scenario Selector */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 sm:p-6 dark:border-gray-700 dark:bg-black/20">
        <h2 className="mb-3 font-google-sans-code text-xs font-bold uppercase text-gray-700 dark:text-gray-300">
          Distribution Scenario
        </h2>
        {/* Mobile: horizontal scroll row; sm+: 3-column grid */}
        <div className="flex gap-2 overflow-x-auto pb-1 sm:grid sm:grid-cols-3 sm:gap-3 sm:overflow-visible sm:pb-0">
          {(['traditional_distributor', 'self_distribution', 'straight_to_streaming'] as ScenarioId[]).map((scenario) => (
            <button
              key={scenario}
              onClick={() => selectScenario(scenario)}
              className={`min-w-[140px] shrink-0 rounded-lg border-2 p-3 font-google-sans-code text-xs transition-all sm:min-w-0 sm:shrink sm:p-4 ${
                activeScenario === scenario
                  ? 'border-current bg-white dark:bg-black/40'
                  : 'border-gray-300 bg-white hover:border-gray-400 dark:border-gray-600 dark:bg-black/10'
              }`}
              style={activeScenario === scenario ? { borderColor: colorValue } : {}}
            >
              <div className="font-bold leading-tight">
                {filmData.distribution_deal_scenarios[scenario].label}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Revenue Scenario */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 sm:p-6 dark:border-gray-700 dark:bg-black/20">
        <h2 className="mb-3 font-google-sans-code text-xs font-bold uppercase text-gray-700 dark:text-gray-300">
          Revenue Scenario
        </h2>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {(['downside', 'baseline', 'upside'] as RevenueScenario[]).map((scenario) => (
            <button
              key={scenario}
              onClick={() => setRevenueScenario(scenario)}
              className={`rounded-lg border-2 p-3 font-google-sans-code text-xs transition-all ${
                revenueScenario === scenario
                  ? 'border-current bg-white dark:bg-black/40'
                  : 'border-gray-300 bg-white hover:border-gray-400 dark:border-gray-600 dark:bg-black/10'
              }`}
              style={revenueScenario === scenario ? { borderColor: colorValue } : {}}
            >
              <div className="font-bold capitalize">{scenario}</div>
              <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                {filmData.revenue_projections[scenario].multiplier}x
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Sliders */}
      <div className="grid gap-3 sm:gap-4 lg:grid-cols-2 lg:gap-6">
        {/* Revenue Multiplier */}
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 sm:p-5 dark:border-gray-700 dark:bg-black/20">
          <div className="mb-3 flex items-baseline justify-between">
            <label className="font-google-sans-code text-xs font-bold uppercase text-gray-700 dark:text-gray-300">
              Revenue Multiplier
            </label>
            <span className="ml-2 font-google-sans-code text-sm font-bold tabular-nums" style={{ color: colorValue }}>
              {revenueMultiplier.toFixed(1)}x
            </span>
          </div>
          <input
            type="range"
            min="0.1"
            max="5.0"
            step="0.1"
            value={revenueMultiplier}
            onChange={(e) => setRevenueMultiplier(parseFloat(e.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-300 dark:bg-gray-600"
          />
          <div className="mt-1.5 flex justify-between font-google-sans-code text-[10px] text-gray-400">
            <span>0.1x</span>
            <span>5.0x</span>
          </div>
        </div>

        {/* P&A Spend */}
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 sm:p-5 dark:border-gray-700 dark:bg-black/20">
          <div className="mb-3 flex items-baseline justify-between">
            <label className="font-google-sans-code text-xs font-bold uppercase text-gray-700 dark:text-gray-300">
              P&amp;A Spend
            </label>
            <span className="ml-2 font-google-sans-code text-sm font-bold tabular-nums" style={{ color: colorValue }}>
              {formatCurrency(paSpend)}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="750000"
            step="5000"
            value={paSpend}
            onChange={(e) => setPaSpend(parseInt(e.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-300 dark:bg-gray-600"
          />
          <div className="mt-1.5 flex justify-between font-google-sans-code text-[10px] text-gray-400">
            <span>$0</span>
            <span>$750K</span>
          </div>
        </div>

        {/* Distribution Fee */}
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 sm:p-5 dark:border-gray-700 dark:bg-black/20">
          <div className="mb-3 flex items-baseline justify-between">
            <label className="font-google-sans-code text-xs font-bold uppercase text-gray-700 dark:text-gray-300">
              Distribution Fee
            </label>
            <span className="ml-2 font-google-sans-code text-sm font-bold tabular-nums" style={{ color: colorValue }}>
              {(distributionFeePct * 100).toFixed(0)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="0.45"
            step="0.01"
            value={distributionFeePct}
            onChange={(e) => setDistributionFeePct(parseFloat(e.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-300 dark:bg-gray-600"
          />
          <div className="mt-1.5 flex justify-between font-google-sans-code text-[10px] text-gray-400">
            <span>0%</span>
            <span>45%</span>
          </div>
        </div>

        {/* Contingency */}
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 sm:p-5 dark:border-gray-700 dark:bg-black/20">
          <div className="mb-3 flex items-baseline justify-between">
            <label className="font-google-sans-code text-xs font-bold uppercase text-gray-700 dark:text-gray-300">
              Contingency
            </label>
            <span className="ml-2 font-google-sans-code text-sm font-bold tabular-nums" style={{ color: colorValue }}>
              {(contingencyPct * 100).toFixed(0)}%
            </span>
          </div>
          <input
            type="range"
            min="0.05"
            max="0.20"
            step="0.01"
            value={contingencyPct}
            onChange={(e) => setContingencyPct(parseFloat(e.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-300 dark:bg-gray-600"
          />
          <div className="mt-1.5 flex justify-between font-google-sans-code text-[10px] text-gray-400">
            <span>5%</span>
            <span>20%</span>
          </div>
        </div>
      </div>

      {/* Key Callouts - Stats Dashboard Style */}
      {results && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 lg:gap-6">
          {/* ROI */}
          <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-3 shadow-sm sm:p-5 dark:border-gray-700 dark:from-black/20 dark:to-black/10">
            <div className="font-google-sans-code text-[10px] uppercase text-gray-600 sm:text-xs dark:text-gray-400">
              ROI
            </div>
            <div
              className="mt-1 font-google-sans-code text-2xl font-bold tabular-nums sm:text-3xl lg:text-4xl"
              style={{ color: results.roiPct >= 0 ? '#10b981' : '#ef4444' }}
            >
              {formatPercent(results.roiPct)}
            </div>
            <div className="mt-1 font-google-sans-code text-[10px] text-gray-500 sm:text-xs">
              {results.grossProfitLoss >= 0 ? 'Profit' : 'Loss'}: {formatCurrencyCompact(Math.abs(results.grossProfitLoss))}
            </div>
          </div>

          {/* Producer Net Receipts */}
          <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-3 shadow-sm sm:p-5 dark:border-gray-700 dark:from-black/20 dark:to-black/10">
            <div className="font-google-sans-code text-[10px] uppercase text-gray-600 sm:text-xs dark:text-gray-400">
              Producer Net
            </div>
            <div className="mt-1 font-google-sans-code text-2xl font-bold tabular-nums sm:text-3xl lg:text-4xl" style={{ color: colorValue }}>
              {formatCurrencyCompact(results.producerNetReceipts)}
            </div>
            <div className="mt-1 font-google-sans-code text-[10px] text-gray-500 sm:text-xs">
              After all recoupment
            </div>
          </div>

          {/* P&A as % of Budget */}
          <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-3 shadow-sm sm:p-5 dark:border-gray-700 dark:from-black/20 dark:to-black/10">
            <div className="font-google-sans-code text-[10px] uppercase text-gray-600 sm:text-xs dark:text-gray-400">
              P&amp;A vs Budget
            </div>
            <div className="mt-1 font-google-sans-code text-2xl font-bold tabular-nums sm:text-3xl lg:text-4xl" style={{ color: colorValue }}>
              {results.paAsPctOfBudget.toFixed(0)}%
            </div>
            <div className="mt-1 font-google-sans-code text-[10px] text-gray-500 sm:text-xs">
              Marketing spend ratio
            </div>
          </div>

          {/* Distribution Drag */}
          <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-3 shadow-sm sm:p-5 dark:border-gray-700 dark:from-black/20 dark:to-black/10">
            <div className="font-google-sans-code text-[10px] uppercase text-gray-600 sm:text-xs dark:text-gray-400">
              Distrib. Drag
            </div>
            <div className="mt-1 font-google-sans-code text-2xl font-bold tabular-nums sm:text-3xl lg:text-4xl" style={{ color: colorValue }}>
              {formatCurrencyCompact(results.distributionDragTotal)}
            </div>
            <div className="mt-1 font-google-sans-code text-[10px] text-gray-500 sm:text-xs">
              Total deductions
            </div>
          </div>

          {/* Recoupment Threshold */}
          <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-3 shadow-sm sm:p-5 dark:border-gray-700 dark:from-black/20 dark:to-black/10">
            <div className="font-google-sans-code text-[10px] uppercase text-gray-600 sm:text-xs dark:text-gray-400">
              Break-Even
            </div>
            <div className="mt-1 font-google-sans-code text-2xl font-bold tabular-nums sm:text-3xl lg:text-4xl" style={{ color: colorValue }}>
              {formatCurrencyCompact(results.recoupmentThreshold)}
            </div>
            <div className="mt-1 font-google-sans-code text-[10px] text-gray-500 sm:text-xs">
              Revenue needed to profit
            </div>
          </div>

          {/* Gross Receipts */}
          <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-3 shadow-sm sm:p-5 dark:border-gray-700 dark:from-black/20 dark:to-black/10">
            <div className="font-google-sans-code text-[10px] uppercase text-gray-600 sm:text-xs dark:text-gray-400">
              Gross Receipts
            </div>
            <div className="mt-1 font-google-sans-code text-2xl font-bold tabular-nums sm:text-3xl lg:text-4xl" style={{ color: colorValue }}>
              {formatCurrencyCompact(results.grossReceipts)}
            </div>
            <div className="mt-1 font-google-sans-code text-[10px] text-gray-500 sm:text-xs">
              Total revenue projected
            </div>
          </div>
        </div>
      )}

      {/* Breakdown */}
      {results && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 sm:p-6 dark:border-gray-700 dark:bg-black/20">
          <h2 className="mb-3 font-google-sans-code text-xs font-bold uppercase text-gray-700 sm:mb-4 dark:text-gray-300">
            Recoupment Waterfall
          </h2>
          <div className="space-y-2">
            <div className="flex items-baseline justify-between gap-2 border-b border-gray-300 pb-2 dark:border-gray-600">
              <span className="font-google-sans-code text-xs text-gray-700 dark:text-gray-300">Gross Receipts</span>
              <span className="shrink-0 font-google-sans-code text-xs font-bold sm:text-sm" style={{ color: colorValue }}>
                {formatCurrency(results.grossReceipts)}
              </span>
            </div>
            {results.distributionFeeDeducted > 0 && (
              <div className="flex items-baseline justify-between gap-2 border-b border-gray-300 pb-2 dark:border-gray-600">
                <span className="font-google-sans-code text-xs text-gray-600 dark:text-gray-400">
                  − Distrib. Fee ({(distributionFeePct * 100).toFixed(0)}%)
                </span>
                <span className="shrink-0 font-google-sans-code text-xs text-gray-600 dark:text-gray-400">
                  −{formatCurrency(results.distributionFeeDeducted)}
                </span>
              </div>
            )}
            {results.paCostsRecouped > 0 && (
              <div className="flex items-baseline justify-between gap-2 border-b border-gray-300 pb-2 dark:border-gray-600">
                <span className="font-google-sans-code text-xs text-gray-600 dark:text-gray-400">− P&amp;A Recoupment</span>
                <span className="shrink-0 font-google-sans-code text-xs text-gray-600 dark:text-gray-400">
                  −{formatCurrency(results.paCostsRecouped)}
                </span>
              </div>
            )}
            {results.otherExpensesRecouped > 0 && (
              <div className="flex items-baseline justify-between gap-2 border-b border-gray-300 pb-2 dark:border-gray-600">
                <span className="font-google-sans-code text-xs text-gray-600 dark:text-gray-400">− Other Expenses</span>
                <span className="shrink-0 font-google-sans-code text-xs text-gray-600 dark:text-gray-400">
                  −{formatCurrency(results.otherExpensesRecouped)}
                </span>
              </div>
            )}
            <div className="flex items-baseline justify-between gap-2 pt-2">
              <span className="font-google-sans-code text-xs font-bold text-gray-900 dark:text-white">Producer Net Receipts</span>
              <span className="shrink-0 font-google-sans-code text-xs font-bold sm:text-sm" style={{ color: colorValue }}>
                {formatCurrency(results.producerNetReceipts)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilmCalculator;