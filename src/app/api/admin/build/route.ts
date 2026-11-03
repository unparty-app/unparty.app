import { NextResponse } from 'next/server';
import { adminGuard } from '@/lib/admin';
import { buildCard, RECEIVES_BUILDS } from '@/lib/builds';
import { getTold, takeOff, tellUnparty } from '@/lib/build-tell';

// /api/admin/build: tell unparty you built yours (#589), from /admin.
// GET the card as unparty.app will see it, and whether it's been told;
// POST tells it (an email only if the owner typed one); DELETE takes it off

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET() {
  const denied = await adminGuard();
  if (denied) return denied;
  const told = await getTold();
  return NextResponse.json({ card: buildCard(), told: told ? { number: told.number, status: told.status, sentAt: told.sentAt } : null, receives: RECEIVES_BUILDS });
}

export async function POST(request: Request) {
  const denied = await adminGuard();
  if (denied) return denied;
  if (RECEIVES_BUILDS) return NextResponse.json({ error: 'This is unparty.app: it receives builds' }, { status: 400 });
  const { email } = (await request.json().catch(() => ({}))) as { email?: unknown };
  if (email !== undefined && email !== '' && (typeof email !== 'string' || !EMAIL.test(email))) {
    return NextResponse.json({ error: 'That email doesn’t look right' }, { status: 400 });
  }
  try {
    const told = await tellUnparty(typeof email === 'string' && email ? email : undefined);
    return NextResponse.json({ told: { number: told.number, status: told.status, sentAt: told.sentAt } });
  } catch (error) {
    console.error('Telling unparty failed:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not reach unparty.app' }, { status: 502 });
  }
}

export async function DELETE() {
  const denied = await adminGuard();
  if (denied) return denied;
  try {
    await takeOff();
    return NextResponse.json({ told: null });
  } catch (error) {
    console.error('Taking the build off failed:', error);
    return NextResponse.json({ error: 'Could not reach unparty.app' }, { status: 502 });
  }
}
