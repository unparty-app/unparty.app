'use client';

import { useEffect, type RefObject } from 'react';

/**
 * A mouse can drag a horizontal scroller, the way touch and trackpads already
 * scroll it. Snapping pauses while dragging (the scroller's CSS reads
 * data-dragging="true"), and a drag never ends in a click on whatever it
 * started on. Shared by ScrollRow (components/HorizontalRow) and RowTable's
 * pages, so every row in the app swipes the same way.
 */
export function useDragScroll(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const track = ref.current;
    if (!track) return;
    let startX = 0;
    let startScroll = 0;
    let pointerId: number | null = null;
    let dragged = false;

    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      if (track.scrollWidth <= track.clientWidth) return;
      pointerId = e.pointerId;
      startX = e.clientX;
      startScroll = track.scrollLeft;
      dragged = false;
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;
      const dx = e.clientX - startX;
      if (!dragged && Math.abs(dx) < 6) return;
      if (!dragged) {
        dragged = true;
        track.setPointerCapture(e.pointerId);
        track.dataset.dragging = 'true';
      }
      track.scrollLeft = startScroll - dx;
    };
    const onUp = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;
      pointerId = null;
      if (track.hasPointerCapture(e.pointerId)) track.releasePointerCapture(e.pointerId);
      // Snap back on, so the scroller settles on the nearest item
      delete track.dataset.dragging;
    };
    const onClick = (e: MouseEvent) => {
      if (!dragged) return;
      e.preventDefault();
      e.stopPropagation();
      dragged = false;
    };
    const onDragStart = (e: DragEvent) => e.preventDefault(); // links and images

    track.addEventListener('pointerdown', onDown);
    track.addEventListener('pointermove', onMove);
    track.addEventListener('pointerup', onUp);
    track.addEventListener('pointercancel', onUp);
    track.addEventListener('click', onClick, true);
    track.addEventListener('dragstart', onDragStart);
    return () => {
      track.removeEventListener('pointerdown', onDown);
      track.removeEventListener('pointermove', onMove);
      track.removeEventListener('pointerup', onUp);
      track.removeEventListener('pointercancel', onUp);
      track.removeEventListener('click', onClick, true);
      track.removeEventListener('dragstart', onDragStart);
    };
  }, [ref]);
}
