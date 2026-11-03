import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { RECEIVES_BUILDS } from '@/lib/builds';
import { fetchCard, fetchableOrigin, storeBuild } from '@/lib/builds-receive';

// /api/builds on unparty.app (#589): POST, a copy's owner telling it they
// built theirs: its card is fetched back and verified, counted with the next
// number, and sent to Slack to approve for /builds. DELETE, with the copy's
// token, takes it off. Only unparty.app receives builds; a copy answers 404

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  if (!RECEIVES_BUILDS) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const limit = checkRateLimit(`builds:${getClientIp(request)}`, 5, 60 * 60 * 1000);
  if (!limit.allowed) return NextResponse.json({ error: 'Too many tries; wait a little' }, { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } });

  const { url, token, email } = (await request.json().catch(() => ({}))) as { url?: unknown; token?: unknown; email?: unknown };
  if (typeof token !== 'string' || token.length < 20 || token.length > 200) return NextResponse.json({ error: 'A build needs its token' }, { status: 400 });
  const mail = typeof email === 'string' && EMAIL.test(email) ? email.slice(0, 200) : undefined;

  const target = await fetchableOrigin(url);
  if ('error' in target) return NextResponse.json({ error: target.error }, { status: 400 });
  const fetched = await fetchCard(target.origin, token);
  if ('error' in fetched) return NextResponse.json({ error: fetched.error }, { status: 422 });

  try {
    const build = await storeBuild(target.origin, token, fetched.card, mail);
    await notifySlack(build.id, build.number, fetched.card, build.status);
    return NextResponse.json({ number: build.number, status: build.status });
  } catch (error) {
    console.error('Storing a build failed:', error);
    return NextResponse.json({ error: 'Could not count the build' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!RECEIVES_BUILDS) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const { url, token } = (await request.json().catch(() => ({}))) as { url?: unknown; token?: unknown };
  let origin: string;
  try {
    origin = new URL(String(url)).origin;
  } catch {
    return NextResponse.json({ error: 'That isn’t an address' }, { status: 400 });
  }
  const removed = await prisma.build.deleteMany({ where: { url: origin, token: typeof token === 'string' ? token : '' } }).catch(() => ({ count: 0 }));
  return removed.count ? NextResponse.json({ removed: true }) : NextResponse.json({ error: 'Not found' }, { status: 404 });
}

// The owner's Slack: a new build, with Approve / Reject when the Slack app's
// buttons are on (SLACK_SIGNING_SECRET, /api/slack/interactions)
async function notifySlack(id: string, number: number, card: { name: string; url: string; tagline: string; projects: { name: string }[] }, status: string) {
  if (!process.env.SLACK_WEBHOOK_URL || status === 'APPROVED') return;
  const blocks = [
    { type: 'header', text: { type: 'plain_text', text: `🧱 build #${number}: ${card.name}` } },
    { type: 'section', text: { type: 'mrkdwn', text: `<${card.url}|${card.url}>\n${card.tagline}${card.projects.length ? `\n*projects:* ${card.projects.map((p) => p.name).join(', ')}` : ''}` } },
    ...(process.env.SLACK_SIGNING_SECRET
      ? [
          {
            type: 'actions',
            elements: [
              { type: 'button', action_id: 'approve_build', text: { type: 'plain_text', text: 'List it' }, style: 'primary', value: id },
              { type: 'button', action_id: 'reject_build', text: { type: 'plain_text', text: 'Don’t list it' }, style: 'danger', value: id },
            ],
          },
        ]
      : []),
  ];
  await fetch(process.env.SLACK_WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: `build #${number}: ${card.name}`, blocks }) }).catch(() => {});
}
