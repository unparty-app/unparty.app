'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { X } from '@/app/components/icons';
import { useWatchModal } from '../contexts/WatchModalContext';
import type { VideoRegistryEntry } from '../constants/video-registry/types';
import { useHydrated } from '@/hooks/useHydrated';

// Rendered by the root @modal slot's intercepted (.)watch/[slug] route
// (see #956) — a full-bleed lightbox, deliberately not the app's standard
// Modal.tsx card chrome, since the video itself is meant to be the content,
// not a dialog around it. Full-screen on mobile (video fills the viewport),
// a bounded 16:9 frame with dark surrounding space on larger screens.
//
// Portals to document.body like Modal.tsx/Fab/OutlineRail — page content
// under .page-transition-wrapper keeps a `transform` for its enter
// animation, which would otherwise anchor `fixed` positioning to the
// article instead of the viewport (see the verify skill's gotchas).
export default function WatchLightbox({ video }: { video: VideoRegistryEntry }) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const { setWatchModalOpen } = useWatchModal();
  const mounted = useHydrated();

  useEffect(() => {
    setWatchModalOpen(true);
    return () => setWatchModalOpen(false);
  }, [setWatchModalOpen]);

  // Expanding into the lightbox is a clear watch intent, so this tries to
  // autoplay with sound. Browsers can still block unmuted autoplay once the
  // gesture context from the Link click doesn't carry through to this
  // later-mounted element — native `controls` stays visible either way, so
  // a blocked attempt just means the viewer presses play themselves.
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = false;
    el.play().catch(() => {});
  }, []);

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
      className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-black/95 sm:p-8"
      onClick={() => router.back()}
      role="dialog"
      aria-modal="true"
      aria-label={video.title}
    >
      <button
        type="button"
        onClick={(e) => {
          // Without this, the click bubbles to the backdrop's own onClick
          // below (this button isn't nested inside the content div that
          // stops propagation) - double-firing router.back() and
          // overshooting the history stack.
          e.stopPropagation();
          router.back();
        }}
        aria-label="Close"
        className="absolute right-4 top-4 z-10 flex size-10 items-center justify-center rounded-full text-white/90 backdrop-blur-sm transition-transform hover:scale-105"
        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      >
        <X className="size-5" />
      </button>

      <div
        className="flex h-full w-full flex-col sm:h-auto sm:max-w-4xl"
        onClick={(e) => e.stopPropagation()}
      >
        <video
          ref={videoRef}
          src={video.contentUrl}
          poster={video.thumbnailUrl}
          controls
          playsInline
          preload="auto"
          className="w-full flex-1 bg-black object-contain sm:aspect-video sm:flex-none"
        />

        <div className="flex flex-col gap-2 px-4 py-3 sm:px-0 sm:pt-4">
          <p className="truncate font-vt323 text-lg text-white/90">{video.title}</p>
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
            {/* Explicit "back to start" nav - the owning content's own
                route (a UNPPP today; an /article or /story once video
                frontmatter is supported there, see #956). Plain <a>, not
                next/link: leaving an open intercepted modal for a
                *different* already-visited route via client-side push
                doesn't reliably reset the @modal slot back to default.tsx
                (a documented Next.js parallel/intercepting-routes caveat -
                only router.back() is guaranteed to unwind it) - confirmed
                the lightbox stayed mounted under the destination page with
                Link. A real navigation sidesteps that entirely. Closing
                (X/backdrop/Esc) still uses router.back() and returns to
                wherever the viewer actually came from; this always goes to
                the video's canonical source regardless of that. */}
            <a
              href={video.sourceHref}
              className="shrink-0 font-google-sans-code text-xs uppercase tracking-wider text-white/70 underline decoration-dotted underline-offset-4 hover:text-white"
            >
              ← back to {video.sourceLabel}
            </a>
            {/* Plain <a>, not next/link - this modal IS the intercepted
                (.)watch/[slug] segment, so a client-side Link to the same
                href would just re-render it. A real navigation is what
                lands on the standalone page (full description + THOUGHTS.). */}
            <a
              href={`/watch/${video.slug}`}
              className="shrink-0 font-google-sans-code text-xs uppercase tracking-wider text-white/70 underline decoration-dotted underline-offset-4 hover:text-white"
            >
              full page + thoughts →
            </a>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
