import { NextRequest, NextResponse } from 'next/server';
import StorySchema from '@/utils/StorySchema';

function verifyApiKey(request: NextRequest): boolean {
  const apiKey = process.env.STORY_API_KEY;
  if (!apiKey) return false;
  return request.headers.get('Authorization') === `Bearer ${apiKey}`;
}

export async function GET(request: NextRequest) {
  if (!verifyApiKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const stories = await StorySchema.getAllStories();

  const response = stories
    .map((story) => {
      const coverId = story.id.replace('story-', 'cover-');
      return {
        storyId: story.id,
        coverId,
        title: story.metadata.title,
        subtitle: story.metadata.subtitle ?? null,
        author: story.metadata.author,
        date: story.metadata.date,
        published: story.metadata.published,
        coverUrl: `/covers/${coverId}.png`,
      };
    })
    .sort((a, b) => a.storyId.localeCompare(b.storyId));

  return NextResponse.json(response);
}
