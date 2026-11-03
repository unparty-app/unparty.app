import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth-stub.server';
import { prisma } from '@/lib/prisma';
import { MilestoneType } from '@prisma/client';
import { awardPillarProgress } from '@/lib/pillar-progress';
import UnpppsConfig from '@/data/UnpppsConfig.json';

/**
 * Records a signed-in user's visit to one /theunparty* unppp page
 * (UnpppsConfig.json id). Once a user has visited every id in that config,
 * awards the ALL_UNPPPS_VISITED milestone and a point in the About pillar
 * (same effect as visiting /about — see awardPillarProgress).
 *
 * Called from <UnpppVisitTracker unpppId=.../> (see
 * src/app/components/UnpppVisitTracker.tsx), mounted either via
 * AboutComponent (most /theunparty* pages) or directly on the 8 ids that use
 * the EditorialArticle story template instead of AboutComponent
 * (theunpartybeta, theunpartybot, theunpartychatty, theunpartyfoundation,
 * theunpartyhtml, theunpartyselector, theunpartysnake, theunpartytheme) — all
 * 49 ids are trackable, so ALL_UNPPPS_VISITED is actually earnable.
 * UnpppVisitTracker also gates on the current route actually being that
 * unppp's own page, so a page that merely displays unppp content under a
 * different id (e.g. /about rendering AboutComponent with
 * unpppId="theunpartyapp") doesn't get misrecorded as a visit to it.
 */

const VALID_UNPPP_IDS = new Set(UnpppsConfig.unppps.map((u) => u.id));
const TOTAL_UNPPP_COUNT = UnpppsConfig.unppps.length;

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { unpppId } = await req.json();
  if (typeof unpppId !== 'string' || !VALID_UNPPP_IDS.has(unpppId)) {
    return NextResponse.json({ error: 'Unknown unpppId' }, { status: 400 });
  }

  await prisma.userUnpppVisit.upsert({
    where: { userId_unpppId: { userId, unpppId } },
    update: {},
    create: { userId, unpppId },
  });

  const visitedCount = await prisma.userUnpppVisit.count({ where: { userId } });
  const allUnpppsVisited = visitedCount >= TOTAL_UNPPP_COUNT;

  if (allUnpppsVisited) {
    await prisma.userMilestone.upsert({
      where: { userId_milestone: { userId, milestone: MilestoneType.ALL_UNPPPS_VISITED } },
      update: {},
      create: { userId, milestone: MilestoneType.ALL_UNPPPS_VISITED },
    });
    await awardPillarProgress(userId, 'ABOUT', { source: 'all_unppps_visited', visitedCount });
  }

  return NextResponse.json({ visitedCount, total: TOTAL_UNPPP_COUNT, allUnpppsVisited });
}
