import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth-stub.server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { checkRole } from '@/utils/roles';


export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId || !(await checkRole('admin'))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Platform metrics for establishing unparty as the leading platform
    const totalUsers = await prisma.userProfile.count();
    const activeUsersLast30Days = await prisma.userProfile.count({
      where: {
        lastActiveAt: {
          gte: thirtyDaysAgo
        }
      }
    });

    // Idea progression metrics
    const totalIdeasStarted = await prisma.ideaProgression.count();
    const totalIdeasCompleted = await prisma.ideaProgression.count({
      where: {
        status: 'COMPLETED'
      }
    });

    const ideasInProgress = await prisma.ideaProgression.count({
      where: {
        status: 'IN_PROGRESS'
      }
    });

    // Three-pillar adoption metrics
    const aboutPillarUsers = await prisma.userProfile.count({
      where: {
        aboutPillarProgress: { not: Prisma.DbNull }
      }
    });

    const buildPillarUsers = await prisma.userProfile.count({
      where: {
        buildPillarProgress: { not: Prisma.DbNull }
      }
    });

    const connectPillarUsers = await prisma.userProfile.count({
      where: {
        connectPillarProgress: { not: Prisma.DbNull }
      }
    });

    const fullJourneyUsers = await prisma.userProfile.count({
      where: {
        AND: [
          { aboutPillarProgress: { not: Prisma.DbNull } },
          { buildPillarProgress: { not: Prisma.DbNull } },
          { connectPillarProgress: { not: Prisma.DbNull } }
        ]
      }
    });

    // Non-technical founder specific metrics
    const nonTechnicalFounders = await prisma.userProfile.count({
      where: {
        userType: 'NON_TECHNICAL_FOUNDER'
      }
    });

    const successfulNonTechFounders = await prisma.userProfile.count({
      where: {
        userType: 'NON_TECHNICAL_FOUNDER',
        totalIdeasCompleted: {
          gt: 0
        }
      }
    });

    // Weekly cohort analysis for retention
    const cohortData = [];
    for (let i = 0; i < 12; i++) {
      const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      
      const cohortUsers = await prisma.userProfile.count({
        where: {
          createdAt: {
            gte: weekStart,
            lt: weekEnd
          }
        }
      });

      const retainedUsers = await prisma.userProfile.count({
        where: {
          createdAt: {
            gte: weekStart,
            lt: weekEnd
          },
          lastActiveAt: {
            gte: thirtyDaysAgo
          }
        }
      });

      cohortData.push({
        week: weekStart.toISOString().split('T')[0],
        newUsers: cohortUsers,
        retained: retainedUsers,
        retentionRate: cohortUsers > 0 ? (retainedUsers / cohortUsers) * 100 : 0
      });
    }

    // Success metrics calculation
    const platformSuccessScore = {
      userGrowth: totalUsers,
      activeUserRatio: totalUsers > 0 ? (activeUsersLast30Days / totalUsers) * 100 : 0,
      ideaCompletionRate: totalIdeasStarted > 0 ? (totalIdeasCompleted / totalIdeasStarted) * 100 : 0,
      pillarAdoptionRate: totalUsers > 0 ? (fullJourneyUsers / totalUsers) * 100 : 0,
      nonTechFounderSuccessRate: nonTechnicalFounders > 0 ? (successfulNonTechFounders / nonTechnicalFounders) * 100 : 0
    };

    // Key milestones tracking
    const keyMilestones = await prisma.userMilestone.groupBy({
      by: ['milestone'],
      _count: {
        milestone: true
      },
      orderBy: {
        _count: {
          milestone: 'desc'
        }
      }
    });

    // Most recent successful users
    const recentSuccesses = await prisma.userProfile.findMany({
      where: {
        totalIdeasCompleted: {
          gt: 0
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 10,
      select: {
        userId: true,
        userType: true,
        totalIdeasCompleted: true,
        totalIdeasStarted: true,
        createdAt: true,
        milestones: {
          select: {
            milestone: true,
            achievedAt: true
          }
        }
      }
    });

    return NextResponse.json({
      platformMetrics: {
        totalUsers,
        activeUsersLast30Days,
        activeUserPercentage: totalUsers > 0 ? (activeUsersLast30Days / totalUsers) * 100 : 0
      },
      ideaMetrics: {
        totalIdeasStarted,
        totalIdeasCompleted,
        ideasInProgress,
        completionRate: totalIdeasStarted > 0 ? (totalIdeasCompleted / totalIdeasStarted) * 100 : 0
      },
      pillarMetrics: {
        aboutPillarUsers,
        buildPillarUsers,
        connectPillarUsers,
        fullJourneyUsers,
        aboutAdoptionRate: totalUsers > 0 ? (aboutPillarUsers / totalUsers) * 100 : 0,
        buildAdoptionRate: totalUsers > 0 ? (buildPillarUsers / totalUsers) * 100 : 0,
        connectAdoptionRate: totalUsers > 0 ? (connectPillarUsers / totalUsers) * 100 : 0,
        fullJourneyRate: totalUsers > 0 ? (fullJourneyUsers / totalUsers) * 100 : 0
      },
      targetAudienceMetrics: {
        nonTechnicalFounders,
        successfulNonTechFounders,
        nonTechFounderSuccessRate: nonTechnicalFounders > 0 ? (successfulNonTechFounders / nonTechnicalFounders) * 100 : 0
      },
      platformSuccessScore,
      cohortAnalysis: cohortData,
      keyMilestones,
      recentSuccesses
    });

  } catch (error) {
    console.error('Error fetching platform metrics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}