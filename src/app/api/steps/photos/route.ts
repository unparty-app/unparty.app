import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth, clerkClient } from '@/lib/auth-stub.server'
import { isAdmin } from '@/lib/admin'
import { parsePhotoUploadBlobUrl } from '@/lib/step-progress'
import { Prisma } from '@prisma/client'

interface StepPhoto {
  id: string
  stepId: string
  word: string | null
  cover: string | null
  blobUrl: string
  completedAt: string | null
  uploader?: { firstName: string | null; lastName?: string | null; email?: string }
}

// Backs the reusable StepPhotoScrollRow component - one endpoint, two
// scopes. `mine` is the caller's own uploads (auth required). `everyone` is
// every completed photo-upload, with per-row uploader detail redacted to
// first-name-only unless the caller is an admin (isAdmin(), not a
// client-passed flag) - this keeps the same scope safe to use later from a
// public article, not just /admin.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const scope = searchParams.get('scope')
    const stepId = searchParams.get('stepId') || undefined

    if (scope !== 'mine' && scope !== 'everyone') {
      return NextResponse.json({ error: 'scope must be "mine" or "everyone"' }, { status: 400 })
    }

    const { userId } = await auth()

    if (scope === 'mine' && !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const where: Prisma.UserStepProgressWhereInput = {
      completed: true,
      ...(scope === 'mine' ? { userId: userId as string } : {}),
      ...(stepId ? { stepId } : {}),
      step: { metadata: { path: ['stepType'], equals: 'photo-upload' } }
    }

    const progress = await prisma.userStepProgress.findMany({
      where,
      include: { step: { select: { id: true, cover: true, metadata: true } } },
      orderBy: { completedAt: 'desc' },
      take: 100
    })

    const admin = scope === 'everyone' ? await isAdmin() : false

    const userMap = new Map<string, { firstName: string | null; lastName: string | null; email?: string }>()
    if (scope === 'everyone' && progress.length > 0) {
      const userIds = [...new Set(progress.map((p) => p.userId))]
      const client = await clerkClient()
      const clerkUsers = await Promise.all(
        userIds.map(async (id) => {
          try {
            return await client.users.getUser(id)
          } catch (error) {
            console.error(`Failed to fetch user ${id}:`, error)
            return null
          }
        })
      )
      clerkUsers.forEach((user) => {
        if (!user) return
        userMap.set(user.id, {
          firstName: user.firstName,
          lastName: admin ? user.lastName : null,
          email: admin
            ? user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress
            : undefined
        })
      })
    }

    const photos: StepPhoto[] = progress
      .map((p): StepPhoto | null => {
        const blobUrl = parsePhotoUploadBlobUrl(p.userAnswer)
        if (!blobUrl) return null
        const metadata = p.step.metadata as { uploadWord?: string } | null
        const uploader = scope === 'everyone' ? userMap.get(p.userId) : undefined
        return {
          id: p.id,
          stepId: p.stepId,
          word: metadata?.uploadWord ?? null,
          cover: p.step.cover,
          blobUrl,
          completedAt: p.completedAt ? p.completedAt.toISOString() : null,
          ...(scope === 'everyone'
            ? {
                uploader: {
                  firstName: uploader?.firstName ?? null,
                  ...(admin ? { lastName: uploader?.lastName ?? null, email: uploader?.email } : {})
                }
              }
            : {})
        }
      })
      .filter((p): p is StepPhoto => p !== null)

    return NextResponse.json({ photos })
  } catch (error) {
    console.error('Failed to fetch step photos:', error)
    return NextResponse.json({ error: 'Failed to fetch step photos' }, { status: 500 })
  }
}
