import type { Metadata } from 'next';
import { generatePageMetadata } from '@/app/utils/ogMetadata';
import { SITE_TITLE } from '@/app/constants/organization';

export const metadata: Metadata = generatePageMetadata({
  title: 'Connect',
  description: `a cold start is the first step to connect with ${SITE_TITLE}`,
  coverId: 'cover-020',
});

export default function ConnectLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
