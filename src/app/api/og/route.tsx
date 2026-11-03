import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { readFile } from 'fs/promises';
import { join, sep } from 'path';
import { BRAND_COLORS, FOUNDER, SITE_NAME, SITE_TITLE } from '../../constants/organization';
import { BRAND_COLOR } from '../../constants/colors';
import { getAuthorDisplayName } from '../../constants/authors';
import { resolveCoverSrc } from '../../utils/coverPath';
import { RING_PATH, INK_PATH, MARK_PATH } from '../../components/brand-colors/handDrawn';

// The link preview every page shares (ogMetadata.ts builds the URL): the site's
// own look, frozen at the moment the ink lands. Dark like the site, the title
// in VT323 with a hand-drawn underline, the author inside a hand-drawn ring,
// and the page's cover; without one, the owner's brand colors as ink. Every
// color, name and photo comes from FoundersConfig, so a copy's previews are
// its own from the first deploy.
//
// Node runtime, so fonts and pictures are read from the repo, not fetched
// over HTTP from the live site: previews work on any deploy (and in dev)
// before a domain exists. The fonts are OFL (fonts/OFL-*.txt) and ship with
// every copy.
export const runtime = 'nodejs';

const W = 1200;
const H = 630;
const PAD = 72;
const BG = '#10100D'; // the site's dark --background
const FG = '#EDEDED';
const MUTED = 'rgba(237, 237, 237, 0.68)';

const FONT_DIR = join(process.cwd(), 'src/app/api/og/fonts');
const fontsReady = Promise.all([
  readFile(join(FONT_DIR, 'vt323-400.woff')),
  readFile(join(FONT_DIR, 'space-grotesk-400.woff')),
  readFile(join(FONT_DIR, 'google-sans-code-500.woff')),
]);

// Where pictures are read from, written so the build's file tracer can't see
// it: with process.cwd() spelled out, a name known only at request time makes
// it pack all of public/ (videos and all, 400 MB) into the function, over
// Vercel's 250 MB. next.config.ts names the pictures this reads instead
// (outputFileTracingIncludes: covers and the photos at the top of public/)
const PUBLIC_DIR = [process.cwd(), 'public'].join(sep);

const IMAGE_TYPES: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', svg: 'image/svg+xml' };

/** A picture in public/ as a data URI, or null (unknown, missing, or a type Satori can't draw) */
async function publicImage(path: string | null | undefined): Promise<string | null> {
  if (!path) return null;
  const clean = path.replace(/^\/+/, '');
  // Only plain names inside public/: no climbing out of it
  if (!/^[\w./@-]+$/.test(clean) || clean.includes('..')) return null;
  const type = IMAGE_TYPES[clean.split('.').pop()?.toLowerCase() ?? ''];
  if (!type) return null;
  try {
    const data = await readFile(join(PUBLIC_DIR, clean));
    return `data:${type};base64,${data.toString('base64')}`;
  } catch {
    return null;
  }
}

/** Dark ink or light ink on a color, whichever reads (WCAG luminance) */
function inkOn(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return BG;
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(m[1].slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.179 ? BG : FG;
}

// Shortened at the last whole word that fits, so a preview never ends mid-word
function clip(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return `${(cut.includes(' ') ? cut.slice(0, cut.lastIndexOf(' ')) : cut).replace(/[\s,.;:–—-]+$/, '')}…`;
}

// The title fills its space: short titles large, long ones smaller
const titleSize = (title: string, roomy: boolean) =>
  title.length <= 16 ? 120 : title.length <= 28 ? (roomy ? 108 : 92) : title.length <= 44 ? (roomy ? 84 : 74) : 64;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const title = clip(searchParams.get('title') || SITE_NAME, 64);
    const subtitle = searchParams.get('subtitle');
    const authorParam = searchParams.get('author');
    const author = authorParam ? getAuthorDisplayName(authorParam) : FOUNDER.name;
    const category = clip(searchParams.get('category') || SITE_NAME, 24);
    const coverParam = searchParams.get('coverId');
    // The founder's own photo when they wrote it, unless the page names another
    const authorImageParam = searchParams.get('authorImage') || (author === FOUNDER.name ? FOUNDER.image : null);

    const [[vt323, spaceGrotesk, sansCode], cover, photo] = await Promise.all([
      fontsReady,
      publicImage(coverParam ? resolveCoverSrc(coverParam) : null),
      publicImage(authorImageParam),
    ]);

    // `brand` lets a preview try a color on (LinkPreview beside the brand color
    // setup); pages' own previews never pass it, so they wear the site's
    const brandParam = searchParams.get('brand');
    const brand = brandParam && /^#[0-9A-Fa-f]{6}$/.test(brandParam) ? brandParam : BRAND_COLOR;
    const ink = inkOn(brand);
    const inks = [brand, ...BRAND_COLORS.slice(1, 5)];
    const domain = SITE_TITLE;

    return new ImageResponse(
      (
        <div style={{ display: 'flex', width: W, height: H, background: BG, position: 'relative', fontFamily: 'Space Grotesk' }}>
          {/* A wash of the brand from the top left, like the page's own glow */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', background: `radial-gradient(circle at 0% 0%, ${brand}2E 0%, transparent 55%)` }} />

          {/* Words */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: PAD, width: cover ? 700 : W - 380 }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex' }}>
                <div style={{ display: 'flex', background: brand, color: ink, borderRadius: 999, padding: '10px 22px', fontFamily: 'Google Sans Code', fontSize: 22, letterSpacing: 2, textTransform: 'uppercase' }}>
                  {category}
                </div>
              </div>
              <div style={{ display: 'flex', marginTop: 36, color: FG, fontFamily: 'VT323', fontSize: titleSize(title, !cover), lineHeight: 0.92 }}>
                {title}
              </div>
              {/* The pen underlines it */}
              <svg width={280} height={34} viewBox="0 0 64 10" style={{ marginTop: 6 }}>
                <path d={MARK_PATH} fill="none" stroke={brand} strokeWidth={2.2} strokeLinecap="round" />
              </svg>
              {subtitle && (
                <div style={{ display: 'flex', marginTop: 14, color: MUTED, fontSize: cover ? 26 : 30, lineHeight: 1.3, maxWidth: cover ? 600 : 720 }}>
                  {/* One line beside a cover, two without */}
                  {clip(subtitle, cover ? 44 : 110)}
                </div>
              )}
            </div>

            {/* By whom, on which site */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ display: 'flex', position: 'relative', width: 76, height: 76 }}>
                {photo ? (
                  // eslint-disable-next-line @next/next/no-img-element -- ImageResponse (Satori) only renders plain <img>
                  <img src={photo} width={58} height={58} style={{ position: 'absolute', top: 9, left: 9, borderRadius: 999, objectFit: 'cover' }} alt="" />
                ) : (
                  <div style={{ position: 'absolute', top: 9, left: 9, width: 58, height: 58, borderRadius: 999, background: `${brand}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: FG, fontFamily: 'Google Sans Code', fontSize: 22 }}>
                    {FOUNDER.initials}
                  </div>
                )}
                <svg width={76} height={76} viewBox="0 0 64 64" style={{ position: 'absolute', top: 0, left: 0 }}>
                  <path d={RING_PATH} fill="none" stroke={brand} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', color: FG, fontSize: 26 }}>{`by ${author}`}</div>
                <div style={{ display: 'flex', color: MUTED, fontFamily: 'Google Sans Code', fontSize: 18, letterSpacing: 2, textTransform: 'uppercase' }}>{domain}</div>
              </div>
            </div>
          </div>

          {/* The picture: the page's cover on a brand-color backing, or the brand itself as ink */}
          {cover ? (
            <div style={{ display: 'flex', position: 'absolute', right: PAD, top: 95, width: 420, height: 440 }}>
              <div style={{ position: 'absolute', top: 18, left: 18, width: 402, height: 422, borderRadius: 28, background: brand, transform: 'rotate(3deg)', display: 'flex' }} />
              {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse (Satori) only renders plain <img> */}
              <img src={cover} width={402} height={422} style={{ position: 'absolute', top: 0, left: 0, borderRadius: 28, objectFit: 'cover' }} alt="" />
            </div>
          ) : (
            <div style={{ display: 'flex', position: 'absolute', right: PAD - 10, top: 70, width: 360, height: 490 }}>
              {inks.map((color, i) => {
                const size = i === 0 ? 250 : 150;
                const spots = [
                  { top: 40, left: 70 },
                  { top: 250, left: 10 },
                  { top: 300, left: 190 },
                  { top: 0, left: 230 },
                  { top: 190, left: 230 },
                ];
                return (
                  <svg key={i} width={size} height={size} viewBox="0 0 64 64" style={{ position: 'absolute', ...spots[i] }}>
                    <path d={INK_PATH} fill={color} />
                    <path d={RING_PATH} fill="none" stroke={FG} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                );
              })}
            </div>
          )}
        </div>
      ),
      {
        width: W,
        height: H,
        fonts: [
          { name: 'VT323', data: vt323, weight: 400, style: 'normal' },
          { name: 'Space Grotesk', data: spaceGrotesk, weight: 400, style: 'normal' },
          { name: 'Google Sans Code', data: sansCode, weight: 500, style: 'normal' },
        ],
      }
    );
  } catch (error) {
    console.error('Error generating OG image:', error);
    return new Response('Failed to generate OG image', { status: 500 });
  }
}
