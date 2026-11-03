import type { Metadata } from 'next';
import { generatePageMetadata } from '@/app/utils/ogMetadata';
import { SITE_NAME } from '@/app/constants/organization';

// The page is a client component, so its metadata lives here
export const metadata: Metadata = generatePageMetadata({
  title: `books. | ${SITE_NAME}`,
  description: `The books on the shelf here, and how to claim one.`,
  path: '/books',
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
