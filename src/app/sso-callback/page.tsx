'use client';

import { AuthenticateWithRedirectCallback } from '@/lib/auth-stub.client';

// Where GitHub, Google and Apple send people back (SignIn's redirectCallbackUrl).
// Clerk finishes the sign-in here, or sends someone new on to /sign-up/continue
// for anything their account still needs, then on to where they started
export default function SsoCallbackPage() {
  return (
    <main className="mx-auto max-w-5xl py-24 text-left">
      <p className="font-vt323 text-2xl text-[var(--text-muted)]">signing you in...</p>
      <AuthenticateWithRedirectCallback signInUrl="/sign-in" signUpUrl="/sign-up" continueSignUpUrl="/sign-up/continue" />
    </main>
  );
}
