import { NextResponse } from 'next/server';
import { adminGuard } from '@/lib/admin';
import { auth } from '@/lib/auth-stub.server';
import { getDoubts, setDoubts } from '@/lib/doubts';
import { cleanDoubts, findDoubts } from '@/lib/doubt-references';

// The signed-in founder's doubts (src/lib/doubts.ts), each with where it
// appears in their writing. Admin only: doubts are private to the founder
export async function GET() {
  const denied = await adminGuard();
  if (denied) return denied;
  const { userId } = await auth();
  const doubts = await getDoubts(userId!);
  return NextResponse.json({ doubts: await findDoubts(doubts) });
}

/**
 * { add: [...] } adds doubts (the Delete Your Doubts exercise), { remove:
 * [...] } removes some, { doubts: [...] } replaces the list (/admin). Answers
 * with the list as GET does
 */
export async function POST(request: Request) {
  const denied = await adminGuard();
  if (denied) return denied;
  const { userId } = await auth();
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Send { add }, { remove } or { doubts }' }, { status: 400 });
  }

  const current = await getDoubts(userId!);
  let next: string[];
  if (Array.isArray(body.doubts)) {
    next = body.doubts;
  } else if (Array.isArray(body.add) || Array.isArray(body.remove)) {
    const removed = new Set(cleanDoubts(Array.isArray(body.remove) ? body.remove : []));
    next = [...current, ...(Array.isArray(body.add) ? body.add : [])].filter((d) => !removed.has(d.trim().toLowerCase()));
  } else {
    return NextResponse.json({ error: 'Send { add }, { remove } or { doubts }' }, { status: 400 });
  }

  try {
    const saved = await setDoubts(userId!, next);
    return NextResponse.json({ doubts: await findDoubts(saved) });
  } catch (error) {
    console.error('Saving doubts failed:', error);
    return NextResponse.json({ error: 'Could not save your doubts' }, { status: 500 });
  }
}
