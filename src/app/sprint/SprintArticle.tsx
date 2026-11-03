import { loadMDAsEditorialArticle } from '../utils/mdArticleUtils';
import EditorialArticle from '../components/editorial/EditorialArticle';

/**
 * How sprints work (how-sprints-work.md), as /sprint shows it. A page that
 * embeds it under an article of its own passes showThoughts={false}, so the
 * page has one THOUGHTS. thread, not two
 */
export default function SprintArticle({ showThoughts = true }: { showThoughts?: boolean }) {
  const article = loadMDAsEditorialArticle('sprint', 'how-sprints-work.md');

  if (!article) {
    return <p className="font-google-sans-code text-sm text-[var(--text-muted)]">👾 oh no, nothing here. unparty-app is MEH!</p>;
  }

  return (
    <div className="w-full flex flex-col gap-4 px-2 md:gap-6">
      <EditorialArticle article={article} coverId="cover-001" showThoughts={showThoughts} />
    </div>
  );
}
