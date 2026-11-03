import { NextResponse } from 'next/server';
import { adminGuard } from '@/lib/admin';
import { getEditorialArticle } from '@/app/constants/editorial-articles/registry';
import { editorialArticleSchema } from '@/lib/articleSchema';
import { CAN_CHANGE_CONFIG, LOCAL, writeRepoFile } from '@/lib/founders-config-write';
import { saveDate, stampForSave } from '@/lib/stamp-on-save';

// The article writer (#229), the web twin of the iOS app's ArticleEditorView.
// GET: an article as the site has it, drafts too (a JSON override first, then
// the TS or MD article). PUT: saves it as content/articles/<slug>.json, which
// takes precedence over the TS or MD one: locally the file itself, deployed a
// self-merging pull request through the owner's GitHub App, dated like the
// iOS app's saves. Checked against the article schema, but written as given:
// the schema doesn't list every field an article can have (coverColor,
// presents, a challenge's SETUP. steps), and parsing would drop them

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const denied = await adminGuard();
  if (denied) return denied;
  const { slug } = await params;
  const article = getEditorialArticle(slug);
  return article ? NextResponse.json({ article }) : NextResponse.json({ error: 'No article by that address' }, { status: 404 });
}

export async function PUT(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const denied = await adminGuard();
  if (denied) return denied;
  const { slug } = await params;
  if (!SLUG.test(slug)) return NextResponse.json({ error: 'An address is lowercase words joined by dashes' }, { status: 400 });

  const { article, localDate } = (await request.json().catch(() => ({}))) as { article?: Record<string, unknown>; localDate?: unknown };
  if (!article || typeof article !== 'object' || article.slug !== slug) return NextResponse.json({ error: 'The article and its address don’t match' }, { status: 400 });
  const checked = editorialArticleSchema.safeParse(article);
  if (!checked.success) {
    const first = checked.error.issues[0];
    return NextResponse.json({ error: `${first.path.join('.') || 'article'}: ${first.message}` }, { status: 400 });
  }
  if (!CAN_CHANGE_CONFIG) return NextResponse.json({ error: 'Connect your GitHub App to save articles from here (/article/setup-github-app)' }, { status: 409 });

  const path = `content/articles/${slug}.json`;
  const json = `${JSON.stringify(article, null, 2)}\n`;
  try {
    const current = getEditorialArticle(slug);
    const text = LOCAL ? json : await stampForSave(path, json, saveDate(localDate), current ? JSON.stringify(current) : null);
    const result = await writeRepoFile(path, () => text, { branch: `article-${slug}`, title: `ARTICLE. ${String(article.title)} (${slug})`, body: 'Written in the article writer (/admin/articles).' }, { create: true });
    return NextResponse.json({ slug, saved: result });
  } catch (error) {
    console.error('Article save failed:', error);
    return NextResponse.json({ error: 'Could not save the article' }, { status: 500 });
  }
}
