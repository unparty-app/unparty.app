import { NextResponse } from 'next/server'
import { computeUnpppPriorityScores } from '@/lib/unppp-priority-scores'

// Recomputes a Prisma query + full-set percentile pass — this route is hit
// from a component that renders on every page, so cache rather than
// recompute per-request.
export const revalidate = 300

export async function GET() {
  try {
    const unppps = await computeUnpppPriorityScores()
    return NextResponse.json({ unppps })
  } catch (error) {
    console.error('Failed to compute unppp priority score:', error)
    return NextResponse.json(
      { error: 'Failed to compute unppp priority score' },
      { status: 500 }
    )
  }
}
