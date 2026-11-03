import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import EditorialArticle from '../components/editorial/EditorialArticle';
import { generatePageMetadata } from '../utils/ogMetadata';
import { prisma } from '@/lib/prisma';
import { RECEIVES_BUILDS, type BuildCard } from '@/lib/builds';
import { cardsRow, chapter, component, line, paragraph, plural } from '../founders/resume-data';
import { FOUNDER_CTA, SITE_NAME } from '../constants/organization';
import type { EditorialArticle as Article, EditorialSection } from '../constants/editorial-articles/types';

export const metadata: Metadata = generatePageMetadata({
  title: 'builds',
  description: `Sites built from ${SITE_NAME}, by the people who own them: each one told us itself.`,
  category: 'BUILDS',
  path: '/builds',
});

// New builds and approvals refresh it (approving in Slack revalidates too)
export const revalidate = 3600;

// The builds unparty.app has been told about (#589): how many, then the
// listed ones, each a card in its builder's own brand colors, linking to
// their site. Without a database (a build without secrets) there are none
async function listed(): Promise<{ count: number; builds: Array<{ number: number; card: BuildCard }> }> {
  try {
    const [count, builds] = await Promise.all([
      prisma.build.count({ where: { status: { not: 'REJECTED' } } }),
      prisma.build.findMany({ where: { status: 'APPROVED' }, orderBy: { number: 'asc' }, select: { number: true, card: true } }),
    ]);
    return { count, builds: builds.map((b) => ({ number: b.number, card: b.card as unknown as BuildCard })) };
  } catch {
    return { count: 0, builds: [] };
  }
}

export default async function BuildsPage() {
  // Only unparty.app is told; a copy has no builds page
  if (!RECEIVES_BUILDS) notFound();
  const { count, builds } = await listed();
  const sections: EditorialSection[] = [
    chapter('builds', 'BUILDS.', 'Hammer'),
    line('builds-line', count ? `${plural(count, 'build', 'builds')}.` : 'the first build is yours to make.'),
    paragraph('builds-why', 'each one is a site its owner built and owns, and chose to tell us about. nothing here counts itself.'),
    ...(builds.length
      ? [
          cardsRow(
            'builds-row',
            builds.map(({ number, card }) => ({ href: card.url, cover: card.cover, color: card.colors[0], title: card.name, subtitle: `build #${number}. ${card.tagline}` }))
          ),
        ]
      : []),
    ...(FOUNDER_CTA ? [component('builds-ask', 'BuildYours', { placement: 'builds' })] : []),
  ];
  const article: Article = {
    slug: 'builds',
    title: 'builds.',
    subtitle: `sites built from ${SITE_NAME}, owned by the people who built them.`,
    description: `Sites built from ${SITE_NAME}, by the people who own them.`,
    category: 'BUILDS.',
    date: new Date().toISOString().slice(0, 10),
    published: true,
    coverColor: 'theme',
    author: SITE_NAME,
    tags: [],
    sections,
  };
  return <EditorialArticle article={article} showThoughts={false} />;
}
