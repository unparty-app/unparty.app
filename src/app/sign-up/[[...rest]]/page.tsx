"use client";

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { SignUp } from '@/lib/auth-stub.client';
import { WAITLIST_ON } from '@/app/constants/organization';

// Only ever redirect to a same-site relative path — never trust redirect_url as an absolute
// or protocol-relative URL, which would turn this into an open redirect.
function safeRedirect(url: string | null, fallback: string): string {
  if (url && url.startsWith('/') && !url.startsWith('//')) {
    return url;
  }
  return fallback;
}

function SignUpContent() {
  const searchParams = useSearchParams();
  const fallbackRedirectUrl = safeRedirect(searchParams.get('redirect_url'), WAITLIST_ON ? '/waitlist/apply' : '/party');

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Subtle background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-[rgba(249,194,46,0.01)] pointer-events-none"></div>

      <SignUp fallbackRedirectUrl={fallbackRedirectUrl} />
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={null}>
      <SignUpContent />
    </Suspense>
  );
}
