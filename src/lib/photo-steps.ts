import { prisma } from '@/lib/prisma';

/**
 * The step a /steps/[stepId] page serves, or null: it must exist and be a
 * photo-upload step. One rule for the page, its modal twin and the
 * proxy's check (GET /api/steps/exists), so they can't disagree.
 */
export async function findPhotoUploadStep(stepId: string) {
  const step = await prisma.step.findUnique({ where: { id: stepId } });
  const metadata = step?.metadata as { stepType?: string; uploadWord?: string } | null;
  if (!step || metadata?.stepType !== 'photo-upload') return null;
  return { step, metadata };
}
