import { NextResponse } from 'next/server';
import StorySchema from '@/utils/StorySchema';

/**
 * Batched story fetch — backs StorySchema's client-side bootstrap, which
 * previously fired one GET per story (~53 individual requests) instead of
 * one. Reuses the same server-side StorySchema.getAllStories() that reads
 * every story off disk in a single pass.
 */
export async function GET() {
  const stories = await StorySchema.getAllStories();
  return NextResponse.json(stories);
}
