/**
 * Clearing a plain background from a picture, in the browser (/admin → Your
 * avatar). No model and no download: it works when the background is one
 * color (a white canvas, a studio backdrop, a flat illustration's ground),
 * and says so when it isn't, so a busy photo is left as it is.
 *
 * 1. findPlainBackground: the picture's top and the upper half of its sides
 *    (a portrait's shoulders fill the rest). When nearly all of that is one
 *    color, that's the background.
 * 2. clearBackground: everything of that color reaching in from the edge
 *    goes clear, following a backdrop that shades slowly from one tone to
 *    another (the same color inside the drawing, not touching the edge,
 *    stays). Along the outline, where the drawing fades into the backdrop,
 *    each pixel keeps only its share of the drawing's color against the
 *    backdrop right beside it, so no halo of the old color shows on a new one.
 * 3. trimToContent: the box around what's left, so the picture can be framed
 *    square around it.
 */

export type RGB = [number, number, number];

const dist2 = (d: Uint8ClampedArray, i: number, c: RGB) => {
  const r = d[i] - c[0];
  const g = d[i + 1] - c[1];
  const b = d[i + 2] - c[2];
  return r * r + g * g + b * b;
};

// How near the edge's colors must be to one color for it to count as plain
const EDGE_NEAR = 55;
const EDGE_SHARE = 0.9;
// How near a pixel must be to the background color to be cleared with it;
// further, to CLEAR_FAR, only while it shades smoothly from its neighbor (a
// backdrop lit unevenly), within STEP of it
const CLEAR_NEAR = 60;
const CLEAR_FAR = 120;
const STEP = 14;
// How far in from the cleared part the outline softens, px
const FADE = 3;

/** The background's color when the picture's edge is (nearly) all one color, else null */
export function findPlainBackground(img: ImageData): RGB | null {
  const { data, width: w, height: h } = img;
  const edge: number[] = [];
  // The top, and the upper half of each side: a portrait's shoulders fill the rest
  for (let x = 0; x < w; x++) edge.push(x * 4);
  for (let y = 1; y < h >> 1; y++) edge.push(y * w * 4, (y * w + w - 1) * 4);
  // Fully clear edges are a background that's already gone
  const opaque = edge.filter((i) => data[i + 3] > 200);
  if (opaque.length < edge.length * EDGE_SHARE) return null;
  const median = (k: number) => {
    const values = opaque.map((i) => data[i + k]).sort((a, b) => a - b);
    return values[values.length >> 1];
  };
  const color: RGB = [median(0), median(1), median(2)];
  const near = opaque.filter((i) => dist2(data, i, color) <= EDGE_NEAR * EDGE_NEAR).length;
  return near >= edge.length * EDGE_SHARE ? color : null;
}

/** The picture with `bg` cleared from its edge inward, its outline softened into the drawing's own colors */
export function clearBackground(img: ImageData, bg: RGB): ImageData {
  const { width: w, height: h } = img;
  const data = new Uint8ClampedArray(img.data);
  const n = w * h;
  const cleared = new Uint8Array(n);
  const queue = new Int32Array(n);
  let head = 0;
  let tail = 0;
  const near = CLEAR_NEAR * CLEAR_NEAR;
  const far = CLEAR_FAR * CLEAR_FAR;
  const step = STEP * STEP;
  const between = (p: number, q: number) => {
    const i = p * 4;
    const j = q * 4;
    const r = data[i] - data[j];
    const g = data[i + 1] - data[j + 1];
    const b = data[i + 2] - data[j + 2];
    return r * r + g * g + b * b;
  };
  // `from`: the cleared neighbor it's reached from (none for the picture's edge)
  const seed = (p: number, from = -1) => {
    if (cleared[p]) return;
    const d = dist2(data, p * 4, bg);
    if (d <= near || (from >= 0 && d <= far && between(p, from) <= step)) {
      cleared[p] = 1;
      queue[tail++] = p;
    }
  };
  for (let x = 0; x < w; x++) {
    seed(x);
    seed((h - 1) * w + x);
  }
  for (let y = 0; y < h; y++) {
    seed(y * w);
    seed(y * w + w - 1);
  }
  while (head < tail) {
    const p = queue[head++];
    const x = p % w;
    if (x > 0) seed(p - 1, p);
    if (x < w - 1) seed(p + 1, p);
    if (p >= w) seed(p - w, p);
    if (p < n - w) seed(p + w, p);
  }

  // How far each kept pixel is from the cleared part, up to FADE
  const away = new Uint8Array(n).fill(255);
  head = 0;
  tail = 0;
  for (let p = 0; p < n; p++) {
    if (cleared[p]) {
      away[p] = 0;
      queue[tail++] = p;
    }
  }
  while (head < tail) {
    const p = queue[head++];
    if (away[p] >= FADE) continue;
    const x = p % w;
    for (const q of [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, p - w, p + w]) {
      if (q >= 0 && q < n && away[q] > away[p] + 1) {
        away[q] = away[p] + 1;
        queue[tail++] = q;
      }
    }
  }

  for (let p = 0; p < n; p++) {
    const i = p * 4;
    if (cleared[p]) {
      data[i + 3] = 0;
      continue;
    }
    if (away[p] > FADE) continue;
    // The drawing's own color here: the kept pixel nearby least like the background
    const x = p % w;
    const y = (p - x) / w;
    // The backdrop right here: the cleared pixels nearby, averaged
    const src = img.data;
    let br = 0;
    let bgG = 0;
    let bb = 0;
    let count = 0;
    for (let yy = Math.max(0, y - FADE); yy <= Math.min(h - 1, y + FADE); yy++) {
      for (let xx = Math.max(0, x - FADE); xx <= Math.min(w - 1, x + FADE); xx++) {
        const q = yy * w + xx;
        if (!cleared[q]) continue;
        br += src[q * 4];
        bgG += src[q * 4 + 1];
        bb += src[q * 4 + 2];
        count++;
      }
    }
    const local: RGB = count ? [br / count, bgG / count, bb / count] : bg;
    let ink = -1;
    let inkDist = -1;
    for (let yy = Math.max(0, y - FADE); yy <= Math.min(h - 1, y + FADE); yy++) {
      for (let xx = Math.max(0, x - FADE); xx <= Math.min(w - 1, x + FADE); xx++) {
        const q = yy * w + xx;
        if (cleared[q]) continue;
        const d = dist2(src, q * 4, local);
        if (d > inkDist) {
          inkDist = d;
          ink = q * 4;
        }
      }
    }
    if (ink < 0 || inkDist < 30 * 30) continue;
    // This pixel as a mix of the ink and the backdrop: its share of the ink is its alpha
    const fr = src[ink] - local[0];
    const fg = src[ink + 1] - local[1];
    const fb = src[ink + 2] - local[2];
    const a = Math.min(1, Math.max(0, ((src[i] - local[0]) * fr + (src[i + 1] - local[1]) * fg + (src[i + 2] - local[2]) * fb) / inkDist));
    if (a > 0.98) continue;
    data[i + 3] = Math.round(a * 255);
    if (a > 0.02) {
      // Take the backdrop back out of its color, so no halo of it shows
      data[i] = (src[i] - (1 - a) * local[0]) / a;
      data[i + 1] = (src[i + 1] - (1 - a) * local[1]) / a;
      data[i + 2] = (src[i + 2] - (1 - a) * local[2]) / a;
    }
  }
  return new ImageData(data, w, h);
}

/** The box around everything that isn't (nearly) clear, or null when nothing's left */
export function trimToContent(img: ImageData): { x: number; y: number; w: number; h: number } | null {
  const { data, width: w, height: h } = img;
  let left = w;
  let top = h;
  let right = -1;
  let bottom = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] > 8) {
        if (x < left) left = x;
        if (x > right) right = x;
        if (y < top) top = y;
        if (y > bottom) bottom = y;
      }
    }
  }
  return right < 0 ? null : { x: left, y: top, w: right - left + 1, h: bottom - top + 1 };
}
