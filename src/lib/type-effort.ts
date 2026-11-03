import unpppScores from '../../public/data/unppp-scores.json';
import UnpppTypesConfig from '@/data/UnpppTypesConfig.json';
import { getRepositoriesByType } from '@/app/utils/unpppDataAdapter';
import type { NavCategory } from '@/app/constants/unpppNav';

// Where the work goes, by kind of build: each type's commits a month (summed
// over its projects in public/data/unppp-scores.json, the repo analysis run
// on the owner's machine) as a share of everyone's. TypeStatline draws it.

export interface TypeEffort {
  type: NavCategory;
  color: string;
  commitsPerMonth: number;
  share: number; // 0..1 of all commits a month
  projects: number;
  rising: number; // projects whose velocity is increasing
  hours?: number; // Measured hours instead of commits (/build's KINDS., from the build's own commits)
}

export interface EffortByType {
  types: TypeEffort[]; // UnpppTypesConfig order
  // When the scores were made, so the statline says how old its numbers are
  generatedAt: string | null;
  total: number;
  // Measured in hours over these weeks (src/lib/build-story.ts), not the
  // scores' commits a month
  weeks?: number;
}

export function effortByType(): EffortByType {
  const grouped = getRepositoriesByType();
  const rows = UnpppTypesConfig.types.map((t) => {
    const repos = grouped[t.id as NavCategory] ?? [];
    return {
      type: t.id as NavCategory,
      color: t.color,
      commitsPerMonth: repos.reduce((sum, r) => sum + (r.commits_per_month || 0), 0),
      projects: repos.length,
      rising: repos.filter((r) => r.velocity_trend === 'increasing').length,
    };
  });
  const total = rows.reduce((sum, r) => sum + r.commitsPerMonth, 0);
  return {
    types: rows.map((r) => ({ ...r, share: total > 0 ? r.commitsPerMonth / total : 0 })),
    generatedAt: (unpppScores as { generated_at?: string }).generated_at ?? null,
    total,
  };
}
