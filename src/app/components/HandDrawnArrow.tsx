'use client';

import { useTheme } from '../contexts/ThemeContext';

interface HandDrawnArrowProps {
  className?: string;
  color?: string; // Defaults to the theme color
}

/**
 * HandDrawnArrow - a pen-stroke arrow pointing right: a shaft with a slight
 * wobble and an uneven two-stroke head, in the theme color.
 *
 * It draws itself in when it mounts (shaft, then head), and nudges forward
 * while its parent `.group` is hovered or focused (globals.css
 * .hand-arrow). Reduced motion shows it already drawn and still.
 */
export default function HandDrawnArrow({ className = 'h-6 w-10', color }: HandDrawnArrowProps) {
  const { colorValue } = useTheme();

  return (
    <svg
      viewBox="0 0 40 24"
      fill="none"
      stroke={color ?? colorValue}
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`hand-arrow ${className}`}
    >
      <path
        className="hand-arrow__shaft"
        pathLength={1}
        d="M3 13.2c4.6-.9 9.1-1.6 13.8-1.5 4.9.1 9.6.6 17.4-.4"
      />
      <path
        className="hand-arrow__head"
        pathLength={1}
        d="M27.4 5.6c2.2 2.1 4.6 3.8 7.2 5.6-2.9 1.6-5.4 3.6-7.6 6.3"
      />
    </svg>
  );
}
