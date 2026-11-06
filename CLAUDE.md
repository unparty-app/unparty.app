# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## This is your copy
This app began as unparty's site. Whoever runs this copy owns it, and what they ask for overrides anything below. Some content is still unparty's until they replace it: `/admin/unparty` lists what's left, and `npm run check:identity` flags identity values still set to unparty's. The SETUP. steps are the guided path, starting at `/article/setup-github`. It runs with no `.env`; sign-in and a database are optional.

## How this was built
These explain why the code looks the way it does. Follow them unless the owner wants something else.
- **The site runs on its own content.** Articles, stories and many pages render through `EditorialArticle`, so a new page usually means mapping data into sections, not writing new layout.
- **One place for who the site is.** Identity, projects and settings live in `FoundersConfig.json`, so an owner edits one file instead of hunting through code.
- **Nothing required up front.** Every integration is optional, and a feature with no key or database stays quiet instead of breaking.
- **Reuse before building.** Look for an existing component first, and read two comparable pages before adding a new pattern. Ask before introducing a UI pattern the app doesn't already use, such as a tab row.
- **Plain words.** Copy talks to the person reading it, and says what something does for them.

## Git and scope rules
Never commit directly to main; use a feature branch and a PR unless the owner works differently. When asked to review or suggest, report findings without editing files. Stay within the named component or issue, and ask before expanding the scope. Never print the contents of .env files; check only whether variable names exist.

## Commands

Requires Node 24 (see `.nvmrc`; matches the Vercel project setting).

### Development
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Run all pre-build scripts, generate Prisma client, and build for production
- `npm run start` - Start production server

### Verification (prefer over `npm run lint`)
- `npm run audit:imports` - Audit unused imports across the codebase
- `npm run audit:covers` - Check `public/covers/` for oversized images (1MB limit, also enforced in CI and the pre-commit hook)
- `npm run spellcheck` - Spelling + grammar on changed prose (`:all`, `:fix`; never blocks — see [SPELLCHECK.md](./docs/guides/SPELLCHECK.md))
- `npx tsc --noEmit` - Type-check without emitting files
- `npx tsx scripts/validate-articles.ts <files...>` - Validate JSON articles (`content/articles/**/*.json`) against the schema, which is what the required `validate-articles` CI check runs on changed files (`scripts/validate-md-frontmatter.ts` does the same for UNPPP markdown). TS articles in `src/app/constants/editorial-articles/` are covered by `tsc` instead

### Database Operations
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database (no migration history)
- `npm run db:migrate` - Run migrations with history (use in production)
- `npm run db:studio` - Open Prisma Studio GUI
- `npm run db:seed` - Seed database with initial data. **Deletes all steps, categories and user progress first**, so never run it against a live database
- `npm run db:seed:setup` - Upsert only the SETUP. curriculum (`prisma/setup-steps.ts`); safe to re-run, grants `FOUNDER_USER_ID` access
- `npm run db:seed:make` - Upsert only the MAKE. curriculum (`prisma/seed-make.ts`); safe to re-run. `-- --dry-run` prints the steps without touching the database

### Build Pipeline Scripts (run automatically during `npm run build`)
- `npm run extract-colors-optional` - Precompute cover image colors (Swift, skips if unavailable)
- `npm run generate-video-metadata-optional` - Regenerate `src/data/videoMetadata.json` (needs `ffprobe`, keeps the tracked file if unavailable)
- `npm run generate-cover-extensions` - Generate cover file extension map
- `npm run generate-article-covers` - Generate article cover manifest
- `npm run generate-placeholder-stories` - Generate placeholder story entries
- `npm run sync-stories` - Sync story metadata from source
- `npm run analyze-story-repo-mentions` - Analyze repo mentions in stories
- `npm run generate-icons` - Regenerate `src/data/iconManifest.json`
- `npm run generate-images` - Regenerate `src/data/imageManifest.json`
- `npm run generate-unparty-refs` - Regenerate `src/data/unpartyRefsManifest.json`, the brand-reference list behind the `/admin/unparty` button (also runs before `npm run dev` via `predev`)
- `npm run generate-route-manifest` - Regenerate `src/data/routeManifest.json`, the slugs each dynamic route serves, which the proxy uses to give a missing one the full 404 page (also runs via `predev`; see Authentication)
- `npm run normalize-data` - Normalize page data across the site
- `npm run generate-focus` - Measure where the owner's hours went (`src/data/focus.json`, kept out of `public/` so it's never served): the last 12 weeks of commits on each of the owner's repos, through the same GitHub sign-in as `generate-releases` (`scripts/lib/owner-github.mjs`), counted as work sessions by the baseline's rule (commits <2h apart are one session, +15 min, at most 4h). Private repos only with `"privateRepos": true` in `FoundersConfig.json` (the switch in `/admin#features`). Keeps the last file without credentials. `next.config.ts` hands it over as `FOCUS_JSON`; `src/lib/focus.ts` shapes it for `RepoFocus` (served as `/api/resume?part=focus`) and prices the hours at the baseline's rate. Nothing measured is committed
- `npm run generate-releases` - Publish the owner's releases (`public/releases.json` + each prefix's latest files under `public/releases/`): every release of the owner's repos whose tag reads `<prefix>-v<version>`, read through the GitHub App (or `GITHUB_TOKEN` locally). Without either it keeps the last list and never fails the build. `src/lib/releases.ts` pairs a prefix with a component (`presents.release`, else the component's name in kebab case); `next.config.ts` hands the file to the app as `RELEASES_JSON`, so nothing reads `public/` at request time. They show on `/releases` (one chapter each, `src/lib/releases-article.ts`), in `/llms.txt` for agents (start here, every release with its summary, files and component, every published component; `src/app/llms.txt/route.ts`); a click on any released file sends the consent-gated `release_downloaded` event (`ReleaseDownloads` in the root layout); and on each component's home article, right under the component, as a RELEASES. row (`ReleaseRow`: one written *take it* pill to the release's chapter, a chip per file that saves it; added by `withReleaseRow` in `src/app/article/[slug]/page.tsx`) and on each project page's belt (`ProjectBelt`, via `StatsLayoutWrapper`: stage, the baseline's hours, its repo's releases, the ask; `src/lib/project-belt.ts`)

### Utility Scripts
- `./create-article` - Interactive: write and register a new TS editorial article
- `./create-page` - Create a project page at `src/app/<name>/page.tsx` wrapped in `UnpppPageShell`
- `./scripts/investigate init <area> <name>` / `sit` / `tir` / `complete` - Investigation CLI for build issues; records findings under `investigations/`
- `npm run effort` / `npm run effort:sprint` / `npm run effort:month` - Sprint effort analysis
- `npm run frontmatter:check` - Validate frontmatter on all pages
- `npm run backfill-dates` - Fill every missing created date on stories and articles (`scripts/stamp-dates.js --all`). Dates are stamped on every edit without anyone typing one: the pre-commit hook, the in-app save APIs (`src/lib/stamp-on-save.ts`) and the `stamp-dates.yml` PR workflow all apply the same rules; see [FRONTMATTER_GENERATION.md](./docs/guides/FRONTMATTER_GENERATION.md)
- `npm run frontmatter:install-hooks` - Install the pre-commit frontmatter hook and the pre-push spellcheck hook (run once)
- `npm run validate:unppp-repos` - Validate unppp repo mappings
- `npm run validate:og` - Validate Open Graph tags (`validate:og:local` builds first)
- `npm run debt-score` - Report technical debt score
- `npm run component-health` / `npm run analyze-components` - Component health report
- `npm run audit:component-homes` - Component-portfolio audit (#1433): every component in `COMPONENT_NAMES` (`src/lib/component-portfolio.ts`) has exactly one home article whose `presents` names it, in step with `componentRegistry` in `src/app/components/editorial/EditorialSection.tsx`. Exits 1 on a mismatch; the `component-audit-tracker.yml` workflow runs it
- `npm run create:component-article -- <Name>` (or `--all`, `--dry-run`) - Write an unpublished draft home article for a portfolio component into `src/app/constants/editorial-articles/articles/component-<name>.ts`, with `TODO.` where the words go, and register it. Setting `published: true` publishes it and completes the component's MAKE. step

There is no test runner configured in this repo (no Jest/Vitest/Playwright). The `test:*` npm scripts (`test:user-progress`, `test:vercel-queries`, etc.) are not unit tests. They are ad-hoc `tsx` scripts that connect to the real database through `@/lib/prisma`, so don't run them as a verification step. Verification relies on `npx tsc --noEmit`, `npm run audit:imports`, and manual/browser checks (see the `verify` skill).

## Verification and reporting
Treat issue text as a claim to verify against current code and pull the latest main before auditing or measuring. Trace a helper's callers and purpose before removing it. Don't dismiss a report based on grep alone; reproduce it when possible. Test every entry point before claiming that all of them work, including mobile and signed-in flows. Report anything untested as untested.

## Setup & Configuration

### Required Environment Variables

A copy runs with no `.env` at all, the same with `npm run dev` and live: with no Clerk keys (`src/lib/clerk-on.ts`), the auth stubs answer signed out, `/sign-in` says there's no sign-in yet, and `/admin`, `/party` and `/api/admin` stay locked. Test with `next start`, not only `npm run dev`. With no `DATABASE_URL` (`src/lib/db-on.ts`; the `.env.example` placeholder counts as none), `prisma` itself reads as empty and throws on writes (`src/lib/prisma.ts`), so database-backed sections stay empty and no route needs its own check; a route people save through from a public page answers `noDatabase()` after its sign-in check. `npm run build` also completes without a reachable database or Clerk keys, which is how CI builds (`og-validation.yml` has no secrets): pages that read the database while prerendering fall back to empty data and refill through ISR (#761). Keep it that way. A new prerendered read needs a fallback, as in `generateStatusFromPriorityScores()` and `getKeywordHighlightingEnabled()`.

**To open sign-in, `/admin` and saved data (database and sign-in are optional SETUP. steps):**
- `DATABASE_URL` - PostgreSQL connection string
- `DIRECT_DATABASE_URL` - Non-pooled connection for Prisma migrations (Neon)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk authentication
- `CLERK_SECRET_KEY` - Clerk authentication

**Once there's a database:**
- `CRON_SECRET` - Authenticates Vercel cron job requests (with none, the daily jobs in `vercel.json` and `src/app/api/cron/` answer Unauthorized, and have nothing to do)

**Optional integrations:**
- `BLOB_STORE_ID` or `BLOB_READ_WRITE_TOKEN` - Vercel Blob (public store) for photo-upload steps and the admin `/blobupload` page. `@vercel/blob` 2.x signs in with OIDC + `BLOB_STORE_ID` (what Vercel adds when it connects a store) and falls back to the token (local `.env`). `blobStoreConnected()` (`src/lib/blob-store.ts`) checks for either: with neither, the upload routes answer 503 `uploads-off` and the prompt shows the setup link to an admin, the "build yours" ask to a visitor. Uploads go through a function, so 4.5 MB max (`src/lib/upload-limits.ts`)
- `POLAR_ACCESS_TOKEN` / `POLAR_WEBHOOK_SECRET` / `POLAR_SERVER` - Polar payment processing (`POLAR_SERVER` is `sandbox` or `production`; unset, it follows `NODE_ENV`)
- `GITHUB_APP_ID` / `GITHUB_APP_INSTALLATION_ID` / `GITHUB_APP_PRIVATE_KEY` - the owner's own GitHub App (`/article/setup-github-app`). `/api/repo-data` lists the repos the App is installed on (works for personal accounts and orgs). The build also reads its repos' releases for `npm run generate-releases`, so install the App on the repos you release from. The same App commits story edits, articles and snapshot PRs to the site's own repo (`siteRepo()` in `src/lib/github.ts`: Vercel's `VERCEL_GIT_REPO_*`, or `STORIES_REPO_NAME` + `WAITLIST_REPO_OWNER`)
- `WAITLIST_REPO_OWNER` / `WAITLIST_REPO_NAME` / `GITHUB_WEBHOOK_SECRET` - optional waitlist review in GitHub Discussions ("Pending" → "Approve" via `/api/github/webhook`)
- `NEXT_PUBLIC_CLERK_ALLOWED_REDIRECT_ORIGINS` - comma-separated origins of Clerk satellite apps allowed to redirect back after sign-in (`ClerkThemeProvider`); unset, redirects stay on this site. Built into the client bundle, so changing it needs a rebuild
- `SLACK_WEBHOOK_URL` / `SLACK_WEBHOOK_URL_CHAT` - Admin (waitlist worksheet) and chat notifications. `SLACK_SIGNING_SECRET` adds Approve / Reject buttons to worksheet messages, handled by `/api/slack/interactions` (signature check in `src/lib/slack-verify.ts`, approval through `approveSubmission()`)
- `LOOPS_API_KEY` + `LOOPS_IDEA_SUBMITTED_ID` / `LOOPS_IDEA_UPDATED_ID` / `LOOPS_WAITLIST_APPROVED_ID` - Loops email; each template ID comes from the owner's own Loops account, and an email without one is skipped. Never put an unparty account ID (template, product, org) in code: read it from `.env` or `FoundersConfig.json`
- `APPLE_MUSIC_TEAM_ID` / `APPLE_MUSIC_KEY_ID` / `APPLE_MUSIC_PRIVATE_KEY` - MusicKit
- `DRAIN_SECRET` - Signature secret shared by the Web Analytics and Traces drains (`VERCEL_WEBHOOK_SECRET` is the older analytics name); unset in production, both drains refuse writes
- `NEXT_PUBLIC_GA_ID` - The owner's own Google Analytics Measurement ID; unset, GA never loads
- `FOUNDER_USER_ID` - Clerk user ID for the admin/founder account
- `ANTHROPIC_API_KEY` or `AI_GATEWAY_API_KEY` + `AI_GATEWAY_MODEL` - The owner's model (`src/lib/llm.ts`): replies to Thoughts and free-text "where are you starting from?". Tried in order: a reader's own Anthropic key (kept in their tab, sent straight to Anthropic, never through the owner's Gateway), the owner's Anthropic key, then AI Gateway (OIDC replaces its key on Vercel). `ANTHROPIC_MODEL` sets the direct paths' model; `ANTHROPIC_WORKSPACE_ID` is needed only for a key not scoped to a workspace. None set, both features do without
- `SEARCH_API_URL` - A knowledge base API that `/api/search` also queries (`POST /api/chat`). Unset, search covers only the site's own content and no query leaves the site

All keys go in `.env`, which the site, the Prisma CLI and the seed scripts all read (Prisma never reads `.env.local`). Git ignores it; never commit it. See [.env.example](./.env.example) for full documentation. See [DATABASE_SETUP.md](./docs/guides/DATABASE_SETUP.md) for database setup.

## Architecture

### Tech Stack
- **Framework**: Next.js 16 (App Router), React 19, TypeScript. Request interception lives in `src/proxy.ts`, Next 16's name for middleware (it still exports Clerk's `clerkMiddleware` and a `config` matcher)
- **Database**: PostgreSQL + Prisma ORM (singleton at `src/lib/prisma.ts`, imported everywhere as `@/lib/prisma` — `@/*` maps to `./src/*`)
- **Authentication**: Clerk — import from `src/lib/auth-stub.server.ts` (server) or `src/lib/auth-stub.client.tsx` (client), not directly from `@clerk/nextjs`
- **Styling**: Tailwind CSS with a CSS variable theme system (`--theme-color`)
- **Content**: Typed editorial articles and markdown stories (see Content below); MDX only for a few component demos
- **Payments**: Polar. A project with a `polarProductId` gets a buy pill on its page (`BuyPill`, via `StatsLayoutWrapper`). `"checkout": false` in `FoundersConfig.json` (`CHECKOUT_ON`; unparty's own setting, on when missing) turns every pill into the site's "build yours" and makes `/api/checkout` answer 403; `/api/checkout` creates the embedded session and `/api/webhook/polar` records paid orders in the buyer's Clerk `publicMetadata.purchasedProductIds`
- **File Storage**: Vercel Blob
- **Observability**: Vercel Analytics drain + trace drain (stored in DB), OpenTelemetry via `@vercel/otel`

Note: `src/app/lib/` also exists but only holds a handful of feature-local utilities (`sku-generator.ts`) — don't confuse it with `src/lib/`, which holds the real shared infra (auth, prisma, github, tracing, drain security).

### Route Organization

`src/app/` contains two conceptually distinct groups of routes:

**Product/feature routes** — concrete app features:
- `/admin/*` - Protected admin panel (horizontal nav layout)
- `/party/*` - Authenticated user area
- `/article/[slug]` - Editorial articles
- `/story/[slug]` - Story viewer
- `/sprint/[slug]` - Sprint pages
- `/books` - Book inventory and claiming
- `/unppp/*` - UNPPP program pages (uses `theunparty-` prefixed page names). `/unppp/[type]` is a hub per kind of build (app, agent, service…, `UnpppTypesConfig.json`), full-bleed under a pinned color cover (`StickyCover`), with `OutlineRail` for its sections: FoundersConfig projects with that `type`, unparty's unppps of that type, published articles tagged `unpppType` (a component's home article goes under components) and stories that mention those projects (`src/lib/type-hub.ts`)
- `/covers/*` - Cover photo gallery with precomputed colors
- `/status` - UNPPP priority-score dashboard (per-route YAH./MEH./NAH. tiers from `src/lib/unppp-priority-scores.ts`)

**Showcase/concept pages** (`/theunparty*`) — individual product concept showcases for each sub-product. These are named without a hyphen (e.g. `/theunpartybuilder`, `/theunpartychat`). The `theunparty-` hyphenated prefix is reserved exclusively for UNPPP program pages.

The default shell for these showcase pages is `src/app/components/UnpppPageShell.tsx`. Prefer that shared wrapper over repeating `mx-auto w-full max-w-5xl` in each `src/app/theunparty*/page.tsx`, and keep page-specific spacing/layout tweaks in the shell's `className` prop instead of introducing new outer containers.
**API routes** (`src/app/api/**`) — see the [API Routes Map & Audit](/article/theunpartyapp-api-routes-map) article (source: `src/app/theunpartyapp/api-routes-map.md`) for a visual map and audit of the endpoints (methods, purpose, auth, and which routes are unwired). The article can fall behind the code (it lists 84 endpoints; there are now over 120 `route.ts` files), so grep `src/app/api` to check the current set.

### Content
Articles and stories both render through `EditorialArticle` (`src/app/components/editorial/`) as a list of typed sections (`EditorialSection` in `src/app/constants/editorial-articles/types.ts`). A `component` section draws from `componentRegistry` in `EditorialSection.tsx`.

`getEditorialArticle()` in `src/app/constants/editorial-articles/registry.ts` looks up a slug in this order:
1. `content/articles/<slug>.json` - what the in-app article writer saves through the GitHub App, so an edited slug overrides its source. Read from disk at request time; the folder is empty until someone saves one
2. `src/app/constants/editorial-articles/articles/<slug>.ts` - where articles normally live. `./create-article` writes and registers one (see [ARTICLE_CREATION.md](./docs/guides/ARTICLE_CREATION.md))
3. `.md` files directly inside a `src/app/theunparty*/` folder (`src/app/utils/mdArticleUtils.ts`)

Stories are markdown in `public/covers/stories/story-*.md`, tied to a cover and converted to the same sections by `src/app/utils/storyToEditorialConverter.ts`.

### Authentication
Every route is public unless the proxy (`src/proxy.ts`, built on Clerk's `clerkMiddleware`) gates it. `clerkMiddleware` protects nothing by default. Only two groups are gated: `isProtectedRoute` (`/party/*`, `/admin/*`, `/blobupload/*`) requires sign-in through `auth.protect()`, and `isAdminApiRoute` (`/api/admin/*`) answers 401 when signed out. A new public page needs no middleware entry. The proxy still has an `isPublicRoute` list, but it gates nothing (#1359). Its check runs *before* the gates and returns early, so a pattern there that also matches a gated path (`'/a(.*)'`, `'/api(.*)'`) would skip sign-in for it. Don't add to it.

A page that calls `notFound()` gets an empty HTML shell from Next.js, and its 404 only appears after JavaScript runs ([vercel/next.js#99793](https://github.com/vercel/next.js/issues/99793), still open on 16.4). A URL that matches no route gets the full page. So in production the proxy rewrites a slug that `/article`, `/story`, `/watch`, `/html` and `/unppp/[type]` don't serve to an unmatched path (`src/lib/known-routes.ts`, slugs from `scripts/generate-route-manifest.cts`). A new dynamic route that calls `notFound()` goes in both files. `/steps/[stepId]` is database-backed, so the proxy asks `GET /api/steps/exists` one id at a time instead and caches each answer (`isMissingStep`; full page loads only, since client navigations open steps in the `@modal` slot).

When the owner runs a waitlist (`"waitlist": true` in `FoundersConfig.json`, read as `WAITLIST_ON` from `organization.ts`; off by default), `/party/*` has a second gate on top of sign-in: `isWaitlistGatedRoute` checks the session's `metadata.role === 'admin'` or `metadata.waitlistStatus === 'approved'`, redirecting unapproved signed-in users to `/waitlist/pending`. `/admin/*` requires sign-in but is not waitlist-gated. Approving someone means setting that Clerk label: `approveSubmission()` in `src/lib/waitlist.ts` does it for both the **Approve** button in `/admin/submissions` and the GitHub Discussion webhook. Changing a `UserSubmission` row's status alone does not let anyone in.

Every `/api/admin/*` handler starts with `adminGuard()` from `src/lib/admin.ts` (401 signed out, 403 not an admin); the proxy also requires sign-in there, but sign-in alone is not enough, since anyone can sign up.

Auth functions go through stub files, which answer signed out when no sign-in is connected. Always import from those, never directly from `@clerk/nextjs` or `@clerk/nextjs/server`, since Clerk's own hooks throw without its provider:
- Server Components / API routes: `src/lib/auth-stub.server.ts`
- Client Components: `src/lib/auth-stub.client.tsx`

### Database Models
Defined in `prisma/schema.prisma`. Notable ones:
- **Step** / **StepCategory** / **StepCategories** — tasks with category, priority, org assignment, and visibility
- **Question** / **UserQuestionResponse** — questions attached to steps with typed responses
- **UserStepProgress** / **UserCategoryAccess** — per-user step completion and category access
- **Article** — slug-routed content with publish state
- **Book** — inventory and claiming workflow (no payment provider is wired up; `stripePaymentId` is a leftover column nothing reads)
- **UserSubmission** — file/form submissions with admin review workflow
- **Repository** — GitHub repo metadata (discovered via the GitHub App client)
- **Ticket** / **BoardState** — kanban-style tracking
- **UserProfile** / **IdeaProgression** / **UserMilestone** / **UserSession** / **ChallengeResponse** / **Thought** — founder/user journey tracking
- **VercelPageview** / **VercelEvent** — analytics drain events (pruned after 30 days by cron)
- **VercelTrace** / **VercelTraceSpan** — trace drain data for performance monitoring
- **Build** — builds reported by copies of the site (`/api/builds`, shown on `/builds`)
- **ConnectMessage** — chat messages (`/api/chat/send`)
- **NotFoundHit** — 404 counts (`src/lib/not-found.ts`)
- **AppSetting** — key/value site settings (`src/lib/appSettings.ts`)

### Theme System
Global `ThemeContext` (`src/app/contexts/ThemeContext.tsx`) exposes `selectedColor` / `colorValue` backed by `localStorage`. The active color is written to `--theme-color` on `document.documentElement`. Color definitions live in `src/app/constants/colors.ts`.

### Site Identity
Who the site is and who founded it lives in `src/data/FoundersConfig.json` (site name, title, tagline, headline, description, URL, legal name, logo, founder profile and links, brand colors). `src/app/constants/organization.ts` reads it and exports the typed constants (`SITE_NAME`, `SITE_URL`, `FOUNDER`, …) that metadata, the footer, structured data, sitemap/robots and `/founders` import. While `site.url` is still unparty's, a copy on Vercel uses its own production address for `SITE_URL` (`src/lib/site-address.ts`, so canonical links, the sitemap and `RECEIVES_BUILDS` never claim to be unparty.app). Use those constants instead of typing "unparty" or a URL; a site owner changes identity by editing only the JSON (see `/article/setup-identity`). `npm run check:identity` validates that JSON (a trailing comma passes `tsc` but breaks the site) and warns about values still set to unparty's.

Icons can be redrawn by hand on the icon pad ("Your icons" in `/admin`, `IconDrawPad`). `HandDrawnIcon` draws an icon's pad drawing when it has one: the owner's own (`icons` in this file) first, then the app's defaults (`src/app/components/icons/drawn.json`, unparty's founder's hand, shipped with every copy, saved from the pad on a local copy only), then the strokes in code. A new icon passes `name` to `HandDrawnIcon` and gets a line in `src/app/components/icons/drawable.ts`.

The same file's `projects` list holds the site owner's own projects, in the same entry shape as `src/data/UnpppsConfig.json` (unparty's 49 unppps). Both coexist: look projects up through `src/lib/projects.ts` (`findProjectById`, `findProjectByProductId`), which checks FoundersConfig first, rather than importing UnpppsConfig for anything a buyer's project also needs.

The same file's `answers` holds the owner's answers to the challenge's three questions (`about`, `build`, `connect`; "Your answers" in `/admin`, `src/app/api/admin/answers/route.ts`). A challenge step with `answer: 'about'` shows the owner's and takes the reader's; `answer: true` only asks the reader, with the step's description as the question. `getWordCounts` counts the owner's with their writing, so they reach the word cloud, `WordTags` and the worksheet. It ships in every page's JavaScript, so a reader's answers never go here: they wait in the tab (`src/lib/challenge-answers.ts`) and travel with their worksheet (`/api/problem/send`).

A `ranking` section with a `questionId` ranks written choices from the copy's own database, and shows nothing until that question exists (`MissingQuestion`). Without one it ranks words from the copy's cloud (`WordRanking`: `userPrompt`, `rankWords`), so new articles that can should use that. The owner's answers are always offered as words to rank and tag, since three short answers won't reach the top of a cloud with a lot of writing behind it.

A brand imported from an UNCOLOR `.css` (`ImportColorsCssModal`) goes on the importer's own palette (`ColorSelectionContext`, `InkPalette`, `/api/user/brand-colors`). Only the owner can make it who the site says it is (`/api/admin/site-identity`, which edits `site.name`, `tagline` and `description`).

The same file's `baseline` is what a goal's budget is measured against (`src/lib/baseline.ts`): market pay over `hoursPerYear` gives the hourly rate, `llmPerHour` the LLM cost, and `projects` real measured hours to compare with. It ships as unparty's, measured from unparty's repos by theunpartyrunway's `run-repo-analysis`; the owner replaces it. Measurements only: no premiums, and no infra, which the stack (DependConfig) already prices. `scripts/polar-pricing.ts` reads its rates from it too.

### UNPPP Visual Convention
When a component needs to represent a UNPPP as a small circular cover/dot, use `src/app/components/UnpppCircle.tsx` rather than hand-rolling another `next/image` + `resolveCoverSrc()` + `onError` fallback. It defaults to the 24px circular cover convention; only override `size` for an existing constrained layout. Resolve the `src` upstream when needed (for example, pathname-aware cases in navigation), then pass the resolved `src` and UNPPP color into the shared component.

### Generated Files (do not edit manually)
Track a generated file only when it can't be regenerated. Ignore it when every command that needs it (`npm run build`, `npm run dev`, CI) makes it first. Track it when some machines can't make it, or when code imports it and nothing makes it before `npm run dev`. A new generator's output goes in one list or the other. Adding a path to `.gitignore` doesn't untrack a file git already tracks, so also run `git rm --cached <file>` (see `/article/setup-gitignore`).

**Ignored (the build regenerates them):**
- `src/data/iconManifest.json` — `npm run generate-icons`
- `src/data/imageManifest.json` — `npm run generate-images`
- `src/data/normalizedPageMedia.json` — `npm run normalize-data`
- `public/data/story-repo-mappings.json` — `npm run analyze-story-repo-mentions` (read with a fallback, so a fresh copy works before its first build)
- `src/data/routeManifest.json` — `npm run generate-route-manifest` (every build and `npm run dev`). Optional: `next.config.ts` hands it to the proxy as `ROUTE_MANIFEST` instead of an import, so dev and `tsc` work without it (missing slugs then fall back to the page's `notFound()`)
- `src/data/focus.json` — `npm run generate-focus` (every build). Read with a fallback (no focus until a build makes it)
- `public/releases.json`, `public/releases/` — `npm run generate-releases` (every build). Read with a fallback (no releases until a build makes it); `tsconfig` and ESLint skip the copied files
- `src/data/unpartyRefsManifest.json` — `npm run generate-unparty-refs` (every build and `npm run dev`): every remaining brand reference a buyer still has to replace, categorized for the `/admin/unparty` button. `unppp` is frame vocabulary, and the allowlist in the generating script marks the frame files that never count

**Tracked (can't be regenerated everywhere, or imported before any build runs):**
- `src/app/covers/cover-colors.json` — `scripts/precompute-colors.swift` (Swift, Mac only; palettes are sampled at random, so a cover keeps the one it has: `npm run extract-colors -- cover-052` picks again)
- `src/data/videoMetadata.json` — `npm run generate-video-metadata` (needs `ffprobe`)
- `public/raw-repo-metadata.csv`, `public/data/unppp-scores.*` and related CSV files — repo analysis scripts run on the owner's machine
- `src/app/covers/cover-extensions.json`, `src/data/articleCoversManifest.json` — the build regenerates them, but code imports them, and `npm run dev` doesn't make them first
- `src/data/comparisons.json` — `npm run measure:comparisons` (needs the GitHub CLI signed in): the site's repo next to public repos of a similar scale, pull requests and issues month by month over a year, for /founders' comparison chart (`src/lib/comparisons.ts`). The snapshot empties it, so a copy measures its own

### Key Lib Files (all in `src/lib/`, not `src/app/lib/`)
- `prisma.ts` — Prisma singleton (dev-safe global)
- `github.ts` — GitHub App client for org repo discovery
- `vercel-drain-security.ts` — drain signature verification
- `tracing.ts` / `vercel-analytics-queries.ts` / `vercel-trace-queries.ts` — OTel tracing and analytics/trace drain queries
- `admin.ts` — admin/founder access helpers
- `src/workflows/problem-notification.ts` — durable workflow (`'use workflow'`/`'use step'`) for problem submission notifications, sent via Loops

## Commit Messages

Commit subjects start with an uppercase category and a period, then one plain sentence about what changed for the reader, then the issue number: `FIX. Approving again repairs a missing account label (#752)`. Common categories: `UX.`, `LEARN.` (setup articles), `FIX.`, `FEAT.`, `STORY.`, `BRAND.`, `LAYOUT.`, `DOC.`, `LINT.`. Check `git log` for the current set before inventing a new one.
