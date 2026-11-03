"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import UnpppsConfig from '../../data/UnpppsConfig.json';
import { SITE_TITLE } from '../constants/organization';

/**
 * The page's name beside the peace circle, and the header's link home. A
 * unppp page shows its id (home maps to theunpartyapp); any other page shows
 * the site's title from FoundersConfig.json, so home is reachable everywhere.
 * Typeset like a `personal` row's text, on the header's frosted glass.
 */
const PageHeader = () => {
  const pathname = usePathname();
  const routePath = pathname.slice(1);
  const targetId = routePath === '' ? 'theunpartyapp' : routePath;
  const matchedUnppp = UnpppsConfig.unppps.find(unppp => unppp.id === targetId);
  const label = matchedUnppp?.id ?? SITE_TITLE;

  return (
    <Link
      href="/"
      aria-label={`${label}, go home`}
      className="min-w-0 truncate font-space-grotesk text-xs leading-relaxed text-[var(--foreground)] transition-colors duration-200 hover:text-[var(--theme-color,_#f9c22e)] md:text-sm"
    >
      {label}
    </Link>
  );
};

export default PageHeader;
