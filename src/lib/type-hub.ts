import UnpppsConfig from '@/data/UnpppsConfig.json';
import UnpppTypesConfig from '@/data/UnpppTypesConfig.json';
import storiesManifest from '@/data/storiesManifest.json';
import { EDITORIAL_ARTICLES } from '@/app/constants/editorial-articles/registry';
import type { UnpppType } from '@/app/constants/editorial-articles/types';
import { typeBelt, type ProjectBelt } from '@/lib/project-belt';
import { FOUNDER_PROJECTS } from '@/app/constants/organization';
import { UNPPP_NAV_ITEMS } from '@/app/constants/unpppNav';
import { getRepositoriesByTypeCategory } from '@/app/utils/unpppDataAdapter';
import { loadStoryRepoMappings } from '@/app/utils/storyRepoMappings';
import { resolveCoverSrc } from '@/app/utils/coverPath';
import { componentLabel, type ComponentName } from '@/lib/component-portfolio';
import { getRepoNameForUnppp } from '@/utils/unppp-repo-mapping';

// A type's hub (/unppp/<type>): everything of one kind of build in one place.
// Projects are the owner's own (FoundersConfig `projects` with that `type`)
// first, then unparty's unppps the builder bot classified that way
// (public/data/unppp-scores.json). Components and articles are the published
// articles tagged `unpppType`; a component's is its home article. Stories are
// the ones that mention a project of that type (story-repo-mappings.json).

export interface HubRow {
  href: string;
  title: string;
  detail?: string;
  // A cover or photo for the row's circle, and its color when there's none
  cover?: string;
  color?: string;
  // A short label on the right ("yours", a date)
  value?: string;
}

export interface RelatedType {
  type: UnpppType;
  color: string;
  definition: string;
}

export interface TypeHub {
  type: UnpppType;
  definition: string;
  // The type's own color (UnpppTypesConfig.json), the hub's accent
  color: string;
  // The other types, for where to go next
  related: RelatedType[];
  projects: HubRow[];
  components: HubRow[];
  articles: HubRow[];
  stories: HubRow[];
  // The quick links under the cover: its projects' count and hours, and the
  // tools released for it (src/lib/project-belt.ts)
  belt: ProjectBelt;
}

export const UNPPP_TYPES = UnpppTypesConfig.types.map((t) => t.id) as UnpppType[];

// The types with a hub at /unppp/<type>: those with a nav item
export const HUB_TYPES = UNPPP_TYPES.filter((type) => UNPPP_NAV_ITEMS.some((item) => item.category === type));

const usable = (value: string | null | undefined) => (value && value !== 'null' ? value.trim() : undefined);
const coverSrc = (cover: string | undefined) => (cover ? resolveCoverSrc(cover) : undefined);

function projectsOf(type: UnpppType): HubRow[] {
  const unppps = new Map(UnpppsConfig.unppps.map((u) => [u.id, u]));
  // An owner's project that points at an unppp takes what it leaves out from it
  const yours: HubRow[] = FOUNDER_PROJECTS.filter((p) => p.type === type).map((p) => {
    const u = unppps.get(p.id);
    return {
      href: `/${p.id}`,
      title: p.name,
      detail: p.tagline || p.description || usable(u?.tagline) || usable(u?.description),
      cover: coverSrc(p.cover ?? usable(u?.cover)),
      color: p.color ?? usable(u?.color),
      value: p.stage ?? 'yours',
    };
  });
  const taken = new Set(yours.map((row) => row.href));
  const classified: HubRow[] = getRepositoriesByTypeCategory(type)
    .filter((repo) => unppps.has(repo.id) && !taken.has(`/${repo.id}`))
    .map((repo) => {
      const u = unppps.get(repo.id)!;
      // The repo's name, as the old hub and the stories name it; its own
      // description under it, unless that's just the name in capitals
      const description = usable(u.description);
      return {
        href: `/${repo.id}`,
        title: getRepoNameForUnppp(repo.id) ?? repo.id,
        detail: description && description.toLowerCase() !== repo.id ? description : usable(u.name),
        cover: coverSrc(usable(u.cover)),
        color: usable(u.color),
      };
    });
  return [...yours, ...classified];
}

function articlesOf(type: UnpppType): { components: HubRow[]; articles: HubRow[] } {
  const tagged = EDITORIAL_ARTICLES.filter((a) => a.published && a.unpppType === type);
  const row = (title: string, a: (typeof tagged)[number]): HubRow => ({
    href: `/article/${a.slug}`,
    title,
    detail: a.subtitle && a.subtitle !== 'TODO.' ? a.subtitle : a.description,
    cover: a.coverImage,
    value: a.category.replace(/\.$/, '').toLowerCase(),
  });
  // A component's home article is a MAKE. article; a SETUP. or brand article
  // that also presents a component (Start Here, the curriculum) is still an article
  const isHome = (a: (typeof tagged)[number]) => Boolean(a.presents) && a.category === 'MAKE.';
  return {
    components: tagged.filter(isHome).map((a) => row(componentLabel(a.presents!.component as ComponentName), a)),
    articles: tagged.filter((a) => !isHome(a)).map((a) => row(a.title.replace(/\.$/, '').toLowerCase(), a)),
  };
}

async function storiesOf(type: UnpppType): Promise<HubRow[]> {
  const { mappings } = await loadStoryRepoMappings();
  const slugs = storiesManifest.coverIdToSlug as Record<string, string>;
  const published = new Set(storiesManifest.published as string[]);
  return Object.entries(mappings)
    .filter(([, m]) => m.mentionsByType[type]?.length)
    .map(([storyId, m]) => {
      const coverId = storyId.replace('story-', 'cover-');
      const slug = slugs[coverId] ?? coverId;
      return { slug, coverId, m };
    })
    .filter(({ slug }) => published.has(slug))
    .sort((a, b) => a.coverId.localeCompare(b.coverId))
    .map(({ slug, coverId, m }) => ({
      href: `/story/${slug}`,
      title: m.title.replace(/\.$/, '').toLowerCase(),
      detail: `mentions ${m.mentionsByType[type].join(', ')}`,
      cover: coverSrc(coverId),
    }));
}

export async function typeHub(type: UnpppType): Promise<TypeHub> {
  const { components, articles } = articlesOf(type);
  const types = UnpppTypesConfig.types as Array<{ id: UnpppType; color: string; description: string }>;
  const own = types.find((t) => t.id === type)!;
  const projects = projectsOf(type);
  return {
    type,
    definition: own.description,
    color: own.color,
    related: types.filter((t) => t.id !== type).map((t) => ({ type: t.id, color: t.color, definition: t.description })),
    projects,
    components,
    articles,
    stories: await storiesOf(type),
    belt: typeBelt(type, projects.map((p) => p.href.replace(/^\//, ''))),
  };
}
