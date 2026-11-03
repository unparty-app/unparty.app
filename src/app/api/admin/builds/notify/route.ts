import { NextResponse } from 'next/server';
import { adminGuard } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import { RECEIVES_BUILDS, type BuildCard } from '@/lib/builds';

// POST /api/admin/builds/notify on unparty.app (#589): a release notice to
// every counted build that left an email. Updates to a copy are manual
// (#1096), so knowing one exists is the hard part. Through Loops, with the
// template from .env (LOOPS_RELEASE_NOTICE_ID: name, version, notes, link);
// without it nothing is sent

export async function POST(request: Request) {
  const denied = await adminGuard();
  if (denied) return denied;
  if (!RECEIVES_BUILDS) return NextResponse.json({ error: 'Only unparty.app sends release notices' }, { status: 400 });
  const transactionalId = process.env.LOOPS_RELEASE_NOTICE_ID;
  if (!process.env.LOOPS_API_KEY || !transactionalId) {
    return NextResponse.json({ error: 'Set LOOPS_API_KEY and LOOPS_RELEASE_NOTICE_ID to send release notices' }, { status: 409 });
  }

  const { version, notes, link } = (await request.json().catch(() => ({}))) as { version?: unknown; notes?: unknown; link?: unknown };
  if (typeof version !== 'string' || !version.trim()) return NextResponse.json({ error: 'Which version?' }, { status: 400 });
  const href = typeof link === 'string' && /^https:\/\//.test(link) ? link : '';

  const builds = await prisma.build.findMany({ where: { email: { not: null }, status: { not: 'REJECTED' } }, select: { email: true, card: true } });
  let sent = 0;
  for (const build of builds) {
    const res = await fetch('https://app.loops.so/api/v1/transactional', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.LOOPS_API_KEY}` },
      body: JSON.stringify({
        transactionalId,
        email: build.email,
        dataVariables: { name: (build.card as unknown as BuildCard).name, version: version.trim(), notes: typeof notes === 'string' ? notes.slice(0, 2000) : '', link: href },
      }),
    }).catch(() => null);
    if (res?.ok) sent++;
    else console.error('Release notice failed for a build:', res?.status);
  }
  return NextResponse.json({ sent, of: builds.length });
}
