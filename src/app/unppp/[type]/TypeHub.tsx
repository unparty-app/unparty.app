'use client';

import { useCallback, useRef, useState } from 'react';
import Link from 'next/link';
import { UNPPP_NAV_ITEMS } from '../../constants/unpppNav';
import { FOUNDER_CTA } from '../../constants/organization';
import { Boxes, FileText, BookOpen, Layers, ArrowRight } from '@/app/components/icons';
import type { HandDrawnIconComponent } from '@/app/components/icons';
import OutlineRail from '../../components/editorial/OutlineRail';
import ProjectBelt from '../../components/ProjectBelt';
import StickyCover from '../../components/editorial/StickyCover';
import Chapter from '../../founders/components/Chapter';
import { InkUnderline } from '../../components/depend/ink';
import UnpppCircle from '../../components/UnpppCircle';
import ProjectCard from '../../components/ProjectCard';
import { LinkRow } from '../../admin/components/Settings';
import type { EditorialSection } from '../../constants/editorial-articles/types';
import type { HubRow, TypeHub as Hub } from '@/lib/type-hub';

const LABEL = 'font-google-sans-code text-[10px] uppercase tracking-wide text-[var(--text-muted)]';
const HEADING = 'font-vt323 text-3xl leading-none text-[var(--foreground)] sm:text-4xl';
// Rows in as many columns as the screen holds; min-w-0 so a long line truncates instead of widening the page
const ROWS_GRID = 'grid border-t border-[var(--row-line)] sm:grid-cols-2 sm:gap-x-10 xl:grid-cols-3 2xl:grid-cols-4 [&>*]:min-w-0 [&>*]:border-b [&>*]:border-[var(--row-line)]';

// Text on the type's color: dark on a light color, light on a deep one
const INK_DARK = '#0D0C1D';
const INK_LIGHT = '#FFF1D6';
function inkOn(hex: string): string {
  const channel = (i: number) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const luminance = 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
  return (luminance + 0.05) / 0.05 > 1.05 / (luminance + 0.05) ? INK_DARK : INK_LIGHT;
}

type GroupId = 'components' | 'projects' | 'articles' | 'stories';

// Stories run long (two dozen on some hubs): a page at a time
const STORIES_PER_PAGE = 12;

// The hub's sections in reading order: what you can make (components), what
// people made (projects), how to (articles), why (stories). Each leads on
const GROUPS: Array<{ id: GroupId; label: string; icon: HandDrawnIconComponent; more: { label: string; href: string } }> = [
  { id: 'components', label: 'components', icon: Boxes, more: { label: 'every component', href: '/build' } },
  { id: 'projects', label: 'projects', icon: Layers, more: { label: FOUNDER_CTA?.label ?? 'build yours', href: FOUNDER_CTA?.href ?? '/article/setup-start-here' } },
  { id: 'articles', label: 'articles', icon: FileText, more: { label: 'every article', href: '/article' } },
  { id: 'stories', label: 'stories', icon: BookOpen, more: { label: 'every story', href: '/covers' } },
];

/** Back, where you are, next: for a list too long to show at once */
function Pager({ page, pages, onPage, accent }: { page: number; pages: number; onPage: (page: number) => void; accent: string }) {
  if (pages < 2) return null;
  const button = 'min-h-10 rounded-full border px-4 py-2 font-google-sans-code text-[11px] uppercase tracking-wide transition hover:opacity-80 disabled:opacity-30';
  return (
    <div className="mt-4 flex items-center gap-3">
      <button type="button" className={button} style={{ borderColor: accent, color: accent }} disabled={page === 1} onClick={() => onPage(page - 1)}>back</button>
      <span className={LABEL}>page {page} of {pages}</span>
      <button type="button" className={button} style={{ borderColor: accent, color: accent }} disabled={page === pages} onClick={() => onPage(page + 1)}>next</button>
    </div>
  );
}

/**
 * TypeHub - one kind of build (app, agent, service…) as a place to get
 * around, in that type's own color (UnpppTypesConfig.json), using the whole
 * screen like /admin. The journey runs down the page:
 *
 * 1. the article cover's frame in the type's color, solid, edge to edge and
 *    pinned under the header as it shrinks to a band (StickyCover): only the
 *    type's name with an ink underline (the /admin heading) and what it
 *    means, which fades as the band shrinks. Its icon is the header's circle
 * 2. (party and admin live in the header's unppp nav tray; the header's
 *    circle shows the type's icon in its color)
 * 3. components (what you can make), projects (what people made, as cover
 *    cards), articles (how to) and stories (why, 12 to a page). A section
 *    with nothing in it isn't shown, except projects, which asks for yours
 * 4. related: the other types, each as the header draws it (its icon on
 *    its color)
 *
 * The app's OutlineRail follows along; each section registers through
 * Chapter, as on /founders and /languages. The hub sets --theme-color to the
 * type's color, so every themed icon inside it takes that color too.
 */
export default function TypeHub({ hub }: { hub: Hub }) {
  const nav = UNPPP_NAV_ITEMS.find((item) => item.category === hub.type)!;
  const accent = hub.color;
  const ink = inkOn(accent);
  const rows: Record<GroupId, HubRow[]> = hub;
  const shownGroups = GROUPS.filter((g) => g.id === 'projects' || rows[g.id].length > 0);

  // The OutlineRail's entries: the cover, each section shown, then related
  const outline: EditorialSection[] = [
    { id: 'top', type: 'hero', content: nav.label },
    ...shownGroups.map((g): EditorialSection => ({ id: g.id, type: 'heading', content: `${g.label}.` })),
    { id: 'related', type: 'heading', content: 'related.' },
  ];
  const sectionRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const register = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) sectionRefs.current.set(id, el);
    else sectionRefs.current.delete(id);
  }, []);

  const [storyPage, setStoryPage] = useState(1);
  const storyPages = Math.ceil(hub.stories.length / STORIES_PER_PAGE);
  const shown = (g: GroupId) => (g === 'stories' ? hub.stories.slice((storyPage - 1) * STORIES_PER_PAGE, storyPage * STORIES_PER_PAGE) : rows[g]);
  const turnStoryPage = (page: number) => {
    setStoryPage(page);
    sectionRefs.current.get('stories')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };


  return (
    // Full-bleed past the root layout's max-w-screen-lg, like /admin, in the type's color
    <div
      className="mx-[calc(50%-50vw)] w-screen pb-16"
      style={{ ['--theme-color' as string]: accent, ['--row-line' as string]: `${accent}33` }}
    >
      <OutlineRail sections={outline} sectionRefs={sectionRefs} />
      {/* The article cover's frame, edge to edge with its rounding, pinned
          under the header and shrinking to a band (StickyCover). A solid
          color: no highlight over it. Its content sits at the top, so the
          band keeps the type */}
      {/* Pins with room for the name: the band clears the header's blur */}
      <StickyCover band={{ phone: 124, wide: 168 }} contentSized>
        <div className="image-container-responsive image-container-cover cover-hub" style={{ backgroundColor: accent, color: ink }}>
          {/* Top padding clears the header the pinned cover tucks under */}
          <div className="mx-auto w-full max-w-[1920px] px-4 pb-10 pt-14 sm:px-6 lg:px-12">
            {/* The type's icon is in the header's circle, so the cover holds only its name */}
            <h1 className="font-vt323 text-4xl uppercase leading-none sm:text-6xl">{nav.label}</h1>
            <InkUnderline color={ink} className="mt-1 h-2 w-24 sm:w-32" />
            <p className="cover-hub__definition mt-5 max-w-2xl font-space-grotesk text-base leading-relaxed sm:text-xl">{hub.definition}</p>
          </div>
        </div>
      </StickyCover>
      <div className="mx-auto w-full max-w-[1920px] px-4 sm:px-6 lg:px-12">
        {/* Where the outline's first entry jumps: the cover itself pins, so it
            can't be a Chapter (a sticky element only sticks inside its parent) */}
        <div ref={(el) => register('top', el)} data-section-id="top" aria-hidden="true" />

        {/* Quick links: its projects, their hours, and what's been released for it */}
        <ProjectBelt belt={hub.belt} fill color={accent} className="mb-12 mt-8" label={`what to do next with ${nav.label.replace(/\.$/, '').toLowerCase()}s`} />

        <div className="flex flex-col gap-16">
          {shownGroups.map((g) => {
            const items = shown(g.id);
            return (
              <Chapter key={g.id} id={g.id} onRef={register} className="scroll-mt-28">
                <section aria-labelledby={`${g.id}-label`}>
                  <div className="mb-4 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                    <h2 id={`${g.id}-label`} className={HEADING}>{g.label}.</h2>
                    <span className={LABEL}>{rows[g.id].length}</span>
                    <Link href={g.more.href} className={`${LABEL} ml-auto inline-flex items-center gap-1 transition-colors hover:text-[var(--foreground)]`}>
                      {g.more.label} <ArrowRight size={12} strokeWidth={1.5} />
                    </Link>
                  </div>
                  {g.id === 'projects' && items.length === 0 ? (
                    // No project of this kind yet: the ask, where a project would be
                    <div className={ROWS_GRID}>
                      <LinkRow
                        href={g.more.href}
                        icon={Layers}
                        title="yours could be the first."
                        detail={FOUNDER_CTA?.pitch ?? 'build your own, step by step.'}
                        value={g.more.label}
                      />
                    </div>
                  ) : g.id === 'projects' ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
                      {items.map((row) => <ProjectCard key={row.href} row={row} accent={accent} />)}
                    </div>
                  ) : (
                    <div className={ROWS_GRID}>
                      {items.map((row) => (
                        <LinkRow
                          key={row.href}
                          href={row.href}
                          title={row.title}
                          detail={row.detail}
                          value={row.value}
                          icon={g.id === 'stories' ? undefined : g.icon}
                          leading={g.id === 'stories' ? <UnpppCircle src={row.cover} color={accent} size={28} /> : undefined}
                        />
                      ))}
                    </div>
                  )}
                  {g.id === 'stories' && <Pager page={storyPage} pages={storyPages} onPage={turnStoryPage} accent={accent} />}
                </section>
              </Chapter>
            );
          })}

          {/* Where to go next: the other types, each in its own color */}
          <Chapter id="related" onRef={register} className="scroll-mt-28">
            <section aria-labelledby="related-label">
              <h2 id="related-label" className={`mb-4 ${HEADING}`}>related.</h2>
              <div className={ROWS_GRID}>
                {hub.related.map((t) => {
                  const item = UNPPP_NAV_ITEMS.find((n) => n.category === t.type);
                  const TypeIcon = item?.icon ?? Layers;
                  return (
                    <LinkRow
                      key={t.type}
                      href={`/unppp/${t.type}`}
                      // The header's circle for that type: its icon on its color
                      leading={
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full shadow-md" style={{ backgroundColor: t.color }} aria-hidden="true">
                          <TypeIcon size={18} strokeWidth={1.6} color={inkOn(t.color)} />
                        </span>
                      }
                      title={(item?.label ?? t.type).replace(/\.$/, '').toLowerCase()}
                      detail={t.definition}
                    />
                  );
                })}
              </div>
            </section>
          </Chapter>
        </div>
      </div>
    </div>
  );
}
