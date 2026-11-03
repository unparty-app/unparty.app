import type { PrismaClient } from '@prisma/client'

// SETUP. curriculum (#1094): the steps a buyer follows to make their copy of
// theunpartyapp run, deploy, and become theirs. Steps are upserted by stable
// id, so re-running refreshes the copy without touching anyone's progress.
//
// Ordering: /api/steps sorts by priority desc, then createdAt asc, and Step has
// no order column. Each step's createdAt is pinned to SETUP_EPOCH + order
// minutes so the curriculum always lists in this file's order.
//
// `link` is only set when the page already resolves. `articleSlug` is the
// planned article for the step; `sourceDoc` is the repo doc to convert into it.

export const SETUP_CATEGORY = {
  name: 'SETUP.',
  description: 'Make your copy of theunpartyapp run, deploy, and become yours.',
  color: '#3B82F6',
}

const SETUP_EPOCH = Date.UTC(2000, 0, 1)

// The required path, in the order a buyer walks it. Optional steps have no
// chapter and are listed after it ("add more when you want it.")
export type SetupChapter = 'OWN' | 'RUN' | 'SHIP' | 'FILL' | 'YOURS'

type SetupStep = {
  key: string
  chapter?: SetupChapter
  title: string
  description: string
  optional?: boolean
  link?: string
  articleSlug?: string
  sourceDoc?: string
  // Env vars the step needs. A list inside the list is a choice: any one of them
  // is enough (Blob connects with BLOB_STORE_ID or BLOB_READ_WRITE_TOKEN)
  env?: (string | string[])[]
  // Completion can be checked server-side (env var present, DB reachable, ...)
  autoVerifiable?: boolean
  // Optional steps sort after required ones unless pinned HIGH
  priority?: 'HIGH' | 'MEDIUM' | 'LOW'
}

export const SETUP_STEPS: SetupStep[] = [
  {
    key: 'what-you-own',
    chapter: 'OWN',
    title: 'What you own',
    description:
      'Your copy of theunpartyapp is yours: the code, the content, the history you build from here. A few services (sign-in, database, hosting) are accounts you rent and can swap. This curriculum walks you from an empty folder to a live site.',
    link: '/article/unparty-works-story',
    articleSlug: 'unparty-works-story',
  },
  {
    key: 'github',
    chapter: 'OWN',
    title: 'Set up GitHub',
    description:
      'Create a GitHub account (or sign in to yours) and turn on two-factor authentication. GitHub is where your copy of the code lives, and how your site deploys.',
    link: '/article/setup-github',
    articleSlug: 'setup-github',
  },
  {
    key: 'add-an-llm',
    chapter: 'OWN',
    title: 'Add an LLM partner (Claude recommended)',
    description:
      'Optional, and worth it early. Create a Claude account so you have a partner for every step that follows: paste in an error, ask what a file does, or have it walk you through a setup screen. With Claude Code, it can work directly in your copy of the code. You never need an LLM to use unparty; this is for building it.',
    optional: true,
    priority: 'HIGH',
    link: '/article/setup-get-your-claude',
    articleSlug: 'setup-get-your-claude',
  },
  {
    key: 'get-your-copy',
    chapter: 'OWN',
    title: 'Get your copy',
    description:
      'Click one button: a private repository on your own GitHub account and a live site on your own Vercel account, with no keys. Download it with GitHub Desktop when you want to change it.',
    link: '/article/setup-get-your-copy',
    articleSlug: 'setup-get-your-copy',
  },
  {
    key: 'install-tools',
    chapter: 'RUN',
    title: 'Install the tools',
    description:
      'Install git and Node 24 (nvm on a Mac, fnm on Windows; both read the version from .nvmrc), run npm ci, then npm run dev to see your copy running before any accounts or keys.',
    link: '/article/setup-install-tools',
    articleSlug: 'setup-install-tools',
    sourceDoc: 'README.md (Quick Start)',
  },
  {
    key: 'first-run',
    chapter: 'RUN',
    title: 'First run',
    description:
      'Run npm run dev and walk your own site: the pages anyone can open, and /admin and /party staying locked.',
    link: '/article/setup-first-run',
    articleSlug: 'setup-first-run',
  },
  {
    key: 'deploy',
    chapter: 'SHIP',
    title: 'Deploy',
    description:
      'Used the button? You are already live, and pushing to main publishes. Otherwise, import your repository into Vercel (Node 24.x) and deploy. It needs no keys. Any you add later go in Vercel too, with a CRON_SECRET once you have a database.',
    link: '/article/setup-deploy',
    articleSlug: 'setup-deploy',
    sourceDoc: 'docs/guides/DEPLOYMENT.md + src/app/theunpartyapp/VERCEL_ENV_SETUP.md',
  },
  {
    key: 'domain',
    chapter: 'SHIP',
    title: 'Your domain',
    description:
      'Point your domain at Vercel, and update the site url in FoundersConfig.json. If you added sign-in, move it to a Clerk production instance and make yourself admin there.',
    link: '/article/setup-domain',
    articleSlug: 'setup-domain',
  },
  {
    key: 'first-cover',
    chapter: 'FILL',
    title: 'Your first cover',
    description:
      'Shrink a photo under 1MB, add it to public/covers/ as the next cover number, run generate-cover-extensions and audit:covers, list it in covers-data.ts, and push it.',
    link: '/article/setup-first-cover',
    articleSlug: 'setup-first-cover',
    sourceDoc: 'docs/guides/ImageHandling.md',
  },
  {
    key: 'first-story',
    chapter: 'FILL',
    title: 'Why build your own',
    description:
      'Your first story answers why build your own, in your own words. Write it in Stories in /admin: it opens your /build page, the first thing someone reads about what you build. Lines you start with # show big and become its highlights.',
    // The story writer, on a new story with the why prompt; saving it points
    // founder.why at it (#229, #589)
    link: '/admin/stories?story=new&why=1',
    articleSlug: 'setup-first-story',
    sourceDoc: 'docs/guides/STORY_GENERATION.md',
  },
  {
    key: 'first-article',
    chapter: 'FILL',
    title: 'Your first article',
    description:
      'Run ./create-article (Git Bash on Windows) to create and register it, fill in its sections, check it with npx tsc --noEmit, and push.',
    link: '/article/setup-first-article',
    articleSlug: 'setup-first-article',
    sourceDoc: 'docs/guides/ARTICLE_CREATION.md',
  },
  {
    key: 'first-project-page',
    chapter: 'FILL',
    title: 'Your first project page',
    description:
      'Run ./create-page (Git Bash on Windows) with a page name and your article: it writes the page, takes its title and cover from the article, and adds it to the sitemap. Check it and push.',
    link: '/article/setup-first-project-page',
    articleSlug: 'setup-first-project-page',
    sourceDoc: 'src/app/theunpartyapp/PAGE_CREATION_README.md',
  },
  {
    key: 'identity',
    chapter: 'YOURS',
    title: 'Make it yours: identity',
    description:
      'Fill in src/data/FoundersConfig.json (site name, description, legal name, your founder profile, photo, cover and links), run npm run check:identity until it is clean, check the tab title, footer and /founders, and push.',
    link: '/article/setup-identity',
    articleSlug: 'setup-identity',
  },

  // Optional: a copy runs live without any of these. These three open /admin and /party
  {
    key: 'database',
    optional: true,
    title: 'Create your database',
    description:
      'Pick a plan with the cost calculator, create a Postgres database on Neon, put both connection strings in .env, then run npm run db:push and npm run db:seed:setup. Your site runs without one; add it when you want it to remember people.',
    link: '/article/setup-database',
    articleSlug: 'setup-database',
    sourceDoc: 'docs/guides/DATABASE_SETUP.md',
    env: ['DATABASE_URL', 'DIRECT_DATABASE_URL'],
    autoVerifiable: true,
  },
  {
    key: 'sign-in',
    optional: true,
    title: 'Add sign-in',
    description:
      'Create a Clerk application, add its publishable and secret keys to .env, add public metadata to the session token, and sign up as the first account on your site. Your site runs without it; add it when you want people to sign in, or to open /admin.',
    link: '/article/setup-sign-in',
    articleSlug: 'setup-sign-in',
    env: ['NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', 'CLERK_SECRET_KEY'],
    autoVerifiable: true,
  },
  {
    key: 'make-yourself-admin',
    optional: true,
    title: 'Make yourself admin',
    description:
      'In Clerk, add role: admin to your public metadata, put your Clerk user ID in .env as FOUNDER_USER_ID, run npm run db:seed:setup again, then sign out and back in. Needs sign-in and a database first.',
    link: '/article/setup-make-yourself-admin',
    articleSlug: 'setup-make-yourself-admin',
    env: ['FOUNDER_USER_ID'],
    autoVerifiable: true,
  },

  // Optional integrations
  {
    key: 'payments',
    title: 'Sell something (Polar)',
    description: 'Connect Polar and sell a project from its own page.',
    optional: true,
    link: '/article/setup-payments',
    articleSlug: 'setup-payments',
    env: ['POLAR_ACCESS_TOKEN', 'POLAR_WEBHOOK_SECRET'],
    autoVerifiable: true,
  },
  {
    key: 'baseline',
    title: 'Know your baseline',
    description: 'Set what an hour of your work is worth (market pay over the hours in a year), what an hour costs in an LLM, and your own projects with the hours they took. Goal Budget and Expensd price every build with it. Keep the one your copy ships with, edit it in FoundersConfig.json, or have your LLM draft one for your market.',
    optional: true,
    link: '/article/setup-baseline',
    articleSlug: 'setup-baseline',
  },
  {
    key: 'google-sheet',
    title: 'A sheet as your database',
    description: 'Keep a list in a Google Sheet (free with a Google account), publish it as a CSV link, and put the link in .env as BOOKS_SHEET_CSV_URL: your site reads and filters it like a database. Writing to it is optional, with a free service account.',
    optional: true,
    link: '/article/setup-google-sheet',
    articleSlug: 'setup-google-sheet',
    env: ['BOOKS_SHEET_CSV_URL'],
    autoVerifiable: true,
  },
  {
    key: 'first-poem',
    title: 'Your first poem',
    description: 'Put a poem in a story with a ```poem fence: every line, indent and stanza stays as you wrote it, its icon walks the story, and a tap opens it there with your name under it. Sign a guest\'s poem with author="…", and show it in your own handwriting with scripts/poem-ink.sh and ink=….',
    optional: true,
    link: '/article/setup-first-poem',
    articleSlug: 'setup-first-poem',
  },
  {
    key: 'first-code',
    title: 'Your first code',
    description: 'Get a .css file of your five colors from /color or UNCOLOR, read it, change one line by hand, and load it back to see what you did. No install, no account.',
    optional: true,
    link: '/article/setup-first-code',
    articleSlug: 'setup-first-code',
  },
  {
    key: 'file-uploads',
    title: 'Photo prompts',
    description: 'Turn any picture on your site into a prompt ("upload a photo that represents home") and collect the photos visitors send. Needs a Vercel Blob store for the files.',
    optional: true,
    link: '/article/setup-file-uploads',
    articleSlug: 'setup-file-uploads',
    env: [['BLOB_STORE_ID', 'BLOB_READ_WRITE_TOKEN']],
    autoVerifiable: true,
  },
  {
    key: 'waitlist',
    title: 'Let people in (waitlist)',
    description:
      'Anyone can sign up, but only people you approve get into /party. Approve their worksheet in /admin/submissions, or set waitlistStatus: approved on their account in Clerk.',
    optional: true,
    link: '/article/setup-waitlist',
    articleSlug: 'setup-waitlist',
  },
  {
    key: 'github-app',
    title: 'GitHub repo discovery',
    description: 'Create your own GitHub App and install it on the repositories you want to show, so /founders lists them with live stars, languages and README previews.',
    optional: true,
    link: '/article/setup-github-app',
    articleSlug: 'setup-github-app',
    env: ['GITHUB_APP_ID', 'GITHUB_APP_INSTALLATION_ID', 'GITHUB_APP_PRIVATE_KEY'],
    autoVerifiable: true,
  },
  {
    key: 'slack',
    title: 'Slack notifications',
    description: 'Get a Slack message for every waitlist worksheet and every chat message, and approve or reject worksheets right from Slack.',
    optional: true,
    link: '/article/setup-slack',
    articleSlug: 'setup-slack',
    sourceDoc: 'docs/guides/SlackSetup.md',
    env: ['SLACK_WEBHOOK_URL', 'SLACK_WEBHOOK_URL_CHAT'],
    autoVerifiable: true,
  },
  {
    key: 'email',
    title: 'Email notifications',
    description: 'Connect Loops so the people on your waitlist get an email when their worksheet arrives, when they update it, and when you let them in.',
    optional: true,
    link: '/article/setup-email',
    articleSlug: 'setup-email',
    env: ['LOOPS_API_KEY', 'LOOPS_IDEA_SUBMITTED_ID', 'LOOPS_WAITLIST_APPROVED_ID'],
    autoVerifiable: true,
  },
  {
    key: 'music',
    title: 'Music',
    description: 'Connect Apple MusicKit so your articles can have a theme song readers play on the page.',
    optional: true,
    link: '/article/setup-music',
    articleSlug: 'setup-music',
    sourceDoc: 'docs/guides/APPLE_MUSIC_INTEGRATION.md',
    env: ['APPLE_MUSIC_TEAM_ID', 'APPLE_MUSIC_KEY_ID', 'APPLE_MUSIC_PRIVATE_KEY'],
    autoVerifiable: true,
  },
  {
    key: 'observability',
    title: 'Analytics and traces',
    description: 'Copy your page views and traces into your own database with Vercel Drains, and see them in /admin/observability.',
    optional: true,
    link: '/article/setup-observability',
    articleSlug: 'setup-observability',
    sourceDoc: 'docs/VERCEL_TRACING_PLAN.md',
    env: ['DRAIN_SECRET'],
    autoVerifiable: true,
  },
  {
    key: 'search',
    title: 'Search',
    description: 'Search already covers your pages, articles, stories and steps. Optionally connect a search API you run, so it also searches your own knowledge base.',
    optional: true,
    link: '/article/setup-search',
    articleSlug: 'setup-search',
    env: ['SEARCH_API_URL'],
    autoVerifiable: true,
  },
  {
    key: 'gitignore',
    title: 'What git leaves out',
    description:
      'Read your .gitignore: why .env, node_modules and logs never reach GitHub, how git check-ignore -v answers for any file, the one rule for generated files (save one only when it can\'t be made again), and git rm --cached for a file git already saves.',
    optional: true,
    link: '/article/setup-gitignore',
    articleSlug: 'setup-gitignore',
  },
  {
    key: 'local-guardrails',
    title: 'Local guardrails',
    description:
      'Run npm run frontmatter:install-hooks once: each commit checks cover sizes, dates your stories and articles and adds frontmatter, and each push reports spelling.',
    optional: true,
    link: '/article/setup-local-guardrails',
    articleSlug: 'setup-local-guardrails',
    sourceDoc: 'docs/guides/FRONTMATTER_GENERATION.md',
  },
  {
    key: 'icons',
    title: 'Pick your defaults',
    description:
      'Every icon on your site is hand-drawn. Pick the one each role uses (the icon that walks your poems, the one standing in for an emoji category), and redraw any of them in your own hand on the icon pad. Both are in your site in /admin. It ticks itself once you pick.',
    optional: true,
    // Your site in /admin: Your icons (the pad), then Your defaults (#589)
    link: '/admin#site',
    autoVerifiable: true,
    articleSlug: 'brand-icons',
  },
  // The onboarding's ending (#589): an optional, one-time telling, never sent
  // on its own; it ticks itself once unparty.app has counted it
  {
    key: 'tell-unparty',
    title: 'Tell unparty you built yours',
    description:
      'Your site is live and yours. If you want, tell unparty: it shows the card unparty.app will list (only what your site already shows everyone), and one button sends it. You get your build number and a place on unparty.app/builds, and you can take it off any time.',
    optional: true,
    link: '/admin#site',
    autoVerifiable: true,
  },
  // Last of all (D8, #1244): reaching zero retires the setup guides
  // themselves, so it comes after every other step, and stays optional
  {
    key: 'brand',
    title: 'Make it yours: delete unparty',
    description:
      'Open /admin/unparty: the unparty button lists every remaining unparty reference, grouped in replacement order - identity strings, the domain, any example project pages (delete them, never rename: renaming breaks URLs), author data, then file paths, which count too. This curriculum counts as well, so do this last. unppp is frame vocabulary and never counts. The step completes itself when you open the page at zero.',
    optional: true,
    link: '/article/setup-brand',
    articleSlug: 'setup-brand',
    autoVerifiable: true,
  },
]

export const setupStepId = (key: string) => `setup-${key}`

// Upserts the SETUP. category and steps. Visibility is CATEGORY_RESTRICTED so
// visitors never see setup steps; FOUNDER_USER_ID (when set) gets access.
export async function seedSetupSteps(prisma: PrismaClient) {
  const category = await prisma.stepCategory.upsert({
    where: { name: SETUP_CATEGORY.name },
    create: SETUP_CATEGORY,
    update: { description: SETUP_CATEGORY.description, color: SETUP_CATEGORY.color },
  })

  for (const [order, step] of SETUP_STEPS.entries()) {
    const id = setupStepId(step.key)
    const data = {
      title: step.title,
      description: step.description,
      category: 'SETUP',
      optional: step.optional ?? false,
      link: step.link ?? null,
      priority: step.priority ?? (step.optional ? 'MEDIUM' : 'HIGH'),
      visibility: 'CATEGORY_RESTRICTED' as const,
      createdAt: new Date(SETUP_EPOCH + order * 60_000),
      metadata: {
        stepType: step.link ? 'link-based' : 'action-based',
        order,
        articleSlug: step.articleSlug ?? null,
        sourceDoc: step.sourceDoc ?? null,
        env: step.env ?? [],
        autoVerifiable: step.autoVerifiable ?? false,
      },
    }

    await prisma.step.upsert({ where: { id }, create: { id, ...data }, update: data })
    await prisma.stepCategories.upsert({
      where: { A_B: { A: id, B: category.id } },
      create: { A: id, B: category.id },
      update: {},
    })
  }

  const founderId = process.env.FOUNDER_USER_ID
  if (founderId) {
    await prisma.userCategoryAccess.upsert({
      where: { userId_categoryId: { userId: founderId, categoryId: category.id } },
      create: { userId: founderId, categoryId: category.id },
      update: {},
    })
  }

  return { steps: SETUP_STEPS.length, founderAccess: Boolean(founderId) }
}
