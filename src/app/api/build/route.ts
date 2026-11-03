import { NextResponse } from 'next/server';
import { buildCard } from '@/lib/builds';
import { isOwnToken } from '@/lib/build-tell';

// GET /api/build?token=…: this copy's card (src/lib/builds.ts), for unparty.app
// to fetch back when the owner tells it about their build (#589). Only with
// the copy's own token, so it answers only a telling the owner started;
// anything else is a 404
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get('token');
  if (!(await isOwnToken(token))) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ card: buildCard() }, { headers: { 'Cache-Control': 'no-store' } });
}
