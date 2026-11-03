'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from '@/app/components/icons';
import type { HubRow } from '@/lib/type-hub';

/**
 * A project as a card: its cover (or its color), name and line, with an
 * optional label on the cover ("yours", its type). The type hubs and /about
 * use it
 */
export default function ProjectCard({ row, accent }: { row: HubRow; accent: string }) {
  const color = row.color ?? accent;
  return (
    <Link
      href={row.href}
      className="group flex flex-col overflow-hidden rounded-xl border transition-colors hover:bg-[var(--background-highlight)]"
      style={{ borderColor: `${color}55` }}
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden" style={{ backgroundColor: color }}>
        {row.cover && (
          <Image
            src={row.cover}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 33vw, 20vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none"
          />
        )}
        {row.value && (
          // Light text on the dark pill: readable whatever the project's color
          <span className="absolute left-3 top-3 rounded-full bg-[var(--background)] px-2.5 py-1 font-google-sans-code text-[10px] uppercase tracking-wide text-[var(--foreground)]">
            {row.value}
          </span>
        )}
      </div>
      <div className="flex items-start gap-3 p-4">
        <span className="mt-1 size-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
        <span className="min-w-0 flex-1">
          <span className="block font-space-grotesk text-sm text-[var(--foreground)]">{row.title}</span>
          {row.detail && <span className="mt-0.5 line-clamp-2 block font-space-grotesk text-xs text-[var(--text-muted)]">{row.detail}</span>}
        </span>
        <ArrowRight size={16} strokeWidth={1.3} className="mt-0.5 shrink-0 text-[var(--text-muted)] transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}
