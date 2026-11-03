'use client';

import { useTheme } from '../contexts/ThemeContext';

// Split out of page.tsx purely for the border: page.tsx is a Server
// Component and can't call useTheme() (see #1006/#1008).
export default function ValuationProvenanceChips({ chips }: { chips: string[] }) {
  const { colorValue } = useTheme();

  return (
    <div className="mt-3 flex flex-wrap gap-x-2 gap-y-1.5">
      {chips.map(chip => (
        <span
          key={chip}
          className="font-google-sans-code rounded-full border px-2.5 py-1 text-[11px] tabular-nums"
          style={{ borderColor: `${colorValue}30`, color: 'var(--text-muted)' }}
        >
          {chip}
        </span>
      ))}
    </div>
  );
}
