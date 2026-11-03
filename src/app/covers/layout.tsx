import type { Metadata } from 'next';
import { generatePageMetadata } from '@/app/utils/ogMetadata';
import { SITE_NAME } from '@/app/constants/organization';

// The page is a client component, so its metadata lives here
export const metadata: Metadata = generatePageMetadata({
  title: `covers. | ${SITE_NAME}`,
  description: `Every cover photo on ${SITE_NAME}, with the colors taken from each.`,
  path: '/covers',
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
