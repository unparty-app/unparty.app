import type { Metadata } from 'next';
import { generatePageMetadata } from '@/app/utils/ogMetadata';

export const metadata: Metadata = generatePageMetadata({
  title: 'Build',
  description: 'Your build: the stack your copy runs on and the components to make yours, then the work itself: where the hours go, the kinds of builds, when they happen, what shipped, and what yours would take.',
  category: 'BUILD',
  coverId: 'cover-010',
});

export default function BuildLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
