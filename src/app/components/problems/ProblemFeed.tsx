'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Grid3x3, List, Plus } from '@/app/components/icons';
import ScrollRow from '@/components/HorizontalRow';
import { InkCircle } from '../depend/ink';
import ProblemCard from './ProblemCard';
import { formatShortDate, type Problem } from '@/lib/worksheet';

type View = 'cards' | 'table';
const VIEW_KEY = 'problem_feed_view';

const LABEL = 'font-google-sans-code text-[10px] uppercase tracking-wide text-[var(--text-muted)]';
const grewLabel = (p: Problem) => {
  const grew = p.versions.length - 1;
  return grew === 0 ? 'first version' : `grew ${grew}×`;
};

interface ProblemFeedProps {
  problems: Problem[];
  /** Cards and dots for problems with no color of their own */
  color: string;
  /** Where "new problem." goes; leave out to hide it */
  newHref?: string;
}

/**
 * Someone's problems, as colored cards in the ScrollRow or as a table built for
 * phones first (name and due date stacked; due, growth and last update get their
 * own columns from sm up). The view is remembered per browser. Every problem
 * opens its article at /party/problem/[id]
 */
export default function ProblemFeed({ problems, color, newHref }: ProblemFeedProps) {
  const router = useRouter();
  const [view, setView] = useState<View>('cards');

  useEffect(() => {
    try {
      if (localStorage.getItem(VIEW_KEY) === 'table') setView('table');
    } catch { /* storage blocked: cards */ }
  }, []);

  const choose = (next: View) => {
    setView(next);
    try { localStorage.setItem(VIEW_KEY, next); } catch { /* not remembered */ }
  };

  const hrefOf = (p: Problem) => `/party/problem/${p.id}`;

  const toggle = (
    <div role="group" aria-label="View problems as" className="flex items-center gap-1">
      {([['cards', Grid3x3], ['table', List]] as const).map(([id, Icon]) => {
        const on = view === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => choose(id)}
            aria-pressed={on}
            aria-label={id}
            className="relative grid size-10 place-items-center transition-colors"
            style={{ color: on ? color : 'var(--text-muted)' }}
          >
            <Icon size={18} strokeWidth={1.3} />
            {on && <InkCircle key={id} color={color} className="absolute inset-1 h-8 w-8" />}
          </button>
        );
      })}
    </div>
  );

  const newCard = newHref && (
    <Link
      key="new-problem"
      href={newHref}
      className="group flex h-full min-h-[218px] flex-col justify-end gap-2 rounded-xl border border-dashed p-4 transition-colors duration-300"
      style={{ borderColor: `${color}60` }}
    >
      <Plus size={28} strokeWidth={1.2} themed className="transition-transform duration-300 group-hover:rotate-90" />
      <span className="font-vt323 text-3xl leading-none text-[var(--foreground)]">new problem.</span>
      <span className={LABEL}>
        {problems.length ? 'or grow one by giving it the same name.' : 'start with the one you keep coming back to.'}
      </span>
    </Link>
  );

  return (
    <section aria-label="problems">
      <div className="mx-auto mb-2 flex max-w-5xl justify-start">{toggle}</div>

      {view === 'cards' ? (
        <ScrollRow
          items={[...problems.map((p) => <ProblemCard key={p.id} problem={p} fallbackColor={color} />), ...(newCard ? [newCard] : [])]}
          fullBleed
          maxItems={problems.length + 1}
          ariaLabel="problems"
        />
      ) : (
        <div className="mx-auto max-w-5xl text-left">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b" style={{ borderColor: `${color}20` }}>
                <th scope="col" className={`py-2 text-left font-normal ${LABEL}`}>problem.</th>
                <th scope="col" className={`hidden py-2 text-left font-normal sm:table-cell ${LABEL}`}>due.</th>
                <th scope="col" className={`hidden py-2 text-left font-normal sm:table-cell ${LABEL}`}>grew.</th>
                <th scope="col" className={`py-2 text-right font-normal ${LABEL}`}>updated.</th>
              </tr>
            </thead>
            <tbody>
              {problems.map((p) => {
                const own = p.color ?? color;
                return (
                  <tr
                    key={p.id}
                    onClick={() => router.push(hrefOf(p))}
                    className="cursor-pointer border-b transition-colors last:border-b-0 hover:bg-[var(--background-highlight)]"
                    style={{ borderColor: `${color}20` }}
                  >
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-3">
                        <span aria-hidden="true" className="size-6 shrink-0 rounded-full" style={{ backgroundColor: own }} />
                        <div className="min-w-0">
                          <Link href={hrefOf(p)} className="block truncate font-vt323 text-xl leading-tight text-[var(--foreground)]">
                            {p.ideaName.toLowerCase()}.
                          </Link>
                          {/* On phones, due and growth ride under the name */}
                          <span className={`block sm:hidden ${LABEL}`}>
                            {p.latest.deadline ? `by ${formatShortDate(p.latest.deadline)}` : 'no finish date'} · {grewLabel(p)}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className={`hidden py-3 pr-3 sm:table-cell ${LABEL}`}>
                      {p.latest.deadline ? formatShortDate(p.latest.deadline) : '—'}
                    </td>
                    <td className={`hidden py-3 pr-3 sm:table-cell ${LABEL}`}>{grewLabel(p)}</td>
                    <td className={`py-3 text-right ${LABEL}`}>{formatShortDate(p.latest.submittedAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {newHref && (
            <Link
              href={newHref}
              className="mt-4 inline-flex items-center gap-2 font-vt323 text-xl text-[var(--foreground)] transition-colors hover:text-[var(--theme-color,_#f9c22e)]"
            >
              <Plus size={18} strokeWidth={1.3} themed /> new problem.
            </Link>
          )}
        </div>
      )}
    </section>
  );
}
