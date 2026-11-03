'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import HandDrawnIcon from './HandDrawnIcon';
import { iconByName } from './byName';
import { DRAWABLE_ICONS, FIRST_ICONS } from './drawable';
import { setVisitorIcon, visitorIcons } from './visitorIcons';

type Point = [number, number];
type Drawings = Record<string, string[]>;
type Target = 'site' | 'default';
type Saved = { site: Drawings; defaults: Drawings; canChange: boolean; local: boolean };
type Save =
  | { state: 'idle' }
  | { state: 'saving' }
  | { state: 'now'; count: number }
  | { state: 'after-deploy'; prUrl: string; count: number }
  | { state: 'paste'; line: string }
  | { state: 'error'; message: string };

const LABEL = 'font-google-sans-code text-[10px] uppercase tracking-wide text-[var(--text-muted)]';
const BUTTON = 'min-h-10 rounded-full border px-4 py-2 font-google-sans-code text-[11px] uppercase tracking-wide transition hover:opacity-80 active:scale-[0.98] disabled:opacity-40';
const FIRST = new Set<string>(FIRST_ICONS);
const ORDER = [...DRAWABLE_ICONS].sort((a, b) => Number(FIRST.has(b)) - Number(FIRST.has(a)));
// Drawings not yet saved stay on this device, so a reload or a locked phone
// loses nothing. A local save reloads the page, so its result waits here too
const DRAFTS_KEY = 'icon-pad-drafts';
const VISITOR_DRAFTS_KEY = 'icon-pad-visitor-drafts';
const FLASH_KEY = 'icon-pad-saved';

function load<T>(key: string, storage: () => Storage, fallback: T): T {
  try {
    const raw = storage().getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function store(key: string, storage: () => Storage, value: unknown) {
  try {
    if (value === null) storage().removeItem(key);
    else storage().setItem(key, JSON.stringify(value));
  } catch {
    // Private browsing or full storage: drafts just don't outlive the page
  }
}

/** Ramer–Douglas–Peucker: drop the points a stroke doesn't need, keep its wobble */
function simplify(points: Point[], tolerance: number): Point[] {
  if (points.length < 3) return points;
  const [ax, ay] = points[0];
  const [bx, by] = points[points.length - 1];
  const length = Math.hypot(bx - ax, by - ay);
  let far = 0;
  let index = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const [px, py] = points[i];
    const distance = length
      ? Math.abs((by - ay) * px - (bx - ax) * py + bx * ay - by * ax) / length
      : Math.hypot(px - ax, py - ay);
    if (distance > far) { far = distance; index = i; }
  }
  if (far <= tolerance) return [points[0], points[points.length - 1]];
  return [...simplify(points.slice(0, index + 1), tolerance).slice(0, -1), ...simplify(points.slice(index), tolerance)];
}

const r = (n: number) => Math.round(n * 10) / 10;

/** The kept points as one smooth pen stroke (Catmull-Rom as cubic curves), on the 24 grid */
function toStroke(raw: Point[]): string {
  const points = simplify(raw, 0.12);
  const [x0, y0] = points[0];
  if (points.length === 1) return `M${r(x0)} ${r(y0)}l.1 0`;
  let d = `M${r(x0)} ${r(y0)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const [x1, y1] = points[i];
    const [x2, y2] = points[i + 1];
    const p3 = points[i + 2] ?? points[i + 1];
    d += `C${r(x1 + (x2 - p0[0]) / 6)} ${r(y1 + (y2 - p0[1]) / 6)} ${r(x2 - (p3[0] - x1) / 6)} ${r(y2 - (p3[1] - y1) / 6)} ${r(x2)} ${r(y2)}`;
  }
  return d;
}

/**
 * IconDrawPad - redraw any hand-drawn icon in your own hand: finger, pen or
 * mouse on the icons' 24×24 grid, over a ghost of the icon it replaces, shown
 * at 16, 24 and 48px as you draw. Strokes are kept as drawn (only thinned of
 * points they don't need), so overshoots and wobble survive. Made for a phone:
 * the pad takes the touch (no scrolling or zooming while drawing), a second
 * finger is ignored, and a pen's palm doesn't draw.
 *
 * Draw as many icons as you like; each waits on this device as a draft. One
 * save sends them all (an admin, through /api/admin/icons) to this site's own
 * icons (FoundersConfig.json `icons`) or the app's defaults (drawn.json, which
 * ship with every copy): at once locally, as one pull request when deployed.
 * HandDrawnIcon draws a saved drawing wherever that icon is used.
 *
 * mode="visitor" (the default, and how stories and articles embed it) is the
 * same pad for anyone: "use mine" keeps the drawing in the visitor's browser
 * (visitorIcons), where it replaces that icon on every page they open, and
 * nothing is sent anywhere. /admin uses mode="owner". `compact` stacks the
 * pad over its controls at every width, for a column in a story.
 */
export default function IconDrawPad({ mode = 'visitor', icons, compact = false }: {
  mode?: 'visitor' | 'owner';
  // The icons to offer (default: the 20 seen most for a visitor, all for the
  // owner). A story's directive can't hold a list, so "Heart|User" works too
  icons?: string[] | string;
  compact?: boolean;
}) {
  const owner = mode === 'owner';
  const draftsKey = owner ? DRAFTS_KEY : VISITOR_DRAFTS_KEY;
  const iconList = typeof icons === 'string' ? icons.split('|').map((icon) => icon.trim()) : icons;
  const offered = iconList?.length ? iconList.filter((icon) => DRAWABLE_ICONS.includes(icon)) : owner ? ORDER : [...FIRST_ICONS];
  const { colorValue } = useTheme();
  const [name, setName] = useState<string>(offered[0] ?? FIRST_ICONS[0]);
  const [mine, setMine] = useState<string[]>([]);
  const [drafts, setDrafts] = useState<Drawings>({});
  const [live, setLive] = useState<Point[] | null>(null);
  const [saved, setSaved] = useState<Saved | null>(null);
  const [save, setSave] = useState<Save>({ state: 'idle' });
  const pad = useRef<SVGSVGElement>(null);
  const points = useRef<Point[] | null>(null);
  const pointer = useRef<number | null>(null);
  const penSeen = useRef(false);
  const frame = useRef(0);

  useEffect(() => {
    setDrafts(load(draftsKey, () => localStorage, {}));
    setMine(Object.keys(visitorIcons()));
    const flash = load<Save | null>(FLASH_KEY, () => sessionStorage, null);
    if (flash) {
      setSave(flash);
      store(FLASH_KEY, () => sessionStorage, null);
    }
    if (owner) fetch('/api/admin/icons').then((res) => (res.ok ? res.json() : null)).then(setSaved).catch(() => setSaved(null));
    return () => cancelAnimationFrame(frame.current);
  }, []);

  const setDrawing = useCallback((icon: string, strokes: string[] | null) => {
    setDrafts((current) => {
      const next = { ...current };
      if (strokes === null) delete next[icon];
      else next[icon] = strokes;
      store(draftsKey, () => localStorage, next);
      return next;
    });
  }, []);

  const strokes = drafts[name] ?? [];

  const at = (event: { clientX: number; clientY: number }): Point => {
    const box = pad.current!.getBoundingClientRect();
    const clamp = (n: number) => Math.min(24, Math.max(0, n));
    return [clamp(((event.clientX - box.left) / box.width) * 24), clamp(((event.clientY - box.top) / box.height) * 24)];
  };

  const paint = () => {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => setLive(points.current ? [...points.current] : null));
  };

  const down = (event: React.PointerEvent<SVGSVGElement>) => {
    if (event.pointerType === 'pen') penSeen.current = true;
    // One stroke at a time; with a pen in use, a resting palm doesn't draw
    if (pointer.current !== null || (penSeen.current && event.pointerType === 'touch')) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    pointer.current = event.pointerId;
    points.current = [at(event)];
    if (save.state !== 'saving') setSave({ state: 'idle' });
    paint();
  };

  const move = (event: React.PointerEvent<SVGSVGElement>) => {
    if (event.pointerId !== pointer.current || !points.current) return;
    // Every sample since the last frame (Safari 18+), not just the latest
    const samples = event.nativeEvent.getCoalescedEvents?.() ?? [];
    for (const sample of samples.length ? samples : [event.nativeEvent]) {
      const point = at(sample);
      const [lx, ly] = points.current[points.current.length - 1];
      if (Math.hypot(point[0] - lx, point[1] - ly) > 0.08) points.current.push(point);
    }
    paint();
  };

  const up = (event: React.PointerEvent<SVGSVGElement>) => {
    if (event.pointerId !== pointer.current) return;
    pointer.current = null;
    const done = points.current;
    points.current = null;
    cancelAnimationFrame(frame.current);
    setLive(null);
    if (done && event.type !== 'pointercancel') setDrawing(name, [...strokes, toStroke(done)]);
  };

  const pending = Object.keys(drafts).filter((icon) => drafts[icon].length);

  const send = async (target: Target, drawings: Drawings) => {
    setSave({ state: 'saving' });
    try {
      const res = await fetch('/api/admin/icons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ drawings, target }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 409 && data.line) {
        setSave({ state: 'paste', line: data.line });
        return;
      }
      if (!res.ok) {
        setSave({ state: 'error', message: data.error ?? 'Could not save. Your drawings are still here.' });
        return;
      }
      const count = Object.keys(drawings).length;
      const result: Save = data.applied === 'after-deploy'
        ? { state: 'after-deploy', prUrl: data.prUrl, count }
        : { state: 'now', count };
      // Saved, so they stop being drafts; a local save reloads the page next
      store(FLASH_KEY, () => sessionStorage, result);
      for (const icon of Object.keys(drawings)) setDrawing(icon, null);
      setSave(result);
    } catch {
      setSave({ state: 'error', message: 'No connection. Your drawings are still here; try again.' });
    }
  };

  const Current = iconByName(name);
  const drawing = live && live.length ? [...strokes, toStroke(live)] : strokes;
  const busy = save.state === 'saving';
  const drawnHere = (icon: string) => owner ? Boolean(saved?.site[icon]?.length || saved?.defaults[icon]?.length) : mine.includes(icon);
  const keepMine = (strokes: string[]) => {
    setVisitorIcon(name, strokes);
    setMine(Object.keys(visitorIcons()));
    if (strokes.length) setDrawing(name, null);
    setSave(strokes.length ? { state: 'now', count: 1 } : { state: 'idle' });
  };
  const outline = { borderColor: colorValue, color: colorValue };

  return (
    <div className="flex flex-col gap-6 text-left">
      <div className={`flex flex-col gap-5 ${compact ? '' : 'md:flex-row md:items-start md:gap-6'}`}>
        <svg
          ref={pad}
          viewBox="0 0 24 24"
          className="aspect-square w-full max-w-[360px] shrink-0 cursor-crosshair touch-none select-none rounded-xl border"
          style={{ borderColor: colorValue, WebkitUserSelect: 'none', WebkitTouchCallout: 'none' } as React.CSSProperties}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
          onContextMenu={(event) => event.preventDefault()}
          aria-label={`Draw the ${name} icon`}
          role="img"
        >
          {Array.from({ length: 23 }, (_, i) => i + 1).map((n) => (
            <g key={n} stroke="var(--text-muted)" strokeWidth={n % 6 === 0 ? 0.04 : 0.02} opacity={0.5}>
              <line x1={n} y1={0} x2={n} y2={24} />
              <line x1={0} y1={n} x2={24} y2={n} />
            </g>
          ))}
          {/* The icon it replaces, faint, to keep the proportions */}
          {Current && drawing.length === 0 && (
            <g opacity={0.18} style={{ color: 'var(--foreground)' }}>
              <Current size={24} />
            </g>
          )}
          <g fill="none" stroke={colorValue} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
            {drawing.map((d, i) => <path key={i} d={d} />)}
          </g>
        </svg>

        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <div>
            <p className={LABEL}>{name}{FIRST.has(name) ? ' · seen most' : ''}</p>
            <p className="mt-1 font-space-grotesk text-sm text-[var(--text-muted)]">
              draw it in a few strokes, the way your hand does. let lines overshoot and loops run past where they start.
            </p>
          </div>

          <div className="flex items-end gap-6">
            <div>
              <p className={`${LABEL} mb-2`}>now</p>
              <div className="flex items-end gap-3 text-[var(--foreground)]">
                {Current && [16, 24, 48].map((s) => <Current key={s} size={s} />)}
              </div>
            </div>
            <div>
              <p className={`${LABEL} mb-2`}>yours</p>
              <div className="flex min-h-12 items-end gap-3 text-[var(--foreground)]">
                {drawing.length > 0 && [16, 24, 48].map((s) => (
                  <HandDrawnIcon key={s} size={s}>{drawing.map((d, i) => <path key={i} d={d} />)}</HandDrawnIcon>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" className={BUTTON} style={outline} disabled={!strokes.length} onClick={() => setDrawing(name, strokes.length > 1 ? strokes.slice(0, -1) : null)}>undo</button>
            <button type="button" className={BUTTON} style={outline} disabled={!strokes.length} onClick={() => setDrawing(name, null)}>clear</button>
            {saved?.site[name]?.length ? (
              <button type="button" className={BUTTON} style={outline} disabled={busy} onClick={() => send('site', { [name]: [] })}>
                use the default again
              </button>
            ) : null}
          </div>

          {!owner && (
            <div className="flex flex-wrap gap-2 border-t border-theme-line pt-4">
              <button
                type="button"
                className={BUTTON}
                style={{ backgroundColor: colorValue, borderColor: colorValue, color: 'var(--background)' }}
                disabled={!strokes.length}
                onClick={() => keepMine(strokes)}
              >
                use mine
              </button>
              {mine.includes(name) && (
                <button type="button" className={BUTTON} style={outline} onClick={() => keepMine([])}>
                  put the site&apos;s back
                </button>
              )}
            </div>
          )}

          {owner && saved && (
            <div className="flex flex-col gap-3 border-t border-theme-line pt-4">
              <p className={LABEL}>
                {pending.length ? `${pending.length} drawn, waiting on this device: ${pending.join(', ')}` : 'draw an icon, then pick the next. save them all at once.'}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={BUTTON}
                  style={{ backgroundColor: colorValue, borderColor: colorValue, color: 'var(--background)' }}
                  disabled={!pending.length || busy}
                  onClick={() => send('site', Object.fromEntries(pending.map((icon) => [icon, drafts[icon]])))}
                >
                  save to your site
                </button>
                <button
                  type="button"
                  className={BUTTON}
                  style={outline}
                  disabled={!pending.length || busy}
                  onClick={() => send('default', Object.fromEntries(pending.map((icon) => [icon, drafts[icon]])))}
                >
                  make them the app&apos;s defaults
                </button>
              </div>
            </div>
          )}

          <p className="font-space-grotesk text-xs text-[var(--text-muted)]" aria-live="polite">
            {save.state === 'saving' && 'saving…'}
            {save.state === 'now' && (owner
              ? `saved ${save.count}. they show everywhere now.`
              : `${name} is yours now, on this device only. every ${name} on this site draws your way until you put the site's back.`)}
            {save.state === 'after-deploy' && (
              <>saved {save.count} as one pull request. they show once it deploys, in a few minutes. <a href={save.prUrl} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: colorValue }}>see the change ↗</a></>
            )}
            {save.state === 'paste' && <>this site can&apos;t save them. paste this into its file and redeploy: <code className="break-all">{save.line}</code></>}
            {save.state === 'error' && save.message}
          </p>
        </div>
      </div>

      <div>
        <p className={`${LABEL} mb-3`}>{owner ? `pick an icon · the first ${FIRST_ICONS.length} are the ones people see most` : 'pick an icon to make yours'}</p>
        <div className="flex flex-wrap gap-1.5">
          {offered.map((icon) => {
            const Icon = iconByName(icon);
            const chosen = icon === name;
            const draft = Boolean(drafts[icon]?.length);
            return (
              <button
                key={icon}
                type="button"
                title={icon}
                aria-label={`Draw ${icon}${draft ? ' (drawn, not saved)' : drawnHere(icon) ? ' (drawn)' : ''}`}
                aria-pressed={chosen}
                onClick={() => setName(icon)}
                className="relative flex size-11 items-center justify-center rounded-lg border transition hover:bg-[var(--background-highlight)]"
                style={{ borderColor: chosen ? colorValue : 'transparent', color: chosen ? colorValue : 'var(--foreground)' }}
              >
                {Icon && <Icon size={18} />}
                {(draft || drawnHere(icon)) && (
                  <span
                    className="absolute right-1 top-1 size-1.5 rounded-full border"
                    style={{ borderColor: colorValue, backgroundColor: draft ? 'transparent' : colorValue }}
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </div>
        <p className={`${LABEL} mt-3`}>{owner ? '● saved · ○ drawn, not saved yet' : '● yours · ○ drawn, not used yet'}</p>
      </div>
    </div>
  );
}
