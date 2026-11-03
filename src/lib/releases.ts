import { EDITORIAL_ARTICLES } from '@/app/constants/editorial-articles/registry';
import { SITE_GITHUB } from '@/app/constants/organization';

/**
 * The site owner's releases (public/releases.json, written by
 * scripts/generate-releases.mjs at build time), each paired with the
 * component that shows what it does (#1033). A person tries the component on
 * its article; an agent reads the notes and fetches the files.
 *
 * A component's releases are the ones whose tag prefix is its home article's
 * `presents.release`, or its name in kebab case (BrandPalette → brand-palette).
 * next.config hands the file over at build (RELEASES_JSON), so this works on
 * any page, prerendered or not. The file is gitignored, so before a build
 * makes it (a fresh copy's `npm run dev`) there are no releases. Server-side
 * only, so the notes never ship to the browser.
 */

export interface ReleaseFile {
  name: string;
  size: number;
  // Where the site serves it
  url: string;
}

export interface Release {
  prefix: string;
  version: string;
  tag: string;
  name: string;
  repo: string;
  publishedAt: string | null;
  // The release notes, markdown as written
  notes: string;
  // The newest release of its prefix: the one whose files the site serves
  latest: boolean;
  files: ReleaseFile[];
}

let cached: Release[] | null = null;

/** Every release, newest first */
export function allReleases(): Release[] {
  if (cached) return cached;
  try {
    cached = JSON.parse(process.env.RELEASES_JSON || '{}').releases ?? [];
  } catch {
    cached = [];
  }
  return cached!;
}

// BrandPalette → brand-palette, AIWrappedVisualization → ai-wrapped-visualization
const kebab = (name: string) =>
  name.replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2').replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

/** The tag prefix a component's releases carry */
export function releasePrefixOf(component: string): string {
  const home = EDITORIAL_ARTICLES.find((a) => a.presents?.component === component);
  return home?.presents?.release ?? kebab(component);
}

/** A component's releases, newest first */
export function releasesOf(component: string): Release[] {
  const prefix = releasePrefixOf(component);
  return allReleases().filter((r) => r.prefix === prefix);
}

/** The component a release ships, and the article to try it on, if one is paired */
export function componentOfRelease(release: Release): { component: string; href: string | null; unpppType?: string } | null {
  const home = EDITORIAL_ARTICLES.find(
    (a) => a.presents && (a.presents.release ?? kebab(a.presents.component)) === release.prefix
  );
  if (!home?.presents) return null;
  return { component: home.presents.component, href: home.published ? `/article/${home.slug}` : null, unpppType: home.unpppType };
}

/** A repo's releases, the newest of each prefix */
export function latestReleasesOfRepo(repo: string): Release[] {
  return allReleases().filter((r) => r.latest && r.repo === repo);
}

/** Where a release lives on the site: its place on /releases (the page scrolls to it) */
export function releaseHref(release: Release): string {
  return `/releases?mention=${encodeURIComponent(release.name.toLowerCase())}`;
}

export const fileSize = (bytes: number) => (bytes < 1024 ? `${bytes} B` : `${Math.round(bytes / 1024)} KB`);

/**
 * The notes as written, minus what's only for the repo: the title line a page
 * already shows, and the commit, author and date lines. A link to a file the
 * site serves points at the site's copy; any other link into the owner's
 * repos (private, so a 404 for everyone else) keeps its words only
 */
export function publicNotes(release: Release): string {
  const served = new Map(release.files.map((f) => [f.name, f.url]));
  const repoLink = new RegExp(`\\[([^\\]]+)\\]\\((https://github\\.com/${SITE_GITHUB}/[^)\\s]+)\\)`, 'gi');
  return release.notes
    .split('\n')
    .filter((line, i) => !(i < 3 && /^#{1,3}\s/.test(line)) && !/^\*\*(commit|updated by|date)\*\*:/i.test(line.trim()))
    .join('\n')
    .replace(repoLink, (_, text: string, url: string) => {
      const file = served.get(url.split('/').pop() ?? '');
      return file ? `[${text}](${file})` : text;
    })
    .trim();
}

/**
 * What a release does, in its notes' first plain sentence run: headings are
 * skipped, a block stops at its first list line, and lines that only point
 * somewhere ("Full docs: …") or label a field ("**Version**: …") don't count
 */
export function releaseSummary(release: Release): string {
  const blocks = publicNotes(release).split(/\n\s*\n/);
  for (const block of blocks) {
    const lines: string[] = [];
    for (const raw of block.split('\n')) {
      const line = raw.trim();
      if (!line || /^#{1,6}\s/.test(line)) continue;
      if (/^(-|\*\s|\||`|>|\d+\.|\.\/|\$\s)/.test(line)) break;
      // A field, not a description ("**Changes**: …", "Release Date: …")
      if (/^(\*\*[^*]+\*\*|[A-Z][\w ]{0,24}):\s/.test(line)) continue;
      lines.push(line);
    }
    const text = lines
      .join(' ')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/\*\*/g, '')
      .replace(/\s+/g, ' ')
      .replace(/\.?:$/, '.')
      .trim();
    if (!text || /^(full docs|docs|see|read more)\b/i.test(text) || /^[\w ]+:\s*\S+$/.test(text)) continue;
    return text.length > 220 ? `${text.slice(0, 217).replace(/\s+\S*$/, '')}…` : text;
  }
  return '';
}

/**
 * A release's own name, as a tool: no emoji, no tag or version, no subtitle
 * after a dash, no leading repo name ("TheUnpartyRunway Foundation Labels" →
 * "Foundation Labels")
 */
export function releaseToolName(release: Release): string {
  const name = release.name
    .replace(/\p{Extended_Pictographic}|\uFE0F/gu, '')
    .replace(new RegExp(`\\s*${release.tag}\\b.*$`, 'i'), '')
    .replace(/\s+v?\d+(\.\d+)+\b.*$/i, '')
    .replace(/\s+-\s+.*$/, '')
    .replace(new RegExp(`^${release.repo}\\s+`, 'i'), '')
    .trim();
  return name || release.prefix;
}
