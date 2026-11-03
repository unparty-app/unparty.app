'use client';

import Link from 'next/link';
import { useTheme } from '../contexts/ThemeContext';
import { InkUnderline } from './depend/ink';
import { X } from './icons';

/**
 * Where sign-in would be, on a copy with none connected (src/lib/clerk-on.ts):
 * a copy runs without accounts, so this says that plainly instead of an error.
 */
export default function SignInOff({ onClose, className = '' }: { onClose?: () => void; className?: string }) {
  const { colorValue } = useTheme();
  return (
    <div className={`relative w-full max-w-md text-left ${className}`}>
      {onClose && (
        <button type="button" onClick={onClose} aria-label="Close" className="absolute right-0 top-0 grid size-11 place-items-center text-[var(--text-muted)] hover:text-[var(--foreground)]">
          <X size={18} />
        </button>
      )}
      <h1 className="pr-10 font-vt323 text-4xl uppercase leading-none text-[var(--foreground)]">no sign-in here yet.</h1>
      <InkUnderline color={colorValue} className="mt-1 h-2 w-28" />
      <p className="mt-4 font-space-grotesk text-sm leading-relaxed text-[var(--text-muted)]">
        this site runs without accounts, so there&apos;s nothing to sign in to. everything you can read is open.
      </p>
      <p className="mt-3 font-space-grotesk text-sm leading-relaxed text-[var(--text-muted)]">
        is this your site?{' '}
        <Link href="/article/setup-sign-in" className="underline decoration-dotted underline-offset-4 hover:text-[var(--foreground)]" style={{ color: colorValue }}>
          add sign-in
        </Link>{' '}
        when you want your admin pages.
      </p>
    </div>
  );
}
