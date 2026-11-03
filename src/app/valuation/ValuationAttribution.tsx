'use client';

import { useTheme } from '../contexts/ThemeContext';

interface ValuationAttributionProps {
  totalDevHours: number;
  laborRatePerHour: number;
  llmBaselineCost: number;
  llmBaselineRange: string;
  llmRatePerHour: number;
}

// Split out of page.tsx purely for the border: page.tsx is a Server
// Component and can't call useTheme() (see #1006/#1008).
export default function ValuationAttribution({
  totalDevHours,
  laborRatePerHour,
  llmBaselineCost,
  llmBaselineRange,
  llmRatePerHour,
}: ValuationAttributionProps) {
  const { colorValue } = useTheme();

  return (
    <div
      className="grid grid-cols-1 gap-3 rounded-lg border p-3 sm:grid-cols-2"
      style={{ borderColor: `${colorValue}30`, backgroundColor: 'var(--background-highlight)' }}
    >
      <div className="text-center">
        <p className="font-vt323 text-lg tracking-wide" style={{ color: 'var(--foreground)' }}>
          MEASURED BY REAL EFFORT.
        </p>
        <p className="font-google-sans-code text-[11px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
          {Math.round(totalDevHours).toLocaleString('en-US')}h of git sessions × $
          {laborRatePerHour.toFixed(2)}/hr derived market labor
        </p>
      </div>
      <div className="text-center">
        <p className="font-vt323 text-lg tracking-wide" style={{ color: 'var(--foreground)' }}>
          CLAUDE AGENT GENERATED.
        </p>
        <p className="font-google-sans-code text-[11px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
          ${llmBaselineCost.toLocaleString('en-US')} measured llm spend ({llmBaselineRange}) → $
          {llmRatePerHour.toFixed(2)}/hr
        </p>
      </div>
    </div>
  );
}
