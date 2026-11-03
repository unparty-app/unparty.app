'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { createBeeEye, facetSizeFor } from './beeEye';

/**
 * cover-008 (a yellow zinnia with a pink flower behind it on black) as a bee's
 * flight. The photo is portrait (1107x2000) and the hero is a 16:9 band, so a
 * still crop only ever shows a wall of petals; the camera walks the whole
 * photo instead, and the effect switches on only where it means something:
 *
 * - it opens on the pink flower against black, the yellow one soft
 * - it eases down the stem and petals; nearing the pollen the view becomes
 *   a bee's, seen through a compound eye of small lens facets (beeEye.ts)
 * - resting on the pollen, a slow six-fold kaleidoscope turns in, the bee
 *   circling; then it lifts away, the facets clear, back to the pink flower
 *
 * One 36s loop, slow enough to settle calmly when the cover pins. The soft focus comes from a pre-blurred copy
 * (public/cover-motion/cover-008-soft.webp, 13KB) masked to each flower;
 * blur itself never animates. Everything comes from the one photo.
 *
 * The CSS version (.zinnia-tilt in globals.css: tilt + focus pull only) is the
 * first frame and the fallback without WebGL. The shader runs on the CSS
 * animation's clock (its currentTime, read every frame), so the two always
 * show the same moment and the handoff is seamless. Under
 * prefers-reduced-motion it holds still on the pollen, no shader.
 */

const SRC = '/covers/cover-008.png';
const SOFT_SRC = '/cover-motion/cover-008-soft.webp';
const PHOTO = { width: 1107, height: 2000 };
const LOOP_MS = 36_000;
// Focus points, as fractions of the photo's height
const PINK = 0.11;
const POLLEN = 0.7;

const YELLOW_MASK = 'linear-gradient(to bottom, transparent 34%, #000 44%)';
const PINK_MASK = 'linear-gradient(to bottom, #000 30%, transparent 40%)';

const ease = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : 0.5 - Math.cos(Math.PI * x) / 2);
// 0 before `from`, eased to 1 by `to`
const rise = (t: number, from: number, to: number) => ease((t - from) / (to - from));
// up over [a, b], held, down over [c, d]
const pulse = (t: number, a: number, b: number, c: number, d: number) => rise(t, a, b) * (1 - rise(t, c, d));

// The loop, t in [0, 1). Keyframes match .zinnia-tilt in globals.css
function frameAt(t: number) {
  const tilt = t < 0.66 ? rise(t, 0.12, 0.42) : 1 - rise(t, 0.66, 1);
  return {
    tilt,
    softYellow: 1 - pulse(t, 0.1, 0.3, 0.8, 0.96),
    softPink: 0.85 * pulse(t, 0.2, 0.4, 0.68, 0.86),
    facet: pulse(t, 0.28, 0.42, 0.66, 0.8),
    kaleido: pulse(t, 0.45, 0.51, 0.59, 0.65),
  };
}

const ZinniaTiltCover: React.FC<{ alt: string }> = ({ alt }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const sharpRef = useRef<HTMLImageElement>(null);
  const softRef = useRef<HTMLImageElement>(null);
  const [shader, setShader] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const canvas = canvasRef.current;
    const sharp = sharpRef.current;
    const soft = softRef.current;
    if (!canvas || !sharp || !soft) return;

    let cancelled = false;
    let raf = 0;
    let visible = true;
    let renderer: ReturnType<typeof createBeeEye> = null;
    let start = 0;
    let cssClock: Animation | null = null;

    // The loop's clock is the CSS tilt's own animation: the shader reads its
    // currentTime every frame, so the two can never drift apart (the CSS
    // animation can restart after mount, which used to leave the shader ~10s
    // off and jump on handoff). Its own clock only if there is no CSS one.
    const loopMs = (now: number) => {
      if (!cssClock || cssClock.playState === 'idle') cssClock = tiltRef.current?.getAnimations()[0] ?? null;
      const css = cssClock?.currentTime;
      return typeof css === 'number' ? css : now - start;
    };

    const loaded = (img: HTMLImageElement) =>
      img.complete && img.naturalWidth > 0
        ? Promise.resolve()
        : new Promise<void>((resolve) => img.addEventListener('load', () => resolve(), { once: true }));

    const tick = (now: number) => {
      raf = 0;
      if (!renderer || !visible || document.hidden) return;
      const ms = loopMs(now);
      const t = (ms % LOOP_MS) / LOOP_MS;
      const f = frameAt(t);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const photoH = (w * PHOTO.height) / PHOTO.width;
      const offsetFor = (focus: number) => -Math.min(Math.max(focus * photoH - h / 2, 0), photoH - h);
      const y = offsetFor(PINK) + (offsetFor(POLLEN) - offsetFor(PINK)) * f.tilt;
      renderer.draw({
        crop: [0, y, w, photoH],
        softYellow: f.softYellow,
        softPink: f.softPink,
        facet: f.facet,
        facetSize: facetSizeFor(w),
        kaleido: f.kaleido,
        turn: ms / 9000,
      });
      raf = requestAnimationFrame(tick);
    };
    const play = () => {
      if (!raf && renderer) raf = requestAnimationFrame(tick);
    };

    Promise.all([loaded(sharp), loaded(soft)]).then(() => {
      if (cancelled) return;
      renderer = createBeeEye(canvas, sharp, soft);
      if (!renderer) return; // no WebGL: the CSS tilt keeps playing
      start = performance.now();
      setShader(true);
      play();
    });

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) play();
    });
    io.observe(canvas);
    const ro = new ResizeObserver(() => renderer?.resize());
    ro.observe(canvas);
    const onVisibility = () => !document.hidden && play();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      renderer?.destroy();
    };
  }, []);

  return (
    <div className="mb-8 w-screen mx-[calc(50%-50vw)]">
      <div className="image-container-responsive image-container-cover border border-border bg-black">
        {/* A stage at the cover's full height, centered: when the sticky cover
            shrinks to a band (StickyCover's --cover-full) the band crops the
            stage like a window instead of resizing it, so the canvas never
            reallocates (which flickered) and the photo never re-centers in a
            jump. Without a sticky cover it is simply the frame's height. */}
        <div
          className="absolute inset-x-0 top-1/2 -translate-y-1/2"
          style={{ height: 'var(--cover-full, 100%)', containerType: 'size' }}
        >
        {/* CSS tilt: first frame, and the fallback without WebGL */}
        <div ref={tiltRef} className="zinnia-tilt absolute inset-x-0 top-0" style={{ aspectRatio: `${PHOTO.width} / ${PHOTO.height}` }}>
          <Image ref={sharpRef} src={SRC} alt={alt} fill sizes="100vw" quality={90} priority />
          <Image
            ref={softRef}
            src={SOFT_SRC}
            alt=""
            aria-hidden
            fill
            sizes="50vw"
            className="zinnia-soft-yellow"
            style={{ maskImage: YELLOW_MASK, WebkitMaskImage: YELLOW_MASK }}
          />
          <Image
            src={SOFT_SRC}
            alt=""
            aria-hidden
            fill
            sizes="50vw"
            className="zinnia-soft-pink"
            style={{ maskImage: PINK_MASK, WebkitMaskImage: PINK_MASK }}
          />
        </div>
        <canvas
          ref={canvasRef}
          aria-hidden
          className={`absolute inset-0 h-full w-full transition-opacity duration-500 ${shader ? 'opacity-100' : 'opacity-0'}`}
        />
        </div>
      </div>
    </div>
  );
};

export default ZinniaTiltCover;
