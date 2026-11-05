import Link from 'next/link';
import CookiePreferencesButton from './CookiePreferencesButton';
import ValuesBadge from './ValuesBadge';
import { FooterAsk, FooterFrame, FooterSponsor, FounderLogos, FOOTER_LINK } from './footer/FooterLinks';
import { FOUNDER, FOUNDER_CTA, LEGAL_NAME, SITE_TAGLINE, SITE_TITLE, SPONSOR_LINKS } from '../constants/organization';
import { FAQ_PUBLISHED } from '@/lib/faq';
import { SignedOut } from '@/lib/auth-stub.client';
import { CLERK_ON } from '@/lib/clerk-on';

// The /admin settings tokens (admin/components/Settings.tsx): links read like a
// row's title (FOOTER_LINK), the legal row like its labels
const LABEL = 'font-google-sans-code text-[10px] uppercase tracking-wide text-[var(--text-muted)]';
const LABEL_LINK = `${LABEL} transition-colors hover:text-[var(--foreground)]`;

/**
 * Footer - two rows in the /admin settings language on the Header's frosted
 * glass, edge to edge like it (FooterFrame), divided by a theme hairline.
 *
 * Row one: the site in VT323 with its tagline, the founder's links as their
 * platforms' marks (GitHub, Instagram…) and its values (ValuesBadge), then
 * where to go next: its ask with the brand brain, articles, the FAQ once
 * published, the founder, sponsoring with a hand-drawn heart, and sign in for
 * anyone signed out, once the copy has sign-in. Row two, in the settings' label type:
 * ©, privacy, terms, cookies, and the Apple Music notice the player requires.
 *
 * Every label and link comes from FoundersConfig and the routes the copy has,
 * so a buyer's footer is theirs: the ask is founder.cta, sponsoring is
 * sponsor.github or sponsor.polarUrl (left out when neither is set).
 */
const Footer = () => {
  const sponsor = SPONSOR_LINKS[0];
  const nav = [
    { label: 'articles', href: '/article' },
    FAQ_PUBLISHED && { label: 'faq', href: '/faq' },
    { label: 'founders', href: '/founders' },
  ].filter((item): item is { label: string; href: string } => Boolean(item));

  return (
    <FooterFrame>
      <div className="flex flex-col gap-6 py-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link href="/" className="font-vt323 text-3xl leading-none text-[var(--foreground)] transition-colors hover:text-[var(--theme-color)]">
            {SITE_TITLE}
          </Link>
          <p className="mt-2 font-space-grotesk text-xs text-[var(--text-muted)]">{SITE_TAGLINE}</p>
          <div className="mt-4">
            <FounderLogos name={FOUNDER.name} links={FOUNDER.links} />
          </div>
          <div className="mt-5 max-w-xs">
            <ValuesBadge variant="footer" />
          </div>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-6 gap-y-3">
          {FOUNDER_CTA && <FooterAsk label={FOUNDER_CTA.label} href={FOUNDER_CTA.href} />}
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className={FOOTER_LINK}>{item.label}</Link>
          ))}
          {sponsor && <FooterSponsor href={sponsor.href} />}
          {/* With no sign-in connected, there's nothing to sign in to */}
          {CLERK_ON && (
            <SignedOut>
              <Link href="/sign-in" className={FOOTER_LINK}>sign in</Link>
            </SignedOut>
          )}
        </nav>
      </div>

      <div className="border-theme-line flex flex-col gap-3 border-t pt-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <span className={LABEL}>&copy; {new Date().getFullYear()} {LEGAL_NAME}</span>
          <Link href="/privacy" className={LABEL_LINK}>privacy</Link>
          <Link href="/terms" className={LABEL_LINK}>terms</Link>
          <CookiePreferencesButton label="cookies" className={LABEL_LINK} />
        </div>
        <p className={`${LABEL} normal-case tracking-normal opacity-70`}>
          Apple and Apple Music are trademarks of Apple Inc., registered in the U.S. and other countries.
        </p>
      </div>
    </FooterFrame>
  );
};

export default Footer;
