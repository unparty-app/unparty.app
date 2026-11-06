import { NextResponse } from 'next/server';
import { findPhotoUploadStep } from '@/lib/photo-steps';

/**
 * GET /api/steps/exists?id=<stepId> - does /steps/<stepId> serve a page?
 * { exists: boolean }. For the proxy (src/lib/known-routes.ts), which
 * sends a missing step down the unmatched path so the 404 renders on the
 * server (#1390). One id at a time, never a list: step pages are public by
 * link, so listing every id would make restricted steps discoverable.
 */
export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get('id') ?? '';
  if (!/^[\w-]{1,64}$/.test(id)) return NextResponse.json({ exists: false });
  try {
    const exists = Boolean(await findPhotoUploadStep(id));
    return NextResponse.json({ exists }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    // Database unreachable: say so, and the proxy leaves the page to it
    return NextResponse.json({ exists: null }, { status: 503 });
  }
}
