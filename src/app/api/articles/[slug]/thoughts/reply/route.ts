import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { auth } from '@/lib/auth-stub.server';
import { llmFor } from '@/lib/llm';
import { checkRateLimit } from '@/lib/rate-limit';
import { getEditorialArticle } from '../../../../../constants/editorial-articles';
import { getPageMDArticle } from '../../../../../utils/mdArticleUtils';
import { SITE_NAME } from '../../../../../constants/organization';

// Replies on the owner's key, per person: a conversation, not a firehose
const OWNER_REPLIES_PER_HOUR = 10;
const MAX_THOUGHT_LENGTH = 1000;
const ARTICLE_EXCERPT = 4000;

/**
 * POST /api/articles/[slug]/thoughts/reply  { body: string }
 *
 * A model's short reply to a thought someone just left on an article (#396),
 * shown under their thought and not saved: { reply, via }. Uses the reader's
 * own key when they sent one (VISITOR_KEY_HEADER), else the owner's, rate
 * limited (src/lib/llm.ts). 501 when there's no model to use, so THOUGHTS.
 * simply shows no reply. Signed in only, like leaving a thought.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getEditorialArticle(slug) ?? getPageMDArticle(slug);
  if (!article?.published) return NextResponse.json({ error: 'Article not found' }, { status: 404 });

  const session = await auth();
  if (!session.userId) return NextResponse.json({ error: 'Sign in to get a reply.' }, { status: 401 });

  let thought = '';
  try {
    const payload = await request.json();
    thought = typeof payload.body === 'string' ? payload.body.trim().slice(0, MAX_THOUGHT_LENGTH) : '';
  } catch {
    // Falls through to the empty check
  }
  if (!thought) return NextResponse.json({ error: 'body is required' }, { status: 400 });

  const llm = llmFor(request);
  if (!llm) return NextResponse.json({ error: 'No model is connected.' }, { status: 501 });

  if (llm.via === 'owner') {
    const limit = checkRateLimit(`thought-reply:1h:user:${session.userId}`, OWNER_REPLIES_PER_HOUR, 3_600_000);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: 'That’s all the replies for this hour. Connect your own key for more.' },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
      );
    }
  }

  const excerpt = article.sections
    .map(section => section.content ?? '')
    .join('\n')
    .replace(/<[^>]+>/g, ' ')
    .slice(0, ARTICLE_EXCERPT);

  try {
    const { text } = await generateText({
      model: llm.model,
      instructions: [
        `You reply to a reader's thought on an article on ${SITE_NAME}.`,
        'Reply in two to four plain sentences: take their idea seriously, add one thing worth thinking about, and ask at most one question back.',
        "Don't speak for the author, don't summarize the article, don't flatter, and don't use lists or headings.",
        `The article is "${article.title}"${article.subtitle ? `: ${article.subtitle}` : ''}. An excerpt follows.`,
        excerpt,
      ].join('\n\n'),
      prompt: thought,
      maxOutputTokens: 300,
    });
    return NextResponse.json({ reply: text.trim(), via: llm.via });
  } catch {
    // Never echo the error: it can carry the request, key included
    return NextResponse.json(
      { error: llm.via === 'visitor' ? 'Your key didn’t work. Check it and try again.' : 'No reply this time.' },
      { status: llm.via === 'visitor' ? 400 : 502 }
    );
  }
}
