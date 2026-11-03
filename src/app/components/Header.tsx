"use client";

import { useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from "../contexts/ThemeContext";
import { pageNavFor } from '../constants/pageNav';
import { inkOn } from './build-yours/BuildYours';
import TypeEffortCard from './TypeEffortCard';
import PageHeader from './PageHeader';
import UnpppNavTray from './UnpppNavTray';
import LogoNav from './LogoNav';
import { useInviteModal } from '../hooks/useInviteModal';
import { useConnectModal } from '../hooks/useConnectModal';


const CIRCLE = 'flex size-12 shrink-0 items-center justify-center rounded-full shadow-md transition-transform duration-200 hover:scale-105 motion-reduce:transition-none';

/**
 * Where the visitor is: off home and the unppp project pages, the section's
 * hand-drawn icon in a circle like the action buttons (constants/pageNav).
 * On a type hub it's the type's icon in its own color, and tapping it opens
 * that type's effort (TypeEffortCard); elsewhere it links to the section's
 * front.
 */
const PageNavCircle = () => {
  const { colorValue } = useTheme();
  const nav = pageNavFor(usePathname());
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);
  if (!nav) return null;
  const color = nav.color ?? colorValue;
  const Icon = nav.icon;
  const mark = <Icon size={22} strokeWidth={1.6} color={inkOn(color)} />;

  if (!nav.type) {
    return (
      <Link href={nav.href} aria-label={nav.label} title={nav.label} className={CIRCLE} style={{ backgroundColor: color }}>
        {mark}
      </Link>
    );
  }
  return (
    <>
      <button
        ref={ref}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="type-effort-card"
        aria-label={`${nav.label}: show its effort`}
        className={CIRCLE}
        style={{ backgroundColor: color }}
      >
        {mark}
      </button>
      <TypeEffortCard type={nav.type} open={open} onClose={() => setOpen(false)} triggerRef={ref} />
    </>
  );
};

const Header = () => {
  const { colorValue } = useTheme();
  const { InviteModal } = useInviteModal();
  const { openModal: openConnectModal, ConnectModal } = useConnectModal();

  return (
    // Frosted glass, the same recipe as the bottom bar (Banner): the page
    // blurs through it, with a faint theme-color edge
    <div
      className="w-full overflow-hidden rounded-b-xl border border-t-0 bg-background/85 pt-[env(safe-area-inset-top)] shadow-lg backdrop-blur-md"
      style={{ borderColor: `${colorValue}40` }}
    >
      {/* Premium edge-to-edge navbar with full viewport width */}
      <div className="w-full pl-2 pr-4 sm:pl-3 sm:pr-6 lg:pl-4 lg:pr-8 xl:pl-6 xl:pr-12">
        <div className="navbar-container">
      {/* The peace circle (unppp nav tray) then the page's name: the same
          circle-then-label row as personal, steps and challenges */}
      <div className="ml-2 flex min-w-0 flex-1 items-center gap-3 sm:ml-3">
        <UnpppNavTray />
        <PageNavCircle />
        <PageHeader />
      </div>

      {/* Spacer for actions alignment */}
      <div className="shrink-0" />
      
      {/* Action buttons */}
      <div className="navbar-actions">
        <button
          onClick={() => openConnectModal()}
          className="flex size-12 shrink-0 items-center justify-center rounded-full shadow-md transition-transform duration-200 hover:scale-105 motion-reduce:transition-none"
          style={{ backgroundColor: colorValue }}
          aria-label="Send us a message"
          title="Send us a message"
        >
          <Image
            src="/icon-connect.png"
            alt="Connect"
            width={28}
            height={28}
            className="size-6 object-contain"
          />
        </button>

        <button
          onClick={() => {
            // Trigger the global search modal (same as Cmd+K)
            window.dispatchEvent(new CustomEvent('openGlobalSearch'));
          }}
          className="flex size-12 shrink-0 items-center justify-center rounded-full shadow-md transition-transform duration-200 hover:scale-105 motion-reduce:transition-none"
          style={{ backgroundColor: colorValue }}
          aria-label="Search everything (Cmd+K)"
          title="Search everything (Cmd+K)"
        >
          <Image
            src="/icon-search.png"
            alt="Search"
            width={28}
            height={28}
            className="size-6 object-contain"
          />
        </button>

    {/* Fish logo trigger + recent-pages tray */}
      <LogoNav />


      </div>

      {/* Invite Modal */}
      {InviteModal}

      {/* Connect Modal */}
      {ConnectModal}
        </div>
      </div>
    </div>
  );
};

export default Header;
