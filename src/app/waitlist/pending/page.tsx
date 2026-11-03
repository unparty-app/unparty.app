'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import { CheckCircle2, XCircle, Clock, KeyRound } from '@/app/components/icons';

type SubmissionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

interface SubmissionInfo {
  status: SubmissionStatus;
  submittedAt: string;
  processedAt: string | null;
}

export default function WaitlistPendingPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [submission, setSubmission] = useState<SubmissionInfo | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch('/api/problem/send');
        if (response.status === 401) {
          setIsAuthenticated(false);
          return;
        }
        setIsAuthenticated(true);
        if (response.ok) {
          const data = await response.json();
          setSubmission(data.submission ?? null);
        }
      } catch (error) {
        console.error('Failed to load waitlist status:', error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  if (isLoading) {
    return (
      <main className="vh-content-container mx-auto max-w-md p-6">
        <div className="animate-pulse font-google-sans-code">Checking your waitlist status...</div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="vh-content-container mx-auto max-w-md p-6">
        <div className="vh-card space-y-4">
          <h1 className="font-google-sans-code text-xl font-semibold">Sign in to check your status</h1>
          <Link href="/sign-in" className="inline-flex w-full items-center justify-center gap-2 app-button-primary">
            <span>Sign In</span>
          </Link>
        </div>
      </main>
    );
  }

  if (!submission) {
    return (
      <main className="vh-content-container mx-auto max-w-md p-6">
        <div className="vh-card space-y-4">
          <div className="flex items-center gap-3">
            <KeyRound className="size-8" />
            <h1 className="font-google-sans-code text-xl font-semibold">You&apos;re not on the waitlist yet</h1>
          </div>
          <p className="font-google-sans-code text-sm opacity-70">
            Complete the problem worksheet to join the waitlist.
          </p>
          <Link href="/waitlist/apply" className="inline-flex w-full items-center justify-center gap-2 app-button-primary">
            <span>Start Worksheet</span>
          </Link>
        </div>
      </main>
    );
  }

  if (submission.status === 'APPROVED') {
    return (
      <main className="vh-content-container mx-auto max-w-md p-6">
        <div className="vh-card border-green-500 bg-green-50 space-y-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="size-8 text-green-600" />
            <h1 className="text-xl font-semibold text-green-800">You&apos;re in</h1>
          </div>
          <p className="text-green-700">Your waitlist submission was approved. Welcome to the party.</p>
          <Link href="/party" className="inline-flex w-full items-center justify-center gap-2 app-button-primary">
            <span>Go to /party</span>
          </Link>
        </div>
      </main>
    );
  }

  if (submission.status === 'REJECTED') {
    return (
      <main className="vh-content-container mx-auto max-w-md p-6">
        <div className="vh-card border-red-500 bg-red-50 space-y-4">
          <div className="flex items-center gap-3">
            <XCircle className="size-8 text-red-600" />
            <h1 className="text-xl font-semibold text-red-800">Problem not compatible</h1>
          </div>
          <p className="text-red-700">Your waitlist submission wasn&apos;t approved this round.</p>
          <Link href="/waitlist/apply" className="inline-flex w-full items-center justify-center gap-2 app-button-secondary">
            <span>Update &amp; Resubmit</span>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="vh-content-container mx-auto max-w-md p-6">
      <div className="vh-card border-amber-500 bg-amber-50 space-y-4">
        <div className="flex items-center gap-3">
          <Clock className="size-8 text-amber-600" />
          <h1 className="text-xl font-semibold text-amber-800">You&apos;re on the list.</h1>
        </div>
        <p className="text-amber-700">
          Your PROBLEM, submitted {new Date(submission.submittedAt).toLocaleDateString()}, is under review.
        </p>
        <Link href="/waitlist/apply" className="inline-flex w-full items-center justify-center gap-2 app-button-secondary">
          <span>Update PROBLEM.</span>
        </Link>
      </div>
    </main>
  );
}
