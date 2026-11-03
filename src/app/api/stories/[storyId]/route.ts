import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { commitStoryFile, createArticleBranch, openArticlePR } from '@/lib/github';
import { saveDate, skipsStamp, stampForSave } from '@/lib/stamp-on-save';

function verifyApiKey(_request: NextRequest): boolean {
  const apiKey = process.env.STORY_API_KEY;
  if (!apiKey) return false;
  return _request.headers.get('Authorization') === `Bearer ${apiKey}`;
}

export async function PUT(
  _request: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  if (!verifyApiKey(_request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { storyId } = await params;

    if (!storyId.match(/^story-\d+$/)) {
      return NextResponse.json({ error: 'Invalid story ID format' }, { status: 400 });
    }

    const body = await _request.json();
    const { content, message, localDate } = body as { content?: string; message?: string; localDate?: string };

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'content is required' }, { status: 400 });
    }

    // Dated here, since a save from unseen never runs the pre-commit hook,
    // then sent through a PR that auto-merges once checks pass, like article
    // saves, instead of straight to main (#1030)
    const commitMessage = message ?? `story: update ${storyId} via unseen`;
    const dated = skipsStamp(commitMessage)
      ? content
      : await stampForSave(`public/covers/stories/${storyId}.md`, content, saveDate(localDate));

    const branch = `unseen/story-${storyId}-${Date.now()}`;
    await createArticleBranch(branch);
    await commitStoryFile(storyId, dated, commitMessage, branch);
    const { prUrl, prNumber, autoMergeEnabled } = await openArticlePR(
      branch,
      commitMessage,
      `Story edit submitted from unseen.\n\nStory: \`${storyId}\``
    );

    return NextResponse.json({ ok: true, storyId, prUrl, prNumber, branch, autoMergeEnabled });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error committing story file:', error);
    return NextResponse.json({ error: 'Failed to commit story', detail: message }, { status: 500 });
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  try {
    const { storyId } = await params;
    
    // Validate storyId format (prevent directory traversal)
    if (!storyId.match(/^story-\d+$/)) {
      return NextResponse.json(
        { error: 'Invalid story ID format' },
        { status: 400 }
      );
    }

    const filePath = path.join(
      process.cwd(),
      'public',
      'covers',
      'stories',
      `${storyId}.md`
    );

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      );
    }

    // Read and return the markdown content
    const content = fs.readFileSync(filePath, 'utf-8');
    
    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error('Error reading story file:', error);
    return NextResponse.json(
      { error: 'Failed to read story file' },
      { status: 500 }
    );
  }
}
