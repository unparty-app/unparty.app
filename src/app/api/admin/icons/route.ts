import { NextResponse } from 'next/server';
import { adminGuard } from '@/lib/admin';
import { CAN_CHANGE_CONFIG, CONFIG_PATH, LOCAL, writeRepoFile } from '@/lib/founders-config-write';
import { DRAWABLE_ICONS } from '@/app/components/icons/drawable';
import founders from '@/data/FoundersConfig.json';
import drawn from '@/app/components/icons/drawn.json';

// Icons drawn on the icon pad (IconDrawPad in /admin). A drawing is a list of
// pen strokes on the 24×24 grid. A save sends every drawing made since the
// last one, as one change, to one of two places:
// - "site": this site's own icons (FoundersConfig.json `icons`)
// - "default": the app's defaults (src/app/components/icons/drawn.json),
//   drawn by unparty's founder and shipped with every copy
// Either way like brand colors: at once locally, as one self-merging pull
// request when deployed (so drawing 20 icons is one deploy, not 20). An empty
// drawing removes that icon's, and it falls back to the next one.
const DEFAULTS_PATH = 'src/app/components/icons/drawn.json';
const STROKE = /^M[-0-9.,\sMmLlCcQqSsTtHhVvZz]+$/;
const MAX_STROKES = 24;
const MAX_ICONS = 120;

type Drawings = Record<string, string[]>;

/** `current` with each of `changes` applied (an empty drawing removes it), keys in order */
function merged(current: Drawings, changes: Drawings): Drawings {
  const next: Drawings = { ...current };
  for (const [name, strokes] of Object.entries(changes)) {
    if (strokes.length) next[name] = strokes;
    else delete next[name];
  }
  return Object.fromEntries(Object.entries(next).sort(([a], [b]) => a.localeCompare(b)));
}

/** The `"icons": { … }` block of the config text, as its start and end offsets */
function iconsBlock(text: string): { start: number; end: number } | null {
  const key = text.search(/"icons":\s*\{/);
  if (key === -1) return null;
  let depth = 0;
  for (let i = text.indexOf('{', key); i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}' && --depth === 0) return { start: key, end: i + 1 };
  }
  return null;
}

/** The config text with `icons` replaced, keeping the rest of the file's own formatting */
function withIcons(text: string, icons: Drawings): string {
  const line = `"icons": ${JSON.stringify(icons, null, 2).replace(/\n/g, '\n  ')}`;
  const block = iconsBlock(text);
  if (block) return text.slice(0, block.start) + line + text.slice(block.end);
  return text.replace(/\n}\s*$/, `,\n  ${line}\n}\n`);
}

/** The request's drawings, or why they can't be saved */
function parseDrawings(value: unknown): Drawings | string {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return 'drawings must be { "IconName": ["M…"] }';
  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length === 0) return 'nothing to save';
  if (entries.length > MAX_ICONS) return `up to ${MAX_ICONS} icons at once`;
  for (const [name, strokes] of entries) {
    if (!DRAWABLE_ICONS.includes(name)) return `${name} isn't an icon the pad can draw`;
    if (!Array.isArray(strokes) || strokes.length > MAX_STROKES || !strokes.every((d) => typeof d === 'string' && d.length < 4000 && STROKE.test(d.trim()))) {
      return `${name} must be up to ${MAX_STROKES} pen strokes, each starting with M`;
    }
  }
  return value as Drawings;
}

export async function GET() {
  const denied = await adminGuard();
  if (denied) return denied;
  // As built: on a deployed site a save shows here once its pull request deploys
  return NextResponse.json({
    site: (founders as { icons?: Drawings }).icons ?? {},
    defaults: drawn as Drawings,
    canChange: CAN_CHANGE_CONFIG,
    local: LOCAL,
  });
}

export async function POST(request: Request) {
  const denied = await adminGuard();
  if (denied) return denied;

  const body = await request.json().catch(() => ({}));
  const target = body.target ?? 'site';
  if (target !== 'site' && target !== 'default') {
    return NextResponse.json({ error: 'target is "site" or "default"' }, { status: 400 });
  }
  const drawings = parseDrawings(body.drawings);
  if (typeof drawings === 'string') return NextResponse.json({ error: drawings }, { status: 400 });

  const names = Object.keys(drawings);
  const drawnCount = names.filter((name) => drawings[name].length).length;
  const what = drawnCount === names.length ? `${names.length} icon${names.length === 1 ? '' : 's'} drawn by hand` : `${names.length} icon change${names.length === 1 ? '' : 's'}`;

  if (!CAN_CHANGE_CONFIG) {
    // The block to paste is the next step, not an error to read
    return NextResponse.json(
      { error: `Set this in ${target === 'site' ? `"icons" in ${CONFIG_PATH}` : DEFAULTS_PATH} and redeploy`, line: JSON.stringify(drawings) },
      { status: 409 }
    );
  }

  try {
    const result =
      target === 'site'
        ? await writeRepoFile(
            CONFIG_PATH,
            (text) => withIcons(text, merged((JSON.parse(text).icons ?? {}) as Drawings, drawings)),
            { branch: 'icons', title: `BRAND. The site's icons: ${what}`, body: `From the icon pad in /admin: ${names.join(', ')}.` }
          )
        : await writeRepoFile(
            DEFAULTS_PATH,
            (text) => `${JSON.stringify(merged(JSON.parse(text) as Drawings, drawings), null, 2)}\n`,
            { branch: 'icon-defaults', title: `BRAND. The app's default icons: ${what}`, body: `From the icon pad in /admin, saved as the defaults every copy ships with: ${names.join(', ')}.` }
          );
    return NextResponse.json({ ...result, saved: names });
  } catch (error) {
    console.error('Icon save failed:', error);
    return NextResponse.json({ error: 'Could not save the icons' }, { status: 500 });
  }
}
