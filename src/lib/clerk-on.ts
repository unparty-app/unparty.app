/**
 * Whether this copy has sign-in connected: a real Clerk publishable key, not
 * none and not the placeholder from .env.example. A copy runs without accounts,
 * and it's the same with `npm run dev` and live, so what you see on your own
 * computer is what you get. The auth stubs and the proxy all read this;
 * with it off, everyone is signed out and /admin and /party stay locked.
 *
 * NEXT_PUBLIC_, so it's built into the client bundle: adding the key takes a
 * restart locally and a redeploy on Vercel.
 */
const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';

export const CLERK_ON = /^pk_(test|live)_/.test(key) && !key.includes('your_clerk');
