import { NextResponse } from 'next/server';
import { adminGuard } from '@/lib/admin';
import { ICON_DEFAULTS } from '@/app/constants/organization';
import { DRAWABLE_ICONS } from '@/app/components/icons/drawable';
import { CAN_CHANGE_CONFIG, CONFIG_PATH, LOCAL, writeFoundersConfig } from '@/lib/founders-config-write';

// The owner's default icons by role (FoundersConfig.json `iconDefaults`),
// picked in /admin (pick your defaults, #589): the poem's walker, the dock's
// category. Each is one of the hand-drawn icons the pad can redraw, so a
// default the owner draws over is still theirs. Saving one role sends both

const ROLES = ['poem', 'category'] as const;

/** The config text with `iconDefaults` set, keeping the file's own formatting */
function withIconDefaults(text: string, defaults: Record<string, string>): string {
  const line = `"iconDefaults": ${JSON.stringify(defaults).replace(/,/g, ', ').replace(/:/g, ': ')}`;
  if (/"iconDefaults":\s*{[^}]*}/.test(text)) return text.replace(/"iconDefaults":\s*{[^}]*}/, line);
  return text.replace(/\n}\s*$/, `,\n  ${line}\n}\n`);
}

export async function GET() {
  const denied = await adminGuard();
  if (denied) return denied;
  return NextResponse.json({ defaults: ICON_DEFAULTS, canChange: CAN_CHANGE_CONFIG, local: LOCAL });
}

export async function POST(request: Request) {
  const denied = await adminGuard();
  if (denied) return denied;

  const { defaults } = (await request.json().catch(() => ({}))) as { defaults?: Record<string, unknown> };
  const picked: Record<string, string> = {};
  for (const role of ROLES) {
    const name = defaults?.[role];
    if (name === undefined || name === '') continue;
    if (typeof name !== 'string' || !DRAWABLE_ICONS.includes(name)) {
      return NextResponse.json({ error: `${role} must be one of the hand-drawn icons` }, { status: 400 });
    }
    picked[role] = name;
  }

  if (!CAN_CHANGE_CONFIG) {
    return NextResponse.json({ error: `Set this in ${CONFIG_PATH} and redeploy`, line: withIconDefaults('{\n}', picked).match(/"iconDefaults".*/)?.[0] }, { status: 409 });
  }

  try {
    const result = await writeFoundersConfig((text) => withIconDefaults(text, picked), {
      branch: 'icon-defaults',
      title: 'BRAND. Pick the site\'s default icons',
      body: `From /admin: iconDefaults → ${Object.entries(picked).map(([r, n]) => `${r}: ${n}`).join(', ') || 'none'}.`,
    });
    return NextResponse.json({ defaults: picked, ...result });
  } catch (error) {
    console.error('Icon defaults save failed:', error);
    return NextResponse.json({ error: 'Could not save the default icons' }, { status: 500 });
  }
}
