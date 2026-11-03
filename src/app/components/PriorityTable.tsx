
"use client";

import { useEffect, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import {
  mergePriorityData,
  type EnrichedPriority,
  type SupplementalPriorityPoints
} from '../utils/priorityTableData';
import { findProjectById } from '@/lib/projects';
import { resolveCoverSrc } from '../utils/coverPath';
import RowTable from './RowTable';
import UnpppCircle from './UnpppCircle';
import type { RepositoryMetadata } from '@/types/repository-metadata';

interface PriorityScoreRow {
  id: string;
  stepLinkPoints: number;
  storyMentionPoints: number;
}

/**
 * PriorityTable - each unppp's priority, as the house table (RowTable, #572):
 * its cover and name, and its combined, unppp, repo, active and recent points
 * as columns that sort (narrow, the labels pick which one shows). Opened,
 * where the points come from: config completeness, step links and story
 * mentions.
 */
const PriorityTable = () => {
  const { colorValue } = useTheme();
  const [rows, setRows] = useState<EnrichedPriority[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [repoResponse, scoreResponse] = await Promise.all([
          fetch('/raw-repo-metadata.json'),
          fetch('/api/unppp/priority-score'),
        ]);
        if (!repoResponse.ok) throw new Error(`Failed to load data: ${repoResponse.statusText}`);
        const repoMetadata: RepositoryMetadata[] = await repoResponse.json();

        // Non-fatal: stepLinkPoints/storyMentionPoints just read as 0 if this fetch fails.
        let supplementalPoints = new Map<string, SupplementalPriorityPoints>();
        if (scoreResponse.ok) {
          const { unppps }: { unppps: PriorityScoreRow[] } = await scoreResponse.json();
          supplementalPoints = new Map(
            unppps.map(u => [u.id, { stepLinkPoints: u.stepLinkPoints, storyMentionPoints: u.storyMentionPoints }])
          );
        } else {
          console.error('Failed to load /api/unppp/priority-score — combined scores will be missing step-link/story-mention points');
        }

        setRows(mergePriorityData(repoMetadata, supplementalPoints));
      } catch (err) {
        console.error('Failed to load priority data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return (
      <div className="w-full py-8 text-left">
        <span className="font-google-sans-code text-sm" style={{ color: 'var(--text-muted)' }}>
          thinking...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full py-8 text-left">
        <span className="font-google-sans-code text-sm" style={{ color: 'var(--text-muted)' }}>
          couldn&apos;t load priority data: {error}
        </span>
      </div>
    );
  }

  const dash = (row: EnrichedPriority, n: number) => (row.matched ? String(n) : '—');
  return (
    <RowTable
      rows={rows}
      rowKey={(r) => r.id}
      label="unppp"
      name={(r) => r.name || r.id}
      nameSort={(r) => (r.name || r.id).toLowerCase()}
      meta={(r) => (r.matched ? r.id : `${r.id} · no repo yet`)}
      circle={(r) => {
        const project = findProjectById(r.id);
        return { node: <UnpppCircle src={project?.cover ? resolveCoverSrc(project.cover) : undefined} color={project?.color} alt="" size={32} /> };
      }}
      columns={[
        { id: 'combined', label: 'combined', value: (r) => <span style={{ color: colorValue }}>{r.combined}</span>, sort: (r) => r.combined },
        { id: 'unppp', label: 'unppp', value: (r) => r.unpppTotal, sort: (r) => r.unpppTotal },
        { id: 'repo', label: 'repo', value: (r) => dash(r, r.repoTotal), sort: (r) => (r.matched ? r.repoTotal : undefined) },
        { id: 'active', label: 'active', value: (r) => dash(r, r.activePeriodPoints), sort: (r) => (r.matched ? r.activePeriodPoints : undefined) },
        { id: 'recent', label: 'recent', value: (r) => dash(r, r.timeBoundedPoints), sort: (r) => (r.matched ? r.timeBoundedPoints : undefined) },
      ]}
      sort={{ by: 'combined', dir: 'desc' }}
      details={[
        { id: 'from', label: 'unppp from', value: (r) => `url ${r.urlPoints} · core ${r.corePoints} · product ${r.productPoints}` },
        { id: 'mentions', label: 'mentions', value: (r) => `step ${r.stepLinkPoints} · story ${r.storyMentionPoints}` },
      ]}
      href={(r) => `/${r.id}`}
      hrefLabel="its page"
      search={(r, q) => r.id.includes(q) || (r.name ?? '').toLowerCase().includes(q)}
      searchLabel="search unppps"
      footer={`${rows.filter((r) => r.matched).length} of ${rows.length} matched to a repo`}
    />
  );
};

export default PriorityTable;
