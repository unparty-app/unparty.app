/**
 * Site-wide identity: who publishes this site and who founded it. Reused
 * across page metadata, the footer, OG images, Article structured data
 * (schema.org Organization) and the /founders page.
 *
 * The values live in src/data/FoundersConfig.json, the one file a site owner
 * fills in (see /article/setup-identity). This module keeps the typed exports
 * the rest of the code imports. Google requires the publisher logo to be a
 * raster image with real pixel dimensions, not an SVG.
 */
import foundersConfig from '@/data/FoundersConfig.json';
import type { ProjectEntry } from '@/lib/projects';
import type { OwnerStackEntry } from '@/utils/dependCosts';
import type { Baseline } from '@/lib/baseline';
import type { AnswerSlot } from '@/lib/answer-slots';
import { resolveSiteUrl } from '@/lib/site-address';

export interface FounderLink {
  label: string;
  url: string;
}

export interface SiteWidget {
  id: string;
  label: string;
  title: string;
  /** A lucide icon name from src/app/components/widgetRegistry.ts */
  icon: string;
  src: string;
}

export interface FounderCta {
  label: string;
  href: string;
  pitch?: string;
}

export interface FounderResume {
  /** Article or story slugs shown in WORK., in this order */
  articles?: string[];
  /** Component names (src/lib/component-portfolio.ts) embedded live in WORK.,
   * each with the props from its home article */
  components?: string[];
  /** Chapters show their hand-drawn icon; true adds the word beside it */
  labels?: boolean;
  /** Show VIEWS.: visitors and top pages from the analytics drain. Off when
   * missing, since traffic is the owner's to share */
  views?: boolean;
  /** The founder's own one-sentence case for their work: it opens the page,
   * and the charts under it are its evidence. Hidden when missing */
  thesis?: string;
  /** The areas the founder's work falls into, for EFFORT.: one line each.
   * A piece counts toward an area when its category, one of its tags or its
   * kind (article, story, component) matches, ignoring case */
  areas?: Array<{ name: string; match: string[]; color?: string }>;
}

export interface FoundersConfig {
  site: {
    name: string;
    title: string;
    tagline: string;
    headline: string;
    description: string;
    url: string;
    legalName: string;
    github: string;
    logo: { path: string; width: number; height: number };
  };
  founder: {
    name: string;
    role: string;
    title: string;
    image: string;
    initials: string;
    cover: string;
    bio: string;
    summary: string;
    links: FounderLink[];
    /** The one thing /founders asks a visitor to do: a label, where it goes
     * (a site path, https:// or mailto:), and an optional sentence of the
     * founder's own that links there from the closing NEXT. chapter */
    cta?: FounderCta;
    /** The founder's story answering "why build your own?" (a story id,
     * "story-001"): the first story the onboarding asks for, and what /build
     * opens with (#229, #589). Set from the story writer */
    why?: string;
    /** What /founders shows as the founder's resume */
    resume?: FounderResume;
  };
  brandColors: string[];
  /** Whether new sign-ups wait for the owner's approval before /party (a
   * business decision, so it lives here). Off when missing. Toggled from /admin */
  waitlist?: boolean;
  /** Whether projects sell from their pages (Polar). Off, each buy pill
   * becomes the site's "build yours" and /api/checkout refuses. On when missing */
  checkout?: boolean;
  /** The owner's default hand-drawn icons, by role, as icon export names
   * ("Heart"): `poem` carries a poem that names none (PoemWalker), `category`
   * stands in the dock for an article's emoji category (Banner). Picked in
   * /admin (pick your defaults, #589) */
  iconDefaults?: { poem?: string; category?: string };
  /** The owner's words, each tagged with the kind of build it points to
   * ("swift": "app"), one of UnpppTypesConfig's ids. Tagged in /admin → Your
   * words; a worksheet's picked words classify by them (src/lib/word-types.ts) */
  wordTypes?: Record<string, string>;
  /** The owner's answers to the challenge's questions (#265): shown on the
   * steps that ask them and counted with their writing. Public, so nothing
   * they wouldn't publish. Written in /admin → Your answers */
  answers?: Partial<Record<AnswerSlot, string>>;
  /** Whether RepoFocus shows private repos, their names and hours, on the
   * site. Off when missing. Toggled from /admin */
  privateRepos?: boolean;
  // How people can fund the site owner's work: a GitHub Sponsors account and/or
  // a Polar checkout link, shown by SponsorCard. Both optional
  sponsor?: {
    github?: string;
    polarUrl?: string;
    cover?: string;
    pitch?: string;
  };
  // What the site stands for, said once: shown by ValuesBadge on the home row
  // and in the footer. No line, no badge
  values?: {
    label?: string;
    line?: string;
    cover?: string;
  };
  // The owner's own icons, drawn on the icon pad (/admin): an icon's name and
  // its pen strokes on the 24×24 grid. HandDrawnIcon reads them
  icons?: Record<string, string[]>;
  // The site owner's other web apps: where the party page's "ask" button goes,
  // and the widget tray's panels (each an iframe of a URL). Both optional
  apps?: {
    ask?: string;
    widgets?: SiteWidget[];
  };
  // The site owner's own projects, in the same shape as an UnpppsConfig.json
  // entry. Read them through src/lib/projects.ts, not from here
  projects?: ProjectEntry[];
  // What the site owner pays for each service in src/data/DependConfig.json,
  // keyed by its id. Optional; the stack builder shows it beside a new copy's
  // starting cost. Prices for everyone else stay in DependConfig
  // (payFrequency is "month", "year" or "once"; JSON types it as a string)
  stack?: Record<string, Omit<OwnerStackEntry, 'payFrequency'> & { payFrequency: string }>;
  // What a goal's budget is measured against: market pay, LLM cost an hour,
  // and projects with their measured hours (src/lib/baseline.ts)
  baseline?: Baseline;
}

const config: FoundersConfig = foundersConfig;

export const SITE_NAME = config.site.name;
// Browser tab and link-preview title for pages that do not set their own
export const SITE_TITLE = config.site.title;
export const SITE_TAGLINE = config.site.tagline;
// What the site is, after its name in the homepage title
export const SITE_HEADLINE = config.site.headline;
// The site's one public address (no trailing slash). metadataBase, sitemap.xml,
// robots.txt, structured data and canonical/OG URLs all read it;
// NEXT_PUBLIC_BASE_URL, when set, overrides it for canonical/OG URLs only.
// A copy still on unparty's address uses its own on Vercel (src/lib/site-address.ts).
export const SITE_URL = resolveSiteUrl(config.site.url, process.env.PRODUCTION_HOST);
// The site the baseline's hours were measured on, which goes with site.url rather
// than with where a copy happens to run: those hours are unparty's until replaced
export const BASELINE_SITE_HOST = new URL(config.site.url).host.replace(/^www\./, '');
// The name in the footer's copyright line
export const LEGAL_NAME = config.site.legalName;
// Where people reach the owner: the privacy policy and terms ({email})
export const SITE_EMAIL: string = (config.site as { email?: string }).email ?? '';
// The GitHub user or organization whose repositories this site describes
// (/founders shows repo data only for repos owned by it)
export const SITE_GITHUB = config.site.github;
// The public repository people copy this site from ("owner/repo"): the Deploy
// Button and the setup steps read it. Without one, the button doesn't show
const SITE_SOURCE: string = (config.site as { source?: string }).source ?? '';
export const SOURCE_REPO_URL = SITE_SOURCE ? `https://github.com/${SITE_SOURCE}` : '';
export const DEPLOY_URL = SOURCE_REPO_URL ? `https://vercel.com/new/clone?repository-url=${encodeURIComponent(SOURCE_REPO_URL)}` : '';

// The logo's path inside public/, for places that load it from this site
// (the Clerk sign-in card)
export const SITE_LOGO_PATH = config.site.logo.path;

export const ORGANIZATION_LOGO = {
  url: `${SITE_URL}${config.site.logo.path}`,
  width: config.site.logo.width,
  height: config.site.logo.height,
};

export const ORGANIZATION_DESCRIPTION = config.site.description;

export const FOUNDER = config.founder;
export const FOUNDER_RESUME: FounderResume = config.founder.resume ?? {};
/** The founder's "why build your own?" story, as a story id, or null before they write it */
export const FOUNDER_WHY: string | null = /^story-\d+$/.test(config.founder.why ?? '') ? config.founder.why! : null;

// What /founders asks visitors to do. Unset, it falls back to the founder's
// first link (how people reach them), so a new owner's page never sends their
// visitors to unparty's own "build yours"
export const FOUNDER_CTA: FounderCta | null =
  config.founder.cta ??
  (config.founder.links[0] ? { label: config.founder.links[0].label, href: config.founder.links[0].url } : null);

// The founder's profile URLs double as the organization's public presence,
// which is right for a solo-founder site
export const ORGANIZATION_SAME_AS = config.founder.links.map(link => link.url);

// The site owner's palette, up to five. The first is the site's color
// (BRAND_COLOR in colors.ts); all lead the visitor color picker
/** The waitlist is on: src/middleware.ts sends unapproved sign-ups to
 * /waitlist/pending, and worksheets open a review. Off, /party is open to anyone
 * signed in and a worksheet is just the owner's own problem */
export const WAITLIST_ON = config.waitlist === true;

/** Projects sell from their pages: the buy pill opens Polar's checkout. Off,
 * the pill is the site's "build yours" (FOUNDER_CTA) and /api/checkout answers
 * 403, so a price can still show as what the work cost without being for sale */
export const CHECKOUT_ON = config.checkout !== false;

/** The owner's default icons by role ("pick your defaults", #589); {} until they pick */
export const ICON_DEFAULTS: { poem?: string; category?: string } = config.iconDefaults ?? {};

/** The owner's word tags, word → kind of build (#389); {} until they tag any */
export const WORD_TYPES: Record<string, string> = config.wordTypes ?? {};

/** The owner's answers to the challenge's questions (#265); {} until they answer */
export const FOUNDER_ANSWERS: Partial<Record<AnswerSlot, string>> = config.answers ?? {};

/** RepoFocus shows private repos too. Off, the build leaves them out of
 * where the hours went (scripts/generate-focus.mjs, src/lib/focus.ts) */
export const PRIVATE_REPOS_ON = config.privateRepos === true;

export const BRAND_COLORS = config.brandColors.filter(Boolean);
/** All five slots as written, "" for an empty one (the brand color setup edits slots) */
export const BRAND_COLOR_SLOTS: string[] = Array.from({ length: 5 }, (_, i) => config.brandColors[i] ?? '');

export const FOUNDER_PROJECTS: ProjectEntry[] = config.projects ?? [];

// What the site owner pays to run this site, by DependConfig id; empty hides it
// (npm run check:identity checks each entry's payFrequency)
export const OWNER_STACK = (config.stack ?? {}) as Record<string, OwnerStackEntry>;

// What a goal's budget is measured against (src/lib/baseline.ts). A copy
// ships with unparty's; null hides budgets
export const BASELINE: Baseline | null = config.baseline ?? null;

// Where the party page's "ask" button goes; null hides the button
export const ASK_URL: string | null = config.apps?.ask || null;

// The widget tray's panels; empty hides the tray
export const SITE_WIDGETS: SiteWidget[] = config.apps?.widgets ?? [];

export interface SponsorLink {
  label: string;
  href: string;
}

// Where SponsorCard sends people; empty hides the card. Keep .github/FUNDING.yml
// pointing at the same accounts
export const SPONSOR_LINKS: SponsorLink[] = [
  config.sponsor?.github ? { label: 'GitHub', href: `https://github.com/sponsors/${config.sponsor.github}` } : null,
  config.sponsor?.polarUrl ? { label: 'Polar', href: config.sponsor.polarUrl } : null,
].filter((link): link is SponsorLink => link !== null);

export const SPONSOR_COVER = config.sponsor?.cover || config.founder.cover;
export const SPONSOR_PITCH = config.sponsor?.pitch || 'sponsor what comes next.';

// ValuesBadge's words; an empty line hides it everywhere
export const VALUES_LINE = config.values?.line?.trim() || '';
export const VALUES_LABEL = config.values?.label || 'VALUES.';
export const VALUES_COVER = config.values?.cover || config.founder.cover;
