/**
 * Authentication - Server-Side
 *
 * Clerk's server functions, or, with no sign-in connected (src/lib/clerk-on.ts),
 * the same functions answering "signed out". Import this file from API routes,
 * Server Components, and Server Actions. Nobody can be an admin without Clerk:
 * adminGuard() and checkRole() both see no user and refuse.
 */

import { auth as clerkAuth, currentUser as clerkCurrentUser, clerkClient as clerkClerkClient } from '@clerk/nextjs/server';
import { CLERK_ON } from './clerk-on';

const signedOut = async () => ({ userId: null, orgId: null, sessionClaims: null, sessionId: null, getToken: async () => null });

export const auth = (CLERK_ON ? clerkAuth : signedOut) as typeof clerkAuth;

export const currentUser = (CLERK_ON ? clerkCurrentUser : async () => null) as typeof clerkCurrentUser;

// Only reached by things that need a user or an admin. Thrown rather than faked,
// so nothing can read an empty answer as "no such user" and carry on
const noClient = async () => {
  throw new Error('Sign-in is not connected: no Clerk keys in this copy');
};

export const clerkClient = (CLERK_ON ? clerkClerkClient : noClient) as typeof clerkClerkClient;
