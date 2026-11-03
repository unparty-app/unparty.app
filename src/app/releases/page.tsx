import type { Metadata } from 'next';
import EditorialArticle from '../components/editorial/EditorialArticle';
import UnpppPageShell from '../components/UnpppPageShell';
import { FOUNDER, SITE_TITLE } from '../constants/organization';
import { releasesToArticle } from '@/lib/releases-article';
import { generatePageMetadata } from '@/app/utils/ogMetadata';

export const metadata: Metadata = generatePageMetadata({
  title: `Releases: the tools ${FOUNDER.name} has shipped | ${SITE_TITLE}`,
  description: 'Every tool released from this site, free to use: what each one does, its files to download, and the component to try it on. All of it is also one file for AI agents at /releases.json.',
  category: 'RELEASES.',
  path: '/releases',
});

// Every release, one chapter each (src/lib/releases-article.ts). Project
// pages' belts link here; agents read the same thing at /releases.json
export default function ReleasesPage() {
  return (
    <UnpppPageShell>
      <EditorialArticle article={releasesToArticle()} />
    </UnpppPageShell>
  );
}
