import { BASELINE, SITE_NAME, SITE_URL } from '@/app/constants/organization';
import { buildCost } from '@/lib/baseline';
import { findProjectById, listProjects, type ResolvedProject } from '@/lib/projects';
import { componentLabel, type ComponentName } from '@/lib/component-portfolio';
import { EDITORIAL_ARTICLES } from '@/app/constants/editorial-articles/registry';
import type { EditorialArticle, EditorialSection } from '@/app/constants/editorial-articles';
import { allReleases, componentOfRelease, latestReleasesOfRepo, releaseHref, releasesOf, releaseSummary, releaseToolName, type Release } from '@/lib/releases';

/**
 * The belt under every project page, and under a type hub's cover: what a
 * visitor can do next, as pills in "build yours"'s hand. Try the project
 * itself where it runs (its `url`), try the component a release ships (see it
 * work), open its releases to take into your own repo, price yours (the
 * real figure, from what this one took), then build yours. Files and versions are for agents: they read
 * them in each pill's name, /releases.json and /llms.txt.
 *
 * Worked out on the server (the root layout, typeHub), so the article registry
 * and the release notes never reach the browser; a project page's belt is
 * picked by path (StatsLayoutWrapper).
 */

export interface BeltItem {
  kind: 'live' | 'try' | 'price' | 'releases';
  // The written verb (a phrase in build-yours/phrases.ts), and the small type
  // after it: what it acts on, or what it gives back
  verb: string;
  note: string;
  // A releases pill opens the belt's releases instead; this is /releases, for
  // a visitor without JavaScript
  href: string;
  // The full name, for screen readers and agents
  label: string;
}

/**
 * A release as the belt's releases pill shows it (ReleasesModal): what it is,
 * the component it pairs with running live, and the prompt that has the
 * visitor's LLM store its files in their own repo
 */
export interface BeltRelease {
  tag: string;
  name: string;
  version: string;
  summary: string;
  href: string;
  // The paired component, as its home article runs it
  component: { name: string; props?: Record<string, unknown> } | null;
  prompt: string;
}

export interface ProjectBelt {
  items: BeltItem[];
  // What its releases pill opens, newest first
  releases?: BeltRelease[];
  // Its Polar product: the ask at the end of the belt (BuyPill)
  polarProductId: string | null;
  // With no product: end on the site's own ask anyway (a hub's belt)
  ask?: boolean;
}

// The repo a project's releases come from: the last part of its GitHub URL, else its id
const repoOf = (project: ResolvedProject) => project.gh?.replace(/\.git$/, '').split('/').filter(Boolean).pop() || project.id;

const dollars = (n: number) => `$${Math.round(n).toLocaleString()}`;

// A released component to try, once its article is published
function tryItem(release: Release, tried: Set<string>): BeltItem | null {
  const paired = componentOfRelease(release);
  if (!paired?.href || tried.has(paired.href)) return null;
  tried.add(paired.href);
  const name = componentLabel(paired.component as ComponentName);
  return { kind: 'try', verb: 'try it', note: name, href: paired.href, label: `Try ${name}, released as ${release.name}` };
}

// The component a release pairs with, with the props its home article gives it
function pairedComponent(release: Release): BeltRelease['component'] {
  const paired = componentOfRelease(release);
  if (!paired) return null;
  const home = EDITORIAL_ARTICLES.find((a) => a.presents?.component === paired.component);
  const section = home?.sections.find((s) => s.type === 'component' && s.metadata?.componentName === paired.component);
  return { name: paired.component, props: section?.metadata?.componentProps as Record<string, unknown> | undefined };
}

const absolute = (path: string) => (/^https?:/.test(path) ? path : `${SITE_URL}${path}`);

// What "take it" copies: everything the visitor's LLM needs to store the
// release in their own repo, in plain words
function takePrompt(release: Release, tool: string): string {
  const folder = `releases/${release.prefix}/${release.version}/`;
  return [
    `Add ${tool} v${release.version} from ${SITE_NAME} to my repo.`,
    `Download these files into ${folder} as they are:`,
    ...release.files.map((f) => `- ${absolute(f.url)}`),
    `Its notes: ${absolute(releaseHref(release))}`,
    `Then tell me what it does and how to use it in my project (its USAGE.md or README.md, if it has one). Don't change anything outside ${folder} unless I ask.`,
  ].join('\n');
}

function beltRelease(release: Release): BeltRelease {
  const tool = releaseToolName(release);
  return {
    tag: release.tag,
    name: tool,
    version: release.version,
    summary: releaseSummary(release),
    href: releaseHref(release),
    component: pairedComponent(release),
    prompt: takePrompt(release, tool),
  };
}

// The releases pill: how many there are to take, opening them (ReleasesModal).
// Only releases with files, since taking one means storing its files
function releasesOn(releases: Release[]): { item: BeltItem; releases: BeltRelease[] } | null {
  const takeable = releases.filter((r) => r.files.length);
  if (!takeable.length) return null;
  const count = takeable.length;
  return {
    item: { kind: 'releases', verb: 'releases', note: String(count), href: '/releases', label: `${count} release${count === 1 ? '' : 's'} to take into your own repo` },
    releases: takeable.map(beltRelease),
  };
}

// The project where it runs (its `url`), unless that's this site itself
const siteHost = new URL(SITE_URL).host.replace(/^www\./, '');
function liveItem(project: ResolvedProject): BeltItem | null {
  if (!project.url) return null;
  let host: string;
  try {
    host = new URL(project.url).host.replace(/^www\./, '');
  } catch {
    return null;
  }
  if (host === siteHost) return null;
  const name = project.name ?? project.id;
  return { kind: 'live', verb: 'try it', note: name, href: project.url, label: `Try ${name} where it runs, at ${host}` };
}

// Pricing yours like a measured project: Goal Budget opens with it picked
function priceItem(id: string, hours: number, label: string): BeltItem | null {
  if (!BASELINE || !hours) return null;
  const cost = buildCost(hours, BASELINE).total;
  return { kind: 'price', verb: 'price yours', note: dollars(cost), href: `/goal-budget?like=${encodeURIComponent(id)}`, label: `Price yours: ${label} took ${Math.round(hours)} hours, about ${dollars(cost)}` };
}

const measuredHours = () => new Map((BASELINE?.projects ?? []).map((p) => [p.id, p.hours]));

export function projectBelts(): Record<string, ProjectBelt> {
  const measured = measuredHours();
  const belts: Record<string, ProjectBelt> = {};
  for (const project of listProjects()) {
    const tried = new Set<string>();
    const live = liveItem(project);
    const latest = latestReleasesOfRepo(repoOf(project));
    const items = [
      ...(live ? [live] : []),
      ...latest.map((r) => tryItem(r, tried)).filter((i): i is BeltItem => !!i),
    ];
    const released = releasesOn(latest);
    if (released) items.push(released.item);
    const price = priceItem(project.id, measured.get(project.id) ?? 0, project.name);
    if (price) items.push(price);
    belts[project.id] = { items, releases: released?.releases, polarProductId: project.polarProductId ?? null };
  }
  return belts;
}

/**
 * A type hub's belt (/unppp/<type>): the components released for it to try
 * (from its projects' repos, and those whose component is of this type), then
 * pricing yours like its typical project (the median by measured hours).
 * Ends on the site's ask.
 */
export function typeBelt(type: string, projectIds: string[]): ProjectBelt {
  const projects = projectIds.map((id) => findProjectById(id)).filter((p): p is ResolvedProject => !!p);
  const repos = new Set(projects.map(repoOf));
  const tried = new Set<string>();
  const latest = allReleases().filter((r) => r.latest && (repos.has(r.repo) || componentOfRelease(r)?.unpppType === type));
  const items = latest.map((r) => tryItem(r, tried)).filter((i): i is BeltItem => !!i);
  const released = releasesOn(latest);
  if (released) items.push(released.item);

  const measured = measuredHours();
  const sized = projects
    .map((p) => ({ project: p, hours: measured.get(p.id) ?? 0 }))
    .filter((p) => p.hours > 0)
    .sort((a, b) => a.hours - b.hours);
  const typical = sized[Math.floor((sized.length - 1) / 2)];
  const price = typical ? priceItem(typical.project.id, typical.hours, `a typical ${type} here, ${typical.project.name},`) : null;
  if (price) items.push(price);
  return { items, releases: released?.releases, polarProductId: null, ask: true };
}

/** A belt of only the releases pill, for a list of releases; null when none has files */
function releasesBelt(releases: Release[]): ProjectBelt | null {
  const released = releasesOn(releases);
  return released ? { items: [released.item], releases: released.releases, polarProductId: null } : null;
}

/** Every release this site publishes, newest of each: what a builder can take (/party) */
export function siteReleasesBelt(): ProjectBelt | null {
  return releasesBelt(allReleases().filter((r) => r.latest));
}

/** Each repo's releases, by repo name in lower case (RepositoryManager, /admin) */
export function repoReleaseBelts(): Record<string, ProjectBelt> {
  const belts: Record<string, ProjectBelt> = {};
  for (const repo of new Set(allReleases().map((r) => r.repo))) {
    const belt = releasesBelt(latestReleasesOfRepo(repo));
    if (belt) belts[repo.toLowerCase()] = belt;
  }
  return belts;
}

// A release's own paperwork, which agents read (llms.txt, /releases) rather
// than a visitor taking it as a tool
const PAPERWORK = /^(license|readme|usage|changelog)(\.|$)/i;

/** A component's RELEASES. row: the release to take, and its files */
export interface ReleaseTake {
  // The written pill: its chapter on /releases (every file and the notes)
  href: string;
  version: string;
  label: string;
  // One chip each, saving the file straight away (counted, ReleaseDownloads)
  files: { name: string; url: string; label: string }[];
}

/** A component's latest release with files, for its home article; null when there's none */
export function releaseRow(component: string): ReleaseTake | null {
  const release = releasesOf(component)[0];
  if (!release?.files.length) return null;
  const tool = `${releaseToolName(release)} v${release.version}`;
  return {
    href: releaseHref(release),
    version: release.version,
    label: `Take ${tool}: every file and its notes`,
    files: release.files
      .filter((f) => !PAPERWORK.test(f.name))
      .map((f) => ({ name: f.name, url: f.url, label: `Take ${f.name} from ${tool}` })),
  };
}

/**
 * A component's home article with its RELEASES. row: right after the
 * component itself (try it, then take it), else after its first component,
 * else before "make it yours.". An article whose component has released
 * nothing with files comes back as it was.
 */
export function withReleaseRow(article: EditorialArticle): EditorialArticle {
  const component = article.presents?.component;
  const release = component ? releaseRow(component) : null;
  if (!component || !release) return article;
  const row: EditorialSection = { id: 'releases', type: 'releases', metadata: { release } };
  const sections = [...article.sections];
  const own = sections.findIndex((s) => s.type === 'component' && s.metadata?.componentName === component);
  const any = sections.findIndex((s) => s.type === 'component');
  const yours = sections.findIndex((s) => s.id === 'make-it-yours');
  const at = own >= 0 ? own + 1 : any >= 0 ? any + 1 : yours >= 0 ? yours : sections.length;
  sections.splice(at, 0, row);
  return { ...article, sections };
}
