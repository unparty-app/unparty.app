'use client';
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { track } from '@vercel/analytics';

import BuildYours, { inkOn } from './build-yours/BuildYours';
import { useTheme } from '../contexts/ThemeContext';
import { FOUNDER_CTA } from '../constants/organization';
import {
  UserButton,
  SignedIn,
  SignedOut,
  dark
} from '@/lib/auth-stub.client';

const DotIcon = () => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor">
      <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512z" />
    </svg>
  );
};

/**
 * The site's one ask, from anywhere (FoundersConfig founder.cta). With none,
 * the Fab is how to sign in. Clicks send the same consent-gated event as the
 * /founders ask (FounderCta), so one funnel compares them.
 */
function FabAsk({ color }: { color: string }) {
  const cta = FOUNDER_CTA;
  const label = cta?.label ?? 'sign in';
  const href = cta?.href ?? '/sign-in';
  const className = 'fab-button flex h-full min-w-11 items-center justify-center overflow-hidden rounded-full sm:min-w-[52px] sm:pl-3 sm:pr-5';
  const style = { backgroundColor: color, borderColor: color };
  const onClick = () => track('cta_clicked', { cta: label, placement: 'fab' });
  // "build yours" in its own hand; any other ask as set text
  const face = label.trim().toLowerCase() === 'build yours'
    ? <BuildYours color={color} />
    : <span className="px-3 font-vt323 text-lg leading-none" style={{ color: inkOn(color) }}>{label}</span>;
  return /^(https?:|mailto:)/.test(href)
    ? <a href={href} target={href.startsWith('mailto:') ? undefined : '_blank'} rel="noopener noreferrer" onClick={onClick} aria-label={label} className={className} style={style}>{face}</a>
    : <Link href={href} onClick={onClick} aria-label={label} className={className} style={style}>{face}</Link>;
}

const Fab = () => {
  const { colorValue } = useTheme();
  const slotRef = useRef<HTMLDivElement>(null);

  // Publish the Fab's live width as --fab-width, so the Banner dock can leave
  // a pocket exactly this wide at its right end: the labeled pill, the icon-only
  // circle and the signed-in avatar are all different widths
  useEffect(() => {
    const slot = slotRef.current;
    if (!slot) return;
    const root = document.documentElement;
    const update = () => root.style.setProperty('--fab-width', `${slot.offsetWidth}px`);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(slot);
    return () => {
      observer.disconnect();
      root.style.removeProperty('--fab-width');
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-50 p-4">
      {/* One shell for both states, the same treatment as the Banner dock's
          avatar and mood button: a 2px theme-color ring around a background
          gap, exactly the dock's height (h-14 / sm:h-16), so the Fab always
          sits in the dock's right end like it belongs there. Content inside is
          44px / 52px: 2px ring + 4px gap on each side. */}
      <div
        ref={slotRef}
        className="pointer-events-auto absolute bottom-4 right-4 flex h-14 items-center rounded-full border-2 p-1 shadow-lg sm:h-16"
        style={{ backgroundColor: 'var(--background)', borderColor: colorValue }}
      >
        <SignedOut>
          {/* Icon-only circle on phones; from sm up a pill that says what it
              does, since an unlabeled icon doesn't tell a new visitor */}
          <FabAsk color={colorValue} />
        </SignedOut>

        <SignedIn>
          {/* The avatar fills the shell's content area, mirroring the author
              avatar at the dock's left end; no ring of Clerk's own */}
          <UserButton
            appearance={{
              elements: {
                avatarBox: `rounded-full overflow-hidden w-11 h-11 sm:w-[52px] sm:h-[52px] transition duration-200 flex items-center justify-center font-bold text-black text-lg sm:text-xl`,
                baseTheme: dark,
                userButtonBox: 'hover:transition p-0',
                userButtonTrigger: 'rounded-full focus:shadow-none',
                userButtonPopoverCard: '!bg-black border',
                userButtonPopoverActionButton: `hover:text-white transition`,
                userButtonPopoverFooter: 'text-xs text-zinc-400',
              },
              variables: {
                colorPrimary: colorValue,
                colorText: colorValue,
                borderRadius: '0.75rem',
              },
            }}
          >
            <UserButton.UserProfileLink label="PARTY" url="/party" labelIcon={<DotIcon />} />

          </UserButton>
        </SignedIn>
      </div>
    </div>
  );
};

export default Fab;