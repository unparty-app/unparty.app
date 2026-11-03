import type { Metadata } from 'next';
import { generatePageMetadata } from '@/app/utils/ogMetadata';
import EditorialArticle from '@/app/components/editorial/EditorialArticle';
import { getFounderResume, resumeToArticle } from './resume-data';
import { FOUNDER } from '@/app/constants/organization';

export const metadata: Metadata = generatePageMetadata({
  title: 'founders',
  description: FOUNDER.summary,
  category: 'FOUNDERS',
  coverId: FOUNDER.cover,
  path: '/founders',
});

// The resume's database chapters (MOMENTUM., VIEWS.) refresh hourly
export const revalidate = 3600;

// The founder's resume, read in the article layout (./resume-data.ts). No
// THOUGHTS. thread: the thoughts API serves articles by slug, and this page
// isn't one of them
export default async function Founders() {
  return <EditorialArticle article={resumeToArticle(await getFounderResume())} showThoughts={false} />;
}
