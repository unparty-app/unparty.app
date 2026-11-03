'use client';

import Link from 'next/link';
import { track } from '@vercel/analytics';
import { Globe, Heart, Lightbulb } from '../icons';
import { logoFor } from './socialLogos';
import { useTheme } from '../../contexts/ThemeContext';

// The footer's row-title type (admin/components/Settings.tsx RowText)
export const FOOTER_LINK =
  'font-space-grotesk text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--theme-color)]';

/**
 * The footer's frosted glass, the Header's recipe flipped: edge to edge on
 * the Header's padding, rounded on top, with the same faint theme-color edge.
 * pb-24 keeps the last line clear of the Fab and the article dock (Banner),
 * both h-16 at bottom-4, which float on the glass
 */
export function FooterFrame({ children }: { children: React.ReactNode }) {
  const { colorValue } = useTheme();
  return (
    <footer
      className="mt-16 w-full overflow-hidden rounded-t-xl border border-b-0 bg-background/85 pb-24 pl-4 pr-4 shadow-lg backdrop-blur-md sm:pl-6 sm:pr-6 lg:pl-7 lg:pr-8 xl:pl-9 xl:pr-12"
      style={{ borderColor: `${colorValue}40` }}
    >
      {children}
    </footer>
  );
}

/**
 * The site's ask (founder.cta) with a hand-drawn lightbulb, the moment the
 * Fab's brain lights up, in the same pen as the sponsor heart: it lights with
 * the Fab's flicker when the link is hovered or focused (globals.css
 * .footer-ask). Counted as the same cta_clicked event as every other
 * placement of the ask
 */
export function FooterAsk({ label, href }: { label: string; href: string }) {
  return (
    <Link
      href={href}
      onClick={() => track('cta_clicked', { cta: label, placement: 'footer' })}
      className={`footer-ask inline-flex items-center gap-1.5 ${FOOTER_LINK}`}
    >
      <Lightbulb size={16} strokeWidth={1.3} themed className="footer-ask__bulb shrink-0" />
      {label}
    </Link>
  );
}

/** Sponsoring, with a hand-drawn heart that beats once on hover or focus */
export function FooterSponsor({ href }: { href: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={`footer-sponsor inline-flex items-center gap-1.5 ${FOOTER_LINK}`}>
      <Heart size={16} strokeWidth={1.3} themed className="footer-sponsor__heart shrink-0" />
      sponsor
    </a>
  );
}

/**
 * The founder's links (founder.links) as their platforms' marks, so a visitor
 * sees at a glance where the person behind the site is: GitHub, Instagram and
 * so on (socialLogos.ts). A link with no mark gets a hand-drawn globe. Each
 * mark lifts and takes the theme color on hover
 */
export function FounderLogos({ name, links }: { name: string; links: { label: string; url: string }[] }) {
  if (links.length === 0) return null;
  return (
    <ul className="flex items-center gap-4" aria-label={`${name} elsewhere`}>
      {links.map((link) => {
        const logo = logoFor(link.url);
        return (
          <li key={link.url}>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer me"
              aria-label={`${name} on ${logo?.name ?? link.label}`}
              title={logo?.name ?? link.label}
              className="footer-logo block text-[var(--text-muted)] transition-colors hover:text-[var(--theme-color)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--theme-color)]"
            >
              {logo ? (
                <svg viewBox="0 0 24 24" className="size-[18px]" fill="currentColor" aria-hidden="true">
                  <path d={logo.path} />
                </svg>
              ) : (
                <Globe size={18} strokeWidth={1.3} />
              )}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
