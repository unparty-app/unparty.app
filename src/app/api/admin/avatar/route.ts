import { NextResponse } from 'next/server';
import { adminGuard } from '@/lib/admin';
import { CAN_CHANGE_CONFIG, CONFIG_PATH, writeFileWithConfig } from '@/lib/founders-config-write';
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_LABEL } from '@/lib/upload-limits';

// The owner's avatar (/admin → Your avatar): the picture beside every byline
// that doesn't name another author (authorImageOf), and on /founders. The
// browser sends it already square and sized, as a PNG (YourAvatar). It's
// saved as a new file in public/ and FoundersConfig `founder.image` points at
// it; the old file stays, since other pages may still name it.

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

// The founder's "image" value, read whole; the rest of the file keeps its formatting
const FOUNDER_IMAGE = /("founder"\s*:\s*\{[^{}]*?"image"\s*:\s*)"(?:[^"\\]|\\.)*"/;
const FOUNDER_OPEN = /("founder"\s*:\s*\{)/;

/** The config text with founder.image set to `file` */
function withFounderImage(text: string, file: string): string {
  const value = JSON.stringify(file);
  const next = FOUNDER_IMAGE.test(text)
    ? text.replace(FOUNDER_IMAGE, (_, head: string) => `${head}${value}`)
    : text.replace(FOUNDER_OPEN, (_, open: string) => `${open}\n    "image": ${value},`);
  const parsed = JSON.parse(next) as { founder?: { image?: string } };
  // A bad edit stops here, before it reaches the file
  if (parsed.founder?.image !== file) throw new Error('founder.image did not change');
  return next;
}

export async function POST(request: Request) {
  const denied = await adminGuard();
  if (denied) return denied;

  const form = await request.formData().catch(() => null);
  const upload = form?.get('avatar');
  if (!(upload instanceof File)) return NextResponse.json({ error: 'Send the picture as "avatar"' }, { status: 400 });
  if (upload.size > MAX_UPLOAD_BYTES) return NextResponse.json({ error: `The picture can be at most ${MAX_UPLOAD_LABEL}` }, { status: 413 });

  const data = Buffer.from(await upload.arrayBuffer());
  if (!data.subarray(0, 8).equals(PNG)) return NextResponse.json({ error: 'The picture must be a PNG' }, { status: 400 });

  const stamp = new Date().toISOString().replace(/\D/g, '').slice(0, 14);
  const file = `avatar-${stamp}.png`;

  if (!CAN_CHANGE_CONFIG) {
    return NextResponse.json(
      { error: `Add the picture to public/ and set "image" under "founder" in ${CONFIG_PATH}, then redeploy`, line: `"image": "${file}"` },
      { status: 409 }
    );
  }

  try {
    const result = await writeFileWithConfig({ path: `public/${file}`, data }, (text) => withFounderImage(text, file), {
      branch: 'avatar',
      title: 'BRAND. A new avatar for the site owner',
      body: `From /admin → Your avatar: public/${file}, the picture beside every byline that doesn't name another author.`,
    });
    return NextResponse.json({ image: `/${file}`, ...result });
  } catch (error) {
    console.error('Saving the avatar failed:', error);
    return NextResponse.json({ error: 'Could not save your avatar' }, { status: 500 });
  }
}
