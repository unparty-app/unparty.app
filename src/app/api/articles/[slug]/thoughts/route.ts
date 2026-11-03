import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@/lib/auth-stub.server';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/admin';
import { dbOn, noDatabase } from '@/lib/db-on';
import { getEditorialArticle } from '../../../../constants/editorial-articles';
import { getVideoEntry } from '../../../../constants/video-registry';
import { getPageMDArticle } from '../../../../utils/mdArticleUtils';

const MAX_BODY_LENGTH = 1000;
const MAX_AUTHOR_LENGTH = 80;
const MAX_THOUGHTS_RETURNED = 200;
const WEB_RATE_LIMIT = 5; // thoughts per minute per user

function verifyApiKey(request: NextRequest): boolean {
  const apiKey = process.env.STORY_API_KEY;
  if (!apiKey) return false;
  return request.headers.get('Authorization') === `Bearer ${apiKey}`;
}

// `slug` here is really "any published content slug that owns a THOUGHTS.
// thread" — editorial articles and /watch/[slug] videos both qualify.
// Thought.articleSlug is a loose string column (no FK into either registry),
// and video-registry slugs (bare UNPPP ids, e.g. 'theunpartybuilder') are
// disjoint from editorial article slugs (always '*-story'), so there's no
// collision between the two lookups. A page's own MD article (/sprint's,
// PAGE_MD_ARTICLES) owns one too.
function isPublishedContentSlug(slug: string): boolean {
  const article = getEditorialArticle(slug) ?? getPageMDArticle(slug);
  if (article?.published) return true;

  const video = getVideoEntry(slug);
  return Boolean(video?.published);
}

// Strip control characters except newline; store plain text only
function sanitizeBody(raw: string): string {
  return raw.replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, '').trim();
}

// `canDelete`: whether the person asking may delete it (theirs, or an admin).
// Never the thought's userId itself
function serializeThought(thought: {
  id: string;
  author: string;
  body: string;
  source: string;
  createdAt: Date;
}, canDelete = false) {
  return {
    id: thought.id,
    author: thought.author,
    body: thought.body,
    source: thought.source,
    createdAt: thought.createdAt,
    canDelete,
  };
}

/**
 * GET /api/articles/[slug]/thoughts
 *
 * Public list of visible thoughts for a published editorial article or
 * /watch/[slug] video. Signed in, each says whether you may delete it (your
 * own; every one for an admin).
 * Returns: { thoughts: [{ id, author, body, source, createdAt, canDelete }], count }
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!isPublishedContentSlug(slug)) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    const thoughts = await prisma.thought.findMany({
      where: { articleSlug: slug, status: 'VISIBLE' },
      orderBy: { createdAt: 'asc' },
      take: MAX_THOUGHTS_RETURNED,
      select: { id: true, author: true, body: true, source: true, createdAt: true, userId: true },
    });

    const { userId } = await auth();
    const admin = userId ? await isAdmin() : false;

    return NextResponse.json({
      thoughts: thoughts.map(({ userId: owner, ...thought }) => serializeThought(thought, admin || (!!userId && owner === userId))),
      count: thoughts.length,
    });
  } catch (error) {
    console.error('[Thoughts API] GET error:', error);
    return NextResponse.json({ error: 'Failed to load thoughts' }, { status: 500 });
  }
}

/**
 * POST /api/articles/[slug]/thoughts
 *
 * Create a thought. Dual auth:
 * 1. Bearer STORY_API_KEY (theunpartyunseen) — body: { body, author? }
 * 2. Clerk session (web) — body: { body }; author derived server-side
 *
 * Returns: 201 { thought: { id, author, body, source, createdAt } }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!isPublishedContentSlug(slug)) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    let payload: { body?: unknown; author?: unknown };
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const body = typeof payload.body === 'string' ? sanitizeBody(payload.body) : '';
    if (!body || body.length > MAX_BODY_LENGTH) {
      return NextResponse.json(
        { error: `body is required (1-${MAX_BODY_LENGTH} characters)` },
        { status: 400 }
      );
    }

    let source: 'WEB' | 'UNSEEN';
    let author: string;
    let userId: string | null = null;

    if (verifyApiKey(request)) {
      source = 'UNSEEN';
      const rawAuthor = typeof payload.author === 'string' ? payload.author.trim() : '';
      author = rawAuthor.slice(0, MAX_AUTHOR_LENGTH) || 'unseen';
    } else {
      const session = await auth();
      if (!session.userId) {
        return NextResponse.json(
          { error: 'Unauthorized. party to leave a thought.' },
          { status: 401 }
        );
      }
      source = 'WEB';
      userId = session.userId;

      const user = await currentUser();
      author = (user?.username ?? user?.firstName ?? 'member').slice(0, MAX_AUTHOR_LENGTH);

      const recentCount = await prisma.thought.count({
        where: { userId, createdAt: { gte: new Date(Date.now() - 60_000) } },
      });
      if (recentCount >= WEB_RATE_LIMIT) {
        return NextResponse.json(
          { error: 'Too many thoughts. Take a breath and try again in a minute.' },
          { status: 429 }
        );
      }
    }

    if (!dbOn()) return noDatabase();

    const thought = await prisma.thought.create({
      data: { articleSlug: slug, body, author, userId, source },
      select: { id: true, author: true, body: true, source: true, createdAt: true },
    });

    // Whoever just posted it may delete it
    return NextResponse.json({ thought: serializeThought(thought, source === 'WEB') }, { status: 201 });
  } catch (error) {
    console.error('[Thoughts API] POST error:', error);
    return NextResponse.json({ error: 'Failed to save thought' }, { status: 500 });
  }
}
