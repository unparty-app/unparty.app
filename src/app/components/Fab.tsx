'use client';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { track } from '@vercel/analytics';

import BuildYours from './build-yours/BuildYours';
import { useTheme } from '../contexts/ThemeContext';
import SignIn from './SignIn';
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

const Fab = () => {
  const { colorValue } = useTheme();
  const [isSignInOpen, setIsSignInOpen] = useState(false);
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

  useEffect(() => {
    if (!isSignInOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsSignInOpen(false);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isSignInOpen]);

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
          <button 
            onClick={() => {
              // Same event as the /founders ask (FounderCta), so one funnel
              // compares them; consent-gated, a no-op until analytics is accepted
              track('cta_clicked', { cta: 'build yours', placement: 'fab' });
              setIsSignInOpen(true);
            }}
            aria-label="build yours"
            className="fab-button flex h-full min-w-11 items-center justify-center overflow-hidden rounded-full sm:min-w-[52px] sm:pl-3 sm:pr-5"
            style={{ 
              backgroundColor: colorValue,
              borderColor: colorValue,
            }}
          >
            {/* The brand brain beside the words, hand-written; below sm the
                brain alone (components/build-yours) */}
            <BuildYours color={colorValue} />
          </button>
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

      {/* Sign-In Modal */}
      {isSignInOpen && createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-sm" style={{ backgroundColor: 'var(--background)' }}>
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-200">
            <SignIn onClose={() => setIsSignInOpen(false)} />
          </div>
          
          {/* Click outside to close */}
          <div 
            className="absolute inset-0 -z-10" 
            onClick={() => setIsSignInOpen(false)}
            aria-label="Close sign-in modal"
          />
        </div>,
        document.body
      )}
    </div>
  );
};

export default Fab;