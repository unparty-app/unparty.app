#!/usr/bin/env tsx
/**
 * scripts/test-user-progress.ts
 *
 * Prints exactly what GET /api/analytics/user-progress would return for a
 * given userId, by querying Prisma directly — no HTTP, no Clerk session
 * needed. A diagnostic tool for inspecting the real shape of production
 * data while iterating on the route/admin UI.
 *
 * Usage:
 *   npm run test:user-progress -- --list             # print recent userIds to pick from
 *   npm run test:user-progress -- --userId=user_abc   # print that user's full payload
 */

import { prisma } from '../src/lib/prisma';

const args = process.argv.slice(2);
const getArg = (flag: string) => {
  const prefix = `${flag}=`;
  const arg = args.find(a => a.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : null;
};

const SHOULD_LIST = args.includes('--list');
const USER_ID = getArg('--userId');

async function listUserIds(limit = 20) {
  const profiles = await prisma.userProfile.findMany({
    select: { userId: true, userType: true, lastActiveAt: true },
    orderBy: { lastActiveAt: 'desc' },
    take: limit,
  });

  if (profiles.length === 0) {
    console.log('No user profiles found.');
    return;
  }

  console.log(`Most recently active users (up to ${limit}):\n`);
  for (const p of profiles) {
    console.log(`  ${p.userId}  (${p.userType}, last active ${p.lastActiveAt.toISOString()})`);
  }
}

// Mirrors GET handler in src/app/api/analytics/user-progress/route.ts
async function printUserProgress(userId: string) {
  const userProfile = await prisma.userProfile.findUnique({
    where: { userId },
    include: {
      milestones: true,
      ideaProgression: true,
      sessions: {
        orderBy: { startedAt: 'desc' },
        take: 5,
      },
    },
  });

  if (!userProfile) {
    console.log(`No UserProfile found for userId "${userId}".`);
    return;
  }

  const progressStats = {
    aboutPillarUsed: userProfile.aboutPillarProgress !== null,
    buildPillarUsed: userProfile.buildPillarProgress !== null,
    connectPillarUsed: userProfile.connectPillarProgress !== null,
    totalIdeas: userProfile.totalIdeasStarted,
    completedIdeas: userProfile.totalIdeasCompleted,
    retentionScore: userProfile.retentionScore,
    milestoneCount: userProfile.milestones.length,
  };

  console.log(JSON.stringify({ userProfile, progressStats }, null, 2));
}

async function main() {
  if (SHOULD_LIST) {
    await listUserIds();
    return;
  }

  if (!USER_ID) {
    console.error('Usage: npm run test:user-progress -- --userId=<id>  (or --list to find one)');
    process.exit(1);
  }

  await printUserProgress(USER_ID);
}

main()
  .catch(err => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
