'use client';

import { useHydrated } from '@/hooks/useHydrated';
import Link from 'next/link';

import { AlertTriangle, RefreshCw, Home } from '@/app/components/icons';

export default function ErrorPage() {
  // navigator is only available once hydrated on the client
  const hydrated = useHydrated();
  const browserInfo = (hydrated && navigator.userAgent?.split(' ')[0]) || 'Unknown';

  const handleRetry = () => {
    // Refresh the page to retry
    window.location.reload();
  };

  return (
    <main className="vh-content-container mx-auto max-w-md p-6">
      <div className="vh-card border-red-500 bg-red-50">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="size-8 text-red-600" />
            <h1 className="text-xl font-semibold text-red-800">System Error</h1>
          </div>

          <div className="space-y-4 text-red-700">
            <p>
              We&apos;re experiencing technical difficulties and couldn&apos;t validate your code at this time.
            </p>
            <p className="text-sm">
              This is likely a temporary issue. Please try again in a few moments.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleRetry}
              className="inline-flex w-full items-center justify-center gap-2 app-button-primary"
            >
              <RefreshCw className="size-4" />
              <span>Try Again</span>
            </button>

            <Link
              href="/"
              className="inline-flex w-full items-center justify-center gap-2 app-button-secondary"
            >
              <Home className="size-4" />
              <span>Go Home</span>
            </Link>
          </div>

          <div className="border-t border-red-200 pt-4">
            <div className="text-xs text-red-600 space-y-1">
              <p><strong>Still having trouble?</strong></p>
              <p>If this error persists, please contact our support team with the following details:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Time: {new Date().toLocaleString()}</li>
                <li>Error: Code validation failed</li>
                <li>Browser: {browserInfo}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}