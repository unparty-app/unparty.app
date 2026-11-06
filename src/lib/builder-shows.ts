/**
 * What the work shows about the builder (#561): the opening of /founders,
 * read from what the copy measures rather than graded. It replaces an
 * entrepreneurial assessment that scored a builder from a repo analysis and
 * marked them down for working alone and for ideas still in motion. A builder
 * who trusts the process is easy to overlook, so each card says one strength
 * plainly and links to the chart that backs it (/build or /founders):
 *
 * - the hours: FoundersConfig `baseline`, how many and across how many
 *   projects, and how they were measured. No price on them: this is a
 *   resume, and market pay stays a tool for the visitor (Goal Budget)
 * - driven: how long they've kept at it, and that they still are (`baseline.projects`)
 * - focused: where the last weeks went (focus.json, src/lib/focus.ts)
 * - creative: the different places their builds start from (`projects` startsFrom)
 * - visionary: each build leading to the next (`projects` leadsTo), the
 *   pattern #620 found: a build closes a gap the last one opened, which its
 *   `need` says in the owner's words on the path
 * - ships: projects out in the world, releases, pieces published
 * - grows: the work year over year (`baseline.rhythm`)
 *
 * No numbers are kept here, and a card with nothing behind it is left out,
 * so a fresh copy's reading grows as its builder does.
 */
import 'server-only';
import { BASELINE } from '@/app/constants/organization';
import { rhythmYears } from '@/lib/baseline';
import { focusRepos } from '@/lib/focus';
import { allReleases } from '@/lib/releases';
import { findProjectById, listFounderProjects } from '@/lib/projects';
import { monthYear, plural, type FounderResumeData } from '@/app/founders/resume-data';

export interface BuilderShows {
  // The sentence that carries the number: the hours, where, and how they were measured
  measured: string | null;
  cards: Array<{ title: string; subtitle: string; href: string }>;
}

const DAY_MS = 24 * 60 * 60 * 1000;
// Work within this many days of the measuring counts as still going
const STILL_GOING_DAYS = 90;
// Focused: at least this share of the last weeks' hours in one project
const FOCUSED_SHARE = 0.4;

const list = (words: string[]) =>
  words.length < 2 ? words[0] ?? '' : `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;

/** The longest run of builds each leading to the next, by name (cycles end it) */
function longestChain(): string[] {
  const projects = listFounderProjects();
  const byId = new Map(projects.map((p) => [p.id, p]));
  const walk = (id: string, seen: Set<string>): string[] => {
    const project = byId.get(id);
    if (!project || seen.has(id)) return [];
    const next = (project.leadsTo ?? []).map((to) => walk(to, new Set([...seen, id])));
    const longest = next.reduce<string[]>((best, run) => (run.length > best.length ? run : best), []);
    return [project.name || id, ...longest];
  };
  return projects.map((p) => walk(p.id, new Set())).reduce<string[]>((best, run) => (run.length > best.length ? run : best), []);
}

export function builderShows(resume: FounderResumeData): BuilderShows {
  const cards: BuilderShows['cards'] = [];
  const measured = BASELINE?.projects ?? [];
  const hours = measured.reduce((sum, p) => sum + p.hours, 0);
  const firsts = measured.map((p) => p.from).filter((d): d is string => !!d).sort();
  const lasts = measured.map((p) => p.to).filter((d): d is string => !!d).sort();
  const first = firsts[0];
  const last = lasts[lasts.length - 1];

  // The hours, across how many projects, and how they were measured
  const projectCount = measured.filter((p) => p.hours > 0).length;
  const measuredLine =
    BASELINE && hours >= 1
      ? `${plural(Math.round(hours), 'hour', 'hours')} across ${plural(projectCount, 'project', 'projects')}${first ? ` since ${monthYear(first)}` : ''}, measured from the commits.`
      : null;

  // Driven: how long, how often, and still at it
  if (first && last) {
    const years = (Date.parse(last) - Date.parse(first)) / (365 * DAY_MS);
    const sessions = measured.reduce((sum, p) => sum + (p.sessions ?? 0), 0);
    const asOf = Date.parse(BASELINE?.measured ?? last);
    const going = asOf - Date.parse(last) <= STILL_GOING_DAYS * DAY_MS;
    if (years >= 0.5) {
      const span = years >= 1.5 ? `${Math.floor(years)} years at it` : `${Math.round(years * 12)} months at it`;
      cards.push({
        title: 'driven.',
        subtitle: `${span}${sessions ? `, ${plural(sessions, 'work session', 'work sessions')}` : ''}${going ? ', and still going.' : '.'}`,
        href: '/build#rhythm',
      });
    }
  }

  // Focused: most of the last weeks in one build
  const focus = focusRepos();
  if (focus) {
    const total = focus.repos.reduce((sum, r) => sum + r.total, 0);
    const top = focus.repos[0];
    const share = total ? top.total / total : 0;
    if (share >= FOCUSED_SHARE) {
      cards.push({
        title: 'focused.',
        subtitle: `${Math.round(share * 100)}% of the last ${focus.weeks.length} weeks went into ${findProjectById(top.repo)?.name ?? top.repo}.`,
        href: '/build#focus',
      });
    }
  }

  // Creative: builds that start from different places
  const starts = [...new Set(listFounderProjects().flatMap((p) => p.startsFrom ?? []))];
  if (starts.length >= 2) {
    cards.push({ title: 'creative.', subtitle: `builds that start from ${list(starts)}.`, href: '/founders#building' });
  }

  // Visionary: each build leading to the next
  const chain = longestChain();
  if (chain.length >= 3) {
    cards.push({ title: 'visionary.', subtitle: `each build opened the next: ${chain.join(', then ')}.`, href: '/founders#building' });
  }

  // Ships: what's out in the world
  const out = resume.building.filter((p) => p.stage === 'shipped' || p.stage === 'selling').length;
  const releases = allReleases().length;
  const shipped = [
    out ? `${out} of ${plural(resume.building.length, 'project', 'projects')} out in the world` : '',
    releases ? plural(releases, 'release', 'releases') : '',
    resume.shipped.pieces ? plural(resume.shipped.pieces, 'piece', 'pieces') + ' published' : '',
  ].filter(Boolean);
  if (shipped.length) cards.push({ title: 'ships.', subtitle: `${list(shipped)}.`, href: out ? '/build#built' : '/build#shipped' });

  // Grows: more each year (whole years only, the last as "so far")
  const years = rhythmYears(BASELINE).filter((y) => y.commits > 0);
  if (years.length >= 2 && years[years.length - 1].commits >= years[0].commits) {
    const said = years.map((y) => `${y.commits.toLocaleString('en-US')} in ${y.year}${y.through ? ' so far' : ''}`);
    cards.push({ title: 'grows.', subtitle: `commits by year: ${said.join(', ')}.`, href: '/build#rhythm' });
  }

  return { measured: measuredLine, cards };
}
