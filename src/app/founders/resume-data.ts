/**
 * The founder's resume at /founders: what a visitor deciding whether to back,
 * hire or buy from this founder would want to see, computed from this copy of
 * the site, so it describes whoever owns it. getFounderResume() gathers it;
 * resumeToArticle() lays it out as an EditorialArticle (the way
 * problemToArticle does for a problem), so it reads like every other article.
 *
 * - SHIPPED. and NEXT.: the published articles, stories and component homes
 *   the founder (or the site) is credited on, dated by the stamped
 *   started-at / updated dates. Content files, so no database is needed.
 * - WORK.: the articles and components named in FoundersConfig
 *   `founder.resume`, in that order.
 * - BUILDING.: FoundersConfig `projects`.
 * - MOMENTUM.: the SETUP. / MAKE. steps FOUNDER_USER_ID finished.
 * - STACK.: what the copy costs to run (FoundersConfig `stack`).
 * - VIEWS.: the analytics drain, only with `founder.resume.views` on.
 *
 * Every database read falls back to null, so `next build` prerenders the page
 * without a database and ISR fills it in (#761).
 */
import 'server-only';
import storiesManifest from '@/data/storiesManifest.json';
import StorySchema from '@/utils/StorySchema';
import { prisma } from '@/lib/prisma';
import { VercelAnalyticsQueries } from '@/lib/vercel-analytics-queries';
import { getPublishedEditorialArticles } from '@/app/constants/editorial-articles/registry';
import type { EditorialArticle, EditorialSection } from '@/app/constants/editorial-articles/types';
import { getAuthorDisplayName } from '@/app/constants/authors';
import { resolveCoverSrc } from '@/app/utils/coverPath';
import { focusData } from '@/lib/focus';
import { BRAND_COLORS, FOUNDER, FOUNDER_CTA, FOUNDER_RESUME, OWNER_STACK, SITE_NAME, SITE_TITLE } from '@/app/constants/organization';
import { builderShows } from '@/lib/builder-shows';
import { getDependItems, monthlyCost } from '@/utils/dependCosts';
import { type PathStage, type StackLine, type TimelineMonth, type TimelineSeries, type ViewsData, type WordCount } from '@/app/components/resume/types';
import { getWordCounts } from '@/lib/word-counts';
import { listFounderProjects, projectStage } from '@/lib/projects';
import { startingPoints } from '@/lib/path-recommendations';
import { ownerLlmConfigured } from '@/lib/llm';
import { COMPONENT_NAMES, componentLabel, type ComponentName } from '@/lib/component-portfolio';

export type ResumePieceKind = 'article' | 'story' | 'component';

export interface ResumePiece {
  kind: ResumePieceKind;
  slug: string;
  title: string;
  description?: string;
  href: string;
  cover?: string;
  created: string; // YYYY-MM-DD
  updated: string; // YYYY-MM-DD, the created date when never updated
  labels: string[]; // What an area can match, lowercased: its category, tags and kind
}

/** A picked component, shown by its home article: where it works and how to make it yours */
export interface ResumeComponent {
  name: string;
  label: string; // 'Brand Palette'
  href: string;
  blurb?: string;
  cover?: string;
  color?: string; // The home's coverColor, when it has no photo
}

export interface ResumeProject {
  id: string;
  name: string;
  tagline?: string;
  description?: string;
  need?: string; // The gap it was built to close, in the owner's words
  cover?: string;
  color?: string;
  href?: string;
  stage: PathStage;
  leadsTo: string[];
}

export interface FounderResumeData {
  shipped: { pieces: number; first: string | null; months: TimelineMonth[] };
  work: { pieces: ResumePiece[]; components: ResumeComponent[] };
  building: ResumeProject[];
  effort: TimelineSeries[]; // One line per founder.resume area that has work in it
  words: WordCount[]; // The founder's most used words, stories and articles together
  momentum: { steps: number; months: TimelineMonth[] } | null;
  stack: { monthly: number; lines: StackLine[] } | null;
  views: ViewsData | null;
  next: ResumePiece[];
  mostRead: ResumePiece | null; // The founder's piece with the most pageviews in thirty days
}

const DAY_MS = 24 * 60 * 60 * 1000;

// How many of the founder's words WORDS. shows
const WORDS_SHOWN = 40;

const ymd = (value: string | undefined | null): string | null => {
  if (!value) return null;
  const match = /^\d{4}-\d{2}-\d{2}/.exec(value);
  if (match) return match[0];
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
};

// The founder's own work: credited to them or to the site. A copy's example
// content credited to someone else never counts as the owner's
const ownNames = new Set([FOUNDER.name, SITE_NAME].map(name => name.toLowerCase()));
const isOwn = (author: string | undefined) => !!author && ownNames.has(getAuthorDisplayName(author).toLowerCase());

const labelsOf = (kind: ResumePieceKind, category?: string, tags: string[] = []) =>
  [kind, category ?? '', ...tags].filter(Boolean).map(label => label.toLowerCase());

function articlePiece(article: EditorialArticle): ResumePiece | null {
  const created = ymd(article.startedAt) ?? ymd(article.date);
  if (!created) return null;
  return {
    kind: article.presents ? 'component' : 'article',
    slug: article.slug,
    title: article.title,
    description: article.subtitle || article.description,
    href: `/${article.sourceRoute ?? 'article'}/${article.slug}`,
    cover: article.coverImage,
    created,
    updated: ymd(article.updated) ?? created,
    labels: labelsOf(article.presents ? 'component' : 'article', article.category, article.tags),
  };
}

export async function storyPieces(): Promise<ResumePiece[]> {
  const slugToCoverId = storiesManifest.slugToCoverId as Record<string, string>;
  const pieces = await Promise.all(
    storiesManifest.published.map(async (slug): Promise<ResumePiece | null> => {
      const coverId = slugToCoverId[slug];
      const story = coverId ? await StorySchema.getStoryByCoverId(coverId) : null;
      if (!story?.metadata.published || !isOwn(story.metadata.author)) return null;
      const created = ymd(story.metadata['started-at']) ?? ymd(story.metadata.date);
      if (!created) return null;
      return {
        kind: 'story',
        slug,
        title: story.metadata.title,
        description: story.metadata.subtitle || story.metadata.description,
        href: `/story/${slug}`,
        cover: resolveCoverSrc(story.metadata.cover || coverId),
        created,
        updated: ymd(story.metadata['updated-at']) ?? created,
        labels: labelsOf('story', story.metadata.category),
      };
    })
  );
  return pieces.filter((piece): piece is ResumePiece => piece !== null);
}

/** Month buckets from the first dated item to the last, with running totals */
export function toTimeline(dates: string[]): TimelineMonth[] {
  if (dates.length === 0) return [];
  const byMonth = new Map<string, number>();
  for (const date of dates) byMonth.set(date.slice(0, 7), (byMonth.get(date.slice(0, 7)) ?? 0) + 1);
  const sorted = [...byMonth.keys()].sort();
  const months: TimelineMonth[] = [];
  let [year, month] = sorted[0].split('-').map(Number);
  const last = sorted[sorted.length - 1];
  let total = 0;
  for (;;) {
    const key = `${year}-${String(month).padStart(2, '0')}`;
    const count = byMonth.get(key) ?? 0;
    total += count;
    months.push({ month: key, count, total });
    if (key === last) break;
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return months;
}

function resumeComponents(articles: EditorialArticle[]): ResumeComponent[] {
  return (FOUNDER_RESUME.components ?? []).flatMap(name => {
    const home = articles.find(article => article.presents?.component === name);
    if (!home || !(COMPONENT_NAMES as readonly string[]).includes(name)) return [];
    return [{
      name,
      label: componentLabel(name as ComponentName),
      href: `/${home.sourceRoute ?? 'article'}/${home.slug}`,
      blurb: home.subtitle || home.description,
      cover: home.coverImage,
      color: home.coverColor,
    }];
  });
}

async function momentum(): Promise<FounderResumeData['momentum']> {
  const userId = process.env.FOUNDER_USER_ID;
  if (!userId) return null;
  try {
    const rows = await prisma.userStepProgress.findMany({
      where: { userId, completed: true, completedAt: { not: null } },
      select: { completedAt: true },
    });
    if (rows.length === 0) return null;
    return {
      steps: rows.length,
      months: toTimeline(rows.map(row => row.completedAt!.toISOString().slice(0, 10))),
    };
  } catch {
    return null;
  }
}

/**
 * The founder's own piece people read most in the last thirty days, matched by
 * its link among the most viewed paths. Only which piece, never how many
 * views, so it shows without founder.resume.views
 */
async function mostRead(pieces: ResumePiece[]): Promise<ResumePiece | null> {
  const end = new Date();
  try {
    const top = await VercelAnalyticsQueries.getTopPages(new Date(end.getTime() - 30 * DAY_MS), end, 200);
    const byHref = new Map(pieces.map(piece => [piece.href, piece]));
    for (const page of top) {
      const piece = byHref.get(page.path);
      if (piece) return piece;
    }
    return null;
  } catch {
    return null;
  }
}

async function views(): Promise<FounderResumeData['views']> {
  if (!FOUNDER_RESUME.views) return null;
  const end = new Date();
  const start = new Date(end.getTime() - 30 * DAY_MS);
  try {
    const [rows, visitors, top] = await Promise.all([
      prisma.vercelPageview.findMany({
        where: { timestamp: { gte: BigInt(start.getTime()), lte: BigInt(end.getTime()) } },
        select: { timestamp: true },
        take: 100_000,
      }),
      VercelAnalyticsQueries.getUniqueVisitors(start, end),
      VercelAnalyticsQueries.getTopPages(start, end, 5),
    ]);
    if (rows.length === 0) return null;
    const days = Array.from({ length: 30 }, () => 0);
    for (const row of rows) {
      const index = Math.floor((Number(row.timestamp) - start.getTime()) / DAY_MS);
      if (index >= 0 && index < 30) days[index] += 1;
    }
    return { visitors, pageviews: rows.length, days, top };
  } catch {
    return null;
  }
}

function stack(): FounderResumeData['stack'] {
  const entries = Object.entries(OWNER_STACK);
  if (entries.length === 0) return null;
  const items = new Map(getDependItems().map(item => [item.id, item]));
  const lines = entries
    .map(([id, entry]) => ({
      id,
      name: items.get(id)?.name ?? id,
      plan: entry.plan,
      monthly: monthlyCost(entry.cost, entry.payFrequency),
    }))
    .sort((a, b) => b.monthly - a.monthly);
  return { monthly: lines.reduce((sum, line) => sum + line.monthly, 0), lines };
}

export async function getFounderResume(): Promise<FounderResumeData> {
  const articles = getPublishedEditorialArticles();
  const own = articles.filter(article => isOwn(article.author)).map(articlePiece).filter((piece): piece is ResumePiece => piece !== null);
  const pieces = [...own, ...(await storyPieces())];

  const bySlug = new Map(pieces.map(piece => [piece.slug, piece]));
  const created = pieces.map(piece => piece.created).sort();

  const [momentumData, viewsData, mostReadPiece, words] = await Promise.all([momentum(), views(), mostRead(pieces), getWordCounts('both', WORDS_SHOWN)]);

  return {
    shipped: {
      pieces: pieces.length,
      first: created[0] ?? null,
      months: toTimeline(pieces.map(piece => piece.created)),
    },
    work: {
      pieces: (FOUNDER_RESUME.articles ?? []).flatMap(slug => bySlug.get(slug) ?? []),
      components: resumeComponents(articles),
    },
    building: listFounderProjects().map(project => ({
      id: project.id,
      name: project.name,
      tagline: project.tagline,
      need: project.need,
      description: project.description ?? undefined,
      cover: project.cover ? resolveCoverSrc(project.cover) : undefined,
      color: project.color,
      // A project's id is its page on this site (./create-page, or a page it extends)
      href: `/${project.id}`,
      stage: projectStage(project),
      leadsTo: project.leadsTo ?? [],
    })),
    effort: (FOUNDER_RESUME.areas ?? []).flatMap(area => {
      const match = new Set(area.match.map(label => label.toLowerCase()));
      const dates = pieces.filter(piece => piece.labels.some(label => match.has(label))).map(piece => piece.created);
      return dates.length > 0 ? [{ name: area.name, ...(area.color ? { color: area.color } : {}), months: toTimeline(dates) }] : [];
    }),
    words,
    momentum: momentumData,
    mostRead: mostReadPiece,
    stack: stack(),
    views: viewsData,
    next: [...pieces].sort((a, b) => b.updated.localeCompare(a.updated)).slice(0, 3),
  };
}

// ── The resume as an article ─────────────────────────────────

export const monthYear = (date: string) =>
  new Date(`${date.slice(0, 7)}-15T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }).toLowerCase();

export const plural = (count: number, one: string, many: string) => `${count.toLocaleString('en-US')} ${count === 1 ? one : many}`;

export const dollars = (value: number) => `$${Math.round(value).toLocaleString('en-US')}`;

// Steady output: at least this many pieces within this many months. The
// timeline starts at the first month that begins such a stretch; anything
// earlier is a note, so one stray early piece doesn't flatten the line
const STEADY_PIECES = 3;
const STEADY_MONTHS = 6;

// Below this many finished steps, MOMENTUM. is a quiet line under NEXT.
// rather than a chapter: a chart of two steps undersells the work it shows
export const MOMENTUM_STEPS = 6;

/** Where steady output starts: the index of its first month (0 when it never settles) */
function steadyStart(months: TimelineMonth[]): number {
  for (let index = 0; index < months.length; index++) {
    const window = months.slice(index, index + STEADY_MONTHS).reduce((sum, month) => sum + month.count, 0);
    if (window >= STEADY_PIECES && months[index].count > 0) return index;
  }
  return 0;
}

/** A chapter's opening: its hand-drawn icon as the hero (the word too with founder.resume.labels) */
export const chapter = (id: string, label: string, icon: string): EditorialSection => ({
  id,
  type: 'hero',
  content: label,
  metadata: { icon, iconOnly: FOUNDER_RESUME.labels !== true },
});

/** A chapter's one line: the sentence that carries its number */
export const line = (id: string, content: string): EditorialSection => ({ id, type: 'heading', content, metadata: { line: true } });

export const paragraph = (id: string, content: string, size?: 'large'): EditorialSection => ({
  id,
  type: 'paragraph',
  content,
  metadata: { dropCap: false, ...(size ? { size } : {}) },
});

/** The house circle-then-text row, linked */
export const row = (id: string, content: string, href?: string, avatar?: string): EditorialSection => ({
  id,
  type: 'personal',
  content,
  metadata: { ...(avatar ? { avatar } : {}), ...(href ? { storyLink: href } : {}) },
});

export const component = (id: string, componentName: string, componentProps: Record<string, unknown>): EditorialSection => ({
  id,
  type: 'component',
  metadata: { componentName, componentProps },
});

type Card = NonNullable<NonNullable<EditorialSection['metadata']>['articleCards']>[number];

export const cardsRow = (id: string, cards: Card[]): EditorialSection => ({
  id,
  type: 'scrollRow',
  metadata: { scrollRowType: 'articles', maxItems: cards.length, articleCards: cards },
});

const pieceCard = (piece: ResumePiece): Card => ({ href: piece.href, cover: piece.cover, title: piece.title, subtitle: piece.description });

/** The founder's charts, by name: what /founders shows and /api/resume serves */
export const CHART_PARTS = ['shipped', 'effort', 'momentum', 'stack', 'views', 'path', 'focus'] as const;
export type ChartPart = (typeof CHART_PARTS)[number];

/** Which ink chart draws each part */
export const CHART_COMPONENT: Record<ChartPart, string> = {
  shipped: 'InkTimeline',
  effort: 'InkTimeline',
  momentum: 'InkTimeline',
  stack: 'StackLedger',
  views: 'ViewsChart',
  path: 'InkPath',
  focus: 'RepoFocus',
};

/**
 * One chart's props from the resume, or null when it has nothing to show.
 * The one place a chart's data is shaped, so /founders and any article
 * embedding the chart by name (componentProps: { source }) always agree
 */
export function chartProps(resume: FounderResumeData, part: ChartPart): Record<string, unknown> | null {
  switch (part) {
    case 'shipped': {
      if (resume.shipped.pieces === 0) return null;
      const months = resume.shipped.months.slice(steadyStart(resume.shipped.months));
      return { months, label: `${resume.shipped.pieces} pieces published, month by month` };
    }
    case 'effort':
      return resume.effort.length > 0
        ? { series: resume.effort, label: `Work by area, month by month: ${resume.effort.map(area => area.name).join(', ')}` }
        : null;
    case 'momentum':
      return resume.momentum ? { months: resume.momentum.months, label: `${resume.momentum.steps} steps finished, month by month` } : null;
    case 'stack':
      return resume.stack ? { lines: resume.stack.lines } : null;
    case 'views':
      return resume.views ? { days: resume.views.days, top: resume.views.top } : null;
    case 'path':
      return resume.building.length > 0
        ? {
            label: `${resume.building.length} projects by stage, and where each leads`,
            // The starting points the projects suit, for NextStep's chooser (#624)
            startingPoints: startingPoints(),
            // Whether the owner has a model, so anyone can say where they start in their own words
            canMatch: ownerLlmConfigured(),
            stops: resume.building.map(project => ({
              id: project.id,
              name: project.name,
              stage: project.stage,
              // Why it was built (its `need`), else what it is
              ...(project.need || project.tagline || project.description ? { tagline: project.need || project.tagline || project.description } : {}),
              ...(project.cover ? { cover: project.cover } : {}),
              ...(project.color ? { color: project.color } : {}),
              ...(project.href ? { href: project.href } : {}),
              leadsTo: project.leadsTo,
            })),
          }
        : null;
    case 'focus':
      // Measured from the owner's repos at build (src/lib/focus.ts), not the resume
      return focusData() as Record<string, unknown> | null;
  }
}

/** A chart as a component section, from its part */
export const chartSection = (id: string, resume: FounderResumeData, part: ChartPart): EditorialSection[] => {
  const props = chartProps(resume, part);
  return props ? [component(id, CHART_COMPONENT[part], props)] : [];
};

/**
 * The resume laid out as an article: the person (#1650). The charts of the
 * work (SHIPPED., EFFORT., MOMENTUM., STACK., VIEWS.) live on /build
 * (src/lib/build-story.ts), which a row here leads to.
 *
 * 1. Who: the founder's thesis, bio and links, then the piece people read most.
 *    BUILDER.: what the work shows about them, each strength linked to its
 *    chart (src/lib/builder-shows.ts, #561).
 * 2. WORK.: the pieces to start with, articles and the components' homes in
 *    one row of cards.
 * 3. WORDS. (what they keep coming back to), BUILDING. (where each project
 *    stands and leads): one chapter each, when there is enough to show. The
 *    ask closes BUILDING., under the path, with the way to the work.
 * 4. NEXT.: what changed lately.
 */
export function resumeToArticle(resume: FounderResumeData): EditorialArticle {
  const { shipped, work, building, next } = resume;
  const sections: EditorialSection[] = [];

  // 1. Who: thesis, bio and links, then the piece people read most
  if (FOUNDER_RESUME.thesis) sections.push(line('thesis', FOUNDER_RESUME.thesis));
  if (FOUNDER.bio) sections.push(paragraph('bio', FOUNDER.bio, 'large'));
  for (const link of FOUNDER.links) sections.push(row(`link-${link.label.toLowerCase()}`, `${link.label} →`, link.url));
  if (resume.mostRead) {
    const piece = resume.mostRead;
    sections.push(row('most-read', `most read: **${piece.title}**`, piece.href, piece.cover ?? (FOUNDER.cover ? resolveCoverSrc(FOUNDER.cover) : undefined)));
  }

  // BUILDER.: what the work shows, each card a strength linked to its chart
  // (src/lib/builder-shows.ts), on the owner's brand colors
  const shows = builderShows(resume);
  if (shows.cards.length > 0) {
    sections.push(
      chapter('builder', 'BUILDER.', 'Sparkles'),
      ...(shows.worth ? [line('builder-line', shows.worth)] : []),
      cardsRow('builder-row', shows.cards.map((card, i) => ({ ...card, color: BRAND_COLORS.length ? BRAND_COLORS[i % BRAND_COLORS.length] : 'theme' })))
    );
  }

  // 2. WORK.: articles first, then the components' homes, in one row
  const cards = [
    ...work.pieces.map(pieceCard),
    ...work.components.map(picked => ({ href: picked.href, cover: picked.cover, color: picked.color, title: picked.label, subtitle: picked.blurb })),
  ];
  if (cards.length > 0) {
    sections.push(
      chapter('work', 'WORK.', 'Layers'),
      line('work-line', 'start here.'),
      cardsRow('work-row', cards)
    );
  }

  // 3. One chapter per part with enough to show
  // The words the founder keeps coming back to
  if (resume.words.length > 0) {
    sections.push(
      chapter('words', 'WORDS.', 'MessageCircle'),
      component('words-field', 'InkWords', { words: resume.words, from: 'both', limit: WORDS_SHOWN }),
      // The founder's doubts and where they surface in this writing; renders
      // only for the founder signed in (DoubtsCloud), nothing for visitors
      component('doubts-cloud', 'DoubtsCloud', {})
    );
  }

  // Where each project stands and where it leads
  if (building.length > 0) {
    sections.push(
      chapter('building', 'BUILDING.', 'Hammer'),
      ...(startingPoints().length > 0 ? [line('building-line', 'where are you starting from?')] : []),
      // With starting points to choose from, the path asks where someone is starting (NextStep)
      ...chartSection('building-path', resume, 'path').map(section =>
        startingPoints().length > 0 ? { ...section, metadata: { ...section.metadata, componentName: 'NextStep' } } : section
      )
    );
    // Under the path, the founder's one ask (founder.cta), as the house card
    if (FOUNDER_CTA) sections.push(component('building-ask', 'BuildYours', { placement: 'founders-building' }));
  }
  // The work itself, measured, lives on /build
  sections.push(row('the-work', 'see the work: where the hours go, when, and what shipped →', '/build'));

  // 4. NEXT.: lately
  if (next.length > 0) {
    sections.push(chapter('next', 'NEXT.', 'Sailboat'), line('next-line', 'lately.'), cardsRow('next-row', next.map(piece => ({ ...pieceCard(piece), subtitle: `updated ${monthYear(piece.updated)}.` }))));
  }

  return {
    slug: 'founders',
    title: FOUNDER.name,
    subtitle: [FOUNDER.title, `${FOUNDER.role}, ${SITE_TITLE}`].filter(Boolean).join(' '),
    description: FOUNDER.summary,
    category: 'FOUNDER.',
    date: shipped.first ?? new Date().toISOString().slice(0, 10),
    published: true,
    author: FOUNDER.name,
    authorImage: FOUNDER.image ? (FOUNDER.image.startsWith('/') ? FOUNDER.image : `/${FOUNDER.image}`) : undefined,
    cover: FOUNDER.cover,
    sections,
  };
}
