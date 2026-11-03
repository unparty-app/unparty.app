import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth-stub.server'
import { Prisma, StepVisibility } from '@prisma/client'

// Registry lookup for step-backed ScrollRow images: given a batch of cover
// ids, returns which ones have a registered `stepType: 'photo-upload'` Step
// (created in /admin/steps with a matching `cover`). Works signed-out - a
// guest sees which images are registered (and can open the upload modal to
// see the sign-in prompt there) but never another user's completion state.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const coversParam = searchParams.get('covers')
    const coverIds = (coversParam || '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean)

    if (coverIds.length === 0) {
      return NextResponse.json({})
    }

    const { userId, orgId } = await auth()

    const stepWhere: Prisma.StepWhereInput = {
      cover: { in: coverIds },
      metadata: { path: ['stepType'], equals: 'photo-upload' },
      OR: [
        { visibility: StepVisibility.ALL_USERS },
        ...(userId
          ? [
              { visibility: StepVisibility.ORGANIZATION_ONLY, organizationId: orgId },
              {
                visibility: StepVisibility.CATEGORY_RESTRICTED,
                StepCategories: {
                  some: {
                    step_categories: {
                      userAccess: { some: { userId } }
                    }
                  }
                }
              }
            ]
          : [])
      ]
    }

    const steps = await prisma.step.findMany({ where: stepWhere })

    const progressByStepId = new Map<string, boolean>()
    if (userId && steps.length > 0) {
      const progress = await prisma.userStepProgress.findMany({
        where: { userId, stepId: { in: steps.map((s) => s.id) } },
        select: { stepId: true, completed: true }
      })
      progress.forEach((p) => progressByStepId.set(p.stepId, p.completed))
    }

    const registry: Record<string, { stepId: string; title: string; word: string | null; completed: boolean }> = {}
    steps.forEach((step) => {
      if (!step.cover) return
      const metadata = step.metadata as { uploadWord?: string } | null
      registry[step.cover] = {
        stepId: step.id,
        title: step.title,
        word: metadata?.uploadWord ?? null,
        completed: progressByStepId.get(step.id) ?? false
      }
    })

    return NextResponse.json(registry)
  } catch (error) {
    console.error('Failed to fetch step image registry:', error)
    return NextResponse.json({ error: 'Failed to fetch step image registry' }, { status: 500 })
  }
}
