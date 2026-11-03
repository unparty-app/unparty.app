'use client';

import type { UnpppPriorityEntry } from '../../utils/unpppPriority';
import { findProjectById } from '@/lib/projects';
import { resolveCoverSrc } from '../utils/coverPath';
import RowTable from '../components/RowTable';
import UnpppCircle from '../components/UnpppCircle';

const price = (n: number) => `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

/**
 * The unppps by priority on /status (#572): ranked by dev investment, price,
 * GitHub activity and commit velocity (getUnpppPriorityData), as the house
 * table: each row its cover, name and rank, and its score, hours, price and
 * confidence as columns (narrow, the labels pick which one shows).
 */
export default function PriorityRows({ entries }: { entries: UnpppPriorityEntry[] }) {
  const rank = new Map([...entries].sort((a, b) => b.priorityScore - a.priorityScore).map((e, i) => [e.id, i + 1]));
  return (
    <RowTable
      rows={entries}
      rowKey={(e) => e.id}
      label="unppp"
      name={(e) => e.displayName}
      nameSort={(e) => e.displayName.toLowerCase()}
      meta={(e) => `#${rank.get(e.id)} · ${e.id}`}
      circle={(e) => {
        const project = findProjectById(e.id);
        return { node: <UnpppCircle src={project?.cover ? resolveCoverSrc(project.cover) : undefined} color={project?.color} alt="" size={32} /> };
      }}
      columns={[
        { id: 'score', label: 'score', value: (e) => e.priorityScore.toFixed(1), sort: (e) => e.priorityScore },
        { id: 'hours', label: 'hours', value: (e) => e.devHours.toFixed(0), sort: (e) => e.devHours },
        { id: 'price', label: 'price', value: (e) => price(e.polarPrice), sort: (e) => e.polarPrice },
        { id: 'confidence', label: 'confidence', value: (e) => e.confidence, sort: (e) => (e.confidence === 'high' ? 1 : 0) },
      ]}
      sort={{ by: 'score', dir: 'desc' }}
      href={(e) => `/${e.id}`}
      search={(e, q) => e.displayName.toLowerCase().includes(q) || e.id.includes(q)}
      searchLabel="search unppps"
      footer="api: /api/unppp/priority"
    />
  );
}
