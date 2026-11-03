"use client"

import { ClerkProvider } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import { SITE_LOGO_PATH } from '../constants/organization'
import { CLERK_ON } from '@/lib/clerk-on'

// Other sites that send people here to sign in and back again (Clerk
// satellite apps), from NEXT_PUBLIC_CLERK_ALLOWED_REDIRECT_ORIGINS as a
// comma-separated list. Unset, Clerk only redirects within this site
const ALLOWED_REDIRECT_ORIGINS = (process.env.NEXT_PUBLIC_CLERK_ALLOWED_REDIRECT_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim().replace(/\/+$/, ''))
  .filter(Boolean)

interface ClerkThemeProviderProps {
  children: React.ReactNode
}

export default function ClerkThemeProvider({ children }: ClerkThemeProviderProps) {
  // No sign-in connected: nothing to provide, and the auth stubs answer signed out
  if (!CLERK_ON) return <>{children}</>

  return (
    <ClerkProvider
      // Satellite apps' origins must be trusted so their sign-in/sign-up
      // redirects back here work.
      // See https://clerk.com/docs/guides/dashboard/dns-domains/satellite-domains
      allowedRedirectOrigins={ALLOWED_REDIRECT_ORIGINS.length > 0 ? ALLOWED_REDIRECT_ORIGINS : undefined}
      appearance={{
        baseTheme: dark,
        layout: {
          animations: true,
          logoImageUrl: SITE_LOGO_PATH,
          logoPlacement: 'inside',
          socialButtonsPlacement: 'top',
          socialButtonsVariant: 'blockButton',
          showOptionalFields: true,
          shimmer: true,
          termsPageUrl: '/terms',
          privacyPageUrl: '/privacy',
        },
        // The site's own variables, so Clerk's screens (sign-up, its continue
        // step, the account popover) follow the reader's theme and light/dark
        // instead of a fixed yellow on black
        variables: {
          colorPrimary: 'var(--theme-color, #F9C22E)',
          colorPrimaryForeground: 'var(--background)',
          colorBackground: 'var(--background)',
          colorForeground: 'var(--foreground)',
          colorMutedForeground: 'var(--text-muted)',
          colorInput: 'var(--background)',
          colorInputForeground: 'var(--foreground)',
          colorNeutral: 'var(--foreground)',
          borderRadius: '0.75rem',
          fontFamily: 'var(--font-space-grotesk), system-ui, sans-serif',
        },
        elements: {
          formButtonPrimary: 'font-google-sans-code uppercase tracking-wide text-[var(--background)]',
          headerTitle: 'font-vt323 text-3xl normal-case text-[var(--foreground)]',
          formHeaderTitle: 'font-vt323 text-3xl normal-case text-[var(--foreground)]',
          headerSubtitle: 'text-[var(--text-muted)]',
          formHeaderSubtitle: 'text-[var(--text-muted)]',
          footerActionLink: 'text-[var(--theme-color)] hover:opacity-80',
          identityPreviewEditButton: 'text-[var(--theme-color)]',
          formResendCodeLink: 'text-[var(--theme-color)]',
        },
      }}
    >
      {children}
    </ClerkProvider>
  );
}
