'use client';

import HandDrawnIcon, { type HandDrawnIconProps } from './HandDrawnIcon';

// Media and spinners (#1391). Loader2, RefreshCw and RotateCcw are drawn
// still; call sites spin them (e.g. animate-spin), as they did with lucide.

export function Pause(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="Pause">
      <path d="M9.1 5.2c-.1 4.6-.1 9.2 0 13.7" />
      <path d="M15.1 5.1c.1 4.6.1 9.2-.1 13.8" />
    </HandDrawnIcon>
  );
}

// SkipBack is the same drawing, mirrored
const SKIP = ['M5.3 5.2c-.1 4.6 0 9.2.1 13.8 3.6-2.3 7.3-4.6 10.9-6.9-3.7-2.3-7.3-4.6-11-6.9', 'M19.1 5.3c.1 4.5.1 9 0 13.5'];

export function SkipForward(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="SkipForward">
      {SKIP.map((d) => <path key={d} d={d} />)}
    </HandDrawnIcon>
  );
}

export function SkipBack(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="SkipBack">
      <g transform="matrix(-1 0 0 1 24 0)">{SKIP.map((d) => <path key={d} d={d} />)}</g>
    </HandDrawnIcon>
  );
}

const SPEAKER = 'M11.2 4.9c-1.9 1.6-3.7 3.2-5.6 4.8-1 0-2.1 0-3.1.1-.1 1.6-.1 3.1 0 4.7 1 .1 2.1 0 3.1.1 1.9 1.6 3.7 3.2 5.6 4.8.1-4.9.1-9.7 0-14.5';

export function Volume2(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="Volume2">
      <path d={SPEAKER} />
      <path d="M15.6 8.9c1.6 1.8 1.6 4.4 0 6.2" />
      <path d="M18.7 6.1c3.2 3.4 3.2 8.4 0 11.8" />
    </HandDrawnIcon>
  );
}

export function VolumeX(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="VolumeX">
      <path d={SPEAKER} />
      <path d="M16.3 9.1c1.9 1.9 3.8 3.9 5.6 5.8" />
      <path d="M21.9 9.1c-1.9 1.9-3.8 3.9-5.6 5.8" />
    </HandDrawnIcon>
  );
}

export function Loader2(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="Loader2">
      <path d="M21 12.3c-.1 5-4.2 8.9-9.2 8.8-5-.1-8.9-4.2-8.8-9.2.1-4.9 4.1-8.8 9-8.8" />
    </HandDrawnIcon>
  );
}

export function RefreshCw(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="RefreshCw">
      <path d="M3.3 11.4c.4-4.6 4.3-8.1 8.9-7.9 2.6.1 4.9 1.3 6.5 3.2.6.7 1.1 1.4 1.5 2.2" />
      <path d="M20.6 3.6c0 1.9.1 3.8 0 5.6-1.9.1-3.8.1-5.6 0" />
      <path d="M20.7 12.7c-.4 4.6-4.3 8.1-8.9 7.9-2.6-.1-4.9-1.3-6.5-3.2-.6-.7-1.1-1.4-1.5-2.2" />
      <path d="M3.4 20.5c0-1.9-.1-3.8 0-5.6 1.9-.1 3.8-.1 5.6 0" />
    </HandDrawnIcon>
  );
}

export function RotateCcw(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="RotateCcw">
      <path d="M3.4 12.3c.1 4.9 4.1 8.8 9 8.7 4.9-.1 8.8-4.1 8.7-9-.1-4.8-4-8.6-8.8-8.6-2.5 0-4.8 1.1-6.4 2.8-.8.8-1.6 1.8-2.4 2.8" />
      <path d="M3.4 4.3c0 1.9-.1 3.8 0 5.7 1.9.1 3.8.1 5.7 0" />
    </HandDrawnIcon>
  );
}
