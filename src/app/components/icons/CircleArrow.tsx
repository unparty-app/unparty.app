'use client';

import HandDrawnIcon, { type HandDrawnIconProps } from './HandDrawnIcon';
import { LOOP } from './shapes';

/**
 * CircleArrowRight / CircleArrowLeft - an arrow inside a loop drawn in one
 * pen stroke that doesn't quite close, like the circle around the 404.
 * Left is the same drawing mirrored. The site navigation draws them `themed`.
 *
 * It appears already drawn: it's a control, so it shouldn't redraw itself.
 * The arrow nudges its way while a parent `.group` (or the site navigation
 * button) is hovered or focused (globals.css .circle-arrow). Reduced motion
 * keeps it still.
 */
function CircleArrow({ direction, className = '', ...props }: HandDrawnIconProps & { direction: 'left' | 'right' }) {
  return (
    <HandDrawnIcon {...props} className={`circle-arrow circle-arrow--${direction} ${className}`}>
      <g transform={direction === 'left' ? 'matrix(-1 0 0 1 24 0)' : undefined}>
        <path d={LOOP} />
        <g className="circle-arrow__arrow">
          <path d="M7.4 12.4c2-.4 4-.5 6.1-.4 1.3.1 2.2.1 2.9 0" />
          <path d="M13.1 8.7c1.2 1 2.3 2 3.4 3.3-1.2.9-2.3 2-3.2 3.3" />
        </g>
      </g>
    </HandDrawnIcon>
  );
}

export function CircleArrowRight(props: HandDrawnIconProps) {
  return <CircleArrow {...props} direction="right" />;
}

export function CircleArrowLeft(props: HandDrawnIconProps) {
  return <CircleArrow {...props} direction="left" />;
}
