/**
 * Path recommendations (#624): where someone should start, and where they go
 * next, from the site owner's own projects. No model and no keys: every copy
 * gets it.
 *
 * - Each FoundersConfig project can name the starting points it suits
 *   (`startsFrom`: "a brand", "a journal", "my repos").
 * - "Where are you starting from?" offers every starting point, in the order
 *   the projects list them.
 * - A starting point recommends the project that names it, then follows its
 *   `leadsTo`: the next steps, in order, as far as the path goes.
 *
 * An LLM connection, when one is set, can sit on top (free-text starting
 * points, a sentence on why), and falls back to this.
 */
import { listFounderProjects, type ResolvedProject } from './projects';

export interface PathRecommendation {
  from: string; // The starting point chosen
  start: ResolvedProject; // Where to begin
  next: ResolvedProject[]; // Then, in order, where the path leads
}

const normalize = (text: string) => text.trim().toLowerCase();

/** Every starting point the owner's projects suit, each once, in the order they're listed */
export function startingPoints(): string[] {
  const seen = new Set<string>();
  const points: string[] = [];
  for (const project of listFounderProjects()) {
    for (const point of project.startsFrom ?? []) {
      if (!seen.has(normalize(point))) {
        seen.add(normalize(point));
        points.push(point);
      }
    }
  }
  return points;
}

/** Where to start from a starting point, and the path after it; null when no project suits it */
export function recommendFrom(from: string): PathRecommendation | null {
  const projects = listFounderProjects();
  const byId = new Map(projects.map(project => [project.id, project]));
  const start = projects.find(project => project.startsFrom?.some(point => normalize(point) === normalize(from)));
  if (!start) return null;

  // Follow where it leads, breadth first, each project once
  const next: ResolvedProject[] = [];
  const seen = new Set([start.id]);
  const queue = [...(start.leadsTo ?? [])];
  while (queue.length > 0) {
    const id = queue.shift()!;
    const project = byId.get(id);
    if (!project || seen.has(id)) continue;
    seen.add(id);
    next.push(project);
    queue.push(...(project.leadsTo ?? []));
  }
  return { from, start, next };
}
