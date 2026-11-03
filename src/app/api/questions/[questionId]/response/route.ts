import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth-stub.server'

/**
 * GET /api/questions/[questionId]/response
 * Fetches a user's response to a specific question
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ questionId: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { questionId } = await params
    
    // Find the user's response for this question
    const response = await prisma.userQuestionResponse.findFirst({
      where: {
        questionId: questionId,
        userId: userId
      },
      select: {
        id: true,
        questionId: true,
        responseData: true,
        updatedAt: true
      }
    })
    
    if (!response) {
      return NextResponse.json(
        { response: null },
        { status: 200 }
      )
    }
    
    return NextResponse.json({
      response: {
        questionId: response.questionId,
        responseData: response.responseData,
        completedAt: response.updatedAt
      }
    })
    
  } catch (error) {
    console.error('Failed to fetch question response:', error)
    return NextResponse.json(
      { error: 'Failed to fetch question response' },
      { status: 500 }
    )
  }
}
