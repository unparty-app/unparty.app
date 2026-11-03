import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth-stub.server';
import { prisma } from '@/lib/prisma';
import { awardPillarProgress } from '@/lib/pillar-progress';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get or create user profile
    let userProfile = await prisma.userProfile.findUnique({
      where: { userId },
      include: {
        milestones: true,
        ideaProgression: true,
        sessions: {
          orderBy: { startedAt: 'desc' },
          take: 5
        }
      }
    });

    if (!userProfile) {
      userProfile = await prisma.userProfile.create({
        data: {
          userId,
          userType: 'NON_TECHNICAL_FOUNDER',
          lastActiveAt: new Date()
        },
        include: {
          milestones: true,
          ideaProgression: true,
          sessions: {
            orderBy: { startedAt: 'desc' },
            take: 5
          }
        }
      });

      // Create first login milestone
      await prisma.userMilestone.create({
        data: {
          userId,
          milestone: 'FIRST_LOGIN'
        }
      });
    }

    // Calculate progression stats
    const progressStats = {
      aboutPillarUsed: userProfile.aboutPillarProgress !== null,
      buildPillarUsed: userProfile.buildPillarProgress !== null,
      connectPillarUsed: userProfile.connectPillarProgress !== null,
      totalIdeas: userProfile.totalIdeasStarted,
      completedIdeas: userProfile.totalIdeasCompleted,
      retentionScore: userProfile.retentionScore,
      milestoneCount: userProfile.milestones.length
    };

    return NextResponse.json({
      userProfile,
      progressStats
    });

  } catch (error) {
    console.error('Error fetching user progress:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { pillar, metadata } = data;

    // pillar-progress + milestone awarding is shared with
    // POST /api/analytics/unppp-visit via awardPillarProgress(); an
    // unrecognized pillar (e.g. OnboardingFlow's action-only payload — see
    // #731) falls through to just bumping lastActiveAt, unchanged from
    // before this route was refactored to share that logic.
    const userProfile =
      pillar === 'ABOUT' || pillar === 'BUILD' || pillar === 'CONNECT'
        ? await awardPillarProgress(userId, pillar, metadata)
        : await prisma.userProfile.upsert({
            where: { userId },
            update: { lastActiveAt: new Date() },
            create: { userId, userType: 'NON_TECHNICAL_FOUNDER', lastActiveAt: new Date() },
          });

    return NextResponse.json({ success: true, userProfile });

  } catch (error) {
    console.error('Error updating user progress:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}