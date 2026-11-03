/**
 * Authentication - Client-Side
 *
 * Clerk's hooks and components, or, with no sign-in connected
 * (src/lib/clerk-on.ts), the same names answering "signed out". Clerk's own need
 * its provider, which isn't there without keys, and throw. Import this file from
 * Client Components (with "use client" directive), never @clerk/nextjs directly.
 */

'use client';

import { cloneElement, isValidElement, useEffect, type MouseEvent, type ReactElement, type ReactNode } from 'react';
import {
  useAuth as clerkUseAuth,
  useUser as clerkUseUser,
  useSignUp as clerkUseSignUp,
  useSignIn as clerkUseSignIn,
  useOrganization as clerkUseOrganization,
  UserButton as ClerkUserButton,
  SignIn as ClerkSignIn,
  SignUp as ClerkSignUp,
  OrganizationSwitcher as ClerkOrganizationSwitcher,
  RedirectToSignIn as ClerkRedirectToSignIn,
  SignInButton as ClerkSignInButton,
  SignOutButton as ClerkSignOutButton,
  AuthenticateWithRedirectCallback as ClerkAuthenticateWithRedirectCallback,
} from '@clerk/nextjs';
import SignInOff from '@/app/components/SignInOff';
import { CLERK_ON } from './clerk-on';

// Export dark theme from @clerk/themes
export { dark } from '@clerk/themes';

const Nothing = () => null;

/** Somewhere sign-in would have happened: sends them to the page that explains */
function GoToSignIn() {
  useEffect(() => {
    window.location.replace('/sign-in');
  }, []);
  return null;
}

/** Keeps its button as it is, and sends a tap to the page that explains */
function SignInButtonOff({ children }: { children?: ReactNode }) {
  if (!isValidElement(children)) return null;
  const child = children as ReactElement<{ onClick?: (event: MouseEvent) => void }>;
  return cloneElement(child, {
    onClick: () => {
      window.location.assign('/sign-in');
    },
  });
}

export const useAuth = (CLERK_ON
  ? clerkUseAuth
  : () => ({ isLoaded: true, isSignedIn: false, userId: null, sessionId: null, orgId: null, orgRole: null, getToken: async () => null, signOut: async () => {} })) as typeof clerkUseAuth;

export const useUser = (CLERK_ON ? clerkUseUser : () => ({ isLoaded: true, isSignedIn: false, user: null })) as typeof clerkUseUser;

export const useSignIn = (CLERK_ON ? clerkUseSignIn : () => ({ isLoaded: true, signIn: null, setActive: null })) as unknown as typeof clerkUseSignIn;

export const useSignUp = (CLERK_ON ? clerkUseSignUp : () => ({ isLoaded: true, signUp: null, setActive: null })) as unknown as typeof clerkUseSignUp;

export const useOrganization = (CLERK_ON ? clerkUseOrganization : () => ({ isLoaded: true, organization: null, membership: null })) as unknown as typeof clerkUseOrganization;

export const UserButton = (CLERK_ON ? ClerkUserButton : Object.assign(Nothing, { UserProfileLink: Nothing })) as typeof ClerkUserButton;

export const SignIn = (CLERK_ON ? ClerkSignIn : SignInOff) as unknown as typeof ClerkSignIn;

export const SignUp = (CLERK_ON ? ClerkSignUp : SignInOff) as unknown as typeof ClerkSignUp;

export const OrganizationSwitcher = (CLERK_ON ? ClerkOrganizationSwitcher : Nothing) as unknown as typeof ClerkOrganizationSwitcher;

export const RedirectToSignIn = (CLERK_ON ? ClerkRedirectToSignIn : GoToSignIn) as unknown as typeof ClerkRedirectToSignIn;

export const SignInButton = (CLERK_ON ? ClerkSignInButton : SignInButtonOff) as unknown as typeof ClerkSignInButton;

export const SignOutButton = (CLERK_ON ? ClerkSignOutButton : Nothing) as unknown as typeof ClerkSignOutButton;

export const AuthenticateWithRedirectCallback = (CLERK_ON ? ClerkAuthenticateWithRedirectCallback : GoToSignIn) as unknown as typeof ClerkAuthenticateWithRedirectCallback;

// Clerk v7 removed SignedIn/SignedOut wrapper components
// Create compatibility wrappers using useAuth hook
export function SignedIn({ children }: { children?: ReactNode }) {
  const { isSignedIn } = useAuth();
  return isSignedIn ? <>{children}</> : null;
}

export function SignedOut({ children }: { children?: ReactNode }) {
  const { isSignedIn } = useAuth();
  return !isSignedIn ? <>{children}</> : null;
}
