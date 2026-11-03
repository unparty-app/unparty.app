'use client';

import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

/** An article's coverColor as a color: a hex as is, 'theme' (or anything else) the reader's theme color. */
export function resolveCoverColor(coverColor: string, themeColor: string): string {
  return HEX.test(coverColor.trim()) ? coverColor.trim() : themeColor;
}

// The light and shade over the color: a soft light from the top left, a
// little shade at the bottom right. See-through white and black, so they work
// on any color. CSS here; painted the same way onto a canvas below
export const COLOR_SURFACE =
  'radial-gradient(120% 90% at 18% 12%, rgba(255,255,255,0.22), transparent 55%), radial-gradient(90% 80% at 88% 100%, rgba(0,0,0,0.24), transparent 62%)';

const GLOWS = [
  // center x, y and radii x, y (fractions of the frame), color, where it fades out
  { cx: 0.18, cy: 0.12, rx: 1.2, ry: 0.9, rgb: '255,255,255', alpha: 0.22, stop: 0.55 },
  { cx: 0.88, cy: 1.0, rx: 0.9, ry: 0.8, rgb: '0,0,0', alpha: 0.24, stop: 0.62 },
];

/** COLOR_SURFACE on a canvas, for the bee's-eye shader (StyledCover with a color). */
export function paintColorSurface(canvas: HTMLCanvasElement, color: string) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { width: w, height: h } = canvas;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, w, h);
  for (const g of GLOWS) {
    // An ellipse: a circle of radius ry, stretched sideways to rx
    ctx.save();
    ctx.translate(g.cx * w, g.cy * h);
    ctx.scale((g.rx * w) / (g.ry * h), 1);
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, g.ry * h);
    gradient.addColorStop(0, `rgba(${g.rgb},${g.alpha})`);
    gradient.addColorStop(g.stop, `rgba(${g.rgb},0)`);
    ctx.fillStyle = gradient;
    // Past `stop` it's see-through, so overfilling is harmless
    ctx.fillRect(-2 * w, -2 * h, 4 * w, 4 * h);
    ctx.restore();
  }
}

/**
 * ArticleColorCover - an article cover that is a color (`coverColor`), for an
 * article with no photo, so it opens like the editorial articles that have one.
 *
 * It is the same full-bleed `.image-container-cover` frame as a photo cover,
 * so StickyCover pins it under the frosted header and shrinks it to a band the
 * same way, with COLOR_SURFACE over it so it reads as a surface rather than a
 * flat block. With a coverStyle it goes through the bee's-eye shader instead
 * (StyledCover with `color`).
 */
const ArticleColorCover: React.FC<{ coverColor: string }> = ({ coverColor }) => {
  const { colorValue } = useTheme();
  const color = resolveCoverColor(coverColor, colorValue);

  return (
    <div className="mb-8 w-screen mx-[calc(50%-50vw)]">
      <div
        aria-hidden="true"
        className="image-container-responsive image-container-cover border border-border"
        style={{ backgroundColor: color, backgroundImage: COLOR_SURFACE }}
      />
    </div>
  );
};

export default ArticleColorCover;
