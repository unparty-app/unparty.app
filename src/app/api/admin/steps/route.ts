import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { adminGuard } from '@/lib/admin'
import { StepStatus, Priority, StepVisibility } from '@prisma/client'
import { clerkClient } from '@/lib/auth-stub.server'
import { syncFounderQuestions } from '@/lib/syncFounderQuestions'

export async function GET(request: NextRequest) {
  try {
    const denied = await adminGuard()
    if (denied) return denied
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status') as StepStatus | null
    const priority = searchParams.get('priority') as Priority | null
    const search = searchParams.get('search')
    
    const skip = (page - 1) * limit
    
    const where = {
      ...(status && { status }),
      ...(priority && { priority }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } }
        ]
      })
    }
    
    const filteredWhere = {
      ...where,
      questions: { none: {} }
    }

    const [steps, total] = await Promise.all([
      prisma.step.findMany({
        where: filteredWhere,
        skip,
        take: limit,
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'asc' }
        ],
        include: {
          userProgress: {
            select: {
              userId: true,
              completed: true,
              startedAt: true,
              completedAt: true
            }
          },
          questions: {
            select: {
              id: true,
              text: true,
              type: true
            }
          },
          StepCategories: {
            include: {
              step_categories: {
                select: {
                  id: true,
                  name: true,
                  color: true
                }
              }
            }
          }
        }
      }),
      prisma.step.count({ where: filteredWhere })
    ])
    
    // Get all unique user IDs from progress data
    const allUserIds = [...new Set(steps.flatMap(step => step.userProgress.map(p => p.userId)))]
    
    // Fetch user data from Clerk
    const client = await clerkClient()
    const clerkUsers = allUserIds.length > 0 ? await Promise.all(
      allUserIds.map(async (userId) => {
        try {
          const user = await client.users.getUser(userId)
          return user
        } catch (error) {
          console.error(`Failed to fetch user ${userId}:`, error)
          return null
        }
      })
    ) : []
    
    // Create a map for quick user lookup
    const userMap = new Map(
      clerkUsers.filter(Boolean).map(user => [user!.id, user])
    )

    // Add progress statistics to each step
    const stepsWithStats = steps.map(step => {
      const progressStats = {
        totalUsers: step.userProgress.length,
        completedUsers: step.userProgress.filter(p => p.completed).length,
        startedUsers: step.userProgress.filter(p => !p.completed && p.startedAt).length,
        notStartedUsers: step.userProgress.filter(p => !p.startedAt).length
      }
      
      return {
        ...step,
        progressStats,
        // Transform StepCategories join table into flat categories array
        categories: step.StepCategories?.map(sc => sc.step_categories) || [],
        userProgress: step.userProgress.map(progress => {
          const clerkUser = userMap.get(progress.userId)
          return {
            ...progress,
            user: {
              id: progress.userId,
              firstName: clerkUser?.firstName || 'Unknown',
              lastName: clerkUser?.lastName || 'User',
              email: clerkUser?.emailAddresses.find(e => e.id === clerkUser.primaryEmailAddressId)?.emailAddress || 'No email'
            }
          }
        })
      }
    })

    return NextResponse.json({
      steps: stepsWithStats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Admin steps fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch steps' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const denied = await adminGuard()
    if (denied) return denied
    
    const body = await request.json()
    const { title, description, category, optional, status, priority, dueDate, link, cover, icon, organizationId, visibility, categoryIds, metadata, founderQuestionIds, unpppId, stepType, minTimeMinutes, actionTrigger, uploadWord } = body

    // Prepare metadata object
    const stepMetadata = metadata || {}
    if (founderQuestionIds && Array.isArray(founderQuestionIds) && founderQuestionIds.length > 0) {
      stepMetadata.founderQuestions = founderQuestionIds
    }
    if (stepType) {
      stepMetadata.stepType = stepType
    }
    if (stepType === 'time-based' && minTimeMinutes) {
      stepMetadata.minTimeMinutes = minTimeMinutes
    }
    if (stepType === 'action-based' && actionTrigger) {
      stepMetadata.actionTrigger = actionTrigger
    }
    if (stepType === 'photo-upload' && uploadWord) {
      stepMetadata.uploadWord = uploadWord
    }
    
    const step = await prisma.step.create({
      data: {
        title,
        description,
        category: category || 'GENERAL',
        optional: optional || false,
        link,
        cover: cover || null,
        icon: icon || null,
        status: status || 'PENDING',
        priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null,
        organizationId: organizationId || null,
        visibility: visibility || StepVisibility.ALL_USERS,
        unpppId: unpppId || null,
        metadata: Object.keys(stepMetadata).length > 0 ? stepMetadata : undefined,
        StepCategories: categoryIds?.length > 0 ? {
          create: categoryIds.map((id: string) => ({ B: id }))
        } : undefined
      },
      include: {
        StepCategories: {
          include: {
            step_categories: true
          }
        },
        questions: true
      }
    })
    
    // Sync founder questions to database if provided
    if (founderQuestionIds && Array.isArray(founderQuestionIds) && founderQuestionIds.length > 0) {
      try {
        const syncResult = await syncFounderQuestions(step.id, founderQuestionIds)
        if (!syncResult.success) {
          console.error('Failed to sync founder questions:', syncResult.error)
        }
      } catch (syncError) {
        console.error('Error syncing founder questions:', syncError)
        // Don't fail the step creation if sync fails
      }
    }
    
    return NextResponse.json(step, { status: 201 })
  } catch (error) {
    console.error('Admin step creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create step' },
      { status: 500 }
    )
  }
}