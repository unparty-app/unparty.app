import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma, StepVisibility } from '@prisma/client'

export const revalidate = 3600

/**
 * Public, unauthenticated read of a unppp's ALL_USERS steps —
 * `/api/steps` requires a signed-in user, but the /theunparty* showcase
 * pages that embed these (via AboutComponent) are public.
 *
 * Pass `unpppId=all` to read ALL_USERS steps across every unppp (steps with
 * no unpppId, e.g. founder-onboarding questions, are excluded) — for a
 * story that wants to showcase the whole ecosystem's steps rather than one
 * unppp's, like unparty-app.ts.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ unpppId: string }> }) {
  const { unpppId } = await params

  const where: Prisma.StepWhereInput =
    unpppId === 'all'
      ? { unpppId: { not: null }, visibility: StepVisibility.ALL_USERS }
      : { unpppId, visibility: StepVisibility.ALL_USERS }

  const steps = await prisma.step.findMany({
    where,
    take: 50,
    select: {
      id: true,
      title: true,
      description: true,
      cover: true,
      icon: true,
      link: true,
      questions: {
        where: { audience: 'published' },
        orderBy: { order: 'asc' },
        select: { id: true, text: true, type: true, choices: true },
      },
    },
    orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
  })

  return NextResponse.json({ steps })
}
