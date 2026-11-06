import { NextResponse } from 'next/server';
import { adminGuard } from '@/lib/admin';
import { CAN_CHANGE_CONFIG, CONFIG_PATH, writeFoundersConfig } from '@/lib/founders-config-write';
import { withFounderField } from '@/lib/founder-config-edit';
import type { FounderCta, FounderOffer, FounderOfferLine } from '@/app/constants/organization';
import { DRAWABLE_ICONS } from '@/app/components/icons/drawable';

// What the owner offers and the ask for them (FoundersConfig.json
// founder.offer and founder.hire, /admin → Your offer): public, under their
// bio on /founders. Saving sends both; an empty list or ask removes it.

const MAX_LINES = 6;
const MAX_TITLE = 80;
const MAX_TEXT = 280;
const MAX_LABEL = 40;
// A site path, a web address, or an email link
const HREF = /^(\/(?!\/)|https:\/\/|mailto:)/;

type Clean<T> = { value: T } | { error: string };

function cleanLines(input: unknown, name: string, links: boolean): Clean<FounderOfferLine[]> {
  const icons = new Set(DRAWABLE_ICONS);
  if (input === undefined) return { value: [] };
  if (!Array.isArray(input)) return { error: `${name} must be a list` };
  if (input.length > MAX_LINES) return { error: `${name} can have at most ${MAX_LINES} lines` };
  const lines: FounderOfferLine[] = [];
  for (const raw of input) {
    const { title, text, href, icon } = (raw ?? {}) as Record<string, unknown>;
    if (typeof title !== 'string' || typeof text !== 'string') return { error: `each line in ${name} needs a title and text` };
    const t = title.trim();
    const x = text.trim();
    if (!t && !x) continue; // an empty row left in the form
    if (!t || !x) return { error: `each line in ${name} needs both a title and text` };
    if (t.length > MAX_TITLE || x.length > MAX_TEXT) return { error: `a title can be ${MAX_TITLE} characters and its text ${MAX_TEXT}` };
    const line: FounderOfferLine = { title: t, text: x };
    if (links && typeof href === 'string' && href.trim()) {
      if (!HREF.test(href.trim())) return { error: 'a link starts with /, https:// or mailto:' };
      line.href = href.trim();
    }
    if (typeof icon === 'string' && icon.trim()) {
      if (!icons.has(icon.trim())) return { error: `"${icon.trim()}" isn't one of the hand-drawn icons` };
      line.icon = icon.trim();
    }
    lines.push(line);
  }
  return { value: lines };
}

function cleanHire(input: unknown): Clean<FounderCta | undefined> {
  if (input === undefined || input === null) return { value: undefined };
  const { label, href } = input as Record<string, unknown>;
  const l = typeof label === 'string' ? label.trim() : '';
  const h = typeof href === 'string' ? href.trim() : '';
  if (!l && !h) return { value: undefined };
  if (!l || !h) return { error: 'the ask needs both a label and where it goes' };
  if (l.length > MAX_LABEL) return { error: `the ask's label can be ${MAX_LABEL} characters` };
  if (!HREF.test(h)) return { error: "the ask's link starts with /, https:// or mailto:" };
  return { value: { label: l, href: h } };
}

export async function POST(request: Request) {
  const denied = await adminGuard();
  if (denied) return denied;

  const body = (await request.json().catch(() => null)) as { offer?: Record<string, unknown>; hire?: unknown } | null;
  if (!body) return NextResponse.json({ error: 'Send { offer, hire }' }, { status: 400 });

  const does = cleanLines(body.offer?.does, 'what you do', true);
  if ('error' in does) return NextResponse.json({ error: does.error }, { status: 400 });
  const translates = cleanLines(body.offer?.translates, 'how it translates', true);
  if ('error' in translates) return NextResponse.json({ error: translates.error }, { status: 400 });
  const hire = cleanHire(body.hire);
  if ('error' in hire) return NextResponse.json({ error: hire.error }, { status: 400 });

  const offer: FounderOffer | undefined =
    does.value.length || translates.value.length
      ? { ...(does.value.length ? { does: does.value } : {}), ...(translates.value.length ? { translates: translates.value } : {}) }
      : undefined;

  if (!CAN_CHANGE_CONFIG) {
    return NextResponse.json(
      { error: `Set these under "founder" in ${CONFIG_PATH} and redeploy`, line: JSON.stringify({ offer, hire: hire.value }) },
      { status: 409 }
    );
  }

  try {
    const result = await writeFoundersConfig((text) => withFounderField(withFounderField(text, 'offer', offer), 'hire', hire.value), {
      branch: 'offer',
      title: 'BRAND. Update what the owner offers on /founders',
      body: 'From /admin → Your offer.',
    });
    return NextResponse.json({ offer: offer ?? null, hire: hire.value ?? null, ...result });
  } catch (error) {
    console.error('Saving the offer failed:', error);
    return NextResponse.json({ error: 'Could not save your offer' }, { status: 500 });
  }
}
