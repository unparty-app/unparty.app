import { prisma } from '@/lib/prisma'

/**
 * Marks a step complete for a user, creating or updating their
 * UserStepProgress record. No-ops if already completed.
 */
export async function completeStepForUser(
  userId: string,
  stepId: string,
  completionData: Record<string, unknown>
): Promise<void> {
  const existingProgress = await prisma.userStepProgress.findFirst({
    where: { userId, stepId }
  })

  if (existingProgress?.completed) {
    return
  }

  if (existingProgress) {
    await prisma.userStepProgress.update({
      where: { id: existingProgress.id },
      data: {
        completed: true,
        completedAt: new Date(),
        userAnswer: JSON.stringify(completionData)
      }
    })
  } else {
    await prisma.userStepProgress.create({
      data: {
        userId,
        stepId,
        completed: true,
        completedAt: new Date(),
        startedAt: new Date(),
        userAnswer: JSON.stringify(completionData)
      }
    })
  }
}

/**
 * Records that a named action happened for a user, and completes any
 * action-based steps whose metadata.actionTrigger matches. Returns the ids
 * of steps newly completed by this call.
 */
export async function recordActionForUser(userId: string, actionTrigger: string): Promise<string[]> {
  const matchingSteps = await prisma.step.findMany({
    where: {
      metadata: {
        path: ['actionTrigger'],
        equals: actionTrigger
      }
    },
    include: {
      userProgress: {
        where: { userId },
        take: 1
      }
    }
  })

  const completedSteps: string[] = []

  for (const step of matchingSteps) {
    if (step.userProgress[0]?.completed) {
      continue
    }
    await completeStepForUser(userId, step.id, {
      completionType: 'action',
      actionTrigger
    })
    completedSteps.push(step.id)
  }

  return completedSteps
}

/**
 * Marks a photo-upload step complete for a user, always overwriting the
 * stored photo (unlike completeStepForUser, which no-ops once completed) -
 * a deliberate re-upload should replace the previous photo.
 */
export async function setStepPhotoForUser(userId: string, stepId: string, blobUrl: string): Promise<void> {
  const existingProgress = await prisma.userStepProgress.findFirst({
    where: { userId, stepId }
  })

  const completionData = { completionType: 'photo-upload', blobUrl }

  if (existingProgress) {
    await prisma.userStepProgress.update({
      where: { id: existingProgress.id },
      data: {
        completed: true,
        completedAt: new Date(),
        userAnswer: JSON.stringify(completionData)
      }
    })
  } else {
    await prisma.userStepProgress.create({
      data: {
        userId,
        stepId,
        completed: true,
        completedAt: new Date(),
        startedAt: new Date(),
        userAnswer: JSON.stringify(completionData)
      }
    })
  }
}

/**
 * Extracts the stored blob URL from a photo-upload step's UserStepProgress
 * (userAnswer is the JSON.stringify'd completionData from
 * setStepPhotoForUser above).
 */
export function parsePhotoUploadBlobUrl(userAnswer: string | null | undefined): string | null {
  if (!userAnswer) return null
  try {
    const parsed = JSON.parse(userAnswer)
    return typeof parsed?.blobUrl === 'string' ? parsed.blobUrl : null
  } catch {
    return null
  }
}
