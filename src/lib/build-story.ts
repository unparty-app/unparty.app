/**
 * /build as the story of the builder's work (#1650), laid out as an article
 * the way /founders lays out the person (resumeToArticle), from what every
 * copy has:
 *
 * - FOCUS.: where the hours go now (RepoFocus, the build's focus.json)
 * - KINDS.: those hours by kind of build (TypeStatline), in the owner's brand
 *   colors: a project's kind is its FoundersConfig `type`, else, for
 *   unparty's own repos, the kind the repo analysis gave it
 * - RHYTHM.: when the work happens, year over year (BuildRhythm, the owner's
 *   `baseline.rhythm`)
 * - BUILT.: the owner's projects, each with its stage and measured hours
 * - EFFORT., SHIPPED., MOMENTUM., STACK., VIEWS.: the resume's charts of the
 *   work, which live here rather than on /founders
 * - YOURS.: what a build like this takes (GoalBudget), then the site's ask
 *
 * A chapter shows only when it has something to show, so a fresh copy's
 * /build grows as its builder does. Nothing measured is kept in code.
 */
import 'server-only';
import UnpppTypesConfig from '@/data/UnpppTypesConfig.json';
import { BASELINE, BRAND_COLORS, FOUNDER, FOUNDER_CTA, SITE_NAME } from '@/app/constants/organization';
import { hourName, peakHour, rhythmYears } from '@/lib/baseline';
import { focusData, focusRepos } from '@/lib/focus';
import { findProjectById, listFounderProjects } from '@/lib/projects';
import { allReleases } from '@/lib/releases';
import { getRepositoryById } from '@/app/utils/unpppDataAdapter';
import { UNPPP_NAV_ITEMS, type NavCategory } from '@/app/constants/unpppNav';
import type { EffortByType, TypeEffort } from '@/lib/type-effort';
import type { EditorialArticle, EditorialSection } from '@/app/constants/editorial-articles/types';
import {
  cardsRow,
  chapter,
  chartSection,
  component,
  dollars,
  line,
  MOMENTUM_STEPS,
  paragraph,
  plural,
  row,
  type FounderResumeData,
} from '@/app/founders/resume-data';

// The last weeks that count as now, against the ones before (as RepoFocus)
const RECENT = 4;
const RISING = 1.25;

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);
const repoName = (gh?: string | null) => gh?.replace(/\.git$/, '').split('/').filter(Boolean).pop();

// A measured repo's kind of build: its project's own `type` (FoundersConfig,
// or the record it extends), else the repo analysis's, for unparty's repos
function kindOf(repo: string): NavCategory | null {
  const own = listFounderProjects().find((p) => p.id === repo || repoName(p.gh) === repo);
  const known = UnpppTypesConfig.types.map((t) => t.id);
  const type = (own ?? findProjectById(repo))?.type ?? getRepositoryById(repo)?.type;
  return type && known.includes(type) ? (type as NavCategory) : null;
}

// WCAG relative luminance of a #RRGGBB color
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
// The site is always dark (FORCE_DARK_MODE, --background #10100D): a mark
// shows when it clears 3:1 against it, a luminance of about 0.115
const showsOnDark = (hex: string) => /^#[0-9a-f]{6}$/i.test(hex) && luminance(hex) >= 0.115;
// What the kinds beyond the owner's usable colors share; their names and
// marks in the legend still tell them apart
const FOLDED = 'var(--text-muted)';

/**
 * The last weeks' measured hours by kind of build, or null when no repo has a
 * kind. Painted in the owner's brand colors (FoundersConfig `brandColors`), in
 * their order, the kinds with the most hours first: only the colors that show
 * on the dark page, the rest of the kinds in muted ink
 */
export function liveEffortByType(): EffortByType | null {
  const measured = focusRepos();
  if (!measured) return null;
  const split = Math.max(0, measured.weeks.length - RECENT);
  const byType = new Map<NavCategory, { hours: number; projects: number; rising: number }>();
  for (const repo of measured.repos) {
    const type = kindOf(repo.repo);
    if (!type) continue;
    const now = sum(repo.hours.slice(split)) / Math.max(1, repo.hours.length - split);
    const before = sum(repo.hours.slice(0, split)) / Math.max(1, split);
    const entry = byType.get(type) ?? { hours: 0, projects: 0, rising: 0 };
    byType.set(type, { hours: entry.hours + repo.total, projects: entry.projects + 1, rising: entry.rising + (now > before * RISING ? 1 : 0) });
  }
  const total = sum([...byType.values()].map((t) => t.hours));
  if (!total) return null;
  const palette = BRAND_COLORS.filter(showsOnDark);
  const ranked = [...byType.entries()].sort((a, b) => b[1].hours - a[1].hours).map(([type]) => type);
  const colorOf = (type: NavCategory) => palette[ranked.indexOf(type)] ?? FOLDED;
  const types: TypeEffort[] = UnpppTypesConfig.types.map((t) => {
    const entry = byType.get(t.id as NavCategory) ?? { hours: 0, projects: 0, rising: 0 };
    return { type: t.id as NavCategory, color: colorOf(t.id as NavCategory), commitsPerMonth: 0, share: entry.hours / total, projects: entry.projects, rising: entry.rising, hours: entry.hours };
  });
  return { types, generatedAt: measured.generatedAt, total, weeks: measured.weeks.length };
}

// "app", as the type hubs and TypeStatline say it
const typeLabel = (type: NavCategory) => UNPPP_NAV_ITEMS.find((n) => n.category === type)?.label.replace(/\.$/, '').toLowerCase() ?? type;

export function buildToArticle(resume: FounderResumeData): EditorialArticle {
  const { shipped, building, effort, momentum, stack, views } = resume;
  const sections: EditorialSection[] = [];

  // FOCUS.: where the hours go now
  const focus = focusData();
  if (focus) {
    sections.push(
      chapter('focus', 'FOCUS.', 'Clock'),
      line('focus-line', `${plural(Math.round(focus.totalHours), 'hour', 'hours')} in the last ${focus.weeks.length} weeks.`),
      component('focus-chart', 'RepoFocus', focus as unknown as Record<string, unknown>)
    );
  }

  // KINDS.: those hours by kind of build
  const kinds = liveEffortByType();
  if (kinds) {
    const top = [...kinds.types].sort((a, b) => b.share - a.share)[0];
    sections.push(
      chapter('kinds', 'KINDS.', 'Layers'),
      line('kinds-line', `most of the hours go to ${typeLabel(top.type)}.`),
      component('kinds-line-chart', 'TypeStatline', { effort: kinds })
    );
  }

  // RHYTHM.: when the work happens, and how that changed as it grew
  const years = rhythmYears(BASELINE);
  if (years.length) {
    const first = years[0];
    const last = years[years.length - 1];
    const moved = years.length > 1 && peakHour(first) !== peakHour(last);
    sections.push(
      chapter('rhythm', 'RHYTHM.', 'Calendar'),
      line('rhythm-line', moved ? `the work moved from ${hourName(peakHour(first))} to ${hourName(peakHour(last))}.` : `the work keeps to ${hourName(peakHour(last))}.`),
      ...(years.length > 1 ? [paragraph('rhythm-growth', `${plural(first.commits, 'commit', 'commits')} in ${first.year}, ${plural(last.commits, 'commit', 'commits')} in ${last.year}${last.through ? ' so far' : ''}.`)] : []),
      component('rhythm-chart', 'BuildRhythm', { years })
    );
  }

  // BUILT.: the owner's projects, each with its stage and measured hours
  if (building.length) {
    const measured = new Map((BASELINE?.projects ?? []).map((p) => [p.id, p.hours]));
    const live = building.filter((p) => p.stage === 'shipped' || p.stage === 'selling').length;
    sections.push(
      chapter('built', 'BUILT.', 'Hammer'),
      line('built-line', `${plural(building.length, 'project', 'projects')}, ${live} out in the world.`),
      cardsRow(
        'built-row',
        building.map((p) => {
          const hours = measured.get(p.id);
          return { href: p.href ?? `/${p.id}`, cover: p.cover, color: p.color, title: p.name ?? p.id, subtitle: `${p.stage}.${hours ? ` ${Math.round(hours)} hours.` : ''}` };
        })
      )
    );
  }

  // EFFORT.: where the work goes, by the founder's areas
  if (effort.length > 0) {
    sections.push(chapter('effort', 'EFFORT.', 'Activity'), ...chartSection('effort-timeline', resume, 'effort'));
  }

  // SHIPPED.: what came out, month by month, and what can be taken
  const releases = allReleases().filter((r) => r.latest && r.files.length);
  if (shipped.pieces > 0 || releases.length) {
    sections.push(chapter('shipped', 'SHIPPED.', 'Package'));
    if (shipped.pieces > 0) sections.push(line('shipped-line', `${plural(shipped.pieces, 'piece', 'pieces')} published.`), ...chartSection('shipped-timeline', resume, 'shipped'));
    if (releases.length) sections.push(row('shipped-releases', `${plural(releases.length, 'release', 'releases')} to take into your own repo →`, '/releases'));
  }

  if (momentum && momentum.steps >= MOMENTUM_STEPS) {
    sections.push(
      chapter('momentum', 'MOMENTUM.', 'TrendingUp'),
      line('momentum-line', `${plural(momentum.steps, 'step', 'steps')} finished.`),
      ...chartSection('momentum-timeline', resume, 'momentum')
    );
  }

  if (stack) {
    sections.push(chapter('stack', 'STACK.', 'Boxes'), line('stack-line', `runs on ${dollars(stack.monthly)} a month.`), ...chartSection('stack-ledger', resume, 'stack'));
  }

  if (views) {
    sections.push(
      chapter('views', 'VIEWS.', 'Eye'),
      line('views-line', `${plural(views.visitors, 'visitor', 'visitors')} in thirty days.`),
      paragraph('views-pageviews', `${plural(views.pageviews, 'pageview', 'pageviews')}, and the pages they read most.`),
      ...chartSection('views-chart', resume, 'views')
    );
  }

  // YOURS.: what a build like this takes, then the site's one ask
  sections.push(chapter('yours', 'YOURS.', 'Lightbulb'), line('yours-line', 'what would yours take?'), component('yours-budget', 'GoalBudget', {}));
  if (FOUNDER_CTA) sections.push(component('yours-ask', 'BuildYours', { placement: 'build' }));

  return {
    slug: 'build',
    title: 'build.',
    subtitle: `how ${SITE_NAME} is built, and what yours would take.`,
    description: `Where ${SITE_NAME}'s hours go, the kinds of builds, when the work happens, what shipped, and what it runs on, from the work itself. Then your stack, the components to make yours, and what a build like it would take.`,
    category: 'BUILD.',
    date: shipped.first ?? new Date().toISOString().slice(0, 10),
    published: true,
    coverColor: 'theme',
    author: FOUNDER.name,
    tags: [],
    sections,
  };
}
