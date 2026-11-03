'use client';

import React, { useState, useMemo } from 'react';
import { useFetch } from '@/hooks/useFetch';
import { useTheme } from '../contexts/ThemeContext';
import ScrollRow from '@/components/HorizontalRow';

interface DbStatsResponse {
  totalGB: number;
  totalPretty: string;
  tables: { name: string; bytes: number; gb: number; pretty: string }[];
  fetchedAt: string;
}

type FetchState = 'idle' | 'loading' | 'success' | 'error';

type PlanId = 'free' | 'launch' | 'scale';
type ScenarioId = 'personal' | 'small' | 'production';

interface PlanConfig {
  id: PlanId;
  name: string;
  baseFee: number;
  computeRatePerCUHour: number;
  storageRatePerGBMonth: number;
  maxCU: number;
  maxProjects: number;
  maxRAMGB: number;
  includedStorageGB: number;
  includedCUHours: number;
  dataTransferGB: number;
  tag?: string;
}

interface CostBreakdown {
  baseFee: number;
  storageCost: number;
  computeCost: number;
  total: number;
  annual: number;
  exceedsLimits: boolean;
  limitWarning?: string;
}

// Neon rates from neon.com/pricing, checked 2026-09-28. Paid plans are
// pay-as-you-go: no base fee and no included allowance, so every CU-hour and
// GB-month is billed. Only Free has included usage (per project).
const NEON_PRICING_CHECKED = 'Sep 28, 2026';

const PLANS: Record<PlanId, PlanConfig> = {
  free: {
    id: 'free',
    name: 'Free',
    baseFee: 0,
    computeRatePerCUHour: 0,
    storageRatePerGBMonth: 0,
    maxCU: 2,
    maxProjects: 100,
    maxRAMGB: 8,
    includedStorageGB: 0.5,
    includedCUHours: 100,
    dataTransferGB: 5,
  },
  launch: {
    id: 'launch',
    name: 'Launch',
    baseFee: 0,
    computeRatePerCUHour: 0.106,
    storageRatePerGBMonth: 0.35,
    maxCU: 16,
    maxProjects: 100,
    maxRAMGB: 64,
    includedStorageGB: 0,
    includedCUHours: 0,
    dataTransferGB: 500,
    tag: 'Recommended',
  },
  scale: {
    id: 'scale',
    name: 'Scale',
    baseFee: 0,
    computeRatePerCUHour: 0.222,
    storageRatePerGBMonth: 0.35,
    maxCU: 56,
    maxProjects: 1000,
    maxRAMGB: 224,
    includedStorageGB: 0,
    includedCUHours: 0,
    dataTransferGB: 500,
  },
};

const PLAN_ORDER: PlanId[] = ['free', 'launch', 'scale'];

const CU_SIZES = [0.25, 0.5, 1, 2, 4, 8, 16, 32, 56];

const USAGE_SCENARIOS: Record<ScenarioId, { label: string; storageGB: number; cuSizeIndex: number; activeHours: number; description: string }> = {
  personal: {
    label: 'Dev / Personal',
    storageGB: 0.25,
    cuSizeIndex: 0,
    activeHours: 80,
    description: 'Light usage, mostly idle',
  },
  small: {
    label: 'Small App',
    storageGB: 5,
    cuSizeIndex: 2,
    activeHours: 250,
    description: 'Steady traffic, some peaks',
  },
  production: {
    label: 'Production',
    storageGB: 25,
    cuSizeIndex: 4,
    activeHours: 500,
    description: 'Public launch, real traffic',
  },
};

function calculateCost(
  plan: PlanConfig,
  storageGB: number,
  cuSizeCU: number,
  activeHoursPerMonth: number
): CostBreakdown {
  const cuHours = cuSizeCU * activeHoursPerMonth;

  if (plan.id === 'free') {
    const exceedsStorage = storageGB > plan.includedStorageGB;
    const exceedsCompute = cuSizeCU > plan.maxCU || cuHours > plan.includedCUHours;
    return {
      baseFee: 0,
      storageCost: 0,
      computeCost: 0,
      total: 0,
      annual: 0,
      exceedsLimits: exceedsStorage || exceedsCompute,
      limitWarning: exceedsStorage
        ? `Over ${(plan.includedStorageGB * 1024).toFixed(0)} MB storage cap`
        : exceedsCompute
        ? `Over ${plan.maxCU} CU or ${plan.includedCUHours} CU-hr/mo limit`
        : undefined,
    };
  }

  const storageOverageGB = Math.max(0, storageGB - plan.includedStorageGB);
  const storageCost = storageOverageGB * plan.storageRatePerGBMonth;
  const computeOverageHours = Math.max(0, cuHours - plan.includedCUHours);
  const computeCost = computeOverageHours * plan.computeRatePerCUHour;
  const exceedsMaxCU = cuSizeCU > plan.maxCU;

  const total = plan.baseFee + storageCost + computeCost;

  return {
    baseFee: plan.baseFee,
    storageCost,
    computeCost,
    total,
    annual: total * 12,
    exceedsLimits: exceedsMaxCU,
    limitWarning: exceedsMaxCU
      ? `${plan.name} plan max is ${plan.maxCU} CU`
      : undefined,
  };
}

const FrameCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
  const { colorValue } = useTheme();
  return (
    <div
      className={`relative overflow-hidden rounded-xl transition-all duration-500 ${className}`}
      style={{
        borderRadius: '0.75rem',
        background: `linear-gradient(135deg, ${colorValue}15 0%, var(--background) 60%)`,
      }}
    >
      {children}
      <div
        className="pointer-events-none absolute inset-0 rounded-xl"
        style={{
          border: `1px solid ${colorValue}30`,
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)',
        }}
      />
    </div>
  );
};

interface DatabaseCalculatorProps {
  // Poll /api/admin/db-stats for the real database size. Needs a signed-in
  // user, so articles for the public pass live={false}.
  live?: boolean;
}

const DatabaseCalculator: React.FC<DatabaseCalculatorProps> = ({ live = true }) => {
  const { colorValue } = useTheme();

  const [activeScenario, setActiveScenario] = useState<ScenarioId>('personal');
  // null = follow the live DB size once it loads; set when a slider or scenario picks a value
  const [storageOverrideGB, setStorageGB] = useState<number | null>(null);
  const [cuSizeIndex, setCuSizeIndex] = useState(0);
  const [activeHoursPerMonth, setActiveHoursPerMonth] = useState(80);

  const { data: dbStats, loading: statsLoading, error: statsError, refetch: refetchDbStats } =
    useFetch<DbStatsResponse>(live ? '/api/admin/db-stats' : null);
  const fetchState: FetchState = statsLoading ? 'loading' : statsError ? 'error' : dbStats ? 'success' : 'idle';
  const storageGB =
    storageOverrideGB ?? (dbStats ? parseFloat(Math.max(dbStats.totalGB, 0.01).toFixed(3)) : USAGE_SCENARIOS.personal.storageGB);

  const cuSize = CU_SIZES[cuSizeIndex];
  const cuHours = cuSize * activeHoursPerMonth;

  const costs = useMemo(
    () =>
      Object.fromEntries(
        PLAN_ORDER.map((id) => [id, calculateCost(PLANS[id], storageGB, cuSize, activeHoursPerMonth)])
      ) as Record<PlanId, CostBreakdown>,
    [storageGB, cuSize, activeHoursPerMonth]
  );

  const recommendedPlan = useMemo((): PlanId => {
    if (!costs.free.exceedsLimits) return 'free';
    if (!costs.launch.exceedsLimits && costs.launch.total <= costs.scale.total) return 'launch';
    return 'scale';
  }, [costs]);

  const applyScenario = (id: ScenarioId) => {
    const s = USAGE_SCENARIOS[id];
    setActiveScenario(id);
    setStorageGB(s.storageGB);
    setCuSizeIndex(s.cuSizeIndex);
    setActiveHoursPerMonth(s.activeHours);
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

  const fmtCompact = (n: number) => {
    if (n === 0) return '$0';
    if (n >= 1000) return `$${(n / 1000).toFixed(1)}K`;
    return `$${n.toFixed(0)}`;
  };

  const bestPlan = PLANS[recommendedPlan];

  const scenarioItems = (Object.keys(USAGE_SCENARIOS) as ScenarioId[]).map((id) => {
    const s = USAGE_SCENARIOS[id];
    return (
      <button
        key={id}
        onClick={() => applyScenario(id)}
        className="w-full rounded-lg border-2 p-3 text-left font-google-sans-code text-xs transition-all"
        style={{
          borderColor: activeScenario === id ? colorValue : `${colorValue}30`,
          backgroundColor: 'var(--background)',
          color: 'var(--foreground)',
        }}
      >
        <div className="font-bold uppercase">{s.label}</div>
        <div className="mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.description}</div>
      </button>
    );
  });

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-3 py-4 text-left sm:space-y-8 sm:p-6">
      {/* Header */}
      <div>
        <h1 className="mb-1 font-google-sans-code text-xl font-bold uppercase sm:text-2xl" style={{ color: 'var(--foreground)' }}>
          NEON DB COST CALCULATOR
        </h1>
        <p className="font-google-sans-code text-xs" style={{ color: 'var(--text-muted)' }}>
          Neon · pay-as-you-go · Storage $0.35/GB-mo · Launch $0.106/CU-hr · Scale $0.222/CU-hr · rates as of {NEON_PRICING_CHECKED}
        </p>
      </div>

      {/* Usage Scenario Presets */}
      <div className="rounded-xl border p-4 sm:p-5" style={{ borderColor: `${colorValue}30`, backgroundColor: 'var(--background)' }}>
        <h2 className="mb-3 font-google-sans-code text-xs font-bold uppercase" style={{ color: 'var(--text-muted)' }}>
          Usage Scenario
        </h2>
        <ScrollRow items={scenarioItems} maxItems={3} />
      </div>

      {/* Sliders */}
      <div className="grid gap-3 sm:gap-4 lg:grid-cols-3">
        {/* Storage */}
        <FrameCard className="p-4 sm:p-5">
          <div className="mb-3 flex items-start justify-between gap-2">
            <label className="font-google-sans-code text-xs font-bold uppercase" style={{ color: 'var(--foreground)' }}>
              Storage
            </label>
            <div className="flex items-center gap-2">
              {fetchState === 'success' && dbStats && (
                <span className="font-google-sans-code text-[10px] uppercase" style={{ color: colorValue }}>
                  ● Live
                </span>
              )}
              {fetchState === 'loading' && (
                <span className="font-google-sans-code text-[10px]" style={{ color: 'var(--text-muted)' }}>polling…</span>
              )}
              {fetchState === 'error' && (
                <span className="font-google-sans-code text-[10px] text-red-400">auth required</span>
              )}
              {live && (
              <button
                onClick={() => { setStorageGB(null); refetchDbStats(); setActiveScenario('personal'); }}
                className="rounded px-1.5 py-0.5 font-google-sans-code text-[10px] uppercase transition-colors"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--foreground)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                title="Refresh live DB size"
              >
                ↺
              </button>
              )}
              <span className="font-vt323 text-base font-bold tabular-nums" style={{ color: colorValue }}>
                {storageGB < 1 ? `${(storageGB * 1024).toFixed(0)} MB` : `${storageGB} GB`}
              </span>
            </div>
          </div>
          <input
            type="range"
            min="0"
            max="200"
            step="0.001"
            value={storageGB}
            onChange={(e) => { setStorageGB(Number(e.target.value)); setActiveScenario('personal'); }}
            className="h-2 w-full cursor-pointer appearance-none rounded-lg"
            style={{ backgroundColor: `${colorValue}30` }}
          />
          <div className="mt-1.5 flex justify-between font-google-sans-code text-[10px]" style={{ color: 'var(--text-muted)' }}>
            <span>0 GB</span>
            <span>200 GB</span>
          </div>
          <div className="mt-2 font-google-sans-code text-[10px]" style={{ color: 'var(--text-muted)' }}>
            {dbStats
              ? `Actual: ${dbStats.totalPretty} · fetched ${new Date(dbStats.fetchedAt).toLocaleTimeString()}`
              : 'Free incl. 0.5 GB · paid plans bill every GB'}
          </div>
        </FrameCard>

        {/* Compute Size */}
        <FrameCard className="p-4 sm:p-5">
          <div className="mb-3 flex items-baseline justify-between">
            <label className="font-google-sans-code text-xs font-bold uppercase" style={{ color: 'var(--foreground)' }}>
              Compute Size
            </label>
            <span className="ml-2 font-vt323 text-lg font-bold tabular-nums" style={{ color: colorValue }}>
              {cuSize} CU
            </span>
          </div>
          <input
            type="range"
            min="0"
            max={CU_SIZES.length - 1}
            step="1"
            value={cuSizeIndex}
            onChange={(e) => { setCuSizeIndex(Number(e.target.value)); setActiveScenario('personal'); }}
            className="h-2 w-full cursor-pointer appearance-none rounded-lg"
            style={{ backgroundColor: `${colorValue}30` }}
          />
          <div className="mt-1.5 flex justify-between font-google-sans-code text-[10px]" style={{ color: 'var(--text-muted)' }}>
            <span>0.25 CU</span>
            <span>56 CU</span>
          </div>
          <div className="mt-2 font-google-sans-code text-[10px]" style={{ color: 'var(--text-muted)' }}>
            Presets: {CU_SIZES.join(', ')}
          </div>
        </FrameCard>

        {/* Active Hours */}
        <FrameCard className="p-4 sm:p-5">
          <div className="mb-3 flex items-baseline justify-between">
            <label className="font-google-sans-code text-xs font-bold uppercase" style={{ color: 'var(--foreground)' }}>
              Active Hrs / Mo
            </label>
            <span className="ml-2 font-vt323 text-lg font-bold tabular-nums" style={{ color: colorValue }}>
              {activeHoursPerMonth} hrs
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="744"
            step="10"
            value={activeHoursPerMonth}
            onChange={(e) => { setActiveHoursPerMonth(Number(e.target.value)); setActiveScenario('personal'); }}
            className="h-2 w-full cursor-pointer appearance-none rounded-lg"
            style={{ backgroundColor: `${colorValue}30` }}
          />
          <div className="mt-1.5 flex justify-between font-google-sans-code text-[10px]" style={{ color: 'var(--text-muted)' }}>
            <span>0 hrs</span>
            <span>744 hrs (24/7)</span>
          </div>
          <div className="mt-2 font-google-sans-code text-[10px]" style={{ color: 'var(--text-muted)' }}>
            Neon suspends after 5 min idle
          </div>
        </FrameCard>
      </div>

      {/* CU-Hours derived metric */}
      <div className="rounded-xl border p-4" style={{ borderColor: `${colorValue}30`, backgroundColor: 'var(--background)' }}>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <div>
            <div className="font-google-sans-code text-[10px] uppercase" style={{ color: 'var(--text-muted)' }}>CU-Hours / Month</div>
            <div className="font-vt323 text-3xl font-bold" style={{ color: colorValue }}>
              {cuHours.toFixed(1)}
            </div>
            <div className="font-google-sans-code text-[10px]" style={{ color: 'var(--text-muted)' }}>
              <span className="font-vt323">{cuSize}</span> CU × <span className="font-vt323">{activeHoursPerMonth}</span> hrs
            </div>
          </div>
          <div className="h-10 w-px" style={{ backgroundColor: `${colorValue}30` }} />
          <div>
            <div className="font-google-sans-code text-[10px] uppercase" style={{ color: 'var(--text-muted)' }}>Free allowance left</div>
            <div className="font-vt323 text-xl font-bold" style={{ color: 'var(--foreground)' }}>
              {Math.max(0, PLANS.free.includedCUHours - cuHours).toFixed(1)} hrs
            </div>
            <div className="font-google-sans-code text-[10px]" style={{ color: 'var(--text-muted)' }}>
              of {PLANS.free.includedCUHours} CU-hrs per project
            </div>
          </div>
        </div>
      </div>

      {/* Plan Comparison Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {PLAN_ORDER.map((id) => {
          const plan = PLANS[id];
          const cost = costs[id];
          const isRec = id === recommendedPlan;

          return (
            <div
              key={id}
              className={`rounded-xl border-2 p-4 sm:p-5 transition-all ${isRec ? 'vh-card-elevated' : ''} ${cost.exceedsLimits ? 'opacity-60' : ''}`}
              style={{
                borderColor: isRec ? colorValue : `${colorValue}30`,
                backgroundColor: 'var(--background)',
              }}
            >
              {/* Plan header */}
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <div className="font-google-sans-code text-sm font-bold uppercase" style={{ color: 'var(--foreground)' }}>
                    {plan.name}
                  </div>
                  {isRec && (
                    <div className="mt-0.5 font-google-sans-code text-[10px] uppercase" style={{ color: colorValue }}>
                      Best fit
                    </div>
                  )}
                  {cost.exceedsLimits && (
                    <div className="mt-0.5 font-google-sans-code text-[10px] text-red-500">
                      ✗ Exceeds limit
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div
                    className="font-vt323 text-3xl tabular-nums"
                    style={{ color: cost.exceedsLimits ? '#ef4444' : isRec ? colorValue : 'var(--foreground)' }}
                  >
                    {cost.exceedsLimits ? 'N/A' : fmtCompact(cost.total)}
                  </div>
                  <div className="font-google-sans-code text-[10px]" style={{ color: 'var(--text-muted)' }}>/month</div>
                </div>
              </div>

              {/* Cost breakdown */}
              <div className="space-y-1.5 border-t pt-3" style={{ borderColor: `${colorValue}30` }}>
                <div className="flex justify-between font-google-sans-code text-xs">
                  <span style={{ color: 'var(--text-muted)' }}>Base fee</span>
                  <span style={{ color: 'var(--foreground)' }}>{fmt(cost.baseFee)}</span>
                </div>
                <div className="flex justify-between font-google-sans-code text-xs">
                  <span style={{ color: 'var(--text-muted)' }}>Storage</span>
                  <span style={{ color: 'var(--foreground)' }}>
                    {plan.id === 'free' ? 'incl.' : cost.storageCost === 0 ? 'incl.' : fmt(cost.storageCost)}
                  </span>
                </div>
                <div className="flex justify-between font-google-sans-code text-xs">
                  <span style={{ color: 'var(--text-muted)' }}>Compute</span>
                  <span style={{ color: 'var(--foreground)' }}>
                    {plan.id === 'free' ? 'incl.' : fmt(cost.computeCost)}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-1.5 font-google-sans-code text-xs font-bold" style={{ borderColor: `${colorValue}30` }}>
                  <span style={{ color: 'var(--foreground)' }}>Annual</span>
                  <span style={{ color: cost.exceedsLimits ? '#ef4444' : isRec ? colorValue : 'var(--foreground)' }}>
                    {cost.exceedsLimits ? 'N/A' : fmtCompact(cost.annual)}
                  </span>
                </div>
              </div>

              {/* Plan specs */}
              <div className="mt-3 space-y-1 border-t pt-3" style={{ borderColor: `${colorValue}30` }}>
                <div className="font-google-sans-code text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  Max <span className="font-vt323">{plan.maxCU}</span> CU · <span className="font-vt323">{plan.maxRAMGB}</span> GB RAM
                </div>
                {plan.id === 'free' ? (
                  <>
                    <div className="font-google-sans-code text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      Incl. <span className="font-vt323">{(plan.includedStorageGB * 1024).toFixed(0)} MB</span> storage
                    </div>
                    <div className="font-google-sans-code text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      Incl. <span className="font-vt323">{plan.includedCUHours}</span> CU-hrs compute
                    </div>
                  </>
                ) : (
                  <div className="font-google-sans-code text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    No minimum · billed per CU-hr and GB
                  </div>
                )}
                {cost.limitWarning && (
                  <div className="mt-1 font-google-sans-code text-[10px] text-red-500">{cost.limitWarning}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Recommendation */}
      <div
        className="rounded-xl border-l-4 p-4 sm:p-5"
        style={{ borderLeftColor: colorValue, backgroundColor: 'var(--background)' }}
      >
        <div className="font-google-sans-code text-xs font-bold uppercase" style={{ color: 'var(--foreground)' }}>
          Recommendation
        </div>
        <div className="mt-1 font-google-sans-code text-sm" style={{ color: 'var(--foreground)' }}>
          {recommendedPlan === 'free' ? (
            <>
              Free plan covers your current usage. Upgrade when storage exceeds{' '}
              <span className="font-vt323">{(bestPlan.includedStorageGB * 1024).toFixed(0)} MB</span>, compute passes{' '}
              <span className="font-vt323">{bestPlan.includedCUHours}</span> CU-hrs a month, or you need more than{' '}
              <span className="font-vt323">{bestPlan.maxCU} CU</span>.
            </>
          ) : recommendedPlan === 'launch' ? (
            <>
              {bestPlan.name} is your best fit: pay-as-you-go, no monthly minimum.{' '}
              <span className="font-vt323">{cuHours.toFixed(0)}</span> CU-hrs × ${bestPlan.computeRatePerCUHour} ={' '}
              <span className="font-vt323">{fmt(costs.launch.computeCost)}</span> compute, plus{' '}
              <span className="font-vt323">{fmt(costs.launch.storageCost)}</span> storage.
            </>
          ) : (
            <>
              {bestPlan.name} is needed: your <span className="font-vt323">{cuSize} CU</span> compute exceeds Launch&apos;s{' '}
              <span className="font-vt323">{PLANS.launch.maxCU} CU</span> cap.
            </>
          )}
        </div>
        {recommendedPlan !== 'free' && !costs[recommendedPlan].exceedsLimits && (
          <div className="mt-1 font-google-sans-code text-xs" style={{ color: 'var(--text-muted)' }}>
            Est. total: <span className="font-vt323">{fmtCompact(costs[recommendedPlan].total)}/mo</span> ·
            annual: <span className="font-vt323">{fmtCompact(costs[recommendedPlan].annual)}/yr</span>
            {recommendedPlan === 'scale' && !costs.launch.exceedsLimits && (
              <> · Launch would save <span className="font-vt323">{fmtCompact(costs.scale.annual - costs.launch.annual)}/yr</span> if usage fits</>
            )}
          </div>
        )}
      </div>

      {/* Rates reference */}
      <div className="rounded-xl border p-4" style={{ borderColor: `${colorValue}30`, backgroundColor: 'var(--background)' }}>
        <h2 className="mb-3 font-google-sans-code text-xs font-bold uppercase" style={{ color: 'var(--foreground)' }}>
          Neon — Rate Reference
        </h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 sm:grid-cols-3">
          {[
            { label: 'Storage (all paid plans)', value: '$0.35 / GB-month' },
            { label: 'Launch compute', value: '$0.106 / CU-hour' },
            { label: 'Scale compute', value: '$0.222 / CU-hour' },
            { label: 'Paid plan minimum', value: 'None (pay-as-you-go)' },
            { label: 'Free, per project', value: '100 CU-hrs · 0.5 GB' },
            { label: 'Launch max', value: '16 CU · 64 GB RAM' },
            { label: 'Scale max', value: '56 CU · 224 GB RAM' },
            { label: 'Launch max projects', value: '100' },
            { label: 'Scale max projects', value: '1,000' },
          ].map(({ label, value }) => (
            <div key={label}>
              <div className="font-google-sans-code text-[10px]" style={{ color: 'var(--text-muted)' }}>{label}</div>
              <div className="font-vt323 text-sm font-bold" style={{ color: 'var(--foreground)' }}>{value}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 font-google-sans-code text-[10px]" style={{ color: 'var(--text-muted)' }}>
          Rates from neon.com/pricing as of {NEON_PRICING_CHECKED}. Check there before you choose; buying Neon through
          Vercel uses the same plans, billed on your Vercel invoice. Future: add Supabase, Railway, and other providers to compare across options.
        </div>
      </div>

      {/* Live table breakdown */}
      {dbStats && dbStats.tables.length > 0 && (
        <div className="rounded-xl border p-4" style={{ borderColor: `${colorValue}30`, backgroundColor: 'var(--background)' }}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-google-sans-code text-xs font-bold uppercase" style={{ color: 'var(--foreground)' }}>
              Live — Table Sizes
            </h2>
            <span className="font-google-sans-code text-[10px]" style={{ color: colorValue }}>
              ● {dbStats.totalPretty} total · <span className="font-vt323">{dbStats.tables.length}</span> tables
            </span>
          </div>
          <div className="space-y-1">
            {dbStats.tables.map((table) => {
              const pct = dbStats.totalGB > 0 ? (table.gb / dbStats.totalGB) * 100 : 0;
              return (
                <div key={table.name}>
                  <div className="mb-0.5 flex items-baseline justify-between">
                    <span className="font-google-sans-code text-[10px]" style={{ color: 'var(--text-muted)' }}>{table.name}</span>
                    <span className="font-vt323 text-sm font-bold" style={{ color: 'var(--foreground)' }}>{table.pretty}</span>
                  </div>
                  <div className="h-1 w-full overflow-hidden rounded-full" style={{ backgroundColor: `${colorValue}20` }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${Math.max(pct, 0.5)}%`, backgroundColor: colorValue, opacity: 0.7 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-2 font-google-sans-code text-[10px]" style={{ color: 'var(--text-muted)' }}>
            Fetched {new Date(dbStats.fetchedAt).toLocaleString()} · pg_total_relation_size() includes indexes
          </div>
        </div>
      )}
    </div>
  );
};

export default DatabaseCalculator;
