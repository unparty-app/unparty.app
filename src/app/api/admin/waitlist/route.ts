import { NextResponse } from 'next/server';
import { adminGuard } from '@/lib/admin';
import { WAITLIST_ON } from '@/app/constants/organization';
import { CAN_CHANGE_CONFIG, CONFIG_PATH, LOCAL, writeFoundersConfig } from '@/lib/founders-config-write';

// The waitlist switch on /admin. It's a business decision, so it lives in
// src/data/FoundersConfig.json (`waitlist`), and flipping it changes that file
// (src/lib/founders-config-write.ts: at once locally, after a deploy otherwise)

/** The config text with `waitlist` set, keeping the file's own formatting */
function withWaitlist(text: string, on: boolean): string {
  if (/"waitlist":\s*(true|false)/.test(text)) return text.replace(/"waitlist":\s*(true|false)/, `"waitlist": ${on}`);
  return text.replace(/\n}\s*$/, `,\n  "waitlist": ${on}\n}\n`);
}

export async function GET() {
  const denied = await adminGuard();
  if (denied) return denied;
  return NextResponse.json({ on: WAITLIST_ON, canChange: CAN_CHANGE_CONFIG, local: LOCAL });
}

export async function POST(request: Request) {
  const denied = await adminGuard();
  if (denied) return denied;

  const { on } = await request.json().catch(() => ({}));
  if (typeof on !== 'boolean') {
    return NextResponse.json({ error: 'on must be true or false' }, { status: 400 });
  }

  if (!CAN_CHANGE_CONFIG) {
    return NextResponse.json(
      { error: `Set "waitlist": ${on} in ${CONFIG_PATH} and redeploy (connect your GitHub App to change it from here)` },
      { status: 409 }
    );
  }

  try {
    const result = await writeFoundersConfig((text) => withWaitlist(text, on), {
      branch: `waitlist-${on ? 'on' : 'off'}`,
      title: `SETUP. Turn the waitlist ${on ? 'on' : 'off'}`,
      body: on
        ? 'From /admin: new sign-ups wait for approval before /party.'
        : 'From /admin: anyone signed in can open /party; worksheets no longer open a review.',
    });
    return NextResponse.json({ on, ...result });
  } catch (error) {
    console.error('Waitlist switch failed:', error);
    return NextResponse.json({ error: 'Could not change the waitlist' }, { status: 500 });
  }
}
