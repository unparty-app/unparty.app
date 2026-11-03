import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-stub.server'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/admin'
import { Prisma, Priority, StepStatus, StepVisibility } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const { userId, orgId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse query parameters for filtering and pagination
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const status = searchParams.get('status') // 'completed', 'incomplete', 'all'
    const priority = searchParams.get('priority') // 'HIGH', 'MEDIUM', 'LOW'
    const optional = searchParams.get('optional') // 'true', 'false', 'all'
    const limit = parseInt(searchParams.get('limit') || '50') // Default reasonable limit
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build where clause for steps with visibility filtering
    const stepWhere: Prisma.StepWhereInput = {
      OR: [
        { visibility: StepVisibility.ALL_USERS },
        { visibility: StepVisibility.ORGANIZATION_ONLY, organizationId: orgId },
        { 
          visibility: StepVisibility.CATEGORY_RESTRICTED,
          StepCategories: {
            some: {
              step_categories: {
                userAccess: {
                  some: { userId }
                }
              }
            }
          }
        }
      ]
    }
    
    if (search) {
      stepWhere.AND = [
        stepWhere,
        {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } }
          ]
        }
      ]
    }
    
    if (priority && priority !== 'all' && Object.values(Priority).includes(priority as Priority)) {
      stepWhere.priority = priority as Priority
    }
    
    if (optional === 'true') {
      stepWhere.optional = true
    } else if (optional === 'false') {
      stepWhere.optional = false
    }

    // Get steps with filtering and pagination
    const steps = await prisma.step.findMany({
      where: stepWhere,
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' }
      ],
      take: Math.min(limit, 100), // Cap at 100 for performance
      skip: offset,
      include: {
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
    })

    // Get user progress for these steps
    const userProgress = await prisma.userStepProgress.findMany({
      where: {
        userId,
        stepId: { in: steps.map(step => step.id) }
      }
    })

    // Create a map for quick lookup
    const progressMap = new Map(
      userProgress.map(progress => [progress.stepId, progress])
    )

    // Combine steps with user progress
    let stepsWithProgress = steps.map(step => {
      const stepMetadata = step.metadata as { stepType?: string; minTimeMinutes?: number; actionTrigger?: string } | null
      return {
        ...step,
        userProgress: progressMap.get(step.id) || null,
        stepType: stepMetadata?.stepType,
        minTimeMinutes: stepMetadata?.minTimeMinutes,
        actionTrigger: stepMetadata?.actionTrigger
      }
    })

    // Filter by completion status if requested
    if (status === 'completed') {
      stepsWithProgress = stepsWithProgress.filter(step => step.userProgress?.completed)
    } else if (status === 'incomplete') {
      stepsWithProgress = stepsWithProgress.filter(step => !step.userProgress?.completed)
    }

    return NextResponse.json(stepsWithProgress)
  } catch (error) {
    console.error('Failed to fetch steps:', error)
    return NextResponse.json(
      { error: 'Failed to fetch steps' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Step writes are admin-only (#1138): /admin/steps is the only caller
    if (!(await isAdmin())) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { id, title, description, optional, link, cover, icon, status, priority, dueDate, unpppId, metadata } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Step ID is required' },
        { status: 400 }
      )
    }

    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      )
    }

    const step = await prisma.step.update({
      where: { id },
      data: {
        title,
        description,
        optional: Boolean(optional),
        link: link || null,
        cover: cover || null,
        icon: icon || null,
        status: status as StepStatus,
        priority: priority as Priority,
        dueDate: dueDate ? new Date(dueDate) : null,
        unpppId: unpppId || null,
        // Round-trips the full metadata object the client fetched and
        // edited in place (see admin/steps/page.tsx's editingStep.metadata)
        // - previously dropped entirely, silently discarding stepType,
        // actionTrigger, minTimeMinutes, uploadWord, founderQuestions, etc.
        // on every edit.
        ...(metadata !== undefined ? { metadata } : {})
      }
    })

    return NextResponse.json(step)
  } catch (error) {
    console.error('Failed to update step:', error)
    return NextResponse.json(
      { error: 'Failed to update step' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Step writes are admin-only (#1138): /admin/steps is the only caller
    if (!(await isAdmin())) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Step ID is required' },
        { status: 400 }
      )
    }

    // First delete any user progress for this step
    await prisma.userStepProgress.deleteMany({
      where: { stepId: id }
    })

    // Then delete the step
    await prisma.step.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete step:', error)
    return NextResponse.json(
      { error: 'Failed to delete step' },
      { status: 500 }
    )
  }
}