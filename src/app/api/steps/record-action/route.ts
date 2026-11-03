import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-stub.server'
import { recordActionForUser } from '@/lib/step-progress'

/**
 * Records that a named action happened for the current user, and completes
 * any action-based steps whose metadata.actionTrigger matches.
 *
 * Call this from wherever a real action actually happens in the app, e.g.:
 *   fetch('/api/steps/record-action', { method: 'POST', body: JSON.stringify({ actionTrigger: 'connected_github' }) })
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { actionTrigger } = await request.json()

    if (!actionTrigger || typeof actionTrigger !== 'string') {
      return NextResponse.json(
        { error: 'actionTrigger is required' },
        { status: 400 }
      )
    }

    const completedSteps = await recordActionForUser(userId, actionTrigger)

    return NextResponse.json({ actionTrigger, completedSteps })
  } catch (error) {
    console.error('Failed to record action:', error)
    return NextResponse.json(
      { error: 'Failed to record action' },
      { status: 500 }
    )
  }
}
