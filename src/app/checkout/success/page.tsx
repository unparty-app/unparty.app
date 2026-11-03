'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTheme } from '../../contexts/ThemeContext';
import { useHydrated } from '@/hooks/useHydrated';

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const { colorValue } = useTheme();
  const mounted = useHydrated();

  if (!mounted) {
    return null;
  }

  const checkoutId = searchParams.get('checkout_id');

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div 
          className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full"
          style={{ backgroundColor: colorValue }}
        >
          <svg 
            className="size-8 text-white" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M5 13l4 4L19 7" 
            />
          </svg>
        </div>
        
        <h1 className="mb-4 text-2xl font-bold">Payment Successful!</h1>
        
        <p className="mb-6 text-gray-600 dark:text-gray-400">
          Thank you for your purchase. Polar emails your receipt, along with anything that comes with it.
        </p>

        {checkoutId && (
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-500">
            Order ID: {checkoutId}
          </p>
        )}

        <div className="space-y-3">
          <Link
            href="/"
            className="vh-button-primary block w-full rounded-lg py-3 text-center"
          >
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
