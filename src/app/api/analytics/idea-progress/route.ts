import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth-stub.server';
import { prisma } from '@/lib/prisma';


export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { ideaTitle, currentStage, stepsCompleted, totalSteps } = data;

    // Calculate completion rate
    const completionRate = totalSteps > 0 ? (stepsCompleted / totalSteps) * 100 : 0;

    // Upsert idea progression
    const ideaProgression = await prisma.ideaProgression.upsert({
      where: {
        userId_ideaTitle: {
          userId,
          ideaTitle
        }
      },
      update: {
        currentStage: currentStage || 'CONCEPTION',
        stepsCompleted,
        totalSteps,
        completionRate,
        status: completionRate >= 100 ? 'COMPLETED' : 'IN_PROGRESS',
        completedAt: completionRate >= 100 ? new Date() : null,
        updatedAt: new Date()
      },
      create: {
        userId,
        ideaTitle,
        currentStage: currentStage || 'CONCEPTION',
        pillarProgress: {},
        stepsCompleted,
        totalSteps,
        completionRate,
        status: 'IN_PROGRESS'
      }
    });

    // Update user profile stats
    const userIdeasCount = await prisma.ideaProgression.count({
      where: { userId }
    });

    const userCompletedIdeasCount = await prisma.ideaProgression.count({
      where: { 
        userId,
        status: 'COMPLETED'
      }
    });

    await prisma.userProfile.upsert({
      where: { userId },
      update: {
        totalIdeasStarted: userIdeasCount,
        totalIdeasCompleted: userCompletedIdeasCount,
        lastActiveAt: new Date(),
        firstIdeaStartedAt: userIdeasCount === 1 ? new Date() : undefined,
        firstIdeaCompletedAt: userCompletedIdeasCount === 1 && completionRate >= 100 ? new Date() : undefined
      },
      create: {
        userId,
        userType: 'NON_TECHNICAL_FOUNDER',
        totalIdeasStarted: 1,
        totalIdeasCompleted: completionRate >= 100 ? 1 : 0,
        firstIdeaStartedAt: new Date(),
        firstIdeaCompletedAt: completionRate >= 100 ? new Date() : null
      }
    });

    // Create milestones
    if (userIdeasCount === 1) {
      await prisma.userMilestone.upsert({
        where: {
          userId_milestone: {
            userId,
            milestone: 'FIRST_IDEA_STARTED'
          }
        },
        update: {},
        create: {
          userId,
          milestone: 'FIRST_IDEA_STARTED'
        }
      });
    }

    if (userCompletedIdeasCount === 1 && completionRate >= 100) {
      await prisma.userMilestone.upsert({
        where: {
          userId_milestone: {
            userId,
            milestone: 'FIRST_IDEA_COMPLETED'
          }
        },
        update: {},
        create: {
          userId,
          milestone: 'FIRST_IDEA_COMPLETED'
        }
      });
    }

    return NextResponse.json({ 
      success: true, 
      ideaProgression,
      userStats: {
        totalIdeas: userIdeasCount,
        completedIdeas: userCompletedIdeasCount
      }
    });

  } catch (error) {
    console.error('Error tracking idea progress:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}