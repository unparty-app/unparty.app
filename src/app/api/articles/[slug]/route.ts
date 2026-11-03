import { NextRequest, NextResponse } from 'next/server';
import { getEditorialArticle } from '../../../constants/editorial-articles';
import { validateAndSubmitArticle } from '@/lib/articleWrite';

function verifyApiKey(request: NextRequest): boolean {
  const apiKey = process.env.STORY_API_KEY;
  if (!apiKey) return false;
  return request.headers.get('Authorization') === `Bearer ${apiKey}`;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Get editorial article from structured content
    const article = getEditorialArticle(slug);

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    if (!article.published) {
      return NextResponse.json({ error: 'Article not published' }, { status: 404 });
    }

    return NextResponse.json({
      article,
      type: 'editorial'
    });

  } catch (error) {
    console.error('Error loading article:', error);
    return NextResponse.json({ error: 'Failed to load article' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!verifyApiKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { slug } = await params;
    const body = await request.json();
    const { article, message, localDate } = body as { article?: unknown; message?: string; localDate?: string };

    if (!article || typeof article !== 'object') {
      return NextResponse.json({ error: 'article is required' }, { status: 400 });
    }

    if ((article as { slug?: string }).slug !== slug) {
      return NextResponse.json({ error: 'article.slug must match the URL slug' }, { status: 400 });
    }

    const outcome = await validateAndSubmitArticle(
      article,
      message ?? `article: update ${slug} via unseen`,
      localDate
    );

    if (!outcome.ok) {
      return NextResponse.json({ error: 'Invalid article', detail: outcome.error }, { status: 400 });
    }

    return NextResponse.json(outcome.result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error submitting article edit:', error);
    return NextResponse.json({ error: 'Failed to submit article edit', detail: message }, { status: 500 });
  }
}
