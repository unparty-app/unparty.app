import { dbOn, noDatabase } from '@/lib/db-on';
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-stub.server'
import { prisma } from '@/lib/prisma'

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ stepId: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    if (!dbOn()) return noDatabase()

    const { stepId } = await context.params
    const body = await _request.json().catch(() => ({}))
    const { userAnswer } = body

    // Check if step exists
    const step = await prisma.step.findUnique({
      where: { id: stepId }
    })

    if (!step) {
      return NextResponse.json(
        { error: 'Step not found' },
        { status: 404 }
      )
    }

    // Create or update user progress
    const progress = await prisma.userStepProgress.upsert({
      where: {
        userId_stepId: {
          userId,
          stepId
        }
      },
      update: {
        completed: true,
        completedAt: new Date(),
        ...(userAnswer !== undefined && { userAnswer })
      },
      create: {
        userId,
        stepId,
        completed: true,
        completedAt: new Date(),
        ...(userAnswer !== undefined && { userAnswer })
      }
    })

    return NextResponse.json(progress)
  } catch (error) {
    console.error('Failed to complete step:', error)
    return NextResponse.json(
      { error: 'Failed to complete step' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ stepId: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    if (!dbOn()) return noDatabase()

    const { stepId } = await context.params

    // Remove completion
    await prisma.userStepProgress.updateMany({
      where: {
        userId,
        stepId
      },
      data: {
        completed: false,
        completedAt: null
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to uncomplete step:', error)
    return NextResponse.json(
      { error: 'Failed to uncomplete step' },
      { status: 500 }
    )
  }
}