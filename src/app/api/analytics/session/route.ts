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
    const { action, pillarsUsed, pageViews } = data;

    if (action === 'start') {
      // Start a new session
      const session = await prisma.userSession.create({
        data: {
          userId,
          startedAt: new Date(),
          pillarsUsed: pillarsUsed || [],
          pageViews: pageViews || 1
        }
      });

      return NextResponse.json({ success: true, sessionId: session.id });

    } else if (action === 'end') {
      // End the most recent active session
      const activeSession = await prisma.userSession.findFirst({
        where: {
          userId,
          endedAt: null
        },
        orderBy: {
          startedAt: 'desc'
        }
      });

      if (activeSession) {
        const now = new Date();
        const duration = Math.floor((now.getTime() - activeSession.startedAt.getTime()) / 1000);

        await prisma.userSession.update({
          where: { id: activeSession.id },
          data: {
            endedAt: now,
            duration,
            pillarsUsed: pillarsUsed || activeSession.pillarsUsed,
            pageViews: pageViews || activeSession.pageViews
          }
        });

        // Update user profile last active time
        await prisma.userProfile.upsert({
          where: { userId },
          update: {
            lastActiveAt: now
          },
          create: {
            userId,
            userType: 'NON_TECHNICAL_FOUNDER',
            lastActiveAt: now
          }
        });

        // Check for retention milestones
        const userProfile = await prisma.userProfile.findUnique({
          where: { userId },
          select: { createdAt: true }
        });

        if (userProfile) {
          const daysSinceCreated = Math.floor((now.getTime() - userProfile.createdAt.getTime()) / (1000 * 60 * 60 * 24));
          
          const milestones: string[] = [];
          if (daysSinceCreated >= 7) milestones.push('RETENTION_7_DAYS');
          if (daysSinceCreated >= 30) milestones.push('RETENTION_30_DAYS');
          if (daysSinceCreated >= 90) milestones.push('RETENTION_90_DAYS');

          for (const milestone of milestones) {
            await prisma.userMilestone.upsert({
              where: {
                userId_milestone: {
                  userId,
                  milestone: milestone as 'RETENTION_7_DAYS' | 'RETENTION_30_DAYS' | 'RETENTION_90_DAYS'
                }
              },
              update: {},
              create: {
                userId,
                milestone: milestone as 'RETENTION_7_DAYS' | 'RETENTION_30_DAYS' | 'RETENTION_90_DAYS'
              }
            });
          }
        }
      }

      return NextResponse.json({ success: true });

    } else if (action === 'update') {
      // Update current session
      const activeSession = await prisma.userSession.findFirst({
        where: {
          userId,
          endedAt: null
        },
        orderBy: {
          startedAt: 'desc'
        }
      });

      if (activeSession) {
        await prisma.userSession.update({
          where: { id: activeSession.id },
          data: {
            pillarsUsed: pillarsUsed || activeSession.pillarsUsed,
            pageViews: pageViews || activeSession.pageViews + 1
          }
        });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Error managing session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}