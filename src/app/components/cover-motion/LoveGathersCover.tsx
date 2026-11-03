'use client';

import { useEffect, useId, useRef } from 'react';
import Image from 'next/image';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * The founder's handwritten love poem (cover-love-gathers) writing itself in.
 * Everything is the founder's own ink, never retyped:
 *
 * - the paper it was written on, softened (public/cover-motion/love-gathers-paper.webp)
 * - the ink alone, a transparent scan (love-gathers-ink.webp, the same layer
 *   the poem section shows when it unfolds), revealed line by line left to
 *   right through slanted bands that follow each line, like a pen moving
 *   through it. A last settle catches the few strokes no band covers
 * - then every LOVE traced over in the theme color, one after another. The
 *   HATEs stay ink: the poem's point, carried by the motion
 *
 * It opens on the finished poem, so the first frame is the still, holds,
 * fades back to the paper and writes again. One clock (Web Animations, one
 * loop length) drives every piece. With reduced motion it holds the finished
 * poem. The poem's words are in the article's poem section, for screen
 * readers and search.
 */

const PAPER_SRC = '/cover-motion/love-gathers-paper.webp';
const INK_SRC = '/cover-motion/love-gathers-ink.webp';
const INK = { width: 1872, height: 1994 };

// A band along a line of the ink, in ink pixels: from (x0, y0) to (x1, y1)
// along its middle, h tall. Lines in reading order
type Band = readonly [x0: number, y0: number, x1: number, y1: number, h: number];
const LINES: Band[] = [
  [36, 165, 1364, 110, 290], // WHERE LOVE GATHERS
  [190, 392, 1094, 300, 250], // HATE FOLLOWS
  [368, 604, 1836, 420, 210], // LOVE SEEKS MORE LOVE
  [250, 846, 1474, 644, 250], // HATE SEEKS LOVE
  [424, 1064, 1620, 916, 220], // LOVE MOVES ONWARD
  [566, 1262, 1520, 1080, 300], // HATE STAYS PUT
  [468, 1604, 1530, 1340, 230], // FOR HATE IS ONLY
  [544, 1780, 1536, 1476, 190], // A COMPLAINT FOR
  [686, 1810, 1490, 1624, 200], // NEEDING MORE
  [914, 1870, 1220, 1860, 190], // LOVE
];
// Lines that end a stanza, so the pen rests a little longer after them
const STANZA_ENDS = new Set([1, 3, 5]);
// Every LOVE, in reading order
const LOVES: Band[] = [
  [518, 140, 798, 136, 124],
  [368, 604, 676, 600, 156],
  [1530, 426, 1836, 410, 124],
  [1166, 648, 1410, 640, 132],
  [424, 1064, 720, 1060, 168],
  [905, 1902, 1220, 1817, 138], // slanted with the word, clear of NEEDING above it
];

// The loop, in ms
const LOOP_MS = 22_000;
const PEN_PX_PER_MS = 1.4;
const WRITE_FROM = 900;
const LINE_REST = 150;
const STANZA_REST = 450;
const SETTLE_MS = 600;
const TRACE_MS = 500;
const TRACE_STAGGER = 380;
const FADE_FROM = LOOP_MS - 1700;
const FADE_TO = LOOP_MS - 500;

// Rounded, so the server's markup and the browser's agree to the digit
const round = (n: number) => Math.round(n * 1000) / 1000;
const bandLength = ([x0, y0, x1, y1]: Band) => round(Math.hypot(x1 - x0, y1 - y0));
const bandAngle = ([x0, y0, x1, y1]: Band) => round((Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI);

// When each line is written, then the settle and the traces
function timeline() {
  let t = WRITE_FROM;
  const lines = LINES.map((band, i) => {
    const from = t;
    const to = from + bandLength(band) / PEN_PX_PER_MS;
    t = to + (STANZA_ENDS.has(i) ? STANZA_REST : LINE_REST);
    return { from, to };
  });
  const settle = { from: t, to: t + SETTLE_MS };
  const loves = LOVES.map((_, i) => {
    const from = settle.to + 400 + i * TRACE_STAGGER;
    return { from, to: from + TRACE_MS };
  });
  return { lines, settle, loves, held: loves[loves.length - 1].to + 200 };
}

// A wipe that draws over [from, to], holds, and is gone again once the
// poem has faded back to the paper
const wipe = ({ from, to }: { from: number; to: number }, easing: string): Keyframe[] => [
  { offset: 0, transform: 'scaleX(0)' },
  { offset: from / LOOP_MS, transform: 'scaleX(0)', easing },
  { offset: to / LOOP_MS, transform: 'scaleX(1)' },
  { offset: (FADE_TO + 100) / LOOP_MS, transform: 'scaleX(1)' },
  { offset: (FADE_TO + 101) / LOOP_MS, transform: 'scaleX(0)' },
  { offset: 1, transform: 'scaleX(0)' },
];

// One band as a rect along its line, scaled from its left end
const BandRect: React.FC<{ band: Band; fill: string; data: string }> = ({ band, fill, data }) => {
  const [x0, y0, , , h] = band;
  return (
    <g transform={`rotate(${bandAngle(band)} ${x0} ${y0})`}>
      <rect
        data-wipe={data}
        x={x0}
        y={y0 - h / 2}
        width={bandLength(band)}
        height={h}
        fill={fill}
        style={{ transformBox: 'fill-box', transformOrigin: '0% 50%' }}
      />
    </g>
  );
};

const LoveGathersCover: React.FC<{ alt: string }> = ({ alt }) => {
  const { colorValue } = useTheme();
  const svgRef = useRef<SVGSVGElement>(null);
  const id = useId().replace(/:/g, '');

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const time = timeline();
    const loop = { duration: LOOP_MS, iterations: Infinity };
    const animations: Animation[] = [];
    const at = (selector: string) => svg.querySelector(selector);

    LINES.forEach((_, i) => {
      const el = at(`[data-wipe="line-${i}"]`);
      if (el) animations.push(el.animate(wipe(time.lines[i], 'linear'), loop));
    });
    LOVES.forEach((_, i) => {
      const el = at(`[data-wipe="love-${i}"]`);
      if (el) animations.push(el.animate(wipe(time.loves[i], 'cubic-bezier(0.65, 0, 0.35, 1)'), loop));
    });
    const settle = at('[data-settle]');
    if (settle) {
      animations.push(settle.animate([
        { offset: 0, opacity: 0 },
        { offset: time.settle.from / LOOP_MS, opacity: 0, easing: 'ease-out' },
        { offset: time.settle.to / LOOP_MS, opacity: 1 },
        { offset: 1, opacity: 1 },
      ], loop));
    }
    const poem = at('[data-poem]');
    if (poem) {
      animations.push(poem.animate([
        { offset: 0, opacity: 0 },
        { offset: WRITE_FROM / LOOP_MS, opacity: 1 },
        { offset: FADE_FROM / LOOP_MS, opacity: 1, easing: 'ease-in-out' },
        { offset: FADE_TO / LOOP_MS, opacity: 0 },
        { offset: 1, opacity: 0 },
      ], loop));
    }
    // Open on the finished poem, the same frame as the still
    animations.forEach((a) => { a.currentTime = time.held; });
    return () => animations.forEach((a) => a.cancel());
  }, []);

  return (
    <div className="mb-8 w-screen mx-[calc(50%-50vw)]">
      <div className="image-container-responsive image-container-cover border border-border" style={{ containerType: 'size' }}>
        <Image src={PAPER_SRC} alt="" aria-hidden fill sizes="100vw" priority className="object-cover" />
        {/* The poem fills the visible frame's height, so it fits the hero's
            band on wide screens and reads larger on phones */}
        <svg
          ref={svgRef}
          role="img"
          aria-label={alt}
          viewBox={`0 0 ${INK.width} ${INK.height}`}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ height: 'min(88cqh, calc(92cqw * 1994 / 1872))', aspectRatio: `${INK.width} / ${INK.height}` }}
        >
          <defs>
            <mask id={`${id}-ink`} maskUnits="userSpaceOnUse" x="0" y="0" width={INK.width} height={INK.height} style={{ maskType: 'alpha' }}>
              <image href={INK_SRC} width={INK.width} height={INK.height} />
            </mask>
            <mask id={`${id}-pen`} maskUnits="userSpaceOnUse" x="0" y="0" width={INK.width} height={INK.height}>
              {LINES.map((band, i) => <BandRect key={i} band={band} fill="white" data={`line-${i}`} />)}
            </mask>
          </defs>
          <g data-poem>
            <image href={INK_SRC} width={INK.width} height={INK.height} mask={`url(#${id}-pen)`} />
            <image data-settle href={INK_SRC} width={INK.width} height={INK.height} />
            <g mask={`url(#${id}-ink)`}>
              {LOVES.map((band, i) => <BandRect key={i} band={band} fill={colorValue} data={`love-${i}`} />)}
            </g>
          </g>
        </svg>
      </div>
    </div>
  );
};

export default LoveGathersCover;
