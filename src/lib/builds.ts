import { BRAND_COLORS, FOUNDER, SITE_TAGLINE, SITE_TITLE, SITE_URL } from '@/app/constants/organization';
import { listFounderProjects } from '@/lib/projects';
import { UPSTREAM } from '@/lib/site-address';
import { resolveCoverSrc } from '@/app/utils/coverPath';
import pkg from '../../package.json';

/**
 * Tell unparty you built yours (#589): a copy's owner tells unparty.app their
 * site is live, once and only by choice, and it's counted as a build. A copy
 * never reports home on its own (software you own, #1096).
 *
 * The card is only what the copy already shows the world (FoundersConfig):
 * its name, address, tagline, brand colors, cover, and its projects' names
 * and kinds, with the version it runs. No keys, no visitor data. unparty.app
 * fetches it back from the copy (GET /api/build) before counting it, which
 * proves the site is live and is a copy.
 */

export { UPSTREAM };

const host = (url: string) => {
  try {
    return new URL(url).host.replace(/^www\./, '');
  } catch {
    return '';
  }
};

/** This site is unparty.app itself: it receives builds rather than telling one */
export const RECEIVES_BUILDS = host(SITE_URL) === host(UPSTREAM);

export interface BuildCard {
  name: string;
  url: string;
  tagline: string;
  colors: string[];
  cover?: string; // An absolute URL
  projects: Array<{ name: string; type?: string }>;
  version: string;
}

/** The card this copy shows unparty.app: only what it already shows everyone */
export function buildCard(): BuildCard {
  const cover = FOUNDER.cover ? resolveCoverSrc(FOUNDER.cover) : undefined;
  return {
    name: SITE_TITLE,
    url: SITE_URL,
    tagline: SITE_TAGLINE,
    colors: BRAND_COLORS,
    ...(cover ? { cover: cover.startsWith('http') ? cover : `${SITE_URL}${cover}` } : {}),
    projects: listFounderProjects().map((p) => ({ name: p.name ?? p.id, ...(p.type ? { type: p.type } : {}) })),
    version: pkg.version,
  };
}

const HEX = /^#[0-9a-f]{6}$/i;

/**
 * A card as unparty.app accepts it, fetched back from a copy: its fields
 * trimmed to what a card shows, or null when it isn't one, or when it claims
 * an address other than the one it was fetched from
 */
export function readCard(value: unknown, origin: string): BuildCard | null {
  const v = value as Partial<BuildCard> | null;
  if (!v || typeof v.name !== 'string' || typeof v.url !== 'string' || host(v.url) !== host(origin)) return null;
  const text = (s: unknown, max: number) => (typeof s === 'string' ? s.slice(0, max) : '');
  return {
    name: text(v.name, 80),
    url: origin,
    tagline: text(v.tagline, 160),
    colors: Array.isArray(v.colors) ? v.colors.filter((c): c is string => typeof c === 'string' && HEX.test(c)).slice(0, 5) : [],
    ...(typeof v.cover === 'string' && /^https:\/\//.test(v.cover) ? { cover: v.cover.slice(0, 500) } : {}),
    projects: Array.isArray(v.projects)
      ? v.projects.slice(0, 50).flatMap((p) => (p && typeof p.name === 'string' ? [{ name: p.name.slice(0, 60), ...(typeof p.type === 'string' ? { type: p.type.slice(0, 30) } : {}) }] : []))
      : [],
    version: text(v.version, 30),
  };
}
