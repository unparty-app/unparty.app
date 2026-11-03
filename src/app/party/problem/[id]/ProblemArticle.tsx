'use client';

import Link from 'next/link';
import EditorialArticle from '@/app/components/editorial/EditorialArticle';
import PageNavigation from '@/app/components/PageNavigation';
import { CircleArrowLeft } from '@/app/components/icons';
import type { EditorialArticle as EditorialArticleType } from '@/app/constants/editorial-articles/types';

// The article layout every reader already knows, with a way back to /party and
// the side arrows stepping through the owner's other problems
export default function ProblemArticle({ article, routes, labels }: { article: EditorialArticleType; routes: string[]; labels?: Record<string, string> }) {
  return (
    <main className="mx-auto w-full max-w-5xl">
      <Link
        href="/party"
        className="mb-4 inline-flex items-center gap-2 font-google-sans-code text-[10px] uppercase tracking-wide text-[var(--text-muted)] transition-colors hover:text-[var(--theme-color,_#f9c22e)]"
      >
        <CircleArrowLeft size={16} strokeWidth={1} themed /> your problems.
      </Link>
      <EditorialArticle article={article} showThoughts={false} />
      <PageNavigation routes={routes} labels={labels} kind="problem" />
    </main>
  );
}
