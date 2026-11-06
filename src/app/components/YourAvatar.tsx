"use client";

import { useEffect, useRef, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { FOUNDER } from '@/app/constants/organization';
import { authorImageOf } from '@/lib/author-image';
import { clearBackground, findPlainBackground, trimToContent } from '@/lib/clear-background';

const LABEL = 'font-google-sans-code text-[10px] uppercase tracking-wide text-[var(--text-muted)]';
const SIZE = 800; // The saved square, px: sharp at every size a byline uses

type Saved = { applied: 'now'; image: string } | { applied: 'after-deploy'; prUrl: string; image: string };

const WORK = 1600; // The longest side the picture is read at: enough detail, still quick
const MARGIN = 1.08; // Room around a cleared drawing, framed square

const toPng = (canvas: HTMLCanvasElement) =>
  new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not read the picture'))), 'image/png'));

/** A canvas of `w`×`h` with its 2D context */
function canvasOf(w: number, h: number) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('This browser cannot read the picture');
  ctx.imageSmoothingQuality = 'high';
  return { canvas, ctx };
}

type Prepared = { kept: Blob; cleared: Blob | null };

/**
 * The picture two ways, each a square PNG of at most SIZE: as it is, cropped
 * from its middle; and, when its background is one color, with that
 * background cleared and the drawing framed square (src/lib/clear-background.ts)
 */
async function prepare(file: File): Promise<Prepared> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, WORK / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const work = canvasOf(w, h);
  work.ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  const side = Math.min(w, h);
  const kept = canvasOf(Math.min(SIZE, side), Math.min(SIZE, side));
  kept.ctx.drawImage(work.canvas, (w - side) / 2, (h - side) / 2, side, side, 0, 0, kept.canvas.width, kept.canvas.height);

  const pixels = work.ctx.getImageData(0, 0, w, h);
  const bg = findPlainBackground(pixels);
  let cleared: Blob | null = null;
  if (bg) {
    const clear = clearBackground(pixels, bg);
    const box = trimToContent(clear);
    if (box) {
      work.ctx.putImageData(clear, 0, 0);
      const frame = Math.round(Math.max(box.w, box.h) * MARGIN);
      const out = Math.min(SIZE, frame);
      const k = out / frame;
      const square = canvasOf(out, out);
      square.ctx.drawImage(work.canvas, box.x, box.y, box.w, box.h, ((frame - box.w) / 2) * k, ((frame - box.h) / 2) * k, box.w * k, box.h * k);
      cleared = await toPng(square.canvas);
    }
  }
  return { kept: await toPng(kept.canvas), cleared };
}

/** The avatar the way a byline shows it: a circle, and the dock's ringed end cap */
function Circles({ src, alt, color }: { src?: string; alt: string; color: string }) {
  return (
    <div className="flex items-end gap-4">
      <span className="block size-24 overflow-hidden rounded-full" style={{ backgroundColor: `${color}14` }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- a picked file is a blob: URL, which next/image can't load */}
        {src && <img src={src} alt={alt} className="size-full object-cover" />}
      </span>
      <span className="flex size-14 items-center justify-center rounded-full border-2 p-1" style={{ borderColor: color, backgroundColor: 'var(--background)' }}>
        <span className="block size-full overflow-hidden rounded-full">
          {/* eslint-disable-next-line @next/next/no-img-element -- as above */}
          {src && <img src={src} alt="" className="size-full object-cover" />}
        </span>
      </span>
    </div>
  );
}

/**
 * YourAvatar - the owner's picture (/admin → Your avatar): beside every
 * article and story that doesn't name another author (authorImageOf), and on
 * /founders. Pick a picture and it's made square in the browser: with a
 * one-color background, that background is cleared and the picture framed
 * around what's left (src/lib/clear-background.ts), a tap keeping it as it is
 * instead; otherwise it's cropped from its middle. Then it's saved as a new PNG in public/ that FoundersConfig
 * `founder.image` points at (/api/admin/avatar): in the copy at once on a
 * local copy, once its pull request deploys on a live one.
 */
export default function YourAvatar() {
  const { colorValue } = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);
  const [current, setCurrent] = useState(() => authorImageOf(undefined));
  // The picked picture both ways, and whether its background goes
  const [picked, setPicked] = useState<{ kept: string; cleared: string | null; blobs: Prepared } | null>(null);
  const [clear, setClear] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<Saved | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Let go of the preview's object URL when it's replaced or the row closes
  useEffect(() => () => {
    if (!picked) return;
    URL.revokeObjectURL(picked.kept);
    if (picked.cleared) URL.revokeObjectURL(picked.cleared);
  }, [picked]);
  const choice = picked && (clear && picked.cleared ? { url: picked.cleared, blob: picked.blobs.cleared! } : { url: picked.kept, blob: picked.blobs.kept });

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setSaved(null);
    try {
      const blobs = await prepare(file);
      setPicked({ kept: URL.createObjectURL(blobs.kept), cleared: blobs.cleared && URL.createObjectURL(blobs.cleared), blobs });
      setClear(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read the picture');
    }
  };

  const save = async () => {
    if (!choice) return;
    setSaving(true);
    setError(null);
    try {
      const body = new FormData();
      body.append('avatar', choice.blob, 'avatar.png');
      const r = await fetch('/api/admin/avatar', { method: 'POST', body });
      const d = await r.json();
      if (!r.ok) throw new Error(d.line ? `${d.error}: ${d.line}` : d.error);
      setSaved(d);
      if (d.applied === 'now') {
        setCurrent(d.image);
        setPicked(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  const button = 'inline-flex h-10 items-center rounded-full border px-4 font-google-sans-code text-xs transition-transform duration-200 hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100';

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex flex-wrap items-end gap-10">
        <div className="space-y-2">
          <p className={LABEL}>now</p>
          <Circles src={current} alt={FOUNDER.name} color={colorValue} />
        </div>
        {picked && (
          <div className="space-y-2">
            <p className={LABEL}>new</p>
            <Circles src={choice?.url} alt={FOUNDER.name} color={colorValue} />
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ''; }} />
        <button type="button" onClick={() => inputRef.current?.click()} className={button} style={{ borderColor: `${colorValue}66`, color: 'var(--foreground)' }}>
          {picked ? 'choose another' : 'choose a picture'}
        </button>
        {picked?.cleared && (
          // Its background was one color: cleared to start, kept with a tap
          <button
            type="button"
            onClick={() => setClear((now) => !now)}
            aria-pressed={clear}
            className={button}
            style={clear ? { borderColor: colorValue, backgroundColor: colorValue, color: 'var(--background)' } : { borderColor: `${colorValue}66`, color: 'var(--foreground)' }}
          >
            clear the background
          </button>
        )}
        <button type="button" onClick={save} disabled={!choice || saving} className={button} style={{ borderColor: colorValue, color: colorValue }}>
          {saving ? 'saving…' : 'save your avatar'}
        </button>
      </div>

      <p className="font-space-grotesk text-xs text-[var(--text-muted)]" aria-live="polite">
        {error ? (
          <span style={{ color: colorValue }}>{error}</span>
        ) : saved?.applied === 'now' ? (
          'saved.'
        ) : saved?.applied === 'after-deploy' ? (
          <>
            saved. live once{' '}
            <a href={saved.prUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4" style={{ color: colorValue }}>
              the change
            </a>{' '}
            deploys.
          </>
        ) : picked && !picked.cleared ? (
          "its background isn't one color, so it stays. a PNG with a clear background sits on any color."
        ) : picked ? (
          clear ? 'its background is cleared and it is framed around you, so it sits on any color.' : 'kept as it is, cropped square from the middle.'
        ) : (
          'it sits beside every article and story of yours. a plain background gets cleared for you.'
        )}
      </p>
    </div>
  );
}
