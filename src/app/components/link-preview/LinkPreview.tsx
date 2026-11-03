'use client';

import { useEffect, useState } from 'react';
import ScrollRow from '@/components/HorizontalRow';
import { useTheme } from '../../contexts/ThemeContext';
import { FOUNDER, SITE_NAME, SITE_TAGLINE, SITE_TITLE } from '../../constants/organization';
import { ogImageUrl } from '../../utils/ogMetadata';
import HandDrawnArrow from '../HandDrawnArrow';

export interface LinkPreviewPreset {
  label: string;
  title: string;
  subtitle?: string;
  category?: string;
  cover?: string | string[] | null;
}

/**
 * LinkPreview - what people see when someone shares a link to the site: the
 * real /api/og image, in the places it shows up (Messages, X, Slack).
 *
 * Shows, doesn't tell. Type a title and the card redraws itself (it's the
 * same image the pages use, not a mock of it); turn the cover on or off; pick
 * one of the site's own pages. `followTheme` makes the card wear the color on
 * screen, so beside the brand color setup it changes as colors are tried on.
 *
 * Home: /og. Also embedded in setup-identity, under the brand colors.
 */
export default function LinkPreview({ presets = [], followTheme = false }: { presets?: LinkPreviewPreset[]; followTheme?: boolean }) {
  const { colorValue } = useTheme();
  const [title, setTitle] = useState(presets[0]?.title ?? SITE_NAME);
  const [subtitle, setSubtitle] = useState(presets[0]?.subtitle ?? SITE_TAGLINE);
  const [category, setCategory] = useState(presets[0]?.category);
  const [cover, setCover] = useState<string | string[] | null | undefined>(presets[0]?.cover ?? FOUNDER.cover);
  const [src, setSrc] = useState<string | null>(null);

  // Redraw a moment after typing stops, not on every key
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const url = new URL(ogImageUrl({ title: title || SITE_NAME, subtitle, category, cover }, window.location.origin));
      if (followTheme) url.searchParams.set('brand', colorValue.toUpperCase());
      setSrc(`${url.pathname}${url.search}`);
    }, 450);
    return () => window.clearTimeout(timer);
  }, [title, subtitle, category, cover, followTheme, colorValue]);

  const usePreset = (preset: LinkPreviewPreset) => {
    setTitle(preset.title);
    setSubtitle(preset.subtitle ?? '');
    setCategory(preset.category);
    setCover(preset.cover ?? null);
  };

  const card = src ? (
    // eslint-disable-next-line @next/next/no-img-element -- the live /api/og render; next/image would cache a stale one
    <img key={src} src={src} alt={`Link preview: ${title}`} width={1200} height={630} className="link-preview__card block aspect-[1200/630] w-full object-cover" />
  ) : (
    <div className="aspect-[1200/630] w-full bg-[var(--background-highlight)]" />
  );

  const frames = [
    // Messages: the picture with a bar under it
    <Frame key="messages" label="messages">
      <div className="overflow-hidden rounded-2xl border" style={{ borderColor: colorValue }}>
        {card}
        <div className="flex flex-col gap-0.5 bg-[var(--background-highlight)] px-3 py-2">
          <span className="line-clamp-1 font-space-grotesk text-sm text-[var(--foreground)]">{title || SITE_NAME}</span>
          <span className="font-google-sans-code text-[11px] text-[var(--text-muted)]">{SITE_TITLE}</span>
        </div>
      </div>
    </Frame>,
    // X: the picture alone, the address over its corner
    <Frame key="x" label="x">
      <div className="relative overflow-hidden rounded-2xl border" style={{ borderColor: colorValue }}>
        {card}
        <span className="absolute bottom-2 left-2 rounded bg-[var(--background)] px-1.5 py-0.5 font-google-sans-code text-[11px] text-[var(--foreground)] opacity-90">
          {SITE_TITLE}
        </span>
      </div>
    </Frame>,
    // Slack: the site's name and the words first, the picture under them
    <Frame key="slack" label="slack">
      <div className="flex gap-3">
        <div className="w-1 shrink-0 rounded-full" style={{ backgroundColor: colorValue }} />
        <div className="flex min-w-0 flex-col gap-1">
          <span className="font-space-grotesk text-xs font-semibold text-[var(--foreground)]">{SITE_NAME}</span>
          <span className="line-clamp-1 font-space-grotesk text-sm" style={{ color: colorValue }}>{title || SITE_NAME}</span>
          {subtitle && <span className="line-clamp-2 font-space-grotesk text-xs text-[var(--text-muted)]">{subtitle}</span>}
          <div className="mt-1 overflow-hidden rounded-lg">{card}</div>
        </div>
      </div>
    </Frame>,
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="group flex items-center gap-3">
        <p className="font-google-sans-code text-xs uppercase tracking-wider text-[var(--text-muted)]">
          what people see when your link is shared
        </p>
        <HandDrawnArrow className="h-5 w-8" />
      </div>

      <ScrollRow items={frames} itemClassName="w-[300px]" ariaLabel="Where your link shows up" />

      {/* The words on the card */}
      <div className="flex max-w-xl flex-col gap-3">
        {presets.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {presets.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => usePreset(preset)}
                aria-pressed={preset.title === title}
                className="rounded-full border px-3 py-1.5 font-google-sans-code text-[11px] uppercase tracking-wider text-[var(--foreground)] transition-colors hover:bg-[var(--background-highlight)]"
                style={{ borderColor: colorValue, backgroundColor: preset.title === title ? `${colorValue}26` : undefined }}
              >
                {preset.label}
              </button>
            ))}
          </div>
        )}
        <Field label="title" value={title} onChange={setTitle} />
        <Field label="the line under it" value={subtitle ?? ''} onChange={setSubtitle} />
        <label className="flex cursor-pointer items-center gap-3 font-google-sans-code text-xs text-[var(--text-muted)]">
          <input
            type="checkbox"
            checked={Boolean(cover)}
            onChange={(e) => setCover(e.target.checked ? presets.find((p) => p.title === title)?.cover || FOUNDER.cover : null)}
            className="size-4"
            style={{ accentColor: colorValue }}
          />
          show a cover. without one, the card shows your brand colors.
        </label>
      </div>
    </div>
  );
}

function Frame({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="font-google-sans-code text-[11px] uppercase tracking-wider text-[var(--text-muted)]">{label}</span>
      {children}
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const { colorValue } = useTheme();
  return (
    <label className="flex flex-col gap-1">
      <span className="font-google-sans-code text-[11px] uppercase tracking-wider text-[var(--text-muted)]">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={110}
        className="rounded-full border bg-transparent px-4 py-2 font-space-grotesk text-sm text-[var(--foreground)] focus:outline-none"
        style={{ borderColor: colorValue }}
      />
    </label>
  );
}
