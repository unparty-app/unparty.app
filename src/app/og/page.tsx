import { EDITORIAL_ARTICLES } from '../constants/editorial-articles/registry';
import { FOUNDER, SITE_NAME, SITE_TAGLINE } from '../constants/organization';
import { generatePageMetadata } from '../utils/ogMetadata';
import LinkPreview, { type LinkPreviewPreset } from '../components/link-preview/LinkPreview';

export const metadata = generatePageMetadata({
  title: 'LINKS.',
  description: 'What people see when a link to this site is shared: the preview card in Messages, X and Slack, drawn from the site\'s own colors, words and covers.',
  category: 'TOOL',
  path: '/og',
});

// The site's home first, then its newest published articles
const PRESETS: LinkPreviewPreset[] = [
  { label: 'your home page', title: SITE_NAME, subtitle: SITE_TAGLINE, cover: FOUNDER.cover },
  ...EDITORIAL_ARTICLES.filter((a) => a.published)
    .sort((a, b) => (b.updated ?? b.date).localeCompare(a.updated ?? a.date))
    .slice(0, 5)
    .map((a) => ({ label: a.title.toLowerCase(), title: a.title, subtitle: a.subtitle, category: a.category, cover: a.cover ?? null })),
];

// /og: the link preview every page shares (/api/og), shown where it lands.
// Built from FoundersConfig (brand colors, name, founder photo) and each page's
// own title and cover, so an owner checks their previews here, not by posting
// a link and hoping.
export default function OGPreviewPage() {
  return (
    <div className="px-4 py-16 sm:px-6 lg:px-12">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
        <header className="flex flex-col gap-3">
          <h1 className="font-vt323 text-6xl text-[var(--foreground)]">your links, shared.</h1>
          <p className="max-w-2xl font-space-grotesk text-base text-[var(--text-muted)]">
            Every page makes its own preview card from your brand colors, your words and your covers. This is the
            same card, where people will see it.
          </p>
        </header>
        <LinkPreview presets={PRESETS} />
      </div>
    </div>
  );
}
