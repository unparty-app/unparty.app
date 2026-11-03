"use client";

import SignIn from '../../components/SignIn';

// Left-aligned like the rest of the site
export default function SignInPage() {
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-5xl items-center py-16">
      <SignIn />
    </main>
  );
}
