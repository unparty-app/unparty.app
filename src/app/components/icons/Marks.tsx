'use client';

import HandDrawnIcon, { type HandDrawnIconProps } from './HandDrawnIcon';

/**
 * The small marks (#1391): X, Check, Plus, Minus, the chevrons, Square and
 * CheckSquare, and ArrowRight / ExternalLink. Most of their
 * uses render at 12–16px, so each is a stroke or two with a slight curve
 * and uneven ends, not a wobble that would blur at that size. They're
 * controls, so they appear already drawn.
 */

export function X(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="X">
      <path d="M6.3 5.9c3.8 4 7.5 8 11.6 12.4" />
      <path d="M18 5.7c-4.4 3.9-8.2 8-12.2 12.7" />
    </HandDrawnIcon>
  );
}

export function Check(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="Check">
      <path d="M4.7 12.8c1.6 1.5 3.1 3.2 4.6 5.2 2.6-4.7 5.9-8.7 10.3-12.4" />
    </HandDrawnIcon>
  );
}

export function Plus(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="Plus">
      <path d="M12.3 5.1c-.2 4.6-.1 9.2.1 13.8" />
      <path d="M5.2 12.2c4.5.2 9 .1 13.5-.3" />
    </HandDrawnIcon>
  );
}

// One chevron, turned to face each way
const CHEVRON = 'M9.3 5.7c2.4 2.1 4.7 4.3 6.8 6.5-2.1 2.3-4.4 4.4-6.6 6.3';
const FACING = { right: undefined, down: 'rotate(90 12 12)', left: 'matrix(-1 0 0 1 24 0)', up: 'rotate(-90 12 12)' } as const;

function Chevron({ facing, ...props }: HandDrawnIconProps & { facing: keyof typeof FACING }) {
  return (
    <HandDrawnIcon {...props} name="ChevronRight" transform={FACING[facing]}>
      <path d={CHEVRON} />
    </HandDrawnIcon>
  );
}

export const ChevronRight = (props: HandDrawnIconProps) => <Chevron {...props} facing="right" />;
export const ChevronDown = (props: HandDrawnIconProps) => <Chevron {...props} facing="down" />;
export const ChevronLeft = (props: HandDrawnIconProps) => <Chevron {...props} facing="left" />;
export const ChevronUp = (props: HandDrawnIconProps) => <Chevron {...props} facing="up" />;

export function Minus(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="Minus">
      <path d="M5.2 12.2c4.5.2 9 .1 13.5-.3" />
    </HandDrawnIcon>
  );
}

const SQUARE = 'M5.1 3.4c4.6-.1 9.2-.1 13.8 0 .9 0 1.6.7 1.6 1.6.1 4.6.1 9.3 0 13.9 0 .9-.7 1.6-1.6 1.6-4.6.1-9.2.1-13.8 0-.9 0-1.6-.7-1.6-1.6-.1-4.6-.1-9.3 0-13.9 0-1 .8-1.7 1.9-1.6';

export function Square(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="Square">
      <path d={SQUARE} />
    </HandDrawnIcon>
  );
}

// A box whose check runs out past its top edge
export function CheckSquare(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="CheckSquare">
      <path d="M20.6 11.6c.1 2.6.1 5.2 0 7.7 0 .8-.6 1.4-1.4 1.4-5 .1-9.9.1-14.9 0-.8 0-1.4-.6-1.4-1.4-.1-5-.1-9.9 0-14.9 0-.8.6-1.4 1.4-1.4 3.6-.1 7.1-.1 10.7 0" />
      <path d="M8.3 11.2c1.2 1.1 2.3 2.3 3.3 3.7 2.8-4.1 5.8-7.7 9.4-10.8" />
    </HandDrawnIcon>
  );
}

export function ArrowRight(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="ArrowRight">
      <path d="M3.8 12.4c3.6-.5 7.3-.7 10.9-.6 2.2.1 3.9.2 5.4 0" />
      <path d="M14.2 6.6c2.1 1.7 4 3.4 5.9 5.5-2 1.7-3.9 3.6-5.6 5.6" />
    </HandDrawnIcon>
  );
}

export function ExternalLink(props: HandDrawnIconProps) {
  return (
    <HandDrawnIcon {...props} name="ExternalLink">
      <path d="M18.6 13.4c.1 1.9 0 3.9 0 5.8 0 1-.8 1.8-1.8 1.8-4.1.1-8.2.1-12.3 0-1 0-1.8-.8-1.8-1.8-.1-4.1-.1-8.2 0-12.3 0-1 .8-1.8 1.8-1.8 1.9-.1 3.8-.1 5.7 0" />
      <path d="M10.4 13.7c3.4-3.3 6.8-6.7 10.2-10" />
      <path d="M14.9 3.4c1.9-.1 3.9-.1 5.8 0 .1 1.9.1 3.9 0 5.8" />
    </HandDrawnIcon>
  );
}
