'use client';

import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import type { PriorityTier, BuildStatusData, RouteInfo } from '../../types/BuildStatus';
import { PRIORITY_TIER_COLORS } from '../../types/BuildStatus';
import { findProjectById } from '@/lib/projects';
import { resolveCoverSrc } from '../utils/coverPath';
import RowTable, { type RowFilter } from './RowTable';
import UnpppCircle from './UnpppCircle';

interface BuildStatusProps {
  data: BuildStatusData;
  showNavigation?: boolean; // The tier tabs, search and sort (on by default)
  className?: string;
}

const TIERS: PriorityTier[] = ['YAH.', 'MEH.', 'NAH.'];

const FILTERS: RowFilter<RouteInfo>[] = [
  { id: 'all', label: 'all', test: () => true },
  ...TIERS.map((tier) => ({ id: tier, label: tier.replace(/\.$/, ''), test: (r: RouteInfo) => r.tier === tier })),
];

/**
 * BuildStatus - every unppp route by priority (#572): its YAH. / MEH. / NAH.
 * tier from the priority scores (src/lib/unppp-priority-scores.ts), as the
 * house table (RowTable): its cover, its name and route, its tier, and its
 * combined and repo scores. Narrow, the labels pick which one each row shows
 * and sort by it; wide, every column shows. Tabs filter by tier, with counts.
 */
const BuildStatus: React.FC<BuildStatusProps> = ({ data, showNavigation = true, className = '' }) => {
  const { colorValue } = useTheme();
  const { stats } = data;

  return (
    <section className={`flex flex-col gap-4 py-8 ${className}`} aria-label="Priority status">
      <div>
        <p className="font-google-sans-code text-[10px] uppercase tracking-wide md:text-xs" style={{ color: 'var(--text-muted)' }}>
          priority status.
        </p>
        <p className="mt-1 font-space-grotesk text-sm text-[var(--foreground)]">
          <span style={{ color: colorValue }}>{stats.total}</span> routes
          {stats.avgCombined !== undefined && <> · averaging <span style={{ color: colorValue }}>{stats.avgCombined.toFixed(1)}</span> combined</>}
          {stats.matchedCount !== undefined && <> · <span style={{ color: colorValue }}>{stats.matchedCount}</span> matched to a repo</>}
        </p>
      </div>

      <RowTable
        rows={data.routes}
        rowKey={(r) => r.route}
        label="route"
        name={(r) => r.name || r.route}
        nameSort={(r) => (r.name || r.route).toLowerCase()}
        meta={(r) => `/${r.route}`}
        circle={(r) => {
          const project = findProjectById(r.route);
          return { node: <UnpppCircle src={project?.cover ? resolveCoverSrc(project.cover) : undefined} color={project?.color ?? PRIORITY_TIER_COLORS[r.tier]} alt="" size={32} /> };
        }}
        columns={[
          { id: 'combined', label: 'combined', value: (r) => r.combined.toFixed(1), sort: (r) => r.combined },
          { id: 'repo', label: 'repo', value: (r) => r.repoTotal.toFixed(1), sort: (r) => r.repoTotal },
          { id: 'tier', label: 'tier', value: (r) => <span style={{ color: PRIORITY_TIER_COLORS[r.tier] }}>{r.tier}</span>, sort: (r) => TIERS.indexOf(r.tier), dir: 'asc' },
        ]}
        sort={{ by: 'combined', dir: 'desc' }}
        href={(r) => `/${r.route}`}
        filters={showNavigation ? FILTERS : undefined}
        search={showNavigation ? (r, q) => r.route.toLowerCase().includes(q) || (r.name ?? '').toLowerCase().includes(q) : undefined}
        searchLabel="search routes"
        empty="no routes match."
        footer={`generated ${new Date(data.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}`}
      />
    </section>
  );
};

export default BuildStatus;
