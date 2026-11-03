'use client';

import { Heart } from '@/app/components/icons';
import { useTheme } from '../contexts/ThemeContext';
import { SPONSOR_COVER, SPONSOR_LINKS, SPONSOR_PITCH } from '../constants/organization';
import CoverImageBackground from './editorial/CoverImageBackground';
import { PILL_CLASS } from './BuyPill';

interface SponsorCardProps {
  /** Overrides FoundersConfig.json's sponsor.cover (a cover id or image path) */
  cover?: string;
  /** Overrides FoundersConfig.json's sponsor.pitch */
  pitch?: string;
}

/**
 * SponsorCard — the site owner's sponsorship links as a borderless card, sized
 * for a ScrollRow cell: the sponsor cover on top, then the same row as
 * ChallengeSteps (a thin theme ring, SPONSOR. in vt323, the pitch in Space
 * Grotesk), then one pill per link in BuyPill's pill style. The first link is
 * filled, the rest outlined.
 *
 * Links come from FoundersConfig.json's "sponsor" block (GitHub Sponsors
 * account, Polar checkout link); with neither set, the card renders nothing.
 * .github/FUNDING.yml should name the same accounts.
 */
export default function SponsorCard({ cover = SPONSOR_COVER, pitch = SPONSOR_PITCH }: SponsorCardProps) {
  const { colorValue } = useTheme();

  if (SPONSOR_LINKS.length === 0) return null;

  const [primary] = SPONSOR_LINKS;

  return (
    <div className="group text-left">
      {/* The cover repeats the first link for pointer users; keyboard and
          screen reader users get the labelled pills below instead */}
      <a
        href={primary.href}
        target="_blank"
        rel="noopener noreferrer"
        tabIndex={-1}
        aria-hidden="true"
        className="relative mb-3 block aspect-[4/3] overflow-hidden rounded-xl"
      >
        <CoverImageBackground
          cover={cover}
          roundedClassName="rounded-xl"
          scrim={false}
          className="transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none"
        />
      </a>

      <div className="flex items-start gap-3">
        <span
          className="flex size-7 shrink-0 items-center justify-center rounded-full border"
          style={{ borderColor: colorValue }}
        >
          <Heart
            aria-hidden="true"
            strokeWidth={1.5}
            className="size-3.5 transition-transform duration-300 group-hover:scale-110 motion-reduce:transition-none"
            style={{ color: colorValue }}
          />
        </span>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="font-vt323 text-lg uppercase leading-none" style={{ color: colorValue }}>
            SPONSOR.
          </p>
          <p className="mt-1 font-space-grotesk text-xs leading-relaxed text-[var(--text-muted)] md:text-sm">
            {pitch}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {SPONSOR_LINKS.map((link, index) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Sponsor on ${link.label} (opens in a new tab)`}
                className={`${PILL_CLASS} transition duration-150 hover:opacity-80 active:scale-[0.98]`}
                style={
                  index === 0
                    ? { backgroundColor: colorValue, borderColor: colorValue, color: 'var(--background)' }
                    : { borderColor: colorValue, color: colorValue }
                }
              >
                <span>{link.label}</span>
                <span aria-hidden="true">↗</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
