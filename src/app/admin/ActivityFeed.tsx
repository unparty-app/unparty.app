'use client';
import React, { useState } from 'react';
import { useFetch } from '@/hooks/useFetch';
import { useTheme } from '../contexts/ThemeContext';
import type { ActivityItem } from '../api/party/activity/route';
import UnpppCircle from '../components/UnpppCircle';

// Human-readable labels for UserMilestone.milestone (see MilestoneType in
// prisma/schema.prisma). Kept here rather than imported from @prisma/client
// so this file stays a plain client component with no Prisma dependency.
const MILESTONE_LABELS: Record<string, string> = {
  FIRST_LOGIN: 'Signed up',
  ONBOARDING_COMPLETED: 'Completed onboarding',
  FIRST_IDEA_STARTED: 'Started an idea',
  ALL_UNPPPS_VISITED: 'Visited every unppp',
  ABOUT_PILLAR_EXPLORED: 'Explored About',
  BUILD_PILLAR_EXPLORED: 'Explored Build',
  CONNECT_PILLAR_EXPLORED: 'Explored Connect',
  ALL_PILLARS_USED: 'Used all three pillars',
  FIRST_IDEA_COMPLETED: 'Completed first idea',
  COMMUNITY_ENGAGEMENT: 'Community engagement',
  RESOURCE_USAGE: 'Used a resource',
  RETENTION_7_DAYS: 'Active for 7 days',
  RETENTION_30_DAYS: 'Active for 30 days',
  RETENTION_90_DAYS: 'Active for 90 days',
};

const formatRelativeTime = (iso: string): string => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.round(diffMs / 60_000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  return `${diffDay}d ago`;
};

// Read-only summary line per activity type. No per-item interactivity by
// design (see #731) — this is a data feed, not an inbox.
const describe = (item: ActivityItem): string => {
  switch (item.type) {
    case 'connect':
      return item.message;
    case 'milestone':
      return MILESTONE_LABELS[item.milestone] ?? item.milestone;
    case 'idea_started':
      return `Started "${item.ideaTitle}"`;
    case 'idea_completed':
      return `Completed "${item.ideaTitle}"`;
    case 'unppp_visit':
      return `Visited ${item.unpppName}`;
  }
};

// The newest rows show; the rest are one tap away
const FIRST_ROWS = 8;

const NO_ACTIVITY_MESSAGE = '👾 oh no, nothing here. unparty-app is MEH!';

const ActivityFeed: React.FC = () => {
  const { colorValue } = useTheme();
  // A failed fetch here shouldn't read as a broken feature — it falls back to
  // the same quiet copy as "no activity yet" (useFetch still logs the error).
  const { data, loading, error } = useFetch<{ activity: ActivityItem[] }>('/api/party/activity');
  const items = data?.activity ?? [];
  const [showAll, setShowAll] = useState(false);

  if (loading) {
    return (
      <div className="animate-pulse space-y-2">
        <div className="h-4 w-3/4 rounded bg-[var(--background-highlight)]"></div>
        <div className="h-4 w-1/2 rounded bg-[var(--background-highlight)]"></div>
      </div>
    );
  }

  if (error || items.length === 0) {
    return (
      <p className="font-vt323 text-sm" style={{ color: 'var(--text-muted)' }}>
        {NO_ACTIVITY_MESSAGE}
      </p>
    );
  }

  const shown = showAll ? items : items.slice(0, FIRST_ROWS);

  // Circle, then the line, then when: one quiet row each, divided like the /build list
  return (
    <div>
      <ul>
        {shown.map((item) => (
          <li
            key={`${item.type}-${item.id}`}
            className="flex items-center gap-3 border-b py-3 last:border-b-0"
            style={{ borderColor: `${colorValue}20` }}
          >
            {item.type === 'unppp_visit' ? (
              <UnpppCircle src={item.unpppCoverSrc} color={item.unpppColor} alt="" title={item.unpppName} />
            ) : (
              <span aria-hidden="true" className="grid size-6 shrink-0 place-items-center">
                <span className="size-2 rounded-full" style={{ backgroundColor: colorValue }} />
              </span>
            )}
            <p className="min-w-0 flex-1 font-space-grotesk text-sm text-[var(--foreground)]">
              {describe(item)}
              {item.type === 'connect' && item.context && <span className="text-[var(--text-muted)]"> · {item.context}</span>}
            </p>
            <span className="shrink-0 font-google-sans-code text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
              {formatRelativeTime(item.timestamp)}
            </span>
          </li>
        ))}
      </ul>
      {items.length > FIRST_ROWS && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="mt-3 font-google-sans-code text-[10px] uppercase tracking-wide text-[var(--text-muted)] transition-colors hover:text-[var(--theme-color,_#f9c22e)]"
        >
          {showAll ? 'less.' : `all ${items.length}.`}
        </button>
      )}
    </div>
  );
};

export default ActivityFeed;
