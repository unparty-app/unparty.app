'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { createBeeEye, facetSizeFor } from './beeEye';
import { COLOR_SURFACE, paintColorSurface } from '../editorial/ArticleColorCover';
import type { CoverStyleName } from './names';

// One still frame per style, drawn by the bee's-eye shader (beeEye.ts)
const STYLES: Record<CoverStyleName, { facet: number; square?: boolean; bulge: number; kaleido: number }> = {
  'compound-eye': { facet: 1, bulge: 1, kaleido: 0 },
  tile: { facet: 1, square: true, bulge: 0, kaleido: 0 },
  kaleidoscope: { facet: 0, bulge: 0, kaleido: 1 },
};

/**
 * A still cover seen another way (`coverStyle` on an article): a compound eye
 * of lens facets, a grid of square tiles, or a six-fold kaleidoscope. Same
 * full-bleed 16:9 frame as ArticleCoverImage. The plain photo shows first and
 * stays as the fallback without WebGL; the styled frame fades in over it once
 * drawn, and redraws only when the frame resizes. Nothing animates.
 *
 * With `color` instead of `src` (an article's coverColor) there is no photo:
 * the color cover's surface (COLOR_SURFACE) is painted onto an offscreen
 * canvas and that goes through the shader, whose lens rims, highlights and
 * dome shading make the facets show even on one color. The plain color
 * cover is the fallback.
 */
const SURFACE_SIZE = { width: 1600, height: 900 };

const StyledCover: React.FC<{ src?: string; color?: string; alt: string; coverStyle: CoverStyleName; onImageError?: () => void }> = ({ src, color, alt, coverStyle, onImageError }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    // The picture the shader sees: the loaded photo, or the painted color
    let img: HTMLImageElement | HTMLCanvasElement | null = imgRef.current;
    if (color) {
      img = Object.assign(document.createElement('canvas'), SURFACE_SIZE);
      paintColorSurface(img, color);
    }
    if (!canvas || !img) return;
    const source = img;
    let renderer: ReturnType<typeof createBeeEye> = null;
    let cancelled = false;

    const draw = () => {
      if (!renderer) return;
      renderer.resize();
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      // object-cover: fill the frame, centered (a painted color just fills it)
      const iw = source instanceof HTMLImageElement ? source.naturalWidth : w;
      const ih = source instanceof HTMLImageElement ? source.naturalHeight : h;
      const scale = Math.max(w / iw, h / ih);
      const dw = iw * scale;
      const dh = ih * scale;
      renderer.draw({ crop: [(w - dw) / 2, (h - dh) / 2, dw, dh], facetSize: facetSizeFor(w), ...STYLES[coverStyle] });
    };

    const start = () => {
      if (cancelled) return;
      renderer = createBeeEye(canvas, source);
      if (!renderer) return; // no WebGL: the plain photo stays
      draw();
      setDrawn(true);
    };
    if (!(source instanceof HTMLImageElement) || (source.complete && source.naturalWidth > 0)) start();
    else source.addEventListener('load', start, { once: true });

    const ro = new ResizeObserver(draw);
    ro.observe(canvas);
    return () => {
      cancelled = true;
      source.removeEventListener('load', start);
      ro.disconnect();
      renderer?.destroy();
    };
  }, [src, color, coverStyle]);

  return (
    <div className="mb-8 w-screen mx-[calc(50%-50vw)]">
      <div className="image-container-responsive image-container-cover border border-border">
        {src ? (
          <Image ref={imgRef} src={src} alt={alt} fill sizes="100vw" quality={90} priority className="object-cover" onError={onImageError} />
        ) : (
          <div aria-hidden className="absolute inset-0" style={{ backgroundColor: color, backgroundImage: COLOR_SURFACE }} />
        )}
        <canvas
          ref={canvasRef}
          aria-hidden
          className={`absolute inset-0 h-full w-full transition-opacity duration-700 ${drawn ? 'opacity-100' : 'opacity-0'}`}
        />
      </div>
    </div>
  );
};

export default StyledCover;
