import { NextResponse } from 'next/server';
import { adminGuard } from '@/lib/admin';
import { CAN_CHANGE_CONFIG, CONFIG_PATH, writeFoundersConfig } from '@/lib/founders-config-write';
import { cleanSiteIdentity, withSiteIdentity } from '@/lib/site-identity-edit';

// The site's name, tagline and description (FoundersConfig.json `site`), set
// from an imported brand in ImportColorsCssModal (#807). Only what's sent
// changes. A reader's imported brand never comes here: it stays on their own
// palette (ColorSelectionContext, /api/user/brand-colors).
export async function POST(request: Request) {
  const denied = await adminGuard();
  if (denied) return denied;

  const cleaned = cleanSiteIdentity(await request.json().catch(() => null));
  if ('error' in cleaned) return NextResponse.json({ error: cleaned.error }, { status: 400 });
  const { identity } = cleaned;

  if (!CAN_CHANGE_CONFIG) {
    return NextResponse.json({ error: `Set this under "site" in ${CONFIG_PATH} and redeploy`, line: JSON.stringify(identity) }, { status: 409 });
  }

  try {
    const result = await writeFoundersConfig((text) => withSiteIdentity(text, identity), {
      branch: 'site-identity',
      title: 'BRAND. Set who the site says it is from an imported brand',
      body: `From an imported brand: ${Object.entries(identity).map(([field, value]) => `${field} → ${value}`).join(', ')}.`,
    });
    return NextResponse.json({ identity, ...result });
  } catch (error) {
    console.error('Site identity save failed:', error);
    return NextResponse.json({ error: 'Could not save the site identity' }, { status: 500 });
  }
}
