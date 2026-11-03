import { NextResponse } from 'next/server';
import { adminGuard } from '@/lib/admin';
import { isRange, readObservability } from '@/lib/observability';

/**
 * Everything /admin/observability draws for a window (24h, 7d, 30d), in one
 * answer from the analytics drain (src/lib/observability.ts). Google search
 * comes separately (./search), so a slow Google never holds the page.
 *
 * Analytics only. The trace drain has been off since 2026-05-11 and its tables
 * (about 194 GB, nothing writing to them) are coming out (#1360); querying them
 * by time or path scanned them whole and hung this route for minutes (#747)
 */
export async function GET(request: Request) {
  const denied = await adminGuard();
  if (denied) return denied;

  const range = new URL(request.url).searchParams.get('range');
  try {
    const data = await readObservability(isRange(range) ? range : '7d');
    // Reopening the modal within a minute shows what it just drew
    return NextResponse.json(data, { headers: { 'Cache-Control': 'private, max-age=60' } });
  } catch (error) {
    console.error('Observability API error:', error);
    return NextResponse.json({ error: 'Failed to fetch observability data' }, { status: 500 });
  }
}
