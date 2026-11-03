import type { Metadata } from 'next';
import { generatePageMetadata } from '@/app/utils/ogMetadata';
import { SITE_NAME } from '@/app/constants/organization';
import UnpppComponents from './UnpppComponents';

export const metadata: Metadata = generatePageMetadata({
  title: `components. | ${SITE_NAME}`,
  description: `The components ${SITE_NAME} is built from, each running live.`,
  category: 'BUILD',
  path: '/unppp',
});

export default function UnpppPage() {
  return <UnpppComponents />;
}
