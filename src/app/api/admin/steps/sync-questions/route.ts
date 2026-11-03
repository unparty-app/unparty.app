import { NextRequest, NextResponse } from 'next/server'
import { adminGuard } from '@/lib/admin'
import { syncFounderQuestions } from '@/lib/syncFounderQuestions'

interface SyncQuestionsRequest {
  stepId: string
  founderQuestionIds: string[]
}

/**
 * POST /api/admin/steps/sync-questions
 * Syncs founder questions from foundersquestions.json to the database
 * Creates or updates Question records and associates them with a Step
 */
export async function POST(request: NextRequest) {
  try {
    const denied = await adminGuard()
    if (denied) return denied
    
    const body: SyncQuestionsRequest = await request.json()
    const { stepId, founderQuestionIds } = body
    
    if (!stepId || !Array.isArray(founderQuestionIds)) {
      return NextResponse.json(
        { error: 'stepId and founderQuestionIds array are required' },
        { status: 400 }
      )
    }
    
    const result = await syncFounderQuestions(stepId, founderQuestionIds)
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 404 }
      )
    }
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('Failed to sync founder questions:', error)
    return NextResponse.json(
      { error: 'Failed to sync founder questions' },
      { status: 500 }
    )
  }
}
