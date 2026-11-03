'use client'

import { usePathname } from 'next/navigation';
import { useFetch } from '@/hooks/useFetch';
import ProjectBelt from './ProjectBelt';
import type { ProjectBelt as ProjectBeltData } from '@/lib/project-belt';

/**
 * StatsLayoutWrapper - the belt at the end of every project page
 * (ProjectBelt): where it stands, the hours it took, what it has released,
 * and the site's ask. The root layout passes only which projects have one;
 * this picks the page's by its first path segment (the homepage being
 * theunpartyapp's) and loads just that belt (/api/belt/<project>, built with
 * the site). Elsewhere it shows nothing and loads nothing.
 */
export default function StatsLayoutWrapper({ projects }: { projects: string[] }) {
  const pathname = usePathname();
  const projectId = pathname === '/' ? 'theunpartyapp' : pathname.split('/').filter(Boolean)[0];
  const known = projectId && projects.includes(projectId);
  const { data: belt } = useFetch<ProjectBeltData>(known ? `/api/belt/${projectId}` : null);
  if (!known || !belt) return null;
  return <ProjectBelt belt={belt} />;
}
