'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { X } from '@/app/components/icons';
import StepPhotoUpload, { type StepPhotoUploadStep } from './StepPhotoUpload';
import { useHydrated } from '@/hooks/useHydrated';
import { useTheme } from '@/app/contexts/ThemeContext';

// Rendered by the root @modal slot's intercepted (.)steps/[stepId] route -
// the same sleek, full-bleed lightbox treatment as WatchLightbox.tsx (see
// that file for the pattern this clones): portal to document.body, a
// near-opaque --background backdrop, close via router.back()/Esc/backdrop
// click, deliberately not the app's standard Modal.tsx chrome. The prompt
// sits in the page's usual max-w-5xl column, left-aligned. The upload UI itself lives in
// StepPhotoUpload, shared with the standalone /steps/[stepId] fallback page.
export default function PhotoUploadLightbox({
  step,
  initialBlobUrl,
  uploadsOn,
  isAdmin,
}: {
  step: StepPhotoUploadStep;
  initialBlobUrl: string | null;
  uploadsOn: boolean;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const mounted = useHydrated();
  const { colorValue } = useTheme();

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') router.back();
    };
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [router]);

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[70] overflow-y-auto px-4 pb-12 pt-24 sm:px-6 lg:px-12"
      style={{ backgroundColor: 'color-mix(in srgb, var(--background) 95%, transparent)' }}
      onClick={() => router.back()}
      role="dialog"
      aria-modal="true"
      aria-label={step.word ?? step.title}
    >
      <button
        type="button"
        onClick={(e) => {
          // Without this, the click bubbles to the backdrop's own onClick
          // below - double-firing router.back() (see WatchLightbox.tsx).
          e.stopPropagation();
          router.back();
        }}
        aria-label="Close"
        className="absolute right-4 top-4 z-10 flex size-10 items-center justify-center rounded-full border text-[var(--foreground)] transition-transform hover:scale-105"
        style={{ backgroundColor: 'var(--background)', borderColor: colorValue }}
      >
        <X className="size-5" />
      </button>

      <div className="mx-auto w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
        <StepPhotoUpload step={step} initialBlobUrl={initialBlobUrl} uploadsOn={uploadsOn} isAdmin={isAdmin} />

        {/* Plain <a>, not next/link - this modal IS the intercepted
            (.)steps/[stepId] segment, so a client-side Link to the same
            href would just re-render it (same caveat as WatchLightbox.tsx). */}
        <a
          href={`/steps/${step.id}`}
          className="mt-6 inline-block font-google-sans-code text-xs uppercase tracking-wider text-[var(--text-muted)] underline decoration-dotted underline-offset-4 hover:text-[var(--foreground)]"
        >
          full page →
        </a>
      </div>
    </div>,
    document.body
  );
}
