'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { track } from '@vercel/analytics';
import { BASELINE, FOUNDER_CTA } from '../../constants/organization';
import { buildCost, hourlyRate } from '@/lib/baseline';
import { InkUnderline } from '../depend/ink';
import { Cloud, Hammer, X, type HandDrawnIconComponent } from '../icons';
import BuildYours from './BuildYours';

const dollars = (n: number) => `$${Math.round(n).toLocaleString()}`;
const hoursOf = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 1 });

function Step({ icon: Icon, label, color, children }: { icon: HandDrawnIconComponent; label: string; color: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 border-t pt-4" style={{ borderColor: `${color}26` }}>
      <Icon size={22} color={color} className="mt-px shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="font-vt323 text-lg leading-none" style={{ color }}>{label}</p>
        <div className="mt-2">{children}</div>
      </div>
    </div>
  );
}

/**
 * What "price yours" opens, in Goal Budget's own steps: BUILD. what the work is
 * worth, with the sum beside the figure, and RUN. what it adds to run. So the
 * figure reads as the value of the work, not a bill. Then the site's ask, and
 * the whole plan in Goal Budget for anyone who wants to go further.
 */
export default function PriceYoursModal({ hours, name, own, href, color, onClose }: {
  hours: number;
  name?: string;
  own: boolean;
  href: string;
  color: string;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key !== 'Tab') return;
      // Keep the keyboard inside the dialog
      const stops = [...(dialogRef.current?.querySelectorAll<HTMLElement>('a[href], button') ?? [])];
      const first = stops[0];
      const last = stops[stops.length - 1];
      const at = document.activeElement;
      if (event.shiftKey ? at === first || at === dialogRef.current : at === last) {
        event.preventDefault();
        (event.shiftKey ? last : first)?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      before?.focus?.();
    };
  }, [onClose]);

  if (!BASELINE) return null;
  const build = buildCost(hours, BASELINE);
  const rate = hourlyRate(BASELINE);
  const cta = FOUNDER_CTA;

  return createPortal(
    <div role="dialog" aria-modal="true" aria-labelledby="price-yours-title" className="fixed inset-0 z-[60] flex items-center overflow-y-auto p-4 backdrop-blur-sm" style={{ backgroundColor: 'color-mix(in srgb, var(--background) 80%, transparent)' }}>
      <div className="absolute inset-0" onClick={onClose} aria-hidden />
      <div ref={dialogRef} tabIndex={-1} className="relative mx-auto w-full max-w-md rounded-2xl border-2 p-6 text-left outline-none sm:p-8" style={{ borderColor: color, backgroundColor: 'var(--background)' }}>
        <button type="button" onClick={onClose} aria-label="Close" className="absolute right-3 top-3 grid size-11 place-items-center rounded-full transition-colors hover:bg-[var(--background-highlight)]">
          <X size={20} color="var(--text-muted)" />
        </button>

        <h2 id="price-yours-title" className="pr-10 font-vt323 text-4xl leading-none text-[var(--foreground)]">
          {own ? 'what your time is worth.' : 'what a build like this takes.'}
        </h2>

        <div className="mt-6 space-y-5">
          <Step icon={Hammer} label="BUILD." color={color}>
            <p className="relative inline-block font-vt323 text-5xl leading-none" style={{ color }}>
              {dollars(build.total)}
              <InkUnderline color={color} className="absolute -bottom-2 left-0 h-2.5 w-full" />
            </p>
            <p className="mt-4 font-space-grotesk text-sm leading-relaxed text-[var(--foreground)]">
              {own ? `${hoursOf(hours)} hours you tracked.` : `${hoursOf(hours)} hours of work${name ? `, like ${name}` : ''}.`}
            </p>
            <p className="mt-1 font-space-grotesk text-xs leading-relaxed text-[var(--text-muted)]">
              at {dollars(rate)} an hour, plus {dollars(BASELINE.llmPerHour)} an hour of LLM.
            </p>
          </Step>
          <Step icon={Cloud} label="RUN." color={color}>
            <p className="font-vt323 text-3xl leading-none" style={{ color }}>no extra cost</p>
            <p className="mt-2 font-space-grotesk text-xs leading-relaxed text-[var(--text-muted)]">on the free plans every copy starts on.</p>
          </Step>
        </div>

        <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
          {cta && (
            <Link href={cta.href} onClick={() => track('cta_clicked', { cta: cta.label, placement: 'price-yours' })} aria-label={cta.label} className="inline-flex min-h-12 items-center rounded-full px-5 py-2 transition-transform hover:-translate-y-px" style={{ backgroundColor: color }}>
              <BuildYours color={color} words="always" />
            </Link>
          )}
          <Link href={href} className="font-google-sans-code text-[10px] uppercase tracking-wide underline underline-offset-4" style={{ color }}>
            the whole plan →
          </Link>
        </div>
      </div>
    </div>,
    document.body
  );
}
