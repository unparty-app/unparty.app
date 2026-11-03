import { NextResponse } from 'next/server';
import { adminGuard } from '@/lib/admin';
import { WORD_TYPES } from '@/app/constants/organization';
import { isBuildType, TAGGABLE_WORD } from '@/lib/word-types';
import { CAN_CHANGE_CONFIG, CONFIG_PATH, LOCAL, writeFoundersConfig } from '@/lib/founders-config-write';

// The owner's word tags (FoundersConfig.json `wordTypes`, #389): each of the
// words their site keeps using, tagged in /admin → Your words with the kind
// of build it points to. The worksheet classifies picked words by them.
// Saving sends every tag, so untagging a word is leaving it out

const MAX_TAGS = 200;

/** The config text with `wordTypes` set, keeping the rest of the file's formatting */
function withWordTypes(text: string, tags: Record<string, string>): string {
  const sorted = Object.fromEntries(Object.entries(tags).sort(([a], [b]) => a.localeCompare(b)));
  const line = `"wordTypes": ${JSON.stringify(sorted).replace(/,/g, ', ').replace(/:/g, ': ')}`;
  if (/"wordTypes":\s*{[^}]*}/.test(text)) return text.replace(/"wordTypes":\s*{[^}]*}/, line);
  return text.replace(/\n}\s*$/, `,\n  ${line}\n}\n`);
}

export async function GET() {
  const denied = await adminGuard();
  if (denied) return denied;
  return NextResponse.json({ wordTypes: WORD_TYPES, canChange: CAN_CHANGE_CONFIG, local: LOCAL });
}

export async function POST(request: Request) {
  const denied = await adminGuard();
  if (denied) return denied;

  const { wordTypes } = (await request.json().catch(() => ({}))) as { wordTypes?: Record<string, unknown> };
  if (!wordTypes || typeof wordTypes !== 'object') {
    return NextResponse.json({ error: 'wordTypes must be an object of word → kind of build' }, { status: 400 });
  }
  const tags: Record<string, string> = {};
  for (const [raw, type] of Object.entries(wordTypes)) {
    const word = raw.trim().toLowerCase();
    if (!TAGGABLE_WORD.test(word)) return NextResponse.json({ error: `"${raw}" isn't a word that can be tagged` }, { status: 400 });
    if (!isBuildType(type)) return NextResponse.json({ error: `${word} must be tagged with one of the kinds of build` }, { status: 400 });
    tags[word] = type;
  }
  if (Object.keys(tags).length > MAX_TAGS) {
    return NextResponse.json({ error: `Tag at most ${MAX_TAGS} words` }, { status: 400 });
  }

  if (!CAN_CHANGE_CONFIG) {
    return NextResponse.json({ error: `Set this in ${CONFIG_PATH} and redeploy`, line: withWordTypes('{\n}', tags).match(/"wordTypes".*/)?.[0] }, { status: 409 });
  }

  try {
    const result = await writeFoundersConfig((text) => withWordTypes(text, tags), {
      branch: 'word-types',
      title: 'BRAND. Tag the site\'s words with the kind of build they point to',
      body: `From /admin → Your words: ${Object.keys(tags).length} words tagged.`,
    });
    return NextResponse.json({ wordTypes: tags, ...result });
  } catch (error) {
    console.error('Word tags save failed:', error);
    return NextResponse.json({ error: 'Could not save the word tags' }, { status: 500 });
  }
}
