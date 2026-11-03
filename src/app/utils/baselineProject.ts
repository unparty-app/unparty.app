import type { BaselineProject } from '@/lib/baseline';
import { findProjectById } from '@/lib/projects';
import { resolveCoverSrc } from './coverPath';

/**
 * A baseline project as the site shows it: its own name when it has one, else
 * the name, cover and color of the site project with the same id. Goal Budget
 * and Explore Resilience both list baseline projects this way.
 */
export function describeBaselineProject(project: BaselineProject) {
  const known = findProjectById(project.id);
  return {
    name: project.name || known?.name || project.id,
    cover: known?.cover ? resolveCoverSrc(known.cover) : undefined,
    color: known?.color ?? null,
  };
}
