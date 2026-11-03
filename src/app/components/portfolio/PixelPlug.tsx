// A plug in 7×7 pixels, drawn crisp at any size: the tip on a component the
// stack can't run yet (BuildPortfolio). Pixel art, in the same register as the
// VT323 names beside it
const PIXELS = [
  '..X.X..',
  '..X.X..',
  '.XXXXX.',
  '.XXXXX.',
  '..XXX..',
  '...X...',
  '...X...',
];

export default function PixelPlug({ color, className = 'size-3.5' }: { color: string; className?: string }) {
  return (
    <svg viewBox="0 0 7 7" className={className} shapeRendering="crispEdges" aria-hidden="true">
      {PIXELS.flatMap((row, y) =>
        [...row].map((cell, x) => (cell === 'X' ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={color} /> : null))
      )}
    </svg>
  );
}
