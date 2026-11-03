/**
 * The line scroll-pinned UI lands under: the bottom of the fixed site header
 * (#site-chrome), or of the sticky article cover band when there is one
 * (StickyCover publishes it as --pin-line on <html>). StickyHeroStack pins
 * headlines here and OutlineRail scrolls sections to it. Below a pinned
 * headline, StickyHeroStack publishes its bottom as --hero-line.
 */
export function readPinLine(fallback = 72): number {
  if (typeof document === 'undefined') return fallback;
  const chrome = document.getElementById('site-chrome')?.offsetHeight || fallback;
  const cover = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--pin-line')) || 0;
  return Math.max(chrome, cover);
}
