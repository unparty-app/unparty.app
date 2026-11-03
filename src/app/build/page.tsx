import EditorialArticle from '../components/editorial/EditorialArticle';
import { getFounderResume } from '../founders/resume-data';
import { buildToArticle } from '@/lib/build-story';
import { FOUNDER_WHY } from '../constants/organization';
import BuildLead from './BuildLead';

// The work's database chapters (MOMENTUM., VIEWS.) refresh hourly, as on /founders
export const revalidate = 3600;

// /build (#1650): the builder's why (#589), the stack and components, then the story of the work
// in the article layout (src/lib/build-story.ts). No THOUGHTS. thread: the
// thoughts API serves articles by slug, and this page isn't one of them
export default async function BuildPage() {
  return <EditorialArticle article={buildToArticle(await getFounderResume())} lead={<BuildLead key="lead" whyCoverId={FOUNDER_WHY ? FOUNDER_WHY.replace('story-', 'cover-') : null} />} showThoughts={false} />;
}
