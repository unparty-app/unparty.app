// Pen geometry shared by the ink charts: the same small wobble on every
// render, so a plotted line reads as drawn by hand, and a smoothed path
// through points

/** A steady offset in [-amount/2, amount/2] for the nth point */
export const wobble = (index: number, amount = 2.4) => {
  const value = Math.sin(index * 12.9898 + 78.233) * 43758.5453;
  return (value - Math.floor(value) - 0.5) * amount;
};

/** A smooth stroke through the points (midpoint quadratics), ending on the last */
export function penPath(points: ReadonlyArray<readonly [number, number]>): string {
  if (points.length === 0) return '';
  let d = `M${points[0][0]} ${points[0][1]}`;
  for (let index = 1; index < points.length; index++) {
    const [px, py] = points[index - 1];
    const [cx, cy] = points[index];
    d += ` Q${px} ${py} ${(px + cx) / 2} ${(py + cy) / 2}`;
    if (index === points.length - 1) d += ` L${cx} ${cy}`;
  }
  return d;
}

/**
 * An arc over a row, from one point to another, rising `height` above the
 * higher of the two: it leaves and lands nearly upright, so links between
 * things side by side clear everything between them
 */
export function penRainbow(from: readonly [number, number], to: readonly [number, number], height: number): string {
  const [c1, c2] = rainbowControls(from, to, height);
  return `M${from[0]} ${from[1]} C${c1[0]} ${c1[1]} ${c2[0]} ${c2[1]} ${to[0]} ${to[1]}`;
}

/** The direction penRainbow lands in, in radians: for its arrowhead */
export function penRainbowArrival(from: readonly [number, number], to: readonly [number, number], height: number): number {
  const [, c2] = rainbowControls(from, to, height);
  return Math.atan2(to[1] - c2[1], to[0] - c2[0]);
}

function rainbowControls(from: readonly [number, number], to: readonly [number, number], height: number): [[number, number], [number, number]] {
  const [x1, y1] = from;
  const [x2, y2] = to;
  // A cubic peaks at three quarters of its control points' rise
  const top = Math.min(y1, y2) - height * (4 / 3);
  const lean = (x2 - x1) * 0.12;
  return [
    [x1 + lean, top],
    [x2 - lean, top],
  ];
}

/** A small two-stroke arrowhead at `tip`, pointing along `angle` (radians) */
export function penArrowhead(tip: readonly [number, number], angle: number, size = 9): string {
  const [x, y] = tip;
  const left = angle + Math.PI - 0.45;
  const right = angle + Math.PI + 0.45;
  return `M${x + Math.cos(left) * size} ${y + Math.sin(left) * size} L${x} ${y} L${x + Math.cos(right) * size} ${y + Math.sin(right) * size}`;
}

/** A hand-drawn month label: "NOV 2024" */
export const monthName = (month: string) =>
  new Date(`${month}-15T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' }).toUpperCase();
