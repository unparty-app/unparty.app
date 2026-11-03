import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { findPhotoUploadStep } from '@/lib/photo-steps';
import { auth } from '@/lib/auth-stub.server';
import { parsePhotoUploadBlobUrl } from '@/lib/step-progress';
import { blobStoreConnected } from '@/lib/blob-store';
import { isAdmin } from '@/lib/admin';
import PhotoUploadLightbox from '../../../components/PhotoUploadLightbox';

interface Props {
  params: Promise<{ stepId: string }>;
}

// Intercepted counterpart of /steps/[stepId]/page.tsx, mirroring the
// (.)watch/[slug] video pattern (see that route) - rendered instead of the
// full page when navigation happens client-side (a Link from a ScrollRow
// image registered against this step); a direct/hard navigation or refresh
// still resolves the real page, since there's no client router state to
// intercept from.
export default async function StepUploadModal({ params }: Props) {
  const { stepId } = await params;

  const found = await findPhotoUploadStep(stepId);
  if (!found) {
    notFound();
  }
  const { step, metadata } = found;

  const { userId } = await auth();
  const progress = userId
    ? await prisma.userStepProgress.findFirst({ where: { userId, stepId } })
    : null;

  return (
    <PhotoUploadLightbox
      step={{
        id: step.id,
        title: step.title,
        description: step.description,
        word: metadata?.uploadWord ?? null,
      }}
      initialBlobUrl={parsePhotoUploadBlobUrl(progress?.userAnswer)}
      uploadsOn={blobStoreConnected()}
      isAdmin={userId ? await isAdmin() : false}
    />
  );
}
