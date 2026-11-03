import { NextRequest, NextResponse } from 'next/server';
import { getPublishedEditorialArticles, getEditorialArticle } from '../../constants/editorial-articles';
import { validateAndSubmitArticle } from '@/lib/articleWrite';

function verifyApiKey(request: NextRequest): boolean {
  const apiKey = process.env.STORY_API_KEY;
  if (!apiKey) return false;
  return request.headers.get('Authorization') === `Bearer ${apiKey}`;
}

export async function GET() {
  try {
    const articles = getPublishedEditorialArticles();

    return NextResponse.json({
      articles,
      count: articles.length
    });
  } catch (error) {
    console.error('Error loading articles:', error);
    return NextResponse.json({
      error: 'Failed to load articles',
      articles: [],
      count: 0
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!verifyApiKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { article, message, localDate } = body as { article?: unknown; message?: string; localDate?: string };

    if (!article || typeof article !== 'object') {
      return NextResponse.json({ error: 'article is required' }, { status: 400 });
    }

    const slug = (article as { slug?: string }).slug;
    if (!slug) {
      return NextResponse.json({ error: 'article.slug is required' }, { status: 400 });
    }

    if (getEditorialArticle(slug)) {
      return NextResponse.json({ error: `Slug "${slug}" already exists` }, { status: 409 });
    }

    const outcome = await validateAndSubmitArticle(
      article,
      message ?? `article: create ${slug} via unseen`,
      localDate
    );

    if (!outcome.ok) {
      return NextResponse.json({ error: 'Invalid article', detail: outcome.error }, { status: 400 });
    }

    return NextResponse.json(outcome.result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error submitting new article:', error);
    return NextResponse.json({ error: 'Failed to submit new article', detail: message }, { status: 500 });
  }
}
