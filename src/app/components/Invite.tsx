'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Info, Mail, KeyRound } from '@/app/components/icons';
import { useAuth } from '@/lib/auth-stub.client';
import { useFetch } from '@/hooks/useFetch';
import { WAITLIST_ON } from '@/app/constants/organization';

type SubmissionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

const Invite = () => {
  const { isLoaded, isSignedIn } = useAuth();
  const pathname = usePathname();
  const { data, loading: isFetchingStatus } = useFetch<{ submission?: { status: SubmissionStatus } }>(
    isLoaded && isSignedIn ? '/api/problem/send' : null
  );
  const status = data?.submission?.status ?? null;

  const isLoading = !isLoaded || isFetchingStatus;

  const cta = (() => {
    if (!isSignedIn) {
      return { href: `/sign-up?redirect_url=${encodeURIComponent(pathname)}`, label: 'SIGN UP TO JOIN' };
    }
    // No waitlist on this site: anyone signed in goes straight in
    if (!WAITLIST_ON || status === 'APPROVED') {
      return { href: '/party', label: 'GO TO PARTY' };
    }
    if (status === 'PENDING' || status === 'REJECTED') {
      return { href: '/waitlist/pending', label: 'VIEW WAITLIST STATUS' };
    }
    return { href: '/waitlist/apply', label: 'JOIN THE WAITLIST' };
  })();

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4">
      {/* Primary Action */}
      {isLoading ? (
        <div
          className="inline-flex w-full items-center justify-start gap-3 rounded-full border border-gray-200/20 px-4 py-2 font-google-sans-code text-sm font-semibold uppercase tracking-wide opacity-50 sm:px-6 sm:py-3 sm:text-base dark:border-gray-700/20"
          style={{ backgroundColor: 'transparent' }}
        >
          <KeyRound className="size-4 sm:size-5" />
          <div className="h-4 w-px bg-current opacity-20" />
          <span>LOADING...</span>
        </div>
      ) : (
        <Link
          href={cta.href}
          className="inline-flex w-full items-center justify-start gap-3 rounded-full border border-gray-200/20 px-4 py-2 font-google-sans-code text-sm font-semibold uppercase tracking-wide transition-all duration-200 hover:border-gray-300 sm:px-6 sm:py-3 sm:text-base dark:border-gray-700/20 dark:hover:border-gray-600"
          style={{ backgroundColor: 'transparent' }}
        >
          <KeyRound className="size-4 sm:size-5" />
          <div className="h-4 w-px bg-current opacity-20" />
          <span>{cta.label}</span>
        </Link>
      )}

      {/* Secondary Actions Row */}
      {!isLoading && !isSignedIn && (
        <div className="flex gap-3 text-left">
          <Link
            href="/sign-in"
            className="inline-flex flex-1 items-center justify-start gap-2 rounded-full border border-gray-200/20 px-3 py-1.5 font-google-sans-code text-xs font-medium uppercase tracking-wide opacity-80 transition-all duration-200 hover:border-gray-300 hover:opacity-100 sm:px-4 sm:py-2 sm:text-sm dark:border-gray-700/20 dark:hover:border-gray-600"
            style={{ backgroundColor: 'transparent' }}
          >
            <Mail className="size-3 sm:size-4" />
            <div className="h-3 w-px bg-current opacity-20" />
            <span>ALREADY HAVE AN ACCOUNT? SIGN IN</span>
          </Link>

          <button className="inline-flex flex-1 items-center justify-start gap-2 rounded-full border border-gray-200/20 px-3 py-1.5 font-google-sans-code text-xs font-medium uppercase tracking-wide opacity-60 transition-all duration-200 hover:border-gray-300 hover:opacity-100 sm:px-4 sm:py-2 sm:text-sm dark:border-gray-700/20 dark:hover:border-gray-600" style={{ backgroundColor: 'transparent' }}>
            <Info className="size-3 sm:size-4" />
            <div className="h-3 w-px bg-current opacity-20" />
            <span>LEARN MORE</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default Invite;
