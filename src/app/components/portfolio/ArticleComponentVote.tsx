'use client';

import Link from 'next/link';
import { COMPONENT_NAMES, componentLabel, type ComponentName } from '@/lib/component-portfolio';
import { getDependItems } from '@/utils/dependCosts';
import VoteControl from './VoteControl';
import { useComponentVotes } from './useComponentVotes';

// Each service by id: its name, and the SETUP. article that connects it
const DEPENDS = new Map(getDependItems().map((item) => [item.id, item]));

/**
 * At the foot of a component's home article (`presents`): vote on making it
 * yours, the same vote as the portfolio on /build, and the services it runs
 * on (`presents.needs`), each linking to the SETUP. article that connects it,
 * so every component's home leads on to how to run it.
 */
export default function ArticleComponentVote({ component, needs = [], color }: { component: string; needs?: string[]; color: string }) {
  const { votes, vote } = useComponentVotes();
  if (!(COMPONENT_NAMES as readonly string[]).includes(component)) return null;
  const name = component as ComponentName;
  const label = componentLabel(name);

  return (
    <section aria-label={`make ${label} yours`} className="mb-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-left">
      <p className="font-space-grotesk text-sm text-[var(--foreground)]">
        make <span className="font-vt323 text-xl leading-none" style={{ color }}>{label}</span> yours?
      </p>
      <VoteControl name={label} value={votes[name]} onVote={(c) => vote(name, c)} color={color} />
      {needs.length > 0 && (
        <p className="font-google-sans-code text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
          runs on{' '}
          {needs.map((id, i) => {
            const item = DEPENDS.get(id);
            return (
              <span key={id}>
                {i > 0 && ' + '}
                {item?.href ? (
                  <Link href={item.href} className="underline decoration-dotted underline-offset-4 transition-colors hover:text-[var(--foreground)]">
                    {item.name}
                  </Link>
                ) : (
                  item?.name ?? id
                )}
              </span>
            );
          })}
        </p>
      )}
      <Link href="/build" className="font-google-sans-code text-[10px] uppercase tracking-wide text-[var(--text-muted)] transition-colors hover:text-[var(--theme-color,_#f9c22e)]">
        your portfolio →
      </Link>
    </section>
  );
}
