import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-stub.server'
import { prisma } from '@/lib/prisma'
import { adminGuard } from '@/lib/admin'

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const denied = await adminGuard()
  if (denied) return denied

  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const categoryFilter = searchParams.get('category')
    const audienceFilter = searchParams.get('audience')

    // Get questions with their step information
    const questions = await prisma.question.findMany({
      where: {
        ...(categoryFilter && {
          step: {
            category: categoryFilter.toUpperCase()
          }
        }),
        ...(audienceFilter && {
          audience: audienceFilter
        })
      },
      include: {
        step: {
          select: {
            id: true,
            title: true,
            category: true
          }
        },
        _count: {
          select: {
            responses: true
          }
        }
      },
      orderBy: [
        { step: { category: 'asc' } },
        { order: 'asc' }
      ]
    })

    // Get categories summary
    const categories = await prisma.step.findMany({
      include: {
        _count: {
          select: {
            questions: audienceFilter ? {
              where: {
                audience: audienceFilter
              }
            } : true
          }
        }
      },
      orderBy: {
        category: 'asc'
      }
    })

    return NextResponse.json({
      questions: questions.map(q => ({
        id: q.id,
        text: q.text,
        type: q.type,
        choices: q.choices,
        model: q.model,
        audience: q.audience,
        order: q.order,
        responseCount: q._count.responses,
        step: {
          id: q.step.id,
          title: q.step.title,
          category: q.step.category
        }
      })),
      // Every step a question can belong to. unpppId marks a project's step:
      // its questions open with that step on the project's page (StepModal)
      categories: categories.map(c => ({
        id: c.id,
        category: c.category,
        title: c.title,
        unpppId: c.unpppId,
        questionCount: c._count.questions
      }))
    })
  } catch (error) {
    console.error('Failed to fetch admin questions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const denied = await adminGuard()
  if (denied) return denied

  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { stepId, text, type, choices, model, audience, order } = await request.json()

    if (!stepId || !text || !type || !model || !audience) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Generate a unique ID for the question
    const step = await prisma.step.findUnique({
      where: { id: stepId }
    })

    if (!step) {
      return NextResponse.json(
        { error: 'Step not found' },
        { status: 404 }
      )
    }

    // Create a question ID based on category and order; a project step's
    // questions take the project's id instead, so they can't collide with a
    // category's questions of the same order
    const categoryPrefix = (step.unpppId ?? step.category).toLowerCase()
    const questionId = `${categoryPrefix}_q${order || Date.now()}`

    const question = await prisma.question.create({
      data: {
        id: questionId,
        stepId,
        text,
        type: type.toUpperCase(),
        choices: choices || [],
        model,
        audience,
        order: order || 0
      },
      include: {
        step: true
      }
    })

    return NextResponse.json({
      success: true,
      question: {
        id: question.id,
        text: question.text,
        type: question.type,
        choices: question.choices,
        model: question.model,
        audience: question.audience,
        order: question.order,
        step: {
          id: question.step.id,
          title: question.step.title,
          category: question.step.category
        }
      }
    })
  } catch (error) {
    console.error('Failed to create question:', error)
    return NextResponse.json(
      { error: 'Failed to create question' },
      { status: 500 }
    )
  }
}