import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-stub.server'
import { prisma } from '@/lib/prisma'
import { completeStepForUser } from '@/lib/step-progress'

/**
 * Checks and updates step completion based on actual requirements
 * Called automatically when users complete questions or take actions
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, orgId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { stepId } = await request.json()

    if (!stepId) {
      return NextResponse.json(
        { error: 'Step ID is required' },
        { status: 400 }
      )
    }

    // Get step with its questions and current user progress
    const step = await prisma.step.findUnique({
      where: { id: stepId },
      include: {
        questions: {
          where: {
            audience: 'published' // Only count published questions
          }
        },
        userProgress: {
          where: { userId },
          take: 1
        }
      }
    })

    if (!step) {
      return NextResponse.json(
        { error: 'Step not found' },
        { status: 404 }
      )
    }

    const stepMetadata = step.metadata as { stepType?: string; minTimeMinutes?: number } | null
    const existingProgress = step.userProgress[0]

    // Check completion based on step type
    let isCompleted = false
    let completionData: {
      questionsTotal?: number
      questionsAnswered?: number
      completionType: string
      requiresManualCompletion?: boolean
    } = { completionType: 'unknown' }

    if (step.questions.length > 0) {
      // Question-based step: Check if all published questions are answered
      const userResponses = await prisma.userQuestionResponse.findMany({
        where: {
          userId,
          organizationId: orgId ?? null,
          questionId: {
            in: step.questions.map(q => q.id)
          }
        }
      })

      isCompleted = userResponses.length === step.questions.length
      completionData = {
        questionsTotal: step.questions.length,
        questionsAnswered: userResponses.length,
        completionType: 'questions'
      }
    } else if (stepMetadata?.stepType === 'time-based' && stepMetadata.minTimeMinutes) {
      // Time-based step: auto-complete once minTimeMinutes has elapsed since starting
      isCompleted = !!existingProgress?.startedAt &&
        Date.now() - new Date(existingProgress.startedAt).getTime() >= stepMetadata.minTimeMinutes * 60_000
      completionData = {
        completionType: 'time',
        requiresManualCompletion: false
      }
    } else if (step.link) {
      // Link-based step: Could track link visits (would need additional tracking)
      // For now, keep manual completion for link-based steps
      completionData = {
        completionType: 'link',
        requiresManualCompletion: true
      }
    } else {
      // Action-based or custom completion logic
      completionData = {
        completionType: 'custom',
        requiresManualCompletion: true
      }
    }

    // Update or create user progress
    if (isCompleted && !existingProgress?.completed) {
      await completeStepForUser(userId, stepId, completionData)
    } else if (!isCompleted && existingProgress?.completed) {
      // Mark as incomplete (user removed answers)
      await prisma.userStepProgress.update({
        where: { id: existingProgress.id },
        data: {
          completed: false,
          completedAt: null,
          userAnswer: JSON.stringify(completionData)
        }
      })
    } else if (!existingProgress && !isCompleted) {
      // Create progress record to track that user started
      await prisma.userStepProgress.create({
        data: {
          userId,
          stepId,
          completed: false,
          startedAt: new Date(),
          userAnswer: JSON.stringify(completionData)
        }
      })
    }

    return NextResponse.json({
      stepId,
      completed: isCompleted,
      ...completionData
    })

  } catch (error) {
    console.error('Failed to check step completion:', error)
    return NextResponse.json(
      { error: 'Failed to check completion' },
      { status: 500 }
    )
  }
}

/**
 * Bulk check completion for all user's steps
 */
export async function GET() {
  try {
    const { userId, orgId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get all steps user has access to
    const steps = await prisma.step.findMany({
      where: {
        OR: [
          { visibility: 'ALL_USERS' },
          { visibility: 'ORGANIZATION_ONLY', organizationId: orgId }
        ]
      },
      include: {
        questions: {
          where: {
            audience: 'published'
          }
        }
      }
    })

    const completionChecks = []

    for (const step of steps) {
      if (step.questions.length > 0) {
        // Check question-based completion
        const userResponses = await prisma.userQuestionResponse.findMany({
          where: {
            userId,
            organizationId: orgId ?? null,
            questionId: {
              in: step.questions.map(q => q.id)
            }
          }
        })

        const isCompleted = userResponses.length === step.questions.length

        completionChecks.push({
          stepId: step.id,
          completed: isCompleted,
          questionsTotal: step.questions.length,
          questionsAnswered: userResponses.length,
          completionType: 'questions'
        })
      }
    }

    return NextResponse.json({
      completionChecks,
      totalSteps: steps.length,
      questionBasedSteps: completionChecks.length
    })

  } catch (error) {
    console.error('Failed to bulk check completions:', error)
    return NextResponse.json(
      { error: 'Failed to check completions' },
      { status: 500 }
    )
  }
}