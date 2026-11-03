import type { EditorialArticle } from '../types';

// SETUP. curriculum, optional step `local-guardrails` (prisma/setup-steps.ts, #1106).
// `npm run frontmatter:install-hooks` (scripts/install-git-hooks.sh) writes wrapper
// hooks into .git/hooks that run the tracked scripts: pre-commit
// (scripts/pre-commit-frontmatter: blocks covers over 1MB, stamps dates on staged
// stories and articles via scripts/stamp-dates.js, generates frontmatter for new
// src/app/theunparty*/ markdown) and pre-push (scripts/pre-push-spellcheck, never
// blocks). Hooks are not cloned, so every computer installs them once. Story stamping
// moved here from a workflow whose push to protected main was rejected.
export const SETUP_LOCAL_GUARDRAILS_ARTICLE: EditorialArticle = {
  slug: 'setup-local-guardrails',
  title: 'GUARDRAILS.',
  subtitle: 'Catch the heavy photo, the stale date and the typo on your own computer, before anyone else sees them.',
  description: 'How non-technical founders turn on the checks that run on their own computer each time they commit and push: one command, then a cover-size check, story dates, frontmatter and a spellcheck, with nothing to remember.',
  category: 'SETUP.',
  date: '2026-10-01',
  updated: '2026-10-08',
  published: true,
  author: 'justin-murry',
  readTime: '6 min',
  tags: ['Git Hooks', 'Guardrails', 'Spellcheck', 'GitHub Desktop', 'Setup', 'Non-Technical Founders', 'Software You Own'],
  sections: [
    {
      id: 'hero-guardrails',
      type: 'hero',
      content: 'catch it before it ships.',
      metadata: { style: 'highlight' }
    },
    {
      id: 'intro',
      type: 'paragraph',
      content: 'GitHub already checks every change you send it, but by then the mistake is on its way. This step adds a few checks that run on **your computer**, at the moment you commit and push. They stop a photo too big for your site, put today\'s date on the stories you edit, and point out typos while the words are still fresh. You turn them on once, and then you never think about them.',
      metadata: { dropCap: true }
    },
    {
      id: 'checks-table',
      type: 'table',
      metadata: {
        headers: ['When', 'What it does', 'Stops you?'],
        rows: [
          ['Commit', 'Refuses a cover image over 1MB', 'Yes'],
          ['Commit', 'Puts today\'s date on the stories and articles whose words you changed', 'No'],
          ['Commit', 'Adds frontmatter to new project-page markdown', 'No'],
          ['Push', 'Lists spelling and grammar issues in what you wrote', 'No']
        ]
      }
    },
    {
      id: 'honest-list',
      type: 'list',
      content: '**Only one of them can stop you** — the cover check, because a heavy photo slows every page that shows it. Everything else fixes itself or just tells you|**Each computer turns them on once** — they are not copied when you download your code, so a new laptop needs the command again|**GitHub still checks too** — these catch things sooner. The checks on your pull requests stay the final word',
      metadata: { style: 'accent' }
    },
    {
      id: 'challenge-guardrails',
      type: 'challenge',
      userPrompt: 'GUARDRAILS.',
      label: 'BUILD.',
      pollEnabled: false,
      stepOne: { emoji: '1️⃣', action: 'Turn on.', description: 'One command, once.' },
      stepTwo: { emoji: '2️⃣', action: 'Commit.', description: 'Watch a story get its date.' },
      stepThree: { emoji: '3️⃣', action: 'Push.', description: 'Read your spelling report.' },
      successMetric: 'a story you edited shows today in updated-at.'
    },
    {
      id: 'before-list',
      type: 'list',
      content: '**Your copy on your computer** — from [Get your copy](/article/setup-get-your-copy)|**The tools installed** — from [Install the tools](/article/setup-install-tools), including running **npm install** once',
      metadata: { style: 'accent' }
    },
    {
      id: 'divider-on',
      type: 'divider'
    },
    {
      id: 'on-heading',
      type: 'heading',
      content: '1️⃣ One Command, Once'
    },
    {
      id: 'on-para',
      type: 'paragraph',
      content: 'Open **Terminal** in your project folder (in GitHub Desktop: **Repository → Open in Terminal**) and run:'
    },
    {
      id: 'on-code',
      type: 'code',
      content: 'npm run frontmatter:install-hooks',
      metadata: { language: 'bash', emphasis: true, caption: 'Safe to run again any time' }
    },
    {
      id: 'on-result',
      type: 'paragraph',
      content: 'It answers with two ✓ lines, one for commits and one for pushes. That is all. The checks live in your project\'s **scripts** folder, so when your copy gets an update, the checks update with it.'
    },
    {
      id: 'divider-commit',
      type: 'divider'
    },
    {
      id: 'commit-heading',
      type: 'heading',
      content: '2️⃣ Watch a Story Get Its Date'
    },
    {
      id: 'commit-steps',
      type: 'list',
      content: 'Open any story in **public/covers/stories/** and change one word|In GitHub Desktop, write a summary and click **Commit**|Open the story again. **updated-at** now shows today, and it went into the same commit',
      metadata: { numbered: true }
    },
    {
      id: 'commit-para',
      type: 'paragraph',
      content: 'Your site shows that date in the story\'s bar, and tells search engines the story changed. Before, a robot tried to add it after your change reached GitHub, and GitHub turned it away. Now it travels inside your own commit.'
    },
    {
      id: 'divider-push',
      type: 'divider'
    },
    {
      id: 'push-heading',
      type: 'heading',
      content: '3️⃣ Read Your Spelling Report'
    },
    {
      id: 'push-para',
      type: 'paragraph',
      content: 'Every push now reads only the words you changed and lists anything that looks misspelled, with suggestions. The push goes through either way. GitHub Desktop pushes quietly, so to read the report, push once from Terminal:'
    },
    {
      id: 'push-code',
      type: 'code',
      content: 'git push\n\n  UNPARTY  spellcheck  ·  1 file(s)\n  SPELLING.\n      12:9     sentance    → sentence',
      metadata: { language: 'bash', caption: 'Or run npm run spellcheck any time before pushing from GitHub Desktop' }
    },
    {
      id: 'push-quote',
      type: 'quote',
      content: 'The best time to catch a typo is before anyone reads it.',
      metadata: { author: 'unparty-app', style: 'highlight' }
    },
    {
      id: 'know-heading',
      type: 'heading',
      content: '⚠️ Good to Know'
    },
    {
      id: 'know-list',
      type: 'list',
      content: '**A story with unsaved half-changes is not dated** — if part of the story is in the commit and part is not, the date is skipped so the other part stays out. Commit the whole story and it gets its date|**No Node, no checks** — if your Git app cannot find Node, the checks skip instead of stopping you. Commit from Terminal once to check they run|**You can skip them once** — in Terminal, git commit --no-verify or git push --no-verify. GitHub still checks the pull request'
    },
    {
      id: 'trouble-heading',
      type: 'heading',
      content: '🧯 If Something Is Off'
    },
    {
      id: 'trouble-list',
      type: 'list',
      content: '**Commit blocked: oversized cover image** — the photo is over 1MB. Shrink it as in [Your first cover](/article/setup-first-cover), then commit again|**updated-at did not change** — the hooks are not on this computer yet, or the story had other unsaved changes. Run the command again, then commit the whole story|**No spelling report** — GitHub Desktop hides it. Push from Terminal, or run npm run spellcheck. If Terminal shows nothing either, run the install command again'
    },
    {
      id: 'llm-heading',
      type: 'heading',
      content: '🤖 Ask Your LLM'
    },
    {
      id: 'llm-prompts',
      type: 'code',
      content: 'My push printed this spelling report: [paste it]. Which are\nreal mistakes, and which are names or words I should add to\n.cspell-words.txt?\n\nMy commit says a cover is over 1MB. Here is the file name and\nsize: [paste it]. Walk me through shrinking it on [Mac/Windows].',
      metadata: { language: 'prompt', emphasis: true }
    },
    {
      id: 'done-heading',
      type: 'heading',
      content: '✅ You Are Done When'
    },
    {
      id: 'done-list',
      type: 'list',
      content: 'npm run frontmatter:install-hooks printed two ✓ lines|A story you edited and committed shows today in updated-at|A push from Terminal printed a spelling report'
    },
    {
      id: 'closing-para',
      type: 'paragraph',
      content: 'That is the whole curriculum\'s quiet helper. Every story, cover and article from here on gets checked the moment you make it.'
    },
    {
      id: 'final-quote',
      type: 'quote',
      content: 'Set it once. Trust it every time.',
      metadata: { author: 'unparty-app', style: 'minimal' }
    }
  ]
};
