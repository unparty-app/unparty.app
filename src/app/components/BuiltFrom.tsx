'use client';

import { usePathname } from 'next/navigation';
import EditorialSection from './editorial/EditorialSection';
import type { BuiltFromCard } from '@/lib/built-from';

/**
 * BuiltFrom - the end of a project page: the components it's built from, each
 * a card that leads to that component's article (and from there to the
 * services it runs on and how to set them up). The project comes from the
 * path, the way StatsLayoutWrapper finds it; a project that lists no
 * components shows nothing.
 */
export default function BuiltFrom({ cards }: { cards: Record<string, BuiltFromCard[]> }) {
  const pathname = usePathname();
  const projectId = pathname.split('/').filter(Boolean)[0];
  const row = projectId ? cards[projectId] : undefined;
  if (!row?.length) return null;

  return (
    <EditorialSection
      section={{
        id: 'built-from',
        type: 'scrollRow',
        metadata: { scrollRowType: 'articles', title: 'BUILT FROM.', articleCards: row, moreLink: '/build' },
      }}
    />
  );
}
