'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTheme } from '../contexts/ThemeContext';
import { DollarSign, Hammer, HelpCircle, KeyRound, ShieldCheck, ChevronRight } from '../components/icons';
import type { HandDrawnIconComponent } from '../components/icons';
import { InkUnderline } from '../components/depend/ink';
import { SettingsGroup, SettingsNav, DisclosureRow } from '../admin/components/Settings';
import type { FaqGroup, FaqQuestion } from '@/lib/faq';

const ICONS: Record<string, HandDrawnIconComponent> = { DollarSign, Hammer, HelpCircle, KeyRound, ShieldCheck };
const DEV = process.env.NODE_ENV === 'development';

/**
 * /faq in the /admin settings language: the same heading, sidebar of groups
 * (from lg up one group shows at a time, phones list them all) and rows that
 * open in place. Each question is a DisclosureRow; its answer reads in Space
 * Grotesk and leads on with one link. The chosen group follows the URL hash,
 * like /admin, so a group can be linked to. On npm run dev, answers still
 * marked draft say so on their row.
 */
export default function FaqSettings({ title, groups, questions }: { title: string; groups: FaqGroup[]; questions: FaqQuestion[] }) {
  const { colorValue } = useTheme();
  const [active, setActive] = useState(groups[0]?.id ?? '');

  useEffect(() => {
    const fromHash = () => {
      const id = window.location.hash.slice(1);
      if (groups.some((g) => g.id === id)) setActive(id);
    };
    fromHash();
    window.addEventListener('hashchange', fromHash);
    return () => window.removeEventListener('hashchange', fromHash);
  }, [groups]);

  const choose = (id: string) => {
    setActive(id);
    history.replaceState(null, '', `#${id}`);
  };

  return (
    // The /admin frame: full-bleed past the root column, then its own gutters
    <div className="mx-[calc(50%-50vw)] w-screen py-12">
      <div className="mx-auto w-full max-w-[1920px] px-4 sm:px-6 lg:px-12">
      <div className="mb-10 lg:mb-14">
        <h1 className="font-vt323 text-5xl uppercase leading-none text-[var(--foreground)] sm:text-6xl">faq.</h1>
        <InkUnderline color={colorValue} className="mt-2 h-2 w-20" />
        <p className="mt-4 font-google-sans-code text-sm uppercase text-[var(--foreground)] opacity-70">questions about building {title}.</p>
      </div>

      <div className="lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-16">
        <SettingsNav
          groups={groups.map((g) => ({
            id: g.id,
            label: g.label.replace(/\.$/, '').replace(/^./, (c) => c.toUpperCase()),
            icon: ICONS[g.icon] ?? HelpCircle,
            value: String(questions.filter((q) => q.group === g.id).length),
          }))}
          active={active}
          onChoose={choose}
        />
        <div>
          {groups.map((group, groupIndex) => (
            <SettingsGroup key={group.id} id={group.id} label={group.label} active={active === group.id}>
              {questions
                .filter((q) => q.group === group.id)
                .map((q, i) => (
                  <DisclosureRow key={q.id} title={q.q} value={DEV && q.draft ? 'draft' : undefined} defaultOpen={groupIndex === 0 && i === 0}>
                    <div className="max-w-2xl space-y-3">
                      <p className="font-space-grotesk text-sm leading-relaxed text-[var(--text-muted)]">{q.a}</p>
                      {q.link && (
                        <Link
                          href={q.link.href}
                          className="group inline-flex items-center gap-1 font-google-sans-code text-[10px] uppercase tracking-wide text-[var(--foreground)] transition-colors hover:text-[var(--theme-color)]"
                        >
                          {q.link.label}
                          <ChevronRight size={14} strokeWidth={1.3} className="transition-transform group-hover:translate-x-0.5" />
                        </Link>
                      )}
                    </div>
                  </DisclosureRow>
                ))}
            </SettingsGroup>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
}
