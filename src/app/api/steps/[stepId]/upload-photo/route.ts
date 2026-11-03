import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { auth } from '@/lib/auth-stub.server'
import { prisma } from '@/lib/prisma'
import { setStepPhotoForUser } from '@/lib/step-progress'
import { blobStoreConnected } from '@/lib/blob-store'
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_LABEL, SIGNED_OUT, UPLOADS_OFF } from '@/lib/upload-limits'

interface Params {
  params: Promise<{ stepId: string }>
}

// Authenticated photo upload for a `stepType: 'photo-upload'` Step - the
// step-image click-to-upload flow. Requires sign-in (this is the
// "authentication required" gate for the feature); on success the step is
// marked complete for the uploading user via setStepPhotoForUser.
//
// Errors carry a `code` StepPhotoUpload turns into a next step instead of a
// message: no Blob store connected (the site can't take photos yet) or no
// session (sign in again).
export async function POST(request: NextRequest, { params }: Params) {
  try {
    if (!blobStoreConnected()) {
      return NextResponse.json(
        { error: "this site isn't taking photos yet.", code: UPLOADS_OFF },
        { status: 503 }
      )
    }

    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'sign in again to upload.', code: SIGNED_OUT }, { status: 401 })
    }

    const { stepId } = await params

    const step = await prisma.step.findUnique({ where: { id: stepId } })
    if (!step) {
      return NextResponse.json({ error: 'Step not found' }, { status: 404 })
    }

    const stepMetadata = step.metadata as { stepType?: string } | null
    if (stepMetadata?.stepType !== 'photo-upload') {
      return NextResponse.json({ error: 'Step is not a photo-upload step' }, { status: 400 })
    }

    const filename = new URL(request.url).searchParams.get('filename')
    if (!filename || !request.body) {
      return NextResponse.json({ error: 'filename and file body are required' }, { status: 400 })
    }

    if (!request.headers.get('content-type')?.startsWith('image/')) {
      return NextResponse.json({ error: 'only photos can be uploaded here.' }, { status: 415 })
    }

    if (Number(request.headers.get('content-length') ?? 0) > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: `photos up to ${MAX_UPLOAD_LABEL}.` }, { status: 413 })
    }

    const blob = await put(`step-photos/${stepId}/${userId}-${Date.now()}-${filename}`, request.body, {
      access: 'public'
    })

    await setStepPhotoForUser(userId, stepId, blob.url)

    return NextResponse.json({ blobUrl: blob.url })
  } catch (error) {
    console.error('Failed to upload step photo:', error)
    return NextResponse.json({ error: "that photo didn't go through. try again in a moment." }, { status: 500 })
  }
}
