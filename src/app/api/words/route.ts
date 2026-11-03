import { NextResponse, type NextRequest } from 'next/server';
import { getWordCounts, WORD_SOURCES, type WordSource } from '@/lib/word-counts';

/**
 * GET /api/words?from=stories|articles|both&limit=N
 *
 * The site owner's most used words, counted across their own published
 * stories, articles or both (both when `from` is missing), most used first:
 * { from, words: [{ word, count }] }. Public: it's the site's published
 * writing, and theunpartycloud's word cloud reads it. limit is 1-200 (200
 * when missing).
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const from = (params.get('from') ?? 'both') as WordSource;
  if (!WORD_SOURCES.includes(from)) {
    return NextResponse.json({ error: `from must be one of ${WORD_SOURCES.join(', ')}` }, { status: 400 });
  }
  const limit = Math.min(200, Math.max(1, Number(params.get('limit')) || 200));

  const words = await getWordCounts(from, limit);
  return NextResponse.json(
    { from, words },
    { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } }
  );
}
