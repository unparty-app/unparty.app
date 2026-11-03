import { prisma } from './prisma';
import { MilestoneType } from '@prisma/client';

export type Pillar = 'ABOUT' | 'BUILD' | 'CONNECT';

const PILLAR_FIELD = {
  ABOUT: 'aboutPillarProgress',
  BUILD: 'buildPillarProgress',
  CONNECT: 'connectPillarProgress',
} as const;

const PILLAR_MILESTONE: Record<Pillar, MilestoneType> = {
  ABOUT: MilestoneType.ABOUT_PILLAR_EXPLORED,
  BUILD: MilestoneType.BUILD_PILLAR_EXPLORED,
  CONNECT: MilestoneType.CONNECT_PILLAR_EXPLORED,
};

/**
 * Sets a user's {pillar}PillarProgress and awards the matching
 * *_PILLAR_EXPLORED / ALL_PILLARS_USED milestone(s). Shared by
 * POST /api/analytics/user-progress (pillar-page visits: ABOUT/BUILD/CONNECT
 * page mount) and POST /api/analytics/unppp-visit (the ALL_UNPPPS_VISITED ->
 * About-pillar award), so the two award paths can't silently drift apart —
 * see 67bbe11 for a real instance of exactly that kind of drift elsewhere
 * (the /priority `combined` formula missing a signal added via a different
 * code path).
 */
export async function awardPillarProgress(
  userId: string,
  pillar: Pillar,
  metadata?: Record<string, unknown>
) {
  const updateData = {
    lastActiveAt: new Date(),
    [PILLAR_FIELD[pillar]]: metadata || { lastAccessed: new Date() },
  };

  const userProfile = await prisma.userProfile.upsert({
    where: { userId },
    update: updateData,
    create: {
      userId,
      userType: 'NON_TECHNICAL_FOUNDER',
      ...updateData,
    },
  });

  const milestones: MilestoneType[] = [PILLAR_MILESTONE[pillar]];

  const allPillarsUsed =
    userProfile.aboutPillarProgress && userProfile.buildPillarProgress && userProfile.connectPillarProgress;
  if (allPillarsUsed) milestones.push(MilestoneType.ALL_PILLARS_USED);

  for (const milestone of milestones) {
    await prisma.userMilestone.upsert({
      where: { userId_milestone: { userId, milestone } },
      update: {},
      create: { userId, milestone },
    });
  }

  return userProfile;
}
