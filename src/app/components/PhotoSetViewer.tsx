'use client';

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';

import { ChevronRight, ChevronLeft } from '@/app/components/icons';
import { track } from '@vercel/analytics';
import UnpppCircle from './UnpppCircle';

// '2024-01-11' -> 'Jan 11, 2024' (parsed as UTC midnight, so formatted in UTC
// to never slip a day); anything that isn't a date shows as written
const formatPhotoDate = (value: string): string => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
};

// How far a downward swipe has to travel before letting go closes the viewer
const SWIPE_CLOSE_PX = 120;

type CloseVia = 'close' | 'keep reading' | 'back' | 'swipe' | 'escape';

interface PhotoSetViewerProps {
  urls: string[];
  labels: string[];
  dates?: string[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  colorValue: string;
}

/**
 * PhotoSetViewer - the photo modal for a circle set (PhotoGallery shape="circle"),
 * built for phones first, where most visitors arrive:
 *
 * - The photos are a native horizontal scroll-snap track: swipe between them
 *   like every other row in the app. Arrows, circles, keys and taps on either
 *   side of the photo just scroll the track
 * - Behind it, a blurred, dimmed copy of the open photo fills the frame; on
 *   wider screens the neighbouring photos peek in, smaller and dimmed
 * - Full screen on phones; a card on wider screens
 * - Opening adds a history entry, so the phone's back button (or back swipe)
 *   closes the photo instead of leaving the story
 * - Swipe down to close
 * - The set as a circle strip with the arrows beside it; the last photo
 *   offers "keep reading"
 * - Consent-gated analytics: opened, and how far into the set a visitor got
 */
const PhotoSetViewer: React.FC<PhotoSetViewerProps> = ({
  urls,
  labels,
  dates,
  index,
  onIndexChange,
  onClose,
  colorValue
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const scrollIndexRef = useRef(index);
  // While the track glides to a photo, the photos it passes aren't visits
  const gliding = useRef<{ to: number; timer: number } | null>(null);
  const furthestRef = useRef(index);
  const closeViaRef = useRef<CloseVia>('back');
  const swipeRef = useRef<{ x: number; y: number; axis: 'x' | 'y' | null } | null>(null);
  const [dragY, setDragY] = useState(0);

  const isLast = index === urls.length - 1;
  const label = labels[index];
  const date = dates?.[index];
  // The set's folder names it in analytics: /stories/personal-mission/a.webp -> /stories/personal-mission
  const setName = urls[0]?.replace(/\/[^/]*$/, '') || 'photos';

  useEffect(() => {
    furthestRef.current = Math.max(furthestRef.current, index);
  }, [index]);

  // Every way out goes through history, so back and the close button agree.
  // Our entry is on top, so going back pops it and the popstate below closes
  const requestClose = useCallback((via: CloseVia) => {
    closeViaRef.current = via;
    if (window.history.state?.photoSet) {
      window.history.back();
    } else {
      onClose();
    }
  }, [onClose]);

  // Open: add the history entry, focus close, record it. Close (popstate):
  // record how far the visitor got and how they left
  useEffect(() => {
    // Only once: React's development double-run would otherwise stack two entries
    if (!window.history.state?.photoSet) {
      window.history.pushState({ ...window.history.state, photoSet: true }, '');
    }
    closeButtonRef.current?.focus();
    track('photo_set_opened', { set: setName, photo: labels[index], total: urls.length });

    const onPopState = () => {
      if (window.history.state?.photoSet) return;
      track('photo_set_closed', {
        set: setName,
        viewed: furthestRef.current + 1,
        total: urls.length,
        via: closeViaRef.current
      });
      onClose();
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
    // Runs once per opening; the index at that moment is the photo opened
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const slideWidth = (el: HTMLElement) =>
    el.querySelector<HTMLElement>('[data-slide]')?.offsetWidth || el.clientWidth;

  // Index -> track: arrows, circles, keys and taps scroll to the photo. The
  // first run (opening) jumps there; later ones glide
  const hasPositionedRef = useRef(false);
  useLayoutEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    if (scrollIndexRef.current === index && hasPositionedRef.current) return;
    scrollIndexRef.current = index;
    if (hasPositionedRef.current) {
      if (gliding.current) window.clearTimeout(gliding.current.timer);
      gliding.current = { to: index, timer: window.setTimeout(() => { gliding.current = null; }, 1000) };
    }
    el.scrollTo({ left: index * slideWidth(el), behavior: hasPositionedRef.current ? 'smooth' : 'instant' });
    hasPositionedRef.current = true;
  }, [index]);

  // Track -> index: a swipe settles on a photo, and that becomes the open one
  const onTrackScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    const nearest = Math.min(urls.length - 1, Math.max(0, Math.round(el.scrollLeft / slideWidth(el))));
    if (gliding.current) {
      if (Math.abs(el.scrollLeft - gliding.current.to * slideWidth(el)) < 2) {
        window.clearTimeout(gliding.current.timer);
        gliding.current = null;
      }
      return;
    }
    if (nearest !== scrollIndexRef.current) {
      scrollIndexRef.current = nearest;
      onIndexChange(nearest);
    }
  };

  // Keep the open photo's circle in view in the strip
  useEffect(() => {
    stripRef.current
      ?.querySelector('[aria-current="true"]')
      ?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  }, [index]);

  const goTo = useCallback((next: number) => {
    if (next >= 0 && next < urls.length) onIndexChange(next);
  }, [onIndexChange, urls.length]);

  // Keys: arrows step through the set (stopping at the ends), Escape closes
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') requestClose('escape');
      else if (e.key === 'ArrowLeft') goTo(index - 1);
      else if (e.key === 'ArrowRight') goTo(index + 1);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [goTo, index, requestClose]);

  // Tap the open photo's left or right third to step, like a story; the middle does nothing
  const onPhotoClick = (e: React.MouseEvent<HTMLElement>, slide: number) => {
    if (slide !== index) {
      goTo(slide);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    if (x < 1 / 3) goTo(index - 1);
    else if (x > 2 / 3) goTo(index + 1);
  };

  // Swipe down to close: the axis is decided by the first few pixels, so a
  // sideways swipe stays the track's (touch-action: pan-x hands us vertical moves)
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    swipeRef.current = { x: t.clientX, y: t.clientY, axis: null };
  };
  const onTouchMove = (e: React.TouchEvent) => {
    const swipe = swipeRef.current;
    if (!swipe) return;
    const t = e.touches[0];
    const dx = t.clientX - swipe.x;
    const dy = t.clientY - swipe.y;
    if (!swipe.axis && Math.hypot(dx, dy) > 10) swipe.axis = Math.abs(dy) > Math.abs(dx) ? 'y' : 'x';
    if (swipe.axis === 'y') setDragY(Math.max(0, dy));
  };
  const onTouchEnd = () => {
    const swipe = swipeRef.current;
    swipeRef.current = null;
    if (swipe?.axis !== 'y') return;
    if (dragY > SWIPE_CLOSE_PX) requestClose('swipe');
    else setDragY(0);
  };

  const ambientUrl = urls[index];

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center sm:p-4"
      style={{
        backgroundColor: 'var(--background)',
        // The page shows through as the viewer is pulled down
        opacity: dragY ? Math.max(0.4, 1 - dragY / 600) : 1
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="photo-set-title"
        className="relative flex h-[100dvh] w-full flex-col overflow-hidden sm:h-auto sm:max-w-5xl sm:rounded-xl sm:border"
        style={{
          borderColor: `${colorValue}40`,
          backgroundColor: 'var(--background)',
          transform: dragY ? `translateY(${dragY}px)` : undefined,
          transition: dragY ? 'none' : 'transform 250ms ease-out'
        }}
      >
        {/* Header, in the site Header's language: the photo's circle, then its
            name (Space Grotesk, as PageHeader) and optional date, and close as
            one of the Header's theme-color action circles */}
        <div
          className="flex items-center justify-between gap-4 border-b px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] sm:px-6 sm:pt-3"
          style={{ borderColor: `${colorValue}30` }}
        >
          <div className="flex min-w-0 items-center gap-3">
            <UnpppCircle src={urls[index]} color={colorValue} size={32} />
            <div className="min-w-0">
              <h2
                id="photo-set-title"
                title={label}
                className="truncate font-space-grotesk text-sm font-medium leading-tight text-[var(--foreground)] md:text-base"
              >
                {label}
              </h2>
              {date && (
                <p className="mt-0.5 font-google-sans-code text-[10px] uppercase leading-tight tracking-wide md:text-xs" style={{ color: 'var(--text-muted)' }}>
                  {formatPhotoDate(date)}
                </p>
              )}
            </div>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={() => requestClose('close')}
            className="flex size-10 shrink-0 items-center justify-center rounded-full shadow-md transition-transform duration-200 hover:scale-105 active:scale-95 motion-reduce:transition-none"
            style={{ backgroundColor: colorValue, color: 'var(--background)' }}
            aria-label="Close photo"
          >
            <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Stage: the ambient fill, with the swipeable track over it */}
        <div
          className="relative min-h-0 flex-1 overflow-hidden sm:flex-none"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onTouchCancel={onTouchEnd}
        >
          <div className="sm:h-[min(64vh,720px)]" />
          <div key={`ambient-${index}`} className="photo-ambient-enter absolute inset-0" aria-hidden="true">
            <Image src={ambientUrl} alt="" fill sizes="128px" className="scale-125 object-cover blur-3xl" />
            <div className="absolute inset-0" style={{ backgroundColor: 'color-mix(in srgb, var(--background) 55%, transparent)' }} />
          </div>

          {/* Each slide is the full width on phones; on wider screens a slide
              is a third of the stage, with a spacer at each end so the first
              and last can sit in the middle too, neighbours peeking whole
              either side (spacers, not padding: a scroller's end padding isn't
              reliably scrollable) */}
          <div
            ref={trackRef}
            onScroll={onTrackScroll}
            className="absolute inset-0 flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain scrollbar-hide"
            style={{ touchAction: 'pan-x' }}
          >
            <div className="hidden w-[33%] shrink-0 sm:block" aria-hidden="true" />
            {urls.map((url, slide) => {
              const active = slide === index;
              return (
                <div key={url} data-slide className="flex h-full w-full shrink-0 snap-center items-center justify-center px-4 py-5 sm:w-[34%] sm:px-3">
                  <Image
                    src={url}
                    alt={labels[slide]}
                    width={900}
                    height={1600}
                    sizes="(max-width: 640px) 100vw, 480px"
                    loading={Math.abs(slide - index) <= 1 ? 'eager' : 'lazy'}
                    draggable={false}
                    onClick={(e) => onPhotoClick(e, slide)}
                    className={`h-full max-h-full w-auto max-w-full cursor-pointer select-none rounded-lg object-contain transition-[opacity,transform,box-shadow] duration-300 motion-reduce:transition-none ${
                      active ? 'opacity-100 shadow-2xl' : 'scale-[0.62] opacity-40 hover:opacity-80'
                    }`}
                  />
                </div>
              );
            })}
            <div className="hidden w-[33%] shrink-0 sm:block" aria-hidden="true" />
          </div>
        </div>

        {/* The set: every photo as a circle, the open one ringed, with the
            arrows beside it. On the last photo the next arrow becomes
            "keep reading", back to the story */}
        <div
          className="flex items-center gap-4 border-t px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] sm:px-6 sm:py-4"
          style={{ borderColor: `${colorValue}30` }}
        >
          <div ref={stripRef} className="flex min-w-0 flex-1 gap-3 overflow-x-auto p-1 scrollbar-hide">
            {urls.map((url, slide) => {
              const active = slide === index;
              return (
                <button
                  key={url}
                  type="button"
                  aria-label={labels[slide]}
                  aria-current={active ? 'true' : undefined}
                  onClick={() => goTo(slide)}
                  className="group relative size-11 shrink-0 rounded-full p-[2px] transition-[transform,background-color] duration-300 hover:scale-105 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-color)] motion-reduce:transition-none"
                  style={{ backgroundColor: active ? colorValue : 'transparent' }}
                >
                  <span
                    className="relative block size-full overflow-hidden rounded-full border-2"
                    style={{ borderColor: 'var(--background)', backgroundColor: `${colorValue}20` }}
                  >
                    <Image
                      src={url}
                      alt=""
                      fill
                      sizes="44px"
                      className={`object-cover transition-opacity duration-300 ${active ? 'opacity-100' : 'opacity-50 group-hover:opacity-100'}`}
                      style={{ objectPosition: '50% 35%' }}
                    />
                  </span>
                </button>
              );
            })}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              disabled={index === 0}
              aria-label="Previous photo"
              className="flex size-10 items-center justify-center rounded-full border transition-[transform,opacity] duration-200 hover:scale-105 hover:bg-[var(--background-highlight)] active:scale-95 disabled:pointer-events-none disabled:opacity-30"
              style={{ borderColor: colorValue, color: colorValue }}
            >
              <ChevronLeft className="size-5" />
            </button>
            {isLast ? (
              <button
                type="button"
                onClick={() => requestClose('keep reading')}
                className="flex h-10 items-center gap-1 rounded-full border pl-4 pr-3 font-google-sans-code text-xs transition-transform duration-200 hover:scale-105 hover:bg-[var(--background-highlight)] active:scale-95"
                style={{ borderColor: colorValue, color: colorValue }}
              >
                keep reading
                <ChevronRight className="size-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => goTo(index + 1)}
                aria-label="Next photo"
                className="flex size-10 items-center justify-center rounded-full border transition-transform duration-200 hover:scale-105 hover:bg-[var(--background-highlight)] active:scale-95"
                style={{ borderColor: colorValue, color: colorValue }}
              >
                <ChevronRight className="size-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default PhotoSetViewer;
