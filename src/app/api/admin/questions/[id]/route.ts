import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-stub.server'
import { prisma } from '@/lib/prisma'
import { adminGuard } from '@/lib/admin'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    const question = await prisma.question.findUnique({
      where: { id },
      include: {
        step: true,
        _count: {
          select: {
            responses: true
          }
        }
      }
    })

    if (!question) {
      return NextResponse.json(
        { error: '👾 oh no, nothing here. unparty-app is MEH!' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: question.id,
      text: question.text,
      type: question.type,
      choices: question.choices,
      model: question.model,
      audience: question.audience,
      order: question.order,
      responseCount: question._count.responses,
      step: {
        id: question.step.id,
        title: question.step.title,
        category: question.step.category
      }
    })
  } catch (error) {
    console.error('Failed to fetch question:', error)
    return NextResponse.json(
      { error: 'Failed to fetch question' },
      { status: 500 }
    )
  }
}

export async function PUT(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    const { text, type, choices, model, audience, order } = await _request.json()

    const question = await prisma.question.update({
      where: { id },
      data: {
        ...(text !== undefined && { text }),
        ...(type !== undefined && { type: type.toUpperCase() }),
        ...(choices !== undefined && { choices }),
        ...(model !== undefined && { model }),
        ...(audience !== undefined && { audience }),
        ...(order !== undefined && { order })
      },
      include: {
        step: true,
        _count: {
          select: {
            responses: true
          }
        }
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
        responseCount: question._count.responses,
        step: {
          id: question.step.id,
          title: question.step.title,
          category: question.step.category
        }
      }
    })
  } catch (error) {
    console.error('Failed to update question:', error)
    return NextResponse.json(
      { error: 'Failed to update question' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    
    // Check if question has responses
    const responseCount = await prisma.userQuestionResponse.count({
      where: { questionId: id }
    })

    if (responseCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete question with ${responseCount} user responses` },
        { status: 400 }
      )
    }

    await prisma.question.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Question deleted successfully'
    })
  } catch (error) {
    console.error('Failed to delete question:', error)
    return NextResponse.json(
      { error: 'Failed to delete question' },
      { status: 500 }
    )
  }
}