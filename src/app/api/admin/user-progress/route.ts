import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { adminGuard } from '@/lib/admin'

export async function GET(request: NextRequest) {
  try {
    const denied = await adminGuard()
    if (denied) return denied

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const userId = searchParams.get('userId')

    const skip = (page - 1) * limit

    const where = {
      ...(userId && { userId })
    }

    const [userProfiles, total] = await Promise.all([
      prisma.userProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { lastActiveAt: 'desc' },
        include: {
          milestones: true,
          ideaProgression: true,
          sessions: {
            orderBy: { startedAt: 'desc' },
            take: 5
          }
        }
      }),
      prisma.userProfile.count({ where })
    ])

    return NextResponse.json({
      userProfiles,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Failed to fetch user progress:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user progress' },
      { status: 500 }
    )
  }
}
