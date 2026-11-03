'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useTheme } from '../contexts/ThemeContext';
import { useUserTracking } from '../hooks/useUserTracking';
import { SITE_HEADLINE } from '../constants/organization';
import { ArrowRight, Boxes } from '@/app/components/icons';
import { InkUnderline } from '../components/depend/ink';
import { inkOn } from '../components/build-yours/BuildYours';
import BuildYoursCard from '../components/build-yours/BuildYoursCard';
import OutlineRail from '../components/editorial/OutlineRail';
import StickyCover from '../components/editorial/StickyCover';
import Chapter from '../founders/components/Chapter';
import TypeStatline, { percent, typeName } from '../components/TypeStatline';
import ProjectCard from '../components/ProjectCard';
import SponsorCard from '../components/SponsorCard';
import ValuesBadge from '../components/ValuesBadge';
import { LinkRow, DisclosureRow } from '../admin/components/Settings';
import { effortByType } from '@/lib/type-effort';
import type { EditorialSection } from '../constants/editorial-articles/types';
import type { HubRow } from '@/lib/type-hub';

export interface AboutData {
  projects: HubRow[];
  components: HubRow[];
  faq: Array<{ id: string; q: string; a: string; link?: { label: string; href: string } }>;
}

const LABEL = 'font-google-sans-code text-[10px] uppercase tracking-wide text-[var(--text-muted)]';
const HEADING = 'font-vt323 text-3xl leading-none text-[var(--foreground)] sm:text-4xl';
const MORE = `${LABEL} ml-auto inline-flex items-center gap-1 transition-colors hover:text-[var(--foreground)]`;
const ROWS_GRID = 'grid border-t border-[var(--row-line)] sm:grid-cols-2 sm:gap-x-10 xl:grid-cols-3 [&>*]:min-w-0 [&>*]:border-b [&>*]:border-[var(--row-line)]';

/** A section's heading line: its name, an optional count, and where it leads */
function SectionHead({ id, label, count, more }: { id: string; label: string; count?: number; more?: { label: string; href: string } }) {
  return (
    <div className="mb-5 flex flex-wrap items-baseline gap-x-4 gap-y-1">
      <h2 id={`${id}-label`} className={HEADING}>{label}</h2>
      {count !== undefined && <span className={LABEL}>{count}</span>}
      {more && (
        <Link href={more.href} className={MORE}>
          {more.label} <ArrowRight size={12} strokeWidth={1.5} />
        </Link>
      )}
    </div>
  );
}

/**
 * AboutClient - /about, top to bottom: the cover (pinned like the hubs');
 * the work in numbers, then where it goes by kind of build (TypeStatline);
 * what's being built (the owner's projects, then the busiest); what you can
 * build with it (the published components); what it stands for (the values
 * and sponsor cards, side by side); the questions people ask (the
 * published FAQ, opening in place); and the one ask (BuildYoursCard). The
 * OutlineRail follows along.
 */
export default function AboutClient({ data }: { data: AboutData }) {
  const { colorValue } = useTheme();
  const ink = inkOn(colorValue);
  const { trackPillarUsage } = useUserTracking();
  const effort = useMemo(() => effortByType(), []);

  useEffect(() => {
    trackPillarUsage({ pillar: 'ABOUT', action: 'page_visit', metadata: { timestamp: new Date(), page: '/about' } });
  }, [trackPillarUsage]);

  const sectionRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const register = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) sectionRefs.current.set(id, el);
    else sectionRefs.current.delete(id);
  }, []);

  const hasEffort = effort.total > 0;
  const busiest = [...effort.types].sort((a, b) => b.share - a.share)[0];
  const rising = effort.types.reduce((sum, t) => sum + t.rising, 0);
  const projects = effort.types.reduce((sum, t) => sum + t.projects, 0);

  const sections = [
    hasEffort && { id: 'work', label: 'the work.' },
    data.projects.length > 0 && { id: 'projects', label: 'what’s being built.' },
    data.components.length > 0 && { id: 'components', label: 'build with it.' },
    { id: 'stands-for', label: 'what it stands for.' },
    data.faq.length > 0 && { id: 'questions', label: 'questions.' },
  ].filter(Boolean) as Array<{ id: string; label: string }>;
  const outline: EditorialSection[] = [
    { id: 'top', type: 'hero', content: 'ABOUT.' },
    ...sections.map((s): EditorialSection => ({ id: s.id, type: 'heading', content: s.label })),
  ];

  return (
    <main
      className="mx-[calc(50%-50vw)] w-screen pb-4"
      style={{ ['--row-line' as string]: `${colorValue}20` }}
    >
      <OutlineRail sections={outline} sectionRefs={sectionRefs} />
      {/* The cover pins only as far as the sections go, so it lets go before
          the closing band rather than sitting on it */}
      <div>
      <StickyCover band={{ phone: 124, wide: 168 }} contentSized>
        <div className="image-container-responsive image-container-cover cover-hub" style={{ backgroundColor: colorValue, color: ink }}>
          <div className="mx-auto w-full max-w-[1920px] px-4 pb-10 pt-14 sm:px-6 lg:px-12">
            <h1 className="font-vt323 text-4xl uppercase leading-none sm:text-6xl">about.</h1>
            <InkUnderline color={ink} className="mt-1 h-2 w-24 sm:w-32" />
            <p className="cover-hub__definition mt-5 max-w-2xl font-space-grotesk text-base leading-relaxed sm:text-xl">{SITE_HEADLINE.toLowerCase()}.</p>
          </div>
        </div>
      </StickyCover>

      <div className="mx-auto w-full max-w-[1920px] px-4 sm:px-6 lg:px-12">
        <div ref={(el) => register('top', el)} data-section-id="top" aria-hidden="true" />
        <div className="flex flex-col gap-20">
          {hasEffort && (
            <Chapter id="work" onRef={register} className="scroll-mt-28">
              <section id="work" aria-labelledby="work-label" className="scroll-mt-48">
                <SectionHead id="work" label="the work." />
                {/* The work in numbers, then where it goes */}
                <dl className="mb-10 grid grid-cols-2 gap-x-10 gap-y-6 sm:grid-cols-4">
                  {[
                    { value: String(Math.round(effort.total)), label: 'commits a month' },
                    { value: String(projects), label: 'projects' },
                    { value: String(rising), label: 'picking up pace' },
                    { value: busiest ? percent(busiest.share) : '—', label: busiest ? `in ${typeName(busiest.type)}` : 'busiest' },
                  ].map((stat) => (
                    <div key={stat.label} className="flex flex-col gap-1">
                      <dt className="order-2 font-google-sans-code text-[11px] uppercase tracking-wide text-[var(--text-muted)]">{stat.label}</dt>
                      <dd className="order-1 font-vt323 text-5xl leading-none text-[var(--foreground)] sm:text-6xl">{stat.value}</dd>
                    </div>
                  ))}
                </dl>
                <TypeStatline />
              </section>
            </Chapter>
          )}

          {data.projects.length > 0 && (
            <Chapter id="projects" onRef={register} className="scroll-mt-28">
              <section aria-labelledby="projects-label">
                <SectionHead id="projects" label={'what’s being built.'} count={data.projects.length} />
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {data.projects.map((row) => <ProjectCard key={row.href} row={row} accent={colorValue} />)}
                </div>
              </section>
            </Chapter>
          )}

          {data.components.length > 0 && (
            <Chapter id="components" onRef={register} className="scroll-mt-28">
              <section aria-labelledby="components-label">
                <SectionHead id="components" label="build with it." count={data.components.length} more={{ label: 'every component', href: '/build' }} />
                <div className={ROWS_GRID}>
                  {data.components.map((row) => (
                    <LinkRow key={row.href} href={row.href} icon={Boxes} title={row.title} detail={row.detail} />
                  ))}
                </div>
              </section>
            </Chapter>
          )}

          <Chapter id="stands-for" onRef={register} className="scroll-mt-28">
            <section aria-labelledby="stands-for-label">
              <SectionHead id="stands-for" label="what it stands for." />
              <div className="grid max-w-4xl gap-8 sm:grid-cols-2">
                <ValuesBadge />
                <SponsorCard />
              </div>
            </section>
          </Chapter>

          {data.faq.length > 0 && (
            <Chapter id="questions" onRef={register} className="scroll-mt-28">
              <section aria-labelledby="questions-label">
                <SectionHead id="questions" label="questions." more={{ label: 'every question', href: '/faq' }} />
                <div className="max-w-3xl border-t border-[var(--row-line)] [&>*]:border-b [&>*]:border-[var(--row-line)]">
                  {data.faq.map((q) => (
                    <DisclosureRow key={q.id} title={q.q}>
                      <p className="max-w-2xl font-space-grotesk text-sm leading-relaxed text-[var(--foreground)]">{q.a}</p>
                      {q.link && (
                        <Link href={q.link.href} className={`${LABEL} mt-3 inline-flex items-center gap-1 transition-colors hover:text-[var(--foreground)]`}>
                          {q.link.label} <ArrowRight size={12} strokeWidth={1.5} />
                        </Link>
                      )}
                    </DisclosureRow>
                  ))}
                </div>
              </section>
            </Chapter>
          )}
        </div>
      </div>

      </div>

      {/* The page's one ask, the brand brain writing itself in */}
      <BuildYoursCard placement="about" alignStart />
    </main>
  );
}
