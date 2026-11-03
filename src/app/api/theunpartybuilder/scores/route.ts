import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// TYPES
// ============================================================================

interface UnpppScore {
  id: string;
  full_name: string;
  type: string;
  confidence: number;
  assumption_score: number;
  similarity_score: number | null;
  standards_score: number | null;
  monthly_standards_score: number | null;
  mo_cc_rate: number | null;
  mo_cc_trend: number | null;
  mo_velocity_ratio: number | null;
  mo_peak_day_ratio: number | null;
  mo_n_commits: number;
  commits_per_month: number | null;
  velocity_trend: string | null;
  uses_conventional_commits: boolean | null;
  avg_message_length: number | null;
  detailed_messages_ratio: number | null;
  dominant_commit_type: string | null;
  kw_cli: number;
  kw_api: number;
  kw_ui: number;
  kw_bot: number;
  kw_agent: number;
  kw_test: number;
  ct_feat: number;
  ct_fix: number;
  ct_docs: number;
  ct_chore: number;
  ct_refactor: number;
  ct_test: number;
  last_updated: string;
}

interface ScoresPayload {
  generated_at: string;
  total: number;
  scores: UnpppScore[];
}

interface CachedScores {
  data: ScoresPayload;
  timestamp: number;
}

// ============================================================================
// CACHE
// ============================================================================

let cache: CachedScores | null = null;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

function isCacheValid(): boolean {
  if (!cache) return false;
  return Date.now() - cache.timestamp < CACHE_TTL;
}

// ============================================================================
// LOAD DATA
// ============================================================================

function loadScores(): ScoresPayload | null {
  const filePath = path.join(process.cwd(), 'public', 'data', 'unppp-scores.json');
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as ScoresPayload;
  } catch (err) {
    console.error('Failed to load unppp-scores.json:', err instanceof Error ? err.message : err);
    return null;
  }
}

// ============================================================================
// SORTING
// ============================================================================

type SortKey = 'assumption_score' | 'similarity_score' | 'standards_score' | 'monthly_standards_score' | 'confidence' | 'id' | 'type' | 'commits_per_month';

const VALID_SORT_KEYS: SortKey[] = ['assumption_score', 'similarity_score', 'standards_score', 'monthly_standards_score', 'confidence', 'id', 'type', 'commits_per_month'];

function sortScores(scores: UnpppScore[], sortKey: SortKey, order: 'asc' | 'desc'): UnpppScore[] {
  return [...scores].sort((a, b) => {
    const av = a[sortKey];
    const bv = b[sortKey];
    if (typeof av === 'string' && typeof bv === 'string') {
      return order === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    }
    const an = av as number;
    const bn = bv as number;
    return order === 'asc' ? an - bn : bn - an;
  });
}

// ============================================================================
// API ROUTE
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    if (!isCacheValid() || !cache) {
      const data = loadScores();
      if (!data) {
        return NextResponse.json(
          { error: 'Score data not available. Run scripts/classification_analysis.py to generate it.' },
          { status: 404 }
        );
      }
      cache = { data, timestamp: Date.now() };
    }

    const { searchParams } = request.nextUrl;
    const idParam = searchParams.get('id');
    const typeParam = searchParams.get('type');
    const sortParam = searchParams.get('sort') as SortKey | null;
    const orderParam = searchParams.get('order') as 'asc' | 'desc' | null;

    let scores = [...cache.data.scores];

    // Filter by id (matches id or full_name)
    if (idParam) {
      scores = scores.filter(s => s.id === idParam || s.full_name === idParam);
      if (scores.length === 0) {
        return NextResponse.json({ error: `No score found for id: ${idParam}` }, { status: 404 });
      }
      return NextResponse.json({ score: scores[0], cached: isCacheValid() });
    }

    // Filter by type
    if (typeParam) {
      scores = scores.filter(s => s.type === typeParam);
    }

    // Sort
    const sortKey: SortKey = sortParam && VALID_SORT_KEYS.includes(sortParam) ? sortParam : 'assumption_score';
    const order: 'asc' | 'desc' = orderParam === 'asc' ? 'asc' : 'desc';
    scores = sortScores(scores, sortKey, order);

    return NextResponse.json({
      generated_at: cache.data.generated_at,
      total: scores.length,
      scores,
      cached: isCacheValid(),
      cacheAge: Math.round((Date.now() - cache.timestamp) / 1000),
    });
  } catch (err) {
    console.error('Error in scores API:', err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: 'Internal server error', details: process.env.NODE_ENV === 'development' && err instanceof Error ? err.message : undefined },
      { status: 500 }
    );
  }
}
