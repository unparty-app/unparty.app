import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { findPhotoUploadStep } from '@/lib/photo-steps';
import { auth } from '@/lib/auth-stub.server';
import { parsePhotoUploadBlobUrl } from '@/lib/step-progress';
import { blobStoreConnected } from '@/lib/blob-store';
import { isAdmin } from '@/lib/admin';
import StepPhotoUpload from '../../components/StepPhotoUpload';

interface Props {
  params: Promise<{ stepId: string }>;
}

// Standalone counterpart of the intercepted (.)steps/[stepId] modal - a real
// page for direct navigation/refresh, mirroring /watch/[slug]/page.tsx's
// relationship to WatchModal. Same upload UI (StepPhotoUpload), on the
// site's own background in the usual left-aligned max-w-5xl column.
export default async function StepUploadPage({ params }: Props) {
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
    <div className="px-4 py-16 sm:px-6 lg:px-12">
      <div className="mx-auto w-full max-w-5xl">
        <StepPhotoUpload
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
      </div>
    </div>
  );
}
