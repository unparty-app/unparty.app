'use client';

import { Users } from '@/app/components/icons';
import { useTheme } from '../contexts/ThemeContext';
import { VALUES_COVER, VALUES_LABEL, VALUES_LINE } from '../constants/organization';
import CoverImageBackground from './editorial/CoverImageBackground';

interface ValuesBadgeProps {
  /** card: SponsorCard's ScrollRow cell, cover on top. footer: the ring row alone */
  variant?: 'card' | 'footer';
}

/**
 * ValuesBadge — what the site stands for, said once. The code is MIT, so
 * anyone may use it; this is the owner's word on how, kept out of the license
 * and put where people read it.
 *
 * The card variant is SponsorCard without the pills: the values cover, then
 * the ChallengeSteps row (a thin theme ring, the label in vt323, the line in
 * Space Grotesk). The footer variant is that row alone, small.
 *
 * Words and cover come from FoundersConfig.json's "values" block; with no
 * line, the badge renders nothing.
 */
export default function ValuesBadge({ variant = 'card' }: ValuesBadgeProps) {
  const { colorValue } = useTheme();

  if (!VALUES_LINE) return null;

  const footer = variant === 'footer';

  const row = (
    <div className="flex items-start gap-3">
      <span
        className={`flex shrink-0 items-center justify-center rounded-full border ${footer ? 'size-6' : 'size-7'}`}
        style={{ borderColor: colorValue }}
      >
        <Users
          aria-hidden="true"
          strokeWidth={1.5}
          className={`${footer ? 'size-3' : 'size-3.5'} transition-transform duration-300 group-hover:scale-110 motion-reduce:transition-none`}
          style={{ color: colorValue }}
        />
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <p className={`font-vt323 uppercase leading-none ${footer ? 'text-base' : 'text-lg'}`} style={{ color: colorValue }}>
          {VALUES_LABEL}
        </p>
        <p className={`mt-1 font-space-grotesk text-xs leading-relaxed text-[var(--text-muted)] ${footer ? '' : 'md:text-sm'}`}>
          {VALUES_LINE}
        </p>
      </div>
    </div>
  );

  if (footer) return <div className="group text-left">{row}</div>;

  return (
    <div className="group text-left">
      <div className="relative mb-3 aspect-[4/3] overflow-hidden rounded-xl">
        <CoverImageBackground
          cover={VALUES_COVER}
          roundedClassName="rounded-xl"
          scrim={false}
          className="transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none"
        />
      </div>
      {row}
    </div>
  );
}
