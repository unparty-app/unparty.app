'use client';

import { useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import type { NavCategory } from '../constants/unpppNav';
import { effortByType } from '@/lib/type-effort';
import { useTrayAnchor } from '../hooks/useTrayAnchor';
import { useHydrated } from '@/hooks/useHydrated';
import { TypeMark, effortLine, percent, asOfLabel, typeName } from './TypeStatline';

const LABEL = 'font-google-sans-code text-[10px] uppercase tracking-wide text-[var(--text-muted)]';

/**
 * TypeEffortCard - what the header's type circle opens on a type hub: that
 * type's share of all the work, as its own segment of the statline, then its
 * projects, commits a month and how many are rising, with the scores' date
 * and the way to every type on /about. Anchored under the circle and
 * portaled to the body like the unppp tray (the navbar's transform would
 * re-anchor it); closes on a tap outside or Escape.
 */
export default function TypeEffortCard({ type, open, onClose, triggerRef }: {
  type: NavCategory;
  open: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLElement | null>;
}) {
  const mounted = useHydrated();
  const anchor = useTrayAnchor(triggerRef, open);
  const cardRef = useRef<HTMLDivElement>(null);
  const effort = useMemo(() => effortByType(), []);
  const t = effort.types.find((e) => e.type === type);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node;
      if (!cardRef.current?.contains(target) && !triggerRef.current?.contains(target)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose, triggerRef]);

  if (!mounted || !t) return null;
  const asOf = asOfLabel(effort.generatedAt);

  return createPortal(
    <div
      ref={cardRef}
      id="type-effort-card"
      role="dialog"
      aria-label={`${typeName(type)} effort`}
      className={`fixed w-[min(22rem,calc(100vw-2rem))] rounded-xl border bg-[var(--background)] p-4 text-left shadow-lg transition-[opacity,transform,visibility] duration-200 ease-out motion-reduce:transition-none ${
        open ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-2 opacity-0'
      }`}
      style={{ top: (anchor?.bottom ?? 64) + 10, left: Math.max(16, anchor?.left ?? 16), borderColor: `${t.color}66`, zIndex: 9999 }}
    >
      <div className="flex items-center gap-3">
        <TypeMark type={type} color={t.color} size={32} />
        <span className="font-vt323 text-2xl leading-none text-[var(--foreground)]">{typeName(type)}.</span>
        <span className="ml-auto flex flex-col items-end">
          <span className="font-vt323 text-2xl leading-none text-[var(--foreground)]">{percent(t.share)}</span>
          <span className={LABEL}>of the work</span>
        </span>
      </div>
      {/* Its segment of the statline, against the whole */}
      <div className="mt-4 h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: `${t.color}26` }} aria-hidden="true">
        <div
          className="h-full origin-left rounded-full transition-transform duration-500 ease-out motion-reduce:transition-none"
          style={{ backgroundColor: t.color, width: `${Math.max(t.share * 100, 1)}%`, transform: `scaleX(${open ? 1 : 0})` }}
        />
      </div>
      <p className="mt-3 font-space-grotesk text-sm text-[var(--foreground)]">{effortLine(t)}</p>
      <div className="mt-3 flex items-center gap-3">
        {asOf && <span className={LABEL}>as of {asOf}</span>}
        <Link
          href="/about#work"
          onClick={onClose}
          tabIndex={open ? 0 : -1}
          className={`${LABEL} ml-auto transition-colors hover:text-[var(--foreground)]`}
        >
          every type →
        </Link>
      </div>
    </div>,
    document.body
  );
}
