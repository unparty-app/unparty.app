"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { track } from '@vercel/analytics';
import { useSignIn, useAuth } from '@/lib/auth-stub.client';
import { useTheme } from '../contexts/ThemeContext';
import { SITE_TITLE, FOUNDER_CTA } from '../constants/organization';
import { X } from './icons';
import HandDrawnArrow from './HandDrawnArrow';
import SignInOff from './SignInOff';
import { CLERK_ON } from '@/lib/clerk-on';
import BuildYours from './build-yours/BuildYours';

interface SignInProps {
  onClose?: () => void;
  className?: string;
}

type Strategy = 'oauth_github' | 'oauth_google' | 'oauth_apple';

const GitHubMark = () => (
  <svg className="size-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);

const GoogleMark = () => (
  <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const AppleMark = () => (
  <svg className="size-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
  </svg>
);

// GitHub first: it's how the people who build on a copy sign in
const PROVIDERS: Array<{ strategy: Strategy; name: string; Mark: () => React.ReactElement }> = [
  { strategy: 'oauth_github', name: 'GitHub', Mark: GitHubMark },
  { strategy: 'oauth_google', name: 'Google', Mark: GoogleMark },
  { strategy: 'oauth_apple', name: 'Apple', Mark: AppleMark },
];

/** ?redirect_url as a same-site path, or null (never another origin). Read from
 * window.location rather than useSearchParams, so the Fab's modal on every
 * page needs no Suspense boundary */
function returnPath(): string | null {
  const value = new URLSearchParams(window.location.search).get('redirect_url');
  if (!value) return null;
  try {
    const url = new URL(value, window.location.origin);
    return url.origin === window.location.origin ? url.pathname + url.search : null;
  } catch {
    return null;
  }
}

/**
 * Sign in with GitHub, Google or Apple, on /sign-in and in the Fab's modal.
 * The provider sends people back to /sso-callback, where Clerk finishes, and
 * from there to where they started: ?redirect_url on /sign-in, the page under
 * the modal, or /party. Below it, the site's ask (FoundersConfig founder.cta):
 * no account here? build yours.
 */
export default function SignIn(props: SignInProps) {
  return CLERK_ON ? <ConnectedSignIn {...props} /> : <SignInOff {...props} />;
}

function ConnectedSignIn({ onClose, className = '' }: SignInProps) {
  const { signIn } = useSignIn();
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const { colorValue } = useTheme();

  const [pending, setPending] = useState<Strategy | null>(null);
  const [error, setError] = useState('');

  if (isSignedIn) {
    if (onClose) onClose();
    router.push(returnPath() ?? '/');
    return null;
  }

  const signInWith = async (strategy: Strategy, name: string) => {
    if (!signIn) return;
    setPending(strategy);
    setError('');
    const destination = returnPath()
      ?? (onClose ? window.location.pathname + window.location.search : '/party');
    try {
      await signIn.sso({ strategy, redirectCallbackUrl: '/sso-callback', redirectUrl: destination });
    } catch (err: unknown) {
      console.error(`${name} sign-in error:`, err);
      setError(`${name} didn't go through. Try again.`);
      setPending(null);
    }
  };

  const cta = FOUNDER_CTA;
  const external = cta ? /^(https?:|mailto:)/.test(cta.href) : false;
  // The modal covers the page, so it closes for the tap to land anywhere
  const onCta = () => {
    if (cta) track('cta_clicked', { cta: cta.label, placement: 'sign-in' });
    onClose?.();
  };

  return (
    <div className={`relative w-full max-w-md text-left ${className}`}>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute -right-2 -top-2 grid size-9 place-items-center rounded-full text-[var(--text-muted)] transition-colors hover:bg-[var(--background-highlight)] hover:text-[var(--foreground)]"
        >
          <X size={18} strokeWidth={1.3} />
        </button>
      )}

      <h1 className="font-vt323 text-5xl leading-none text-[var(--foreground)]">sign in.</h1>
      <p className="mt-3 font-space-grotesk text-sm text-[var(--text-muted)]">to {SITE_TITLE}, with the account you used before.</p>

      {error && (
        <p role="alert" className="mt-4 font-space-grotesk text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <ul className="mt-8 border-t" style={{ borderColor: `${colorValue}20` }}>
        {PROVIDERS.map(({ strategy, name, Mark }) => (
          <li key={strategy} className="border-b" style={{ borderColor: `${colorValue}20` }}>
            <button
              type="button"
              onClick={() => signInWith(strategy, name)}
              disabled={pending !== null}
              className="group flex min-h-14 w-full items-center gap-3 py-3 text-left text-[var(--foreground)] transition-colors hover:bg-[var(--background-highlight)] disabled:cursor-wait disabled:opacity-60"
            >
              <span className="grid size-8 shrink-0 place-items-center"><Mark /></span>
              <span className="flex-1 font-space-grotesk text-sm">Continue with {name}</span>
              {pending === strategy ? (
                <span aria-label="Opening" className="mr-1 size-4 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: colorValue, borderTopColor: 'transparent' }} />
              ) : (
                <HandDrawnArrow className="mr-1 h-4 w-7 transition-transform group-hover:translate-x-1" color={colorValue} />
              )}
            </button>
          </li>
        ))}
      </ul>

      {cta && (
        <div className="mt-10">
          <p className="mb-3 font-google-sans-code text-[10px] uppercase tracking-wide text-[var(--text-muted)]">no account here?</p>
          {external ? (
            <a href={cta.href} target="_blank" rel="noopener noreferrer" onClick={onCta} className="inline-flex min-h-11 items-center rounded-full px-4 py-2 transition-transform hover:-translate-y-px" style={{ backgroundColor: colorValue }} aria-label={cta.label}>
              <BuildYours color={colorValue} words="always" />
            </a>
          ) : (
            <Link href={cta.href} onClick={onCta} className="inline-flex min-h-11 items-center rounded-full px-4 py-2 transition-transform hover:-translate-y-px" style={{ backgroundColor: colorValue }} aria-label={cta.label}>
              <BuildYours color={colorValue} words="always" />
            </Link>
          )}
          {cta.pitch && <p className="mt-3 max-w-sm font-space-grotesk text-xs text-[var(--text-muted)]">{cta.pitch}</p>}
        </div>
      )}
    </div>
  );
}
