'use client';

/**
 * usePolarCheckout — the embedded Polar checkout lifecycle from #993,
 * extracted out of Stats.tsx so /valuation can surface the exact same flow
 * (#1000) without duplicating it. One hook instance manages one overlay at a
 * time (Polar's embed lives on document.body), keyed by productId so a
 * multi-product surface like the valuation ledger can drive checkout for any
 * row through a single state machine.
 *
 * Lifecycle per product:
 * idle → loading (creating the session + fetching the embed script) →
 * open (Polar's embedded checkout overlay is up) → success (paid — the
 * productId joins purchasedProductIds so bought state survives the overlay
 * closing) — or error (retryable).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { PolarEmbedCheckout } from '@polar-sh/checkout/embed';

export type PolarCheckoutState = 'idle' | 'loading' | 'open' | 'success' | 'error';

export interface PolarPrice {
  priceAmount: number;
  priceCurrency: string;
}

// If Polar's embed hasn't finished loading by then (script blocked,
// embedding allowlist missing, …) we degrade to the hosted checkout page
// for the same session rather than leaving a dead pill.
const EMBED_LOAD_TIMEOUT_MS = 15000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('embed load timed out')), ms);
    promise.then(
      (value) => { clearTimeout(timer); resolve(value); },
      (error) => { clearTimeout(timer); reject(error); },
    );
  });
}

export function formatPolarPrice(priceAmount: number, priceCurrency: string): string {
  const dollars = priceAmount / 100;
  const hasCents = priceAmount % 100 !== 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: priceCurrency.toUpperCase(),
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: hasCents ? 2 : 0,
  }).format(dollars);
}

export function usePolarCheckout() {
  const [checkoutState, setCheckoutState] = useState<PolarCheckoutState>('idle');
  const [activeProductId, setActiveProductId] = useState<string | null>(null);
  const [purchasedProductIds, setPurchasedProductIds] = useState<ReadonlySet<string>>(
    () => new Set<string>(),
  );
  const checkoutRef = useRef<PolarEmbedCheckout | null>(null);
  const unmountedRef = useRef(false);

  // The embed overlay lives on document.body, so it survives client-side
  // navigation — close it if the owning component unmounts while it's up.
  useEffect(() => {
    unmountedRef.current = false;
    return () => {
      unmountedRef.current = true;
      checkoutRef.current?.close();
      checkoutRef.current = null;
    };
  }, []);

  const openCheckout = useCallback(async (productId: string) => {
    setActiveProductId(productId);
    setCheckoutState('loading');

    let checkoutUrl: string | null = null;
    try {
      // Load Polar's embed module in parallel with creating the session.
      const [embedModule, response] = await Promise.all([
        import('@polar-sh/checkout/embed'),
        fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId }),
        }),
      ]);
      if (!response.ok) throw new Error(`checkout session failed (${response.status})`);
      const data = await response.json();
      if (typeof data?.url !== 'string') throw new Error('checkout session missing url');
      checkoutUrl = data.url;

      const theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
      const checkout = await withTimeout(
        embedModule.PolarEmbedCheckout.create(checkoutUrl as string, { theme }),
        EMBED_LOAD_TIMEOUT_MS,
      );

      if (unmountedRef.current) {
        checkout.close();
        return;
      }
      checkoutRef.current = checkout;
      setCheckoutState('open');

      checkout.addEventListener('success', (event) => {
        // Our sessions set no external successUrl, so Polar confirms the
        // order inline inside the embed (redirect: false). Record the buy so
        // the bought state survives once the overlay is dismissed.
        setCheckoutState('success');
        setPurchasedProductIds((prev) => {
          const next = new Set(prev);
          next.add(productId);
          return next;
        });
        if (event.detail.redirect) {
          // Defensive: never navigate away from unparty.app mid-flow.
          event.preventDefault();
          checkout.close();
        }
      });
      checkout.addEventListener('close', () => {
        checkoutRef.current = null;
        setCheckoutState((s) => (s === 'success' ? s : 'idle'));
      });
    } catch {
      if (checkoutUrl) {
        // Session exists but the embed couldn't open (blocked script,
        // missing embedding allowlist, …) — fall back to Polar's hosted
        // page for the same session instead of dropping the purchase.
        window.location.assign(checkoutUrl);
        return;
      }
      if (!unmountedRef.current) setCheckoutState('error');
    }
  }, []);

  return { checkoutState, activeProductId, purchasedProductIds, openCheckout };
}
