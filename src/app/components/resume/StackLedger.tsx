'use client';

import { useTheme } from '../../contexts/ThemeContext';
import InkStage from '../ink/InkStage';
import { InkSweep, InkWord } from '../ink/primitives';
import type { StackLine } from './types';

const dollars = (value: number) => `$${value < 10 && value % 1 !== 0 ? value.toFixed(2) : Math.round(value)}`;

/**
 * What a site runs on, by what each service costs a month, drawn in ink
 * (components/ink): each service's name, plan and price rise in, then its
 * pen-drawn bar sweeps out to its share, longest first
 */
export default function StackLedger({ lines }: { lines: StackLine[] }) {
  const { colorValue } = useTheme();
  const max = Math.max(1, ...lines.map(line => line.monthly));

  return (
    <InkStage>
      <ul className="space-y-5">
        {lines.map((line, index) => (
          <li key={line.id}>
            <div className="flex items-baseline gap-3">
              <InkWord beat={index * 1.5} className="min-w-0 truncate font-vt323 text-xl leading-tight" style={{ color: 'var(--foreground)' }}>
                {line.name}
              </InkWord>
              <InkWord beat={index * 1.5 + 0.5} className="font-vt323 text-sm uppercase" style={{ color: 'var(--text-muted)' }}>
                {line.plan}
              </InkWord>
              <InkWord beat={index * 1.5 + 1} className="ml-auto font-vt323 text-xl" style={{ color: 'var(--foreground)' }}>
                {dollars(line.monthly)}
              </InkWord>
            </div>
            <InkSweep beat={2 + index * 1.5} className="mt-1 h-3" style={{ width: `${Math.max(2, (line.monthly / max) * 100)}%` }}>
              {line.monthly > 0 && (
                <svg viewBox="0 0 100 10" preserveAspectRatio="none" className="block size-full overflow-visible" aria-hidden="true">
                  <path
                    d={`M2 ${5.4 + (index % 2 ? 0.6 : -0.4)} C33 4.2 66 6.2 98 5`}
                    fill="none"
                    stroke={colorValue}
                    strokeWidth={6}
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
              )}
            </InkSweep>
          </li>
        ))}
      </ul>
    </InkStage>
  );
}
