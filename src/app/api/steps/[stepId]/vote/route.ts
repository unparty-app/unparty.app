import { dbOn, noDatabase } from '@/lib/db-on';
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-stub.server'
import { prisma } from '@/lib/prisma'

const VOTES = ['more', 'meh', 'nah'] as const
type Vote = (typeof VOTES)[number]

/**
 * Saves the signed-in user's vote on a component, in their progress on its
 * MAKE. step (prisma/make-steps.ts): POST { vote: 'more' | 'meh' | 'nah' | null }.
 * The vote lives in userAnswer as { "vote": "more" }; null takes it back.
 * A first MORE. also starts the step (startedAt). Completing it stays with
 * the step: a MAKE. step is done when its component's article is published.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ stepId: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!dbOn()) return noDatabase()

    const { stepId } = await context.params
    if (!stepId.startsWith('make-')) {
      return NextResponse.json({ error: 'Only MAKE. steps take a vote' }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))
    const vote: Vote | null = VOTES.includes(body?.vote) ? body.vote : null
    if (body?.vote !== null && vote === null) {
      return NextResponse.json({ error: 'vote must be more, meh, nah or null' }, { status: 400 })
    }

    const step = await prisma.step.findUnique({ where: { id: stepId }, select: { id: true } })
    if (!step) {
      // Not seeded on this copy yet (npm run db:seed:make)
      return NextResponse.json({ error: 'Step not found' }, { status: 404 })
    }

    const existing = await prisma.userStepProgress.findUnique({
      where: { userId_stepId: { userId, stepId } },
      select: { startedAt: true },
    })
    const userAnswer = vote ? JSON.stringify({ vote }) : null
    const startedAt = existing?.startedAt ?? (vote === 'more' ? new Date() : null)

    await prisma.userStepProgress.upsert({
      where: { userId_stepId: { userId, stepId } },
      update: { userAnswer, startedAt },
      create: { userId, stepId, userAnswer, startedAt },
    })

    return NextResponse.json({ stepId, vote })
  } catch (error) {
    console.error('Failed to save vote:', error)
    return NextResponse.json({ error: 'Failed to save vote' }, { status: 500 })
  }
}
