'use client';

import Link from 'next/link';
import { formatShortDate, type Problem } from '@/lib/worksheet';

/** Perceived brightness (YIQ), so the idea name stays readable on any problem color */
const isLight = (hex: string) => {
  const n = parseInt(hex.slice(1, 7), 16);
  return ((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000 > 150;
};

/**
 * A problem in the ScrollRow, shaped like the /unppp/[type] repo cards: a block of
 * the problem's color with its name, then when it's due and how many times it grew.
 * Opens the problem's article
 */
export default function ProblemCard({ problem, fallbackColor }: { problem: Problem; fallbackColor: string }) {
  const color = problem.color ?? fallbackColor;
  const ink = isLight(color) ? '#0D0C1D' : '#F0F0F0';
  const grew = problem.versions.length - 1;

  return (
    <Link
      href={`/party/problem/${problem.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border transition-colors duration-300"
      style={{ borderColor: `${color}40` }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = color; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = `${color}40`; }}
    >
      <div className="flex h-[150px] items-end p-4" style={{ backgroundColor: color }}>
        <h3 className="font-vt323 text-3xl leading-none transition-transform duration-300 group-hover:-translate-y-1" style={{ color: ink }}>
          {problem.ideaName.toLowerCase()}.
        </h3>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4 font-google-sans-code text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
        <span>{problem.latest.deadline ? `by ${formatShortDate(problem.latest.deadline)}.` : 'no finish date.'}</span>
        <span>{grew === 0 ? 'first version.' : `grew ${grew} time${grew === 1 ? '' : 's'}.`}</span>
      </div>
    </Link>
  );
}
