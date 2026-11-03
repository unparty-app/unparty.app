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

    // Calculate retention metrics
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    // Total users
    const totalUsers = await prisma.userProfile.count();

    // Active users in different time periods
    const activeUsers7Days = await prisma.userProfile.count({
      where: {
        lastActiveAt: {
          gte: sevenDaysAgo
        }
      }
    });

    const activeUsers30Days = await prisma.userProfile.count({
      where: {
        lastActiveAt: {
          gte: thirtyDaysAgo
        }
      }
    });

    const activeUsers90Days = await prisma.userProfile.count({
      where: {
        lastActiveAt: {
          gte: ninetyDaysAgo
        }
      }
    });

    // Users who completed onboarding
    const onboardedUsers = await prisma.userProfile.count({
      where: {
        onboardingCompleted: true
      }
    });

    // Users who used all three pillars
    const allPillarsUsers = await prisma.userProfile.count({
      where: {
        AND: [
          { aboutPillarProgress: { not: Prisma.DbNull } },
          { buildPillarProgress: { not: Prisma.DbNull } },
          { connectPillarProgress: { not: Prisma.DbNull } }
        ]
      }
    });

    // Users with completed ideas
    const usersWithCompletedIdeas = await prisma.userProfile.count({
      where: {
        totalIdeasCompleted: {
          gt: 0
        }
      }
    });

    // Calculate retention rates
    const retention7Days = totalUsers > 0 ? (activeUsers7Days / totalUsers) * 100 : 0;
    const retention30Days = totalUsers > 0 ? (activeUsers30Days / totalUsers) * 100 : 0;
    const retention90Days = totalUsers > 0 ? (activeUsers90Days / totalUsers) * 100 : 0;

    // Calculate conversion rates
    const onboardingRate = totalUsers > 0 ? (onboardedUsers / totalUsers) * 100 : 0;
    const allPillarsRate = totalUsers > 0 ? (allPillarsUsers / totalUsers) * 100 : 0;
    const ideaCompletionRate = totalUsers > 0 ? (usersWithCompletedIdeas / totalUsers) * 100 : 0;

    // Get milestone distribution
    const milestoneStats = await prisma.userMilestone.groupBy({
      by: ['milestone'],
      _count: {
        milestone: true
      }
    });

    // Get user type distribution
    const userTypeStats = await prisma.userProfile.groupBy({
      by: ['userType'],
      _count: {
        userType: true
      }
    });

    // Get recent growth
    const recentUsers = await prisma.userProfile.count({
      where: {
        createdAt: {
          gte: sevenDaysAgo
        }
      }
    });

    return NextResponse.json({
      overview: {
        totalUsers,
        activeUsers7Days,
        activeUsers30Days,
        activeUsers90Days,
        recentUsers
      },
      retention: {
        retention7Days: Number(retention7Days.toFixed(2)),
        retention30Days: Number(retention30Days.toFixed(2)),
        retention90Days: Number(retention90Days.toFixed(2))
      },
      conversion: {
        onboardingRate: Number(onboardingRate.toFixed(2)),
        allPillarsRate: Number(allPillarsRate.toFixed(2)),
        ideaCompletionRate: Number(ideaCompletionRate.toFixed(2))
      },
      milestones: milestoneStats,
      userTypes: userTypeStats
    });

  } catch (error) {
    console.error('Error fetching retention metrics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}