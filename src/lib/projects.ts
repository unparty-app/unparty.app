/**
 * Projects a page can show and sell, from two files with the same entry shape:
 *
 * - src/data/FoundersConfig.json `projects`: the site owner's own projects.
 *   A buyer's copy adds theirs here (see /article/setup-payments).
 * - src/data/UnpppsConfig.json `unppps`: unparty's 49 unppps.
 *
 * A project's `id` is also its page's first URL segment (`/my-project`).
 * FoundersConfig is checked first, so an owner's project wins over an unppp
 * with the same id.
 */
import UnpppsConfig from '@/data/UnpppsConfig.json';
import { CHECKOUT_ON, FOUNDER_PROJECTS } from '@/app/constants/organization';

export interface ProjectEntry {
  id: string;
  name: string;
  // A Polar product ID. Set it to sell the project from its page
  polarProductId?: string | null;
  description?: string | null;
  tagline?: string;
  cover?: string;
  color?: string;
  url?: string;
  // Its repository on GitHub: its releases show on its page (src/lib/releases.ts)
  gh?: string | null;
  // Which kind of build it is (UnpppTypesConfig.json: app, agent, service…):
  // it joins that type's hub at /unppp/<type>
  type?: string;
  // Where it stands: idea, building, shipped or selling (/founders' path).
  // Missing: selling with a polarProductId, building without
  stage?: string;
  // Ids of the projects someone moves on to from this one
  leadsTo?: string[];
  // The gap it was built to close, in a line in the owner's words ("my
  // palettes lived in five apps"): /founders' path says it under the
  // project, so the path reads as each build answering the last (#561, #620)
  need?: string;
  // The starting points this project suits ("a brand", "a journal"): each
  // becomes a choice in "where are you starting from?", which recommends it
  startsFrom?: string[];
  // The portfolio components it's built from (COMPONENT_NAMES): its page
  // shows them as a "built from." row, each card leading to that component's
  // article. An unknown name, or one without a published article, is left out
  components?: string[];
}

export type ProjectSource = 'founder' | 'unppp';

export interface ResolvedProject extends ProjectEntry {
  source: ProjectSource;
}

const UNPPPS = UnpppsConfig.unppps as ProjectEntry[];

// An owner's project whose id the site already knows extends that record
// rather than replacing it: what the owner writes (a stage, where it leads,
// a shorter name) wins, and everything else (its cover, its page, its Polar
// product) carries over, so adding a project to FoundersConfig never takes
// anything away from its page
// (it stays an unppp to its page, so the page keeps showing what it showed)
const FOUNDER_RESOLVED: ResolvedProject[] = FOUNDER_PROJECTS.map((project) => {
  const known = UNPPPS.find((entry) => entry.id === project.id);
  return { ...known, ...project, source: known ? ('unppp' as const) : ('founder' as const) };
});

const PROJECTS: ResolvedProject[] = [
  ...FOUNDER_RESOLVED,
  ...UNPPPS.map((project) => ({ ...project, source: 'unppp' as const })),
];

/** The owner's own projects (FoundersConfig), each with what it extends filled in */
export function listFounderProjects(): ResolvedProject[] {
  return FOUNDER_RESOLVED;
}

// Every project once, FoundersConfig first: an unppp whose id an owner's
// project already uses is left out, as findProjectById would never reach it
export function listProjects(): ResolvedProject[] {
  const seen = new Set<string>();
  return PROJECTS.filter((project) => !seen.has(project.id) && seen.add(project.id));
}

export function findProjectById(id: string): ResolvedProject | undefined {
  return PROJECTS.find((project) => project.id === id);
}

export function findProjectByProductId(productId: string): ResolvedProject | undefined {
  return PROJECTS.find((project) => project.polarProductId === productId);
}

const STAGES = ['idea', 'building', 'shipped', 'selling'] as const;

/** Where a project stands: its own stage, or selling with a Polar product
 * while checkout is on (FoundersConfig `checkout`), building otherwise */
export function projectStage(project: ProjectEntry): (typeof STAGES)[number] {
  return (STAGES as readonly string[]).includes(project.stage ?? '')
    ? (project.stage as (typeof STAGES)[number])
    : project.polarProductId && CHECKOUT_ON ? 'selling' : 'building';
}
