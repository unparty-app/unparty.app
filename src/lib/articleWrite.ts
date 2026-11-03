import { editorialArticleSchema, type EditorialArticleValidated } from './articleSchema';
import { createArticleBranch, commitArticleFile, openArticlePR } from './github';
import { saveDate, skipsStamp, stampForSave } from './stamp-on-save';
import { getEditorialArticle } from '@/app/constants/editorial-articles/registry';

export interface ArticleWriteResult {
  prUrl: string;
  prNumber: number;
  branch: string;
  autoMergeEnabled: boolean;
}

export type ArticleWriteOutcome =
  | { ok: true; result: ArticleWriteResult }
  | { ok: false; error: string };

/**
 * Shared write path for both creating and editing an article from unseen:
 * validate against the schema (no git action on failure), branch off main,
 * date it (src/lib/stamp-on-save.ts: `updated` becomes today when the title or
 * sections changed against main), commit the JSON, open a PR, and enable
 * auto-merge. Used by both POST /api/articles and PUT /api/articles/[slug].
 * `localDate` is the client's own date (YYYY-MM-DD), see saveDate().
 */
export async function validateAndSubmitArticle(
  article: unknown,
  message: string,
  localDate?: unknown
): Promise<ArticleWriteOutcome> {
  const parsed = editorialArticleSchema.safeParse(article);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.message };
  }

  const data: EditorialArticleValidated = parsed.data;
  const branch = `unseen/article-${data.slug}-${Date.now()}`;

  const json = JSON.stringify(data, null, 2);
  // The article as the site serves it now: what a first JSON save of a TS or
  // MD article is compared against
  const current = getEditorialArticle(data.slug);
  const dated = skipsStamp(message)
    ? json
    : await stampForSave(
        `content/articles/${data.slug}.json`,
        json,
        saveDate(localDate),
        current ? JSON.stringify(current) : null
      );

  await createArticleBranch(branch);
  await commitArticleFile(data.slug, dated, message, branch);
  const { prUrl, prNumber, autoMergeEnabled } = await openArticlePR(
    branch,
    message,
    `Article edit submitted from unseen.\n\nSlug: \`${data.slug}\``
  );

  return { ok: true, result: { prUrl, prNumber, branch, autoMergeEnabled } };
}
