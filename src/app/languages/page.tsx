import type { Metadata } from 'next';
import { generatePageMetadata } from '@/app/utils/ogMetadata';
import { SITE_TITLE } from '@/app/constants/organization';
import LanguagesPage from './LanguagesPage';

export const metadata: Metadata = generatePageMetadata({
  title: 'languages',
  description:
    `Every language, commit, and repository building ${SITE_TITLE} — the full technical stack, live effort metrics, and AI adoption, measured from the git log.`,
  category: 'DATA',
  path: '/languages',
});

export default function Languages() {
  return <LanguagesPage />;
}
