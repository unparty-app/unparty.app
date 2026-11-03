'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import UnpppCircle from './UnpppCircle';
import { CircleArrowLeft, CircleArrowRight } from './icons';

export interface Neighbor {
  href: string;
  // What it's called ("Runway", "DEPEND.")
  name: string;
  // Its cover, or its color when there's none
  cover?: string;
  color?: string | null;
}

// Where the row goes: a slot the root layout keeps in the page flow, after the
// page and its belt, before the footer
export const NEIGHBORS_SLOT = 'page-neighbors';

function NeighborLink({ neighbor, side, kind }: { neighbor: Neighbor; side: 'previous' | 'next'; kind: string }) {
  const Arrow = side === 'previous' ? CircleArrowLeft : CircleArrowRight;
  return (
    <Link
      href={neighbor.href}
      aria-label={`${side} ${kind}: ${neighbor.name}`}
      className={`group flex min-w-0 items-center gap-3 rounded-full py-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 ${side === 'next' ? 'flex-row-reverse text-right' : ''}`}
      style={{ outlineColor: 'var(--theme-color)' }}
    >
      <span className="shrink-0 transition-transform duration-200 group-hover:scale-105">
        <UnpppCircle src={neighbor.cover} color={neighbor.color ?? 'var(--theme-color)'} size={36} />
      </span>
      <span className={`flex min-w-0 flex-col ${side === 'next' ? 'items-end' : ''}`}>
        <span className={`flex items-center gap-1 font-google-sans-code text-[10px] uppercase tracking-wide text-[var(--text-muted)] ${side === 'next' ? 'flex-row-reverse' : ''}`}>
          <Arrow size={14} strokeWidth={1.5} themed className="shrink-0" />
          {side}.
        </span>
        <span className="mt-1 break-words font-vt323 text-xl leading-none" style={{ color: 'var(--theme-color)' }}>{neighbor.name}</span>
      </span>
    </Link>
  );
}

/**
 * PageNeighbors - the way on from a page in a run of pages (unppp pages,
 * stories, the owner's problems), in the page itself: its previous and next,
 * each by name and cover, at the end of the page. On a screen too narrow for
 * the floating side arrows to sit beside the content (below 1200px, where
 * they'd cover it), this is how a reader steps on; wider, the arrows do it
 * and this stays hidden. Rendered into the layout's NEIGHBORS_SLOT.
 */
export default function PageNeighbors({ previous, next, kind }: { previous?: Neighbor; next?: Neighbor; kind: string }) {
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  useEffect(() => setSlot(document.getElementById(NEIGHBORS_SLOT)), []);
  if (!slot || (!previous && !next)) return null;

  return createPortal(
    <nav aria-label={`more ${kind}s`} className="mx-auto mt-12 flex w-full max-w-5xl items-center justify-between gap-4 px-4 min-[1200px]:hidden">
      <div className="min-w-0 flex-1">{previous && <NeighborLink neighbor={previous} side="previous" kind={kind} />}</div>
      <div className="flex min-w-0 flex-1 justify-end">{next && <NeighborLink neighbor={next} side="next" kind={kind} />}</div>
    </nav>,
    slot
  );
}
