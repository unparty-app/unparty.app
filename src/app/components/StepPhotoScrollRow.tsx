'use client';

import { useFetch } from '@/hooks/useFetch';
import { useUser, SignInButton } from '@/lib/auth-stub.client';
import ScrollRow from '@/components/HorizontalRow';

interface StepPhoto {
  id: string;
  stepId: string;
  word: string | null;
  cover: string | null;
  blobUrl: string;
  completedAt: string | null;
  uploader?: { firstName: string | null; lastName?: string | null; email?: string };
}

export interface StepPhotoScrollRowProps {
  // 'mine' = the signed-in viewer's own uploads (requires auth - shows a
  // sign-in prompt when signed out, safe to drop in unconditionally).
  // 'everyone' = every uploader's photo; the API redacts uploader detail to
  // first-name-only unless the caller is an admin, so this scope is equally
  // safe in /admin and a future public article - no separate flag needed.
  scope: 'mine' | 'everyone';
  stepId?: string; // omit to aggregate across every photo-upload step
  title?: string;
  moreLink?: string;
  maxItems?: number;
  fullBleed?: boolean;
}

// Reusable across /admin (scope="everyone"), /party (scope="mine"), and -
// later - articles/stories via ScrollRowRenderer (scope="everyone" + a
// specific stepId). Built on ScrollRow's own interface (src/components/
// HorizontalRow.tsx) rather than a bespoke gallery layout.
export default function StepPhotoScrollRow({
  scope,
  stepId,
  title,
  moreLink,
  maxItems,
  fullBleed,
}: StepPhotoScrollRowProps) {
  const { isSignedIn } = useUser();
  // "mine" needs a signed-in user; a failed request renders as no photos
  const params = new URLSearchParams({ scope });
  if (stepId) params.set('stepId', stepId);
  const { data } = useFetch<{ photos?: StepPhoto[] }>(
    scope === 'mine' && !isSignedIn ? null : `/api/steps/photos?${params}`
  );
  const photos = data?.photos ?? [];

  if (scope === 'mine' && !isSignedIn) {
    return (
      <p className="font-vt323 text-lg" style={{ color: 'var(--text-muted)' }}>
        <SignInButton mode="modal">
          <button type="button" className="underline decoration-dotted underline-offset-4">
            sign in to see your photos.
          </button>
        </SignInButton>
      </p>
    );
  }

  if (photos.length === 0) {
    return null;
  }

  const items = photos.map((photo) => (
    <div
      key={photo.id}
      className="relative w-full overflow-hidden rounded-lg border border-border bg-background"
      style={{ aspectRatio: '1 / 1' }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- blob storage host isn't configured for next/image */}
      <img
        src={photo.blobUrl}
        alt={photo.word ?? 'uploaded photo'}
        className="size-full object-cover"
      />
      {(photo.word || photo.uploader?.firstName) && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
          {photo.word && (
            <div className="font-google-sans-code text-[10px] uppercase tracking-wider text-white">
              {photo.word}
            </div>
          )}
          {photo.uploader?.firstName && (
            <div className="font-google-sans-code text-[10px] text-white/70">by {photo.uploader.firstName}</div>
          )}
        </div>
      )}
    </div>
  ));

  return <ScrollRow items={items} title={title} moreLink={moreLink} maxItems={maxItems} fullBleed={fullBleed} />;
}
