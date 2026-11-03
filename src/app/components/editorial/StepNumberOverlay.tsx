import React from 'react';

/**
 * StepNumberOverlay - Numbered ring film over a cover image, scaled up so
 * it covers the full circle (clipped by the circle's own mask). Inlined
 * (rather than <img src="/svgs/N.svg">) so `currentColor` actually resolves
 * to the theme color - an externally-referenced SVG loaded via <img> can't
 * see the page's CSS, so currentColor there falls back to black. The low-
 * opacity fill and transparent corners let the cover image show through.
 *
 * Shared by ChallengeSteps and any other circular, numbered step treatment
 * (e.g. the unppp Step scroll embed, SetupCurriculum's rows) so they stay
 * visually identical. Pass `className` to place it standalone instead of as
 * an overlay; the step-ring__* classes are the hooks for the .step-ring
 * draw-in and hover animations in globals.css.
 *
 * `weight="thin"` is the hairline version (SetupCurriculum): a 1-unit ring and
 * a regular-weight Space Grotesk numeral instead of bold monospace.
 */
const OVERLAY_CLASSES = 'pointer-events-none absolute inset-0 z-20 h-full w-full scale-125';

const WEIGHTS = {
  bold: { stroke: 2, tint: 0.15, numeral: { fontFamily: 'monospace', fontSize: 12, fontWeight: 700 } },
  thin: { stroke: 1, tint: 0.08, numeral: { fontFamily: 'var(--font-space-grotesk), sans-serif', fontSize: 10, fontWeight: 400 } },
};

const StepNumberOverlay: React.FC<{
  number: number | string;
  colorValue: string;
  className?: string;
  weight?: keyof typeof WEIGHTS;
}> = ({ number, colorValue, className = OVERLAY_CLASSES, weight = 'bold' }) => {
  const style = WEIGHTS[weight];
  const thin = weight === 'thin';
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      style={{ color: colorValue }}
      aria-hidden="true"
    >
      <circle className="step-ring__fill" cx="12" cy="12" r="10" fill="currentColor" opacity={style.tint} />
      <circle
        className="step-ring__stroke"
        cx="12"
        cy="12"
        r="10"
        fill="none"
        stroke="currentColor"
        strokeWidth={style.stroke}
        pathLength={1}
      />
      <text
        className="step-ring__numeral"
        x="12"
        y={thin ? 12 : 16}
        textAnchor="middle"
        dominantBaseline={thin ? 'central' : undefined}
        fill="currentColor"
        style={style.numeral}
      >
        {number}
      </text>
    </svg>
  );
};

export default StepNumberOverlay;
