'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { track } from '@vercel/analytics';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '@/lib/auth-stub.client';
import { CHECKOUT_ON, FOUNDER_CTA } from '../constants/organization';
import BuildYours, { inkOn } from './build-yours/BuildYours';
import {
  formatPolarPrice as formatPrice,
  usePolarCheckout,
  type PolarPrice,
} from '../hooks/usePolarCheckout';

export const PILL_CLASS = [
  'inline-flex shrink-0 items-center gap-1.5 rounded-full',
  'border px-2.5 py-1.5',
  'font-google-sans-code text-xs uppercase tracking-wide',
].join(' ');

interface BuyPillProps {
  polarProductId: string;
  /**
   * Fail-closed: callers must explicitly opt in (auth-derived, see
   * StatsLayoutWrapper) to render the live checkout pill. Anonymous
   * visitors always get the static price-only pill.
   */
  disableCheckout?: boolean;
}

/**
 * BuyPill — where a project's page asks for something. With checkout on
 * (FoundersConfig `checkout`, on when missing) it's the project's live Polar
 * price, and for signed-in visitors the embedded checkout. With it off, it's
 * the site's "build yours" (BuildYoursPill).
 *
 * The checkout pill: a project's live Polar price, and for signed-in visitors the
 * embedded checkout (#992/#993). Renders nothing until the price loads, so a
 * product Polar doesn't know (wrong ID, wrong POLAR_SERVER) never shows.
 * Used inside Stats for unppps, and on its own for FoundersConfig projects,
 * which have no priority score.
 *
 * Shows YOURS. right after a checkout, and on later visits once the Polar
 * webhook has recorded the product in the user's Clerk publicMetadata
 * (`purchasedProductIds`, api/webhook/polar).
 */
export default function BuyPill(props: BuyPillProps) {
  return CHECKOUT_ON ? <CheckoutPill {...props} /> : <BuildYoursPill />;
}

/**
 * The Fab's "build yours" (brand brain, hand-written words) as a pill, linking
 * to the site's one ask (FoundersConfig founder.cta); another label shows as
 * set text. Clicks send the same
 * consent-gated `cta_clicked` event as the Fab and BuildYoursCard, so the
 * funnel compares this placement with the rest. No ask set, no pill.
 */
export function BuildYoursPill() {
  const { colorValue } = useTheme();
  const cta = FOUNDER_CTA;
  if (!cta) return null;
  return (
    <Link
      href={cta.href}
      onClick={() => track('cta_clicked', { cta: cta.label, placement: 'buy-pill' })}
      aria-label={cta.label}
      className="inline-flex h-10 shrink-0 items-center rounded-full pl-2.5 pr-4 transition duration-150 hover:opacity-85 active:scale-[0.98]"
      style={{ backgroundColor: colorValue }}
    >
      {cta.label.trim().toLowerCase() === 'build yours' ? (
        <BuildYours color={colorValue} words="always" />
      ) : (
        <span className="px-1 font-google-sans-code text-xs uppercase tracking-wide" style={{ color: inkOn(colorValue) }}>
          {cta.label}
        </span>
      )}
    </Link>
  );
}

function CheckoutPill({ polarProductId, disableCheckout = true }: BuyPillProps) {
  const { colorValue } = useTheme();
  const [price, setPrice] = useState<PolarPrice | null>(null);
  // Embedded checkout lifecycle (#993) — shared with /valuation via the hook.
  const { checkoutState, openCheckout } = usePolarCheckout();
  const { user } = useUser();
  const purchased = user?.publicMetadata?.purchasedProductIds;
  const alreadyOwned = Array.isArray(purchased) && purchased.includes(polarProductId);

  useEffect(() => {
    fetch(`/api/unppp/price?productId=${polarProductId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.priceAmount) setPrice(data); })
      .catch(() => {});
  }, [polarProductId]);

  if (!price) return null;

  const label = formatPrice(price.priceAmount, price.priceCurrency);

  if (disableCheckout) {
    return (
      <div className={PILL_CLASS} style={{ borderColor: colorValue, color: colorValue }}>
        <span>{label}</span>
      </div>
    );
  }

  if (checkoutState === 'success' || alreadyOwned) {
    return (
      <div
        role="status"
        className={PILL_CLASS}
        style={{ backgroundColor: colorValue, borderColor: colorValue, color: 'var(--background)' }}
      >
        <span aria-hidden="true">✓</span>
        <span>YOURS.</span>
      </div>
    );
  }

  const checkoutBusy = checkoutState === 'loading' || checkoutState === 'open';

  return (
    <button
      type="button"
      onClick={() => openCheckout(polarProductId)}
      disabled={checkoutBusy}
      aria-busy={checkoutState === 'loading'}
      aria-label={
        checkoutState === 'error'
          ? 'Checkout could not start — tap to retry'
          : `Buy for ${label} — opens checkout without leaving this page`
      }
      className={`${PILL_CLASS} transition duration-150 hover:opacity-80 active:scale-[0.98] disabled:cursor-wait`}
      style={{ backgroundColor: colorValue, borderColor: colorValue, color: 'var(--background)' }}
    >
      <span>{label}</span>
      <span aria-hidden="true" className="inline-flex w-3 items-center justify-center">
        {checkoutState === 'loading' ? (
          <span className="size-3 animate-spin rounded-full border border-current border-t-transparent" />
        ) : checkoutState === 'error' ? (
          '↻'
        ) : (
          '→'
        )}
      </span>
    </button>
  );
}
