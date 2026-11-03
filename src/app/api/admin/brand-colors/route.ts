import { NextResponse } from 'next/server';
import { adminGuard } from '@/lib/admin';
import { BRAND_COLOR_SLOTS } from '@/app/constants/organization';
import { CAN_CHANGE_CONFIG, CONFIG_PATH, LOCAL, writeFoundersConfig } from '@/lib/founders-config-write';

// The owner's brand colors (FoundersConfig.json `brandColors`), set from the
// brand color setup in /admin and the setup-identity article. Five slots, each
// "" or a #RRGGBB color; the first is the site's color (BRAND_COLOR). Saving
// one slot sends all five, so "change one color" is the same write.
const HEX = /^#[0-9A-Fa-f]{6}$/;

/** The config text with `brandColors` set, keeping the file's own formatting */
function withBrandColors(text: string, slots: string[]): string {
  const line = `"brandColors": ${JSON.stringify(slots).replace(/,/g, ', ')}`;
  if (/"brandColors":\s*\[[^\]]*\]/.test(text)) return text.replace(/"brandColors":\s*\[[^\]]*\]/, line);
  return text.replace(/\n}\s*$/, `,\n  ${line}\n}\n`);
}

export async function GET() {
  const denied = await adminGuard();
  if (denied) return denied;
  return NextResponse.json({ colors: BRAND_COLOR_SLOTS, canChange: CAN_CHANGE_CONFIG, local: LOCAL });
}

export async function POST(request: Request) {
  const denied = await adminGuard();
  if (denied) return denied;

  const { colors } = await request.json().catch(() => ({}));
  if (!Array.isArray(colors) || colors.length > 5 || !colors.every((c) => c === '' || (typeof c === 'string' && HEX.test(c)))) {
    return NextResponse.json({ error: 'colors must be up to five "" or "#RRGGBB" values' }, { status: 400 });
  }
  const slots = Array.from({ length: 5 }, (_, i) => (colors[i] ?? '').toUpperCase());

  if (!CAN_CHANGE_CONFIG) {
    // The line to paste is the next step, not an error to read
    return NextResponse.json(
      { error: `Set this in ${CONFIG_PATH} and redeploy`, line: withBrandColors('{\n}', slots).match(/"brandColors".*/)?.[0] },
      { status: 409 }
    );
  }

  try {
    const result = await writeFoundersConfig((text) => withBrandColors(text, slots), {
      branch: 'brand-colors',
      title: 'BRAND. Set the site\'s brand colors',
      body: `From /admin: brandColors → ${slots.filter(Boolean).join(', ') || 'none'}. The first is the site's color.`,
    });
    return NextResponse.json({ colors: slots, ...result });
  } catch (error) {
    console.error('Brand colors save failed:', error);
    return NextResponse.json({ error: 'Could not save the brand colors' }, { status: 500 });
  }
}
