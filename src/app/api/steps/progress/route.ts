import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-stub.server'
import { prisma } from '@/lib/prisma'

// Step ids are slugs (setup-payments, make-goal-budget) or cuids
const STEP_ID = /^[a-z0-9-]{1,80}$/
const MAX_IDS = 100

/**
 * The signed-in user's progress on the steps asked for:
 * GET /api/steps/progress?ids=setup-payments,make-goal-budget
 * → { progress: { [stepId]: { completed, startedAt, userAnswer } } }
 *
 * The component portfolio reads its MAKE. votes from here, and GoalBudget its
 * milestones (SETUP. steps). A step with no progress is left out.
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const ids = [...new Set((request.nextUrl.searchParams.get('ids') ?? '').split(',').filter((id) => STEP_ID.test(id)))].slice(0, MAX_IDS)
    if (ids.length === 0) return NextResponse.json({ progress: {} })

    const rows = await prisma.userStepProgress.findMany({
      where: { userId, stepId: { in: ids } },
      select: { stepId: true, completed: true, startedAt: true, userAnswer: true },
    })

    return NextResponse.json({
      progress: Object.fromEntries(rows.map(({ stepId, ...rest }) => [stepId, rest])),
    })
  } catch (error) {
    console.error('Failed to read step progress:', error)
    return NextResponse.json({ error: 'Failed to read step progress' }, { status: 500 })
  }
}
