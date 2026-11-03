'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { track } from '@vercel/analytics';

import { Check, Upload } from '@/app/components/icons';
import { useAuth, useUser, SignInButton } from '@/lib/auth-stub.client';
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_LABEL, SIGNED_OUT, UPLOADS_OFF } from '@/lib/upload-limits';
import { FOUNDER_CTA } from '@/app/constants/organization';
import { useTheme } from '@/app/contexts/ThemeContext';
import { BuildBrain, BuildLettering, BUILD_YOURS_DONE, inkOn } from './build-yours/BuildYours';

export interface StepPhotoUploadStep {
  id: string;
  title: string;
  description: string;
  word: string | null;
}

// Shared upload UI for a `stepType: 'photo-upload'` Step - the word/prompt,
// an inline sign-in gate for guests, and the upload control itself. Used by
// both PhotoUploadLightbox (the intercepted-route modal) and the standalone
// /steps/[stepId] fallback page, so the upload flow and auth gate stay
// identical whether the step opens as a modal or a hard-navigated page.
// Themed like the rest of the site: --foreground / --text-muted text on
// --background (both call sites), the theme color for borders and accents,
// and left-aligned.
//
// The prompt always shows. When the site has no Blob store (`uploadsOn`
// false, or the route answers uploads-off), the upload control becomes the
// next step instead of an error: the owner gets the setup article, a visitor
// the site's "build yours" ask, since a prompt that can't take photos here is
// exactly what their own copy would do. A lapsed session refreshes and
// retries once before asking anyone to sign in again.
export default function StepPhotoUpload({
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
  const { isSignedIn } = useUser();
  const { getToken } = useAuth();
  const { colorValue } = useTheme();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [off, setOff] = useState(!uploadsOn);
  const [sessionLapsed, setSessionLapsed] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(initialBlobUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    // Checked here too: above the limit, Vercel answers before our route can
    if (file.size > MAX_UPLOAD_BYTES) {
      setError(`photos up to ${MAX_UPLOAD_LABEL}. try a smaller one.`);
      return;
    }
    setUploading(true);
    setError(null);
    const send = () =>
      fetch(`/api/steps/${step.id}/upload-photo?filename=${encodeURIComponent(file.name)}`, {
        method: 'POST',
        body: file,
      });
    try {
      let res = await send();
      // The session cookie can go stale while the prompt sits open: renew it, once
      if (res.status === 401 && (await getToken({ skipCache: true }).catch(() => null))) {
        res = await send();
      }
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        if (data?.code === UPLOADS_OFF) return setOff(true);
        if (data?.code === SIGNED_OUT) return setSessionLapsed(true);
        throw new Error(data?.error ?? "that photo didn't go through. try again.");
      }
      const data = await res.json();
      setPhotoUrl(data.blobUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "that photo didn't go through. try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-6">
      {step.word && (
        <p className="font-google-sans-code text-xs uppercase tracking-wider text-[var(--text-muted)]">
          upload a photo that represents
        </p>
      )}
      <h2 className="font-vt323 text-5xl text-[var(--foreground)]">{step.word ?? step.title}</h2>
      {step.description && (
        <p className="max-w-sm font-space-grotesk text-sm text-[var(--text-muted)]">{step.description}</p>
      )}

      {off ? (
        <UploadsOff isAdmin={isAdmin} />
      ) : sessionLapsed ? (
        <div className="flex flex-col items-start gap-3">
          <p className="font-google-sans-code text-xs text-[var(--text-muted)]">your session ended while this was open.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-full border px-6 py-2 font-google-sans-code text-xs uppercase tracking-wider text-[var(--foreground)] transition hover:bg-[var(--background-highlight)]"
            style={{ borderColor: colorValue }}
          >
            refresh to upload
          </button>
        </div>
      ) : !isSignedIn ? (
        <SignInButton mode="modal">
          <button
            type="button"
            className="rounded-full border px-6 py-2 font-google-sans-code text-xs uppercase tracking-wider text-[var(--foreground)] transition hover:bg-[var(--background-highlight)]"
            style={{ borderColor: colorValue }}
          >
            sign in to upload
          </button>
        </SignInButton>
      ) : photoUrl ? (
        <div className="flex flex-col items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- blob storage host isn't configured for next/image */}
          <img
            src={photoUrl}
            alt={step.word ?? step.title}
            className="size-40 rounded-full border-2 object-cover"
            style={{ borderColor: colorValue }}
          />
          <div className="flex items-center gap-1 font-google-sans-code text-xs uppercase tracking-wider text-[var(--foreground)]">
            <Check className="size-4" style={{ color: colorValue }} /> completed
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="font-google-sans-code text-xs uppercase tracking-wider text-[var(--text-muted)] underline decoration-dotted underline-offset-4 hover:text-[var(--foreground)] disabled:opacity-50"
          >
            {uploading ? 'uploading…' : 'replace photo'}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex flex-col items-start gap-2 rounded-lg border border-dashed px-10 py-10 text-[var(--text-muted)] transition hover:bg-[var(--background-highlight)] hover:text-[var(--foreground)] disabled:opacity-50"
          style={{ borderColor: colorValue }}
        >
          <Upload className="size-6" />
          <span className="font-google-sans-code text-xs uppercase tracking-wider">
            {uploading ? 'uploading…' : 'choose a photo'}
          </span>
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />

      {error && <p className="font-google-sans-code text-xs text-[var(--text-muted)]">{error}</p>}
    </div>
  );
}

// No Blob store on this site. The owner gets the way to connect one; a
// visitor gets the site's ask (FoundersConfig founder.cta), counted as the
// same cta_clicked event as the Fab and BuildYoursCard, placement photo-prompt
function UploadsOff({ isAdmin }: { isAdmin: boolean }) {
  const { colorValue } = useTheme();

  if (isAdmin) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="max-w-sm font-google-sans-code text-xs text-[var(--text-muted)]">
          photos need a place to live. connect a Vercel Blob store and this prompt starts collecting them.
        </p>
        <Link
          href="/article/setup-file-uploads"
          className="font-google-sans-code text-xs uppercase tracking-wider text-[var(--foreground)] underline decoration-dotted underline-offset-4"
        >
          set up photo prompts →
        </Link>
      </div>
    );
  }

  if (!FOUNDER_CTA) {
    return <p className="font-google-sans-code text-xs text-[var(--text-muted)]">this site isn&apos;t collecting photos yet.</p>;
  }

  return (
    <div className="flex flex-col items-start gap-4">
      <p className="max-w-sm font-google-sans-code text-xs text-[var(--text-muted)]">
        this site isn&apos;t collecting photos yet. on your own copy, any picture can ask a question like this one,
        and every answer comes to you.
      </p>
      <Link
        href={FOUNDER_CTA.href}
        onClick={() => track('cta_clicked', { cta: FOUNDER_CTA?.label ?? 'build yours', placement: 'photo-prompt' })}
        aria-label={FOUNDER_CTA.label}
        className="build-yours flex h-12 items-center gap-2 rounded-full pl-3 pr-5 transition-transform duration-200 hover:-translate-y-px motion-reduce:transition-none"
        style={{ backgroundColor: colorValue, ...BUILD_YOURS_DONE }}
      >
        {/* Brain and words at every width: unlike the Fab, this is the only ask on screen */}
        <BuildBrain color={colorValue} ink={inkOn(colorValue)} className="size-7 shrink-0" />
        <BuildLettering ink={inkOn(colorValue)} className="h-[26px] w-auto" />
      </Link>
    </div>
  );
}
