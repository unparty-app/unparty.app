import type { EditorialArticle, EditorialSection } from '@/app/constants/editorial-articles';
import { FOUNDER } from '@/app/constants/organization';
import { markdownToEditorialSections } from '@/app/utils/mdArticleUtils';
import { componentLabel, type ComponentName } from '@/lib/component-portfolio';
import { allReleases, componentOfRelease, fileSize, publicNotes, type Release } from '@/lib/releases';

/**
 * /releases as an article: every tool the owner has released, newest first,
 * one chapter each (its name, version and date, where to try it, its files,
 * and its notes as written), then the site's ask. Each project page's belt
 * links to a release's chapter (releaseHref), and agents read the same thing
 * whole at /releases.json.
 */

const day = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }) : '';
function chapter(release: Release, earlier: Release[]): EditorialSection[] {
  const id = release.prefix;
  const paired = componentOfRelease(release);
  const where = [`**v${release.version}**`, day(release.publishedAt), `from ${release.repo}`];
  if (paired?.href) where.push(`[try it: ${componentLabel(paired.component as ComponentName)} →](${paired.href})`);

  const sections: EditorialSection[] = [
    // A chapter of its own: the name pins while its notes scroll by, and a
    // belt's link (releaseHref) lands on it
    { id: `${id}-name`, type: 'hero', content: release.name, metadata: { size: 'medium', emphasis: true } },
    { id: `${id}-where`, type: 'paragraph', content: where.filter(Boolean).join(' · ') },
  ];
  if (release.files.length) {
    sections.push({
      id: `${id}-files`,
      type: 'paragraph',
      content: `files: ${release.files.map((f) => `[${f.name}](${f.url}) (${fileSize(f.size)})`).join(' · ')}`,
    });
  }
  sections.push(...markdownToEditorialSections(publicNotes(release)).map((s, i) => ({ ...s, id: `${id}-notes-${i}` })));
  if (earlier.length) {
    sections.push({
      id: `${id}-earlier`,
      type: 'paragraph',
      content: `earlier: ${earlier.map((r) => `v${r.version}${r.publishedAt ? ` (${day(r.publishedAt)})` : ''}`).join(', ')}.`,
    });
  }
  return sections;
}

export function releasesToArticle(): EditorialArticle {
  const releases = allReleases();
  const latest = releases.filter((r) => r.latest);

  const sections: EditorialSection[] = [
    { id: 'hero', type: 'hero', content: 'releases.' },
    {
      id: 'what-these-are',
      type: 'paragraph',
      content: latest.length
        ? 'Every tool here started as a problem I ran into while building. The ones with a component, you can try right on its page. The rest are scripts: take the files and run them. For your agent, all of it is one file: [/releases.json](/releases.json).'
        : 'Nothing released yet.',
      metadata: { dropCap: true },
    },
    ...latest.flatMap((release) =>
      chapter(release, releases.filter((r) => r.prefix === release.prefix && !r.latest))
    ),
    { id: 'build-yours', type: 'component', metadata: { componentName: 'BuildYours' } },
  ];

  return {
    slug: 'releases',
    title: 'RELEASES.',
    subtitle: 'the tools I have shipped, free to use.',
    description: `Every tool ${FOUNDER.name} has released: what each does, its files, and where to try it. Also at /releases.json for agents.`,
    category: 'RELEASES.',
    date: (latest[0]?.publishedAt ?? new Date().toISOString()).slice(0, 10),
    published: true,
    author: FOUNDER.name,
    authorPage: '/founders',
    coverColor: 'theme',
    coverStyle: 'tile',
    tags: ['releases', 'tools', 'open source'],
    sections,
  };
}
