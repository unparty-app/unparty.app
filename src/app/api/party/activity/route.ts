import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth-stub.server';
import { prisma } from '@/lib/prisma';
import UnpppsConfig from '@/data/UnpppsConfig.json';
import { resolveCoverSrc } from '@/app/utils/coverPath';

// Resolved upstream of the client per the UnpppCircle convention (CLAUDE.md
// "UNPPP Visual Convention", added in #943) — the shared component takes an
// already-resolved `src`, not a raw cover id.
const UNPPP_DISPLAY: Record<string, { name: string; src?: string; color?: string | null }> =
  Object.fromEntries(
    UnpppsConfig.unppps.map((u) => [
      u.id,
      { name: u.name, src: u.cover ? resolveCoverSrc(u.cover) : undefined, color: u.color },
    ])
  );

/**
 * Unified /party Activity feed data.
 *
 * Merges every per-user, timestamped signal currently available into one
 * feed. Read-only by design — no per-item actions (see issue #731, which
 * this route implements the "surface it" half of).
 *
 * Two kinds of user-progress data exist upstream, in GET /api/analytics/
 * user-progress (src/app/api/analytics/user-progress/route.ts), and only
 * the first is included here:
 *   - discrete, timestamped events (milestones, idea start/completion,
 *     unppp page visits) -> included below
 *   - running current-state fields (aboutPillarProgress/buildPillarProgress/
 *     connectPillarProgress JSON blobs, retentionScore, totalIdeasStarted/
 *     totalIdeasCompleted counters) -> deliberately NOT included; they're
 *     overwritten in place on every pillar-page visit and have no event
 *     history to render as a feed entry.
 * Full data-shape writeup: https://github.com/unparty-app/theunpartyapp/issues/731#issuecomment-5593616872
 *
 * UserSession rows are also deliberately excluded here: they carry no page
 * identity at all (UserSession.pageViews is a static count that never
 * actually increments, and pillarsUsed is always sent empty — see the #731
 * comment), so a session entry can only ever render a content-free "visited
 * N pages" line. UserUnpppVisit is the real per-page signal and is what
 * "which unppp did they visit" should be sourced from.
 *
 * Known data-quality caveats carried over from the same audit
 * (user-journey.json, commit b280b0b), relevant to anyone building on this
 * feed next:
 *   - ONBOARDING_COMPLETED never actually fires today (a pillar/action
 *     field-name mismatch bug in the user-progress POST handler), so it
 *     will never appear here even though the enum exists.
 *   - IdeaProgression rows are created once at 0% and nothing in the app
 *     currently advances them, so an "idea started" entry will effectively
 *     never be followed by an "idea completed" one under current wiring.
 */

export type ActivityItem =
  | { type: 'connect'; id: string; timestamp: string; message: string; context: string | null }
  | { type: 'milestone'; id: string; timestamp: string; milestone: string }
  | { type: 'idea_started'; id: string; timestamp: string; ideaTitle: string }
  | { type: 'idea_completed'; id: string; timestamp: string; ideaTitle: string }
  | {
      type: 'unppp_visit';
      id: string;
      timestamp: string;
      unpppId: string;
      unpppName: string;
      unpppCoverSrc?: string;
      unpppColor?: string | null;
    };

const MAX_ITEMS = 30;

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Each source is fetched up to MAX_ITEMS, not some smaller per-source cap:
  // the merged-then-sorted-then-sliced result below can only be correct if
  // every source could individually fill the whole page — a smaller cap risks
  // dropping genuinely-recent items from a quiet source in favor of stale
  // items from a noisy one that got over-fetched relative to it.
  const [connects, milestones, ideas, unpppVisits] = await Promise.all([
    prisma.connectMessage.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: MAX_ITEMS }),
    prisma.userMilestone.findMany({ where: { userId }, orderBy: { achievedAt: 'desc' }, take: MAX_ITEMS }),
    prisma.ideaProgression.findMany({ where: { userId }, orderBy: { startedAt: 'desc' }, take: MAX_ITEMS }),
    prisma.userUnpppVisit.findMany({ where: { userId }, orderBy: { visitedAt: 'desc' }, take: MAX_ITEMS }),
  ]);

  const items: ActivityItem[] = [
    ...connects.map((c): ActivityItem => ({
      type: 'connect',
      id: c.id,
      timestamp: c.createdAt.toISOString(),
      message: c.message,
      context: c.context,
    })),
    ...milestones.map((m): ActivityItem => ({
      type: 'milestone',
      id: m.id,
      timestamp: m.achievedAt.toISOString(),
      milestone: m.milestone,
    })),
    ...ideas.map((i): ActivityItem => ({
      type: 'idea_started',
      id: `${i.id}-started`,
      timestamp: i.startedAt.toISOString(),
      ideaTitle: i.ideaTitle,
    })),
    ...ideas
      .filter((i): i is typeof i & { completedAt: Date } => i.completedAt !== null)
      .map((i): ActivityItem => ({
        type: 'idea_completed',
        id: `${i.id}-completed`,
        timestamp: i.completedAt.toISOString(),
        ideaTitle: i.ideaTitle,
      })),
    ...unpppVisits.map((v): ActivityItem => ({
      type: 'unppp_visit',
      id: v.id,
      timestamp: v.visitedAt.toISOString(),
      unpppId: v.unpppId,
      unpppName: UNPPP_DISPLAY[v.unpppId]?.name ?? v.unpppId,
      unpppCoverSrc: UNPPP_DISPLAY[v.unpppId]?.src,
      unpppColor: UNPPP_DISPLAY[v.unpppId]?.color,
    })),
  ];

  items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return NextResponse.json({ activity: items.slice(0, MAX_ITEMS) });
}
