'use client';

import { useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import { track } from '@vercel/analytics';
import { Hammer } from '../icons';
import ActionPill from './ActionPill';

// Loaded only when the pill is tapped
const PriceYoursModal = dynamic(() => import('./PriceYoursModal'), { ssr: false });

/**
 * "price yours": an invitation, not a price tag. The pill carries no number,
 * since a figure with no context reads as what the visitor would pay. Tapping
 * it opens PriceYoursModal, where the figure comes with how it's worked out.
 */
export default function PriceYours({ hours, name, own = false, href, color, delayMs }: {
  hours: number;
  name?: string; // What the hours are like ("theunpartyapp")
  own?: boolean; // The visitor's own tracked hours
  href: string; // The whole plan in Goal Budget, with these hours picked
  color: string;
  delayMs?: number;
}) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  return (
    <>
      <ActionPill
        verb="price yours"
        onClick={() => {
          track('price_yours_opened', { of: own ? 'tracked' : name ?? 'unknown' });
          setOpen(true);
        }}
        icon={Hammer}
        color={color}
        label={own ? 'Price yours, from the hours you have tracked' : `Price yours${name ? `, like ${name}` : ''}`}
        delayMs={delayMs}
      />
      {open && <PriceYoursModal hours={hours} name={name} own={own} href={href} color={color} onClose={close} />}
    </>
  );
}
