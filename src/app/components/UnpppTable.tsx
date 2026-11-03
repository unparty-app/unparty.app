
"use client";

import { useMemo } from 'react';
import { getMergedUnpppData, type EnrichedUnppp } from '../utils/unpppTableData';
import { resolveCoverSrc } from '../utils/coverPath';
import { BUILD_TYPES } from '@/lib/word-types';
import RowTable, { type RowFilter } from './RowTable';
import UnpppCircle from './UnpppCircle';

const formatPrice = (price: number) => `$${Math.round(price).toLocaleString('en-US')}`;
const VELOCITY = { increasing: '↑ increasing', stable: '→ stable', decreasing: '↓ decreasing' } as const;
const VELOCITY_ORDER = { increasing: 2, stable: 1, decreasing: 0 } as const;

/**
 * UnpppTable - every unppp, as the house table (RowTable, #572): its cover,
 * name and tagline, and its price, hours, standards, velocity and kind of
 * build as columns that sort (narrow, the labels pick which one shows). Tabs
 * filter by kind of build, with how many of each.
 */
const UnpppTable = () => {
  // Static config + score JSON, merged synchronously
  const allUnppps = useMemo(() => getMergedUnpppData(), []);

  const filters = useMemo<RowFilter<EnrichedUnppp>[]>(
    () => [
      { id: 'all', label: 'all', test: () => true },
      ...BUILD_TYPES.filter((t) => allUnppps.some((u) => u.type === t.id)).map((t) => ({ id: t.id, label: t.id, test: (u: EnrichedUnppp) => u.type === t.id })),
    ],
    [allUnppps]
  );

  return (
    <RowTable
      rows={allUnppps}
      rowKey={(u) => u.id}
      label="unppp"
      name={(u) => u.name || u.id}
      nameSort={(u) => (u.name || u.id).toLowerCase()}
      meta={(u) => u.tagline || u.id}
      circle={(u) => ({ node: <UnpppCircle src={u.cover ? resolveCoverSrc(u.cover) : undefined} color={u.color} alt="" size={32} /> })}
      columns={[
        { id: 'price', label: 'price', value: (u) => formatPrice(u.polarPrice), sort: (u) => u.polarPrice },
        { id: 'hours', label: 'hours', value: (u) => u.hours_formatted || '—', sort: (u) => u.total_hours },
        { id: 'standards', label: 'standards', value: (u) => (u.standards_score ? `${(u.standards_score * 100).toFixed(0)}%` : '—'), sort: (u) => u.standards_score },
        { id: 'velocity', label: 'velocity', value: (u) => (u.velocity_trend ? VELOCITY[u.velocity_trend] : '—'), sort: (u) => (u.velocity_trend ? VELOCITY_ORDER[u.velocity_trend] : undefined) },
        { id: 'kind', label: 'kind', value: (u) => u.type || '—', sort: (u) => u.type, dir: 'asc' },
      ]}
      sort={{ by: 'price', dir: 'desc' }}
      href={(u) => `/${u.id}`}
      filters={filters}
      search={(u, q) => u.id.includes(q) || (u.name ?? '').toLowerCase().includes(q) || (u.tagline ?? '').toLowerCase().includes(q)}
      searchLabel="search unppps"
      empty="no unppps match."
    />
  );
};

export default UnpppTable;
