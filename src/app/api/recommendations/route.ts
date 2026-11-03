import { NextResponse, type NextRequest } from 'next/server';
import { generateText, Output } from 'ai';
import { z } from 'zod';
import { llmFor, ownerLlmConfigured } from '@/lib/llm';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { recommendFrom, startingPoints } from '@/lib/path-recommendations';
import { projectStage, type ResolvedProject } from '@/lib/projects';
import { resolveCoverSrc } from '@/app/utils/coverPath';
import type { PathStop } from '@/app/components/resume/types';

/**
 * GET /api/recommendations              → { startingPoints: string[], canMatch }
 * GET /api/recommendations?from=a brand → { from, start, next }
 * POST /api/recommendations { text }     → from someone's own words (below)
 *
 * Where to start, and where the path goes next, from the site owner's own
 * projects (src/lib/path-recommendations.ts): `start` and `next` are path
 * stops, the shape InkPath draws. 404 when no project suits `from`. Public:
 * it's the owner's published projects.
 */
export async function GET(request: NextRequest) {
  const from = request.nextUrl.searchParams.get('from');
  const headers = { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' };
  // canMatch: whether the owner has a model, so free text works without a key of your own
  if (!from) return NextResponse.json({ startingPoints: startingPoints(), canMatch: ownerLlmConfigured() }, { headers });

  const recommendation = recommendFrom(from);
  if (!recommendation) return NextResponse.json({ error: `no project starts from "${from}"` }, { status: 404 });
  return NextResponse.json(
    { from: recommendation.from, start: toStop(recommendation.start), next: recommendation.next.map(toStop) },
    { headers }
  );
}

// Matches on the owner's key, per visitor: enough to find a starting point
const OWNER_MATCHES_PER_HOUR = 6;
const MAX_TEXT_LENGTH = 600;

/**
 * POST /api/recommendations  { text: string }
 *
 * Where to start, from someone's own words: a model picks the starting point
 * that fits best (only ever one of the owner's, by schema) and says why in a
 * sentence, then the path follows as with ?from=. { from, why, start, next, via }.
 * Uses their own key when they sent one, else the owner's, rate limited per
 * visitor (src/lib/llm.ts). 501 with no model: the starting points to pick
 * from still work.
 */
export async function POST(request: NextRequest) {
  const points = startingPoints();
  if (points.length === 0) return NextResponse.json({ error: 'No starting points.' }, { status: 404 });

  let text = '';
  try {
    const payload = await request.json();
    text = typeof payload.text === 'string' ? payload.text.trim().slice(0, MAX_TEXT_LENGTH) : '';
  } catch {
    // Falls through to the empty check
  }
  if (!text) return NextResponse.json({ error: 'text is required' }, { status: 400 });

  const llm = llmFor(request);
  if (!llm) return NextResponse.json({ error: 'No model is connected.' }, { status: 501 });
  if (llm.via === 'owner') {
    const limit = checkRateLimit(`recommend:1h:${getClientIp(request)}`, OWNER_MATCHES_PER_HOUR, 3_600_000);
    if (!limit.allowed) {
      return NextResponse.json({ error: 'Pick a starting point instead, or try again later.' }, { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } });
    }
  }

  let match: { from: string; why: string };
  try {
    const { output } = await generateText({
      model: llm.model,
      instructions: [
        'Someone describes where they are with an idea. Pick the one starting point that fits them best, from the list only.',
        'Then say why in one plain sentence, speaking to them as "you". No flattery.',
      ].join(' '),
      prompt: `Starting points: ${points.join(', ')}\n\nIn their words: ${text}`,
      output: Output.object({
        schema: z.object({ from: z.enum(points as [string, ...string[]]), why: z.string() }),
      }),
      maxOutputTokens: 200,
    });
    match = output;
  } catch {
    // Never echo the error: it can carry the request, key included
    return NextResponse.json(
      { error: llm.via === 'visitor' ? 'Your key didn’t work. Check it and try again.' : 'Pick a starting point instead.' },
      { status: llm.via === 'visitor' ? 400 : 502 }
    );
  }

  const recommendation = recommendFrom(match.from);
  if (!recommendation) return NextResponse.json({ error: 'Pick a starting point instead.' }, { status: 502 });
  return NextResponse.json({
    from: recommendation.from,
    why: match.why,
    start: toStop(recommendation.start),
    next: recommendation.next.map(toStop),
    via: llm.via,
  });
}

function toStop(project: ResolvedProject): PathStop {
  return {
    id: project.id,
    name: project.name,
    stage: projectStage(project),
    ...(project.tagline || project.description ? { tagline: project.tagline || project.description || undefined } : {}),
    ...(project.cover ? { cover: resolveCoverSrc(project.cover) } : {}),
    ...(project.color ? { color: project.color } : {}),
    href: `/${project.id}`,
    leadsTo: project.leadsTo ?? [],
  };
}
