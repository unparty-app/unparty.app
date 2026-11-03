'use client';

import HandDrawnIcon, { type HandDrawnIconProps } from './HandDrawnIcon';

// Momentum and money (#1391): lines that move.

// TrendingDown is the same line, flipped
const TREND = ['M2.8 17.4c2.2-2.3 4.3-4.6 6.5-6.8 1.4 1.4 2.8 2.9 4.2 4.3 2.4-2.6 4.8-5.1 7.2-7.6', 'M15.5 6.9c1.8-.1 3.6-.1 5.4 0 .1 1.7.1 3.5 0 5.2'];

export function TrendingUp(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="TrendingUp">
      {TREND.map((d) => <path key={d} d={d} />)}
    </HandDrawnIcon>
  );
}

export function TrendingDown(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="TrendingDown">
      <g transform="matrix(1 0 0 -1 0 24)">{TREND.map((d) => <path key={d} d={d} />)}</g>
    </HandDrawnIcon>
  );
}

export function Activity(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="Activity">
      <path d="M2.6 12.3c1.6 0 3.2-.1 4.8 0 1.1-2.8 2.2-5.6 3.2-8.4 1.3 5.3 2.5 10.6 3.7 15.8 1-2.5 2-4.9 3-7.3 1.8.1 3.6 0 5.3-.1" />
    </HandDrawnIcon>
  );
}

export function Zap(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="Zap">
      <path d="M13.4 2.5c-3 3.8-6 7.6-8.9 11.6 2.5 0 5 .1 7.5 0-.4 2.5-.8 4.9-1.1 7.4 3-3.8 6-7.7 8.9-11.6-2.5 0-5-.1-7.5 0 .4-2.5.8-4.9 1.1-7.4" />
    </HandDrawnIcon>
  );
}

export function DollarSign(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="DollarSign">
      <path d="M12.1 2.6c-.1 6.3 0 12.5.1 18.8" />
      <path d="M16.6 6.7c-.9-1.2-2.6-2-4.5-2-2.6 0-4.4 1.4-4.4 3.3 0 4.6 9.1 2.6 9.1 7.6 0 2-2 3.4-4.7 3.4-2.1 0-4-.8-4.9-2.3" />
    </HandDrawnIcon>
  );
}

export function Rocket(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="Rocket">
      <path d="M12.1 14.9c-1-1-2-2-3-3 1.5-3.9 4.5-7.1 8.3-8.9 1.2-.5 2.5-.8 3.8-.9-.1 1.3-.4 2.6-.9 3.8-1.8 3.8-5 6.8-8.2 9" />
      <path d="M9.1 12c-1.8-.1-3.6-.1-5.4 0 .6-1.3 1.6-2.4 2.9-3.1 1.6-.9 3.6-.9 5.3-.2" />
      <path d="M12 14.9c.1 1.8.1 3.6 0 5.4 1.3-.6 2.4-1.6 3.1-2.9.9-1.6.9-3.6.2-5.3" />
      <path d="M4.6 16.5c-1.5 1.3-2 5-2 5s3.7-.5 5-2c.7-.8.7-2.1-.1-2.9-.8-.8-2.1-.8-2.9-.1" />
    </HandDrawnIcon>
  );
}

export function Sailboat(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="Sailboat">
      <path d="M10.9 2.1c-2.3 4.6-4.6 9.3-6.9 13.9 2.3.1 4.6.1 6.9 0" />
      <path d="M2.1 17.9c6.6.1 13.3.1 19.9 0-.8 2.1-2.6 3.6-4.8 3.9-3.7.1-7.4.1-11 0-1.9-.3-3.4-1.9-4.1-3.9" />
      <path d="M10.9 2.1c0 5.3-.1 10.6.1 15.8" />
      <path d="M14 6.1c1.6 2.4 3.3 4.9 4.9 7.3-1.6.1-3.3.1-4.9 0" />
    </HandDrawnIcon>
  );
}

export function PlaneTakeoff(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="PlaneTakeoff">
      <path d="M2.1 22c6.6.1 13.3.1 19.9 0" />
      <path d="M6.3 18.1c-1.4-.6-2.5-1.7-3.2-3.1-.3-.6-.1-1.3.5-1.6.5-.3 1.1-.3 1.6-.1 1.1.4 2.2.8 3.3 1.3 2.9-1.6 5.8-3.1 8.8-4.7-2.6-1.3-5.2-2.7-7.8-4 1-.5 1.9-1 2.9-1.5 3.4.8 6.8 1.6 10.2 2.4 1.2.3 1.8 1.6 1.2 2.7-.3.6-.9 1-1.5 1.3-5.2 2.6-10.4 5.2-15.6 7.7-.2.1-.3 0-.4-.4" />
    </HandDrawnIcon>
  );
}

export function Gauge(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="Gauge">
      <path d="M3.3 18.1c-1.9-3.6-1.5-8 1.1-11.2 2.6-3.2 6.8-4.6 10.8-3.7 4 1 7 4.3 7.6 8.3.3 2.3-.1 4.6-1.2 6.6" />
      <path d="M12.1 14.1c1.6-1.7 3.3-3.4 4.9-5.1" />
      <path d="M12 13.6h.1" />
    </HandDrawnIcon>
  );
}

export function Workflow(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="Workflow">
      <path d="M3.2 3.1c2-.1 3.9-.1 5.9 0 .1 2 .1 3.9 0 5.9-2 .1-3.9.1-5.9 0-.1-2-.1-3.9 0-5.9" />
      <path d="M14.9 15c2-.1 3.9-.1 5.9 0 .1 2 .1 3.9 0 5.9-2 .1-3.9.1-5.9 0-.1-2-.1-3.9 0-5.9" />
      <path d="M6.1 9.1c-.1 1.6 0 3.3 0 4.9 0 1.1.9 2 2 2 2.3.1 4.6.1 6.9 0" />
    </HandDrawnIcon>
  );
}

export function BugPlay(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="BugPlay">
      <path d="M12.1 20c-3.3-.1-6-2.8-6-6.1-.1-1.9-.1-3.9 0-5.8 0-2.2 1.8-4 4-4 1.3-.1 2.7-.1 4 0 2.2 0 4 1.8 4 4 0 .6.1 1.3 0 1.9" />
      <path d="M8.1 2.1c.6.8 1.2 1.6 1.9 2.4" />
      <path d="M16 2.1c-.6.8-1.2 1.6-1.9 2.4" />
      <path d="M6.2 9.1c-1.3 0-2.6-.1-3.9 0" />
      <path d="M6.1 13.1c-1.4-.1-2.8-.1-4.2 0" />
      <path d="M6.4 17.1c-1.2.6-2.3 1.4-3.3 2.4" />
      <path d="M14.1 15.1c-.1 2.2 0 4.3 0 6.5 1.9-1.1 3.8-2.2 5.6-3.3-1.9-1.1-3.7-2.2-5.6-3.2" />
    </HandDrawnIcon>
  );
}

export function Palette(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="Palette">
      <path d="M12.1 22c-5.6-.1-10-4.6-9.9-10.1.1-5.5 4.6-9.9 10.1-9.9 5.5 0 9.9 4 9.9 9 0 2.8-2.2 5-5 5-.6 0-1.2-.1-1.8 0-.9 0-1.6.7-1.6 1.6 0 .4.2.8.4 1.1.3.3.4.7.4 1.1 0 .9-.7 1.6-1.6 1.7" />
      <path d="M13.6 6.6h.1" />
      <path d="M17.6 10.6h.1" />
      <path d="M8.6 7.6h.1" />
      <path d="M6.6 12.6h.1" />
    </HandDrawnIcon>
  );
}
