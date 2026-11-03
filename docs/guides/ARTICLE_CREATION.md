# Article Creation Guide

How editorial articles are created, registered, and served. For the step-by-step version written for site owners, read [Your first article](/article/setup-first-article) (source: `src/app/constants/editorial-articles/articles/setup-first-article.ts`).

## Quick start

```bash
./create-article        # macOS/Linux; on Windows run it from Git Bash
npx tsc --noEmit        # no output = it type-checks
npm run dev             # then open http://localhost:3000/article/<slug>
```

`./create-article` asks for the slug, export name, title, description, category, date, published, author and a few optional fields. It then:

1. Writes `src/app/constants/editorial-articles/articles/<slug>.ts` with a hero section and every other section type commented out as a menu
2. Appends `export * from './articles/<slug>';` to `src/app/constants/editorial-articles/index.ts`
3. **Registers the article** in `src/app/constants/editorial-articles/registry.ts`: the import goes after the last `./articles/` import, and the entry goes above the `// Add more converted articles here` comment. If that comment is missing, it prints the manual steps instead

It refuses a slug whose file already exists, or an export name already used in `registry.ts`.

## Where articles come from

`getEditorialArticle(slug)` in `registry.ts` resolves a slug in this order:

| Source | Location | How it gets there |
|---|---|---|
| JSON | `content/articles/<slug>.json` | The "unseen" editor commits it through the GitHub App (`src/lib/github.ts`). Validated by `npx tsx scripts/validate-articles.ts` (a required CI check) |
| TypeScript | `src/app/constants/editorial-articles/articles/<slug>.ts` | `./create-article`. **Only served if listed in `EDITORIAL_ARTICLES`**; an unregistered file 404s |
| Markdown | `src/app/theunparty*/<file>.md` | UNPPP project pages. Slug is `<folder>-<file>`. Validated by `scripts/validate-md-frontmatter.ts` |

A JSON article shadows a TypeScript article with the same slug.

There is no `generateStaticParams` list to edit. `src/app/article/[slug]/page.tsx` builds it from the published articles.

## Writing sections

Sections render in array order. The full list of types is `EditorialSection['type']` in `src/app/constants/editorial-articles/types.ts`, and the scaffold's comments show each one's shape. [Editorial Section Guide](/article/editorial-section-guide) shows them rendered.

Rules that are easy to trip on:

- **Unique `id` per section**
- **`list` items are split on `|`**, so an item can't contain one. `metadata: { numbered: true }` makes an ordered list
- **Markdown in `paragraph` and `list`**: `**bold**` and `[text](/path)` both render
- **`dropCap: true` splits off the first character**, so start that paragraph with a plain letter
- **Escape apostrophes** inside single-quoted strings (`it\'s`), or write around them
- **`challenge` action labels must be short** (about 10 characters) or they get clipped inside the circles
- **`coverImage` is a path** (`/covers/cover-052.jpg`), not a bare cover id

## Where articles are listed

`/article` renders `ArticleTable`, which fetches `/api/articles`, sorts **newest first by `date`** (`YYYY-MM-DD`), and pages 12 at a time with a search box. `published: false` articles are left out and their pages 404.

## Verifying

```bash
npx tsc --noEmit                                          # TS articles, registry
npm run audit:imports                                     # unused imports
npx cspell --no-progress src/app/constants/editorial-articles/articles/<slug>.ts
npx tsx scripts/validate-articles.ts content/articles/<slug>.json   # JSON articles only
```

`npm run spellcheck` skips `.ts` files, so run `cspell` on the article directly. Check the page at 375px as well as desktop: rendering problems (a literal `**`, a doubled drop cap, clipped challenge labels) only show up visually.
