'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { track } from '@vercel/analytics';
import { useUser } from '@/lib/auth-stub.client';
import ScrollRow from '@/components/HorizontalRow';
import { useTheme } from '../../contexts/ThemeContext';
import { BRAND_COLOR_SLOTS, FOUNDER, FOUNDER_CTA, SITE_NAME } from '../../constants/organization';
import { BRAND_COLOR } from '../../constants/colors';
import coverColors from '../../covers/cover-colors.json';
import { resolveCoverSrc } from '../../utils/coverPath';
import { downloadColorSlotsCss, paletteToColorSlots, parseColorsFromCss } from '../../utils/importColorsCss';
import HandDrawnArrow from '../HandDrawnArrow';
import { BuildBrain, BuildLettering, BUILD_YOURS_DONE, inkOn } from '../build-yours/BuildYours';
import { RING_PATH, INK_PATH, PLUS_PATH, MARK_PATH } from './handDrawn';

const HEX6 = /^#[0-9A-F]{6}$/;
const SLOT_HINTS = [
  "your site's color. buttons, borders and the bar on a phone take it.",
  'leads the colors your visitors can pick from.',
  'leads the colors your visitors can pick from.',
  'leads the colors your visitors can pick from.',
  'leads the colors your visitors can pick from.',
];

/** "#abc" / "abc" / "#aabbcc" → "#AABBCC", or null */
function normalizeHex(value: string): string | null {
  const raw = value.trim().replace(/^#/, '').toUpperCase();
  const six = raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw;
  return HEX6.test(`#${six}`) ? `#${six}` : null;
}

// The founder's own cover first, then the photo covers, then everything else
const COVERS = Object.entries(coverColors as Record<string, string[]>)
  .map(([id, palette]) => ({ id, palette: palette.slice(0, 5).map((c) => normalizeHex(c) ?? '') }))
  .sort((a, b) => Number(b.id === FOUNDER.cover) - Number(a.id === FOUNDER.cover) || Number(b.id.startsWith('cover-')) - Number(a.id.startsWith('cover-')));

type Save =
  | { state: 'idle' }
  | { state: 'saving' }
  | { state: 'now' }
  | { state: 'after-deploy'; prUrl: string }
  | { state: 'paste'; line: string }
  | { state: 'error' };

/**
 * BrandColorsSetup - the site owner's five brand colors (FoundersConfig
 * `brandColors`), set by showing, not telling.
 *
 * Five hand-drawn rings draw themselves in; a picked color drops into its
 * ring like ink. The first ring is the site's color, and while it's being
 * picked the whole page wears it (ThemeContext's preview color, never stored);
 * leaving puts the site back. Colors come from the covers (a cover gives all
 * five at once, a dot just one), a custom color, or an UNCOLOR .css.
 *
 * The owner (an admin: /api/admin/brand-colors answers) saves them into
 * FoundersConfig.json: at once locally, as a pull request on a deployed site,
 * or as a line to paste without a GitHub App. Anyone else is trying their own
 * brand on this site, so saving becomes the ask: build yours to keep them, or
 * take them along as a .css their copy can load.
 *
 * Used in the setup-identity article and /admin's "your site." settings.
 */
export default function BrandColorsSetup({ placement = 'brand-colors' }: { placement?: string }) {
  const { colorValue, setPreviewColor } = useTheme();
  const { user, isLoaded } = useUser();
  // The same label the server's checkRole('admin') reads; the route still decides
  const maybeOwner = user?.publicMetadata?.role === 'admin';
  const [owner, setOwner] = useState<boolean | null>(null);
  const [saved, setSaved] = useState<string[]>(BRAND_COLOR_SLOTS);
  const [slots, setSlots] = useState<string[]>(BRAND_COLOR_SLOTS);
  const [active, setActive] = useState(0);
  const [hexDraft, setHexDraft] = useState('');
  const [save, setSave] = useState<Save>({ state: 'idle' });
  const [seen, setSeen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const cssInputRef = useRef<HTMLInputElement>(null);

  // Owner or not: only an admin can read the saved colors (anyone else is a
  // visitor without asking, so their console stays clean)
  useEffect(() => {
    if (!isLoaded) return;
    if (!maybeOwner) {
      setOwner(false);
      return;
    }
    let cancelled = false;
    fetch('/api/admin/brand-colors')
      .then(async (res) => {
        if (cancelled) return;
        if (!res.ok) return setOwner(false);
        const data = await res.json();
        setOwner(true);
        setSaved(data.colors);
        setSlots(data.colors);
      })
      .catch(() => !cancelled && setOwner(false));
    return () => {
      cancelled = true;
    };
  }, [isLoaded, maybeOwner]);

  // The rings draw themselves in once they're on screen
  useEffect(() => {
    const el = rootRef.current;
    if (!el || seen) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setSeen(true);
        observer.disconnect();
      }
    }, { threshold: 0.3 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [seen]);

  // The whole page wears the first color while it differs from the site's
  useEffect(() => {
    setPreviewColor(slots[0] && slots[0] !== BRAND_COLOR.toUpperCase() ? slots[0] : null);
  }, [slots, setPreviewColor]);
  useEffect(() => () => setPreviewColor(null), [setPreviewColor]);

  const dirty = slots.join() !== saved.join();
  const ink = inkOn(colorValue);

  const setSlot = (index: number, color: string) => {
    setSlots((prev) => prev.map((c, i) => (i === index ? color : c)));
    setSave({ state: 'idle' });
  };
  const takeAll = (palette: string[]) => {
    setSlots(Array.from({ length: 5 }, (_, i) => palette[i] ?? ''));
    setActive(0);
    setSave({ state: 'idle' });
  };

  const commitHex = () => {
    const hex = normalizeHex(hexDraft);
    if (hex) setSlot(active, hex);
    setHexDraft('');
  };

  const loadCss = async (file: File) => {
    const palette = paletteToColorSlots(parseColorsFromCss(await file.text())).map((c) => normalizeHex(c) ?? '');
    if (palette.some(Boolean)) takeAll(palette);
  };

  const downloadCss = () => downloadColorSlotsCss(slots, `brand colors, made on ${SITE_NAME}`);

  const onSave = async () => {
    setSave({ state: 'saving' });
    try {
      const res = await fetch('/api/admin/brand-colors', { method: 'POST', body: JSON.stringify({ colors: slots }) });
      const data = await res.json().catch(() => ({}));
      if (res.status === 409 && data.line) return setSave({ state: 'paste', line: data.line });
      if (!res.ok) return setSave({ state: 'error' });
      setSaved(slots);
      setSave(data.applied === 'after-deploy' ? { state: 'after-deploy', prUrl: data.prUrl } : { state: 'now' });
    } catch {
      setSave({ state: 'error' });
    }
  };

  const covers = useMemo(
    () =>
      COVERS.map(({ id, palette }) => {
        const src = resolveCoverSrc(id);
        return (
          <div key={id} className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => takeAll(palette)}
              aria-label={`Use all five colors from ${id}`}
              className="group relative aspect-square w-full overflow-hidden rounded-lg border-2 transition-transform duration-200 hover:-translate-y-px motion-reduce:transition-none"
              style={{ borderColor: palette.join() === slots.join() ? colorValue : 'transparent' }}
            >
              <Image src={src} alt="" fill sizes="120px" className="object-cover" unoptimized={src.endsWith('.svg')} />
            </button>
            <div className="flex gap-1">
              {palette.map((color, i) =>
                color ? (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSlot(active, color)}
                    aria-label={`Use ${color} for color ${active + 1}`}
                    className="size-5 rounded-full transition-transform hover:scale-110 motion-reduce:transition-none"
                    style={{ backgroundColor: color }}
                  />
                ) : null
              )}
            </div>
          </div>
        );
      }),
    // takeAll/setSlot only close over setters and `active`
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [active, slots, colorValue]
  );

  return (
    <div ref={rootRef} className="brand-colors flex flex-col gap-8" data-seen={seen || undefined}>
      {/* The five rings */}
      <div className="flex flex-col gap-3">
        <p className="font-google-sans-code text-xs uppercase tracking-wider text-[var(--text-muted)]">your colors.</p>
        <div className="flex items-end gap-3 sm:gap-4">
          {slots.map((color, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              aria-pressed={active === i}
              aria-label={`Color ${i + 1}${i === 0 ? ", your site's color" : ''}: ${color || 'empty'}`}
              className={`brand-ring flex flex-col items-start gap-1 ${i === 0 ? 'w-20 sm:w-24' : 'w-12 sm:w-14'}`}
              style={{ '--ring-delay': `${i * 130}ms` } as React.CSSProperties}
            >
              <svg viewBox="0 0 64 64" className="w-full" aria-hidden="true">
                {color && <path key={color} className="brand-ring__ink" d={INK_PATH} fill={color} />}
                {!color && <path className="brand-ring__line" d={PLUS_PATH} pathLength={1} fill="none" stroke="var(--text-muted)" strokeWidth={2} strokeLinecap="round" />}
                <path className="brand-ring__line" d={RING_PATH} pathLength={1} fill="none" stroke="var(--foreground)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <svg viewBox="0 0 64 10" className="h-2 w-full" aria-hidden="true">
                {active === i && <path className="brand-ring__mark" d={MARK_PATH} pathLength={1} fill="none" stroke={colorValue} strokeWidth={2.5} strokeLinecap="round" />}
              </svg>
            </button>
          ))}
        </div>
        <p className="max-w-md font-google-sans-code text-xs text-[var(--text-muted)]">
          <span className="text-[var(--foreground)]">{active + 1}.</span> {SLOT_HINTS[active]}
          {slots[active] && <span className="text-[var(--foreground)]"> {slots[active]}</span>}
        </p>
      </div>

      {/* Where colors come from */}
      <div className="flex flex-col gap-3">
        <p className="font-google-sans-code text-xs uppercase tracking-wider text-[var(--text-muted)]">
          from your covers. one tap takes all five, a dot just the one.
        </p>
        <ScrollRow items={covers} itemClassName="w-[112px]" ariaLabel="Cover palettes" />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <label className="group relative flex size-11 cursor-pointer items-center justify-center" title="Pick any color">
          <span className="sr-only">Pick any color for color {active + 1}</span>
          <input
            type="color"
            value={slots[active] || BRAND_COLOR}
            onChange={(e) => setSlot(active, e.target.value.toUpperCase())}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
          <svg viewBox="0 0 64 64" className="size-11" aria-hidden="true">
            <path d={RING_PATH} fill="none" stroke={colorValue} strokeWidth={3} strokeLinecap="round" />
            <path d={PLUS_PATH} fill="none" stroke="var(--foreground)" strokeWidth={3} strokeLinecap="round" />
          </svg>
        </label>
        <input
          value={hexDraft}
          onChange={(e) => setHexDraft(e.target.value)}
          onBlur={commitHex}
          onKeyDown={(e) => e.key === 'Enter' && commitHex()}
          placeholder={slots[active] || '#C8553D'}
          aria-label={`Hex code for color ${active + 1}`}
          className="w-28 rounded-full border bg-transparent px-4 py-2 font-google-sans-code text-xs uppercase text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus:outline-none"
          style={{ borderColor: colorValue }}
        />
        {active > 0 && slots[active] && (
          <button
            type="button"
            onClick={() => setSlot(active, '')}
            className="font-google-sans-code text-xs uppercase tracking-wider text-[var(--text-muted)] underline decoration-dotted underline-offset-4 hover:text-[var(--foreground)]"
          >
            clear {active + 1}
          </button>
        )}
        <button
          type="button"
          onClick={() => cssInputRef.current?.click()}
          className="font-google-sans-code text-xs uppercase tracking-wider text-[var(--text-muted)] underline decoration-dotted underline-offset-4 hover:text-[var(--foreground)]"
        >
          load a .css
        </button>
        <input
          ref={cssInputRef}
          type="file"
          accept=".css,text/css"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) loadCss(file);
            e.target.value = '';
          }}
        />
      </div>

      {/* Keep them */}
      {owner === null ? null : owner ? (
        <div className="flex flex-col items-start gap-3">
          {(dirty || save.state === 'saving') && (
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={onSave}
                disabled={save.state === 'saving'}
                className="rounded-full px-6 py-2.5 font-google-sans-code text-xs uppercase tracking-wider transition-transform duration-200 hover:-translate-y-px disabled:opacity-60 motion-reduce:transition-none"
                style={{ backgroundColor: colorValue, color: ink }}
              >
                {save.state === 'saving' ? 'saving…' : 'save my colors'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSlots(saved);
                  setSave({ state: 'idle' });
                }}
                className="font-google-sans-code text-xs uppercase tracking-wider text-[var(--text-muted)] underline decoration-dotted underline-offset-4 hover:text-[var(--foreground)]"
              >
                put them back
              </button>
            </div>
          )}
          {save.state === 'now' && <Note>saved. your site picks up its new colors as it reloads.</Note>}
          {save.state === 'after-deploy' && (
            <>
              <Note>saved. your site wears them after its next deploy, in a minute or two.</Note>
              <a href={save.prUrl} target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-2 font-google-sans-code text-xs uppercase tracking-wider text-[var(--foreground)]">
                see the change <HandDrawnArrow className="h-4 w-7" />
              </a>
            </>
          )}
          {save.state === 'paste' && <PasteLine line={save.line} />}
          {save.state === 'error' && <Note>that didn&apos;t save. try again in a moment.</Note>}
          {!dirty && save.state === 'idle' && <Note>tap a ring, then a color. the page tries it on as you go.</Note>}
        </div>
      ) : (
        <div className="flex flex-col items-start gap-4">
          <Note>
            {dirty
              ? 'these are your colors, on this page for as long as you stay. build yours to keep them.'
              : 'tap a ring, then a color. this page tries your brand on as you go.'}
          </Note>
          {dirty && FOUNDER_CTA && (
            <Link
              href={FOUNDER_CTA.href}
              onClick={() => track('cta_clicked', { cta: FOUNDER_CTA?.label ?? 'build yours', placement })}
              aria-label={FOUNDER_CTA.label}
              className="build-yours flex h-12 items-center gap-2 rounded-full pl-3 pr-5 transition-transform duration-200 hover:-translate-y-px motion-reduce:transition-none"
              style={{ backgroundColor: colorValue, ...BUILD_YOURS_DONE }}
            >
              <BuildBrain color={colorValue} ink={ink} className="size-7 shrink-0" />
              <BuildLettering ink={ink} className="h-[26px] w-auto" />
            </Link>
          )}
          {dirty && (
            <button
              type="button"
              onClick={downloadCss}
              className="font-google-sans-code text-xs uppercase tracking-wider text-[var(--text-muted)] underline decoration-dotted underline-offset-4 hover:text-[var(--foreground)]"
            >
              take them with you (.css)
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return <p className="max-w-md font-google-sans-code text-xs text-[var(--text-muted)]">{children}</p>;
}

// No GitHub App: the line to paste into FoundersConfig.json, with a copy button
function PasteLine({ line }: { line: string }) {
  const { colorValue } = useTheme();
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex max-w-xl flex-col items-start gap-2">
      <Note>
        this site can&apos;t change its own files yet. paste this over the brandColors line in src/data/FoundersConfig.json,
        or <Link href="/article/setup-github-app" className="underline decoration-dotted underline-offset-4">connect your GitHub App</Link> to save from here.
      </Note>
      <div className="flex w-full items-center gap-3 rounded-lg border px-4 py-3" style={{ borderColor: colorValue }}>
        <code className="flex-1 overflow-x-auto whitespace-nowrap font-google-sans-code text-xs text-[var(--foreground)]">{line}</code>
        <button
          type="button"
          onClick={() => navigator.clipboard.writeText(line).then(() => setCopied(true)).catch(() => {})}
          className="font-google-sans-code text-xs uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--foreground)]"
        >
          {copied ? 'copied' : 'copy'}
        </button>
      </div>
    </div>
  );
}
