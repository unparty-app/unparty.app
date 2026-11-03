import 'server-only';
import { clerkClient } from '@/lib/auth-stub.server';
import { cleanDoubts } from '@/lib/doubt-references';

/**
 * The founder's doubts: words and phrases they flag in their own writing
 * ("too slow", "not technical"), from the Delete Your Doubts exercise or
 * /admin. They're private: they live in the founder's Clerk privateMetadata,
 * which Clerk never sends to a browser, not in FoundersConfig (public: it
 * ships in every page's JavaScript and in the snapshot). Where each one
 * surfaces in the writing: src/lib/doubt-references.ts
 */

export async function getDoubts(userId: string): Promise<string[]> {
  const user = await (await clerkClient()).users.getUser(userId);
  const stored = (user.privateMetadata as { doubts?: unknown }).doubts;
  return Array.isArray(stored) ? cleanDoubts(stored) : [];
}

export async function setDoubts(userId: string, doubts: string[]): Promise<string[]> {
  const clean = cleanDoubts(doubts);
  await (await clerkClient()).users.updateUserMetadata(userId, { privateMetadata: { doubts: clean } });
  return clean;
}

