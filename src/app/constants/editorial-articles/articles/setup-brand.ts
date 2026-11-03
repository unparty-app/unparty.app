import type { EditorialArticle } from '../types';

// SETUP. curriculum, optional step `brand`, the very last one (prisma/setup-steps.ts,
// #1095, decisions D1–D9 in #1244). /admin/unparty lists every remaining "unparty"
// from src/data/unpartyRefsManifest.json, made by scripts/generate-unparty-refs.js
// first in every build and before npm run dev, from git ls-files only (no git: "not
// counted here"). Text matches by category (identity, domain, projects, author) plus
// file paths, which count. Never counted: unppp, the tooling files, LICENSE.md, the
// saved-setting keys and RENAMED_COLORS. The curriculum counts, hence last. Opening
// the page at zero completes the step for the admin who opened it.
export const SETUP_BRAND_ARTICLE: EditorialArticle = {
  slug: 'setup-brand',
  title: 'MAKE IT YOURS.',
  seoTitle: 'MAKE IT YOURS. replace every unparty left in your copy',
  subtitle: 'Find every unparty left in your copy, replace it, and watch the count reach zero.',
  description: 'How non-technical founders remove a template\'s original brand from their own Next.js site: one page lists every remaining reference by kind, in the order to replace them, and the step completes itself at zero.',
  category: 'SETUP.',
  date: '2026-10-05',
  published: true,
  author: 'justin-murry',
  readTime: '8 min',
  tags: ['Brand', 'Identity', 'Rebrand', 'Setup', 'Non-Technical Founders', 'Software You Own'],
  sections: [
    {
      id: 'hero-brand',
      type: 'hero',
      content: 'zero is yours.',
      metadata: { style: 'highlight' }
    },
    {
      id: 'intro',
      type: 'paragraph',
      content: 'Your site started as a copy of mine, so my name is still in it: in bits of text, in links, in file names. This step finds every one of them. A page in your admin area counts them, sorts them by kind, and shows you where each one is. You replace them in order, and when the count reaches zero, the step completes itself. It is the last step, and it is optional: your site runs fine with my name in it. This is for when you want it to be entirely yours.',
      metadata: { dropCap: true }
    },
    {
      id: 'kinds-table',
      type: 'table',
      metadata: {
        headers: ['Kind', 'What it is', 'How you clear it'],
        rows: [
          ['Identity', 'The name unparty in text and data', 'Mostly one file: FoundersConfig.json'],
          ['Domain', 'Links to unparty.app', 'One setting, then the few that remain'],
          ['Projects', 'Pages named theunparty-something', 'Delete them. Never rename'],
          ['Author', 'My name and handles in bylines', 'Put yours in, or remove them'],
          ['File paths', 'Files with unparty in their name', 'Delete or replace each file']
        ]
      }
    },
    {
      id: 'kept-list',
      type: 'list',
      content: '**unppp never counts** — it is the word this app uses for a project, like story or cover. You keep it|**The tools never count** — the page that does the counting and the checker from [Your identity](/article/setup-identity) have to name unparty to work|**The license never counts** — LICENSE.md names who gave you the code|**Everything else counts** — including this setup guide, which is why this step comes last',
      metadata: { style: 'accent' }
    },
    {
      id: 'challenge-brand',
      type: 'challenge',
      userPrompt: 'MAKE IT YOURS.',
      label: 'BUILD.',
      pollEnabled: false,
      stepOne: { emoji: '1️⃣', action: 'Count.', description: 'Open the page and read the number.' },
      stepTwo: { emoji: '2️⃣', action: 'Replace.', description: 'Work down the kinds, in order.' },
      stepThree: { emoji: '3️⃣', action: 'Zero.', description: 'Retire this guide, then reach zero.' },
      successMetric: 'the page says no unparty references remain.'
    },
    {
      id: 'before-list',
      type: 'list',
      content: '**Every other step done** — this one retires the guides you used for them|**You are an admin** — from [Make yourself admin](/article/setup-make-yourself-admin). The page is in your admin area|**Your site deployed from GitHub** — from [Deploy](/article/setup-deploy). The count is made when your site builds, and it needs your GitHub copy to do it',
      metadata: { style: 'accent' }
    },
    {
      id: 'divider-count',
      type: 'divider'
    },
    {
      id: 'count-heading',
      type: 'heading',
      content: '1️⃣ Read Your Number'
    },
    {
      id: 'count-steps',
      type: 'list',
      content: 'Sign in and open **/admin/unparty** on your site|The big number is everything left: text plus file paths|Below it, each kind lists its files, most first. Click a file to see each line|Click **open ↗** to see that exact line in your GitHub copy',
      metadata: { numbered: true }
    },
    {
      id: 'count-when',
      type: 'personal',
      content: 'The number is counted every time your site builds, and every time you run npm run dev. After you change files, push them, and the number updates when Vercel finishes building.'
    },
    {
      id: 'divider-replace',
      type: 'divider'
    },
    {
      id: 'replace-heading',
      type: 'heading',
      content: '2️⃣ Replace in Order'
    },
    {
      id: 'replace-para',
      type: 'paragraph',
      content: 'The order matters, because the early kinds clear the most in one go. Work down the list:'
    },
    {
      id: 'replace-steps',
      type: 'list',
      content: '**Identity first.** Most of it comes from **src/data/FoundersConfig.json**. If you did [Your identity](/article/setup-identity), much of it is gone already. Run **npm run check:identity**: every warning it prints is one more place to change|**Then the domain.** site.url in FoundersConfig.json covers your site\'s own address. What remains are links in text: change or remove each|**Then projects.** Pages, articles and pictures named theunparty-something are my examples. Delete them. Never rename one: its address would change and any link to it would break|**Then author data.** Bylines, author fields and my photo. Put in your own, or remove them|**Then file paths.** Files with unparty in their name, mostly images. Delete each, or replace it with your own file under a new name. If it is your logo, update site.logo in FoundersConfig.json too',
      metadata: { numbered: true }
    },
    {
      id: 'divider-zero',
      type: 'divider'
    },
    {
      id: 'zero-heading',
      type: 'heading',
      content: '3️⃣ Retire This Guide, Then Reach Zero'
    },
    {
      id: 'zero-para',
      type: 'paragraph',
      content: 'What is left at the end is this setup guide itself: the steps in **prisma/setup-steps.ts** and the articles named setup-something. They talk about unparty because I wrote them for you. Now that your copy runs, rewrite them in your own words for your own users, or remove them. Removing them touches a few files that list them, so ask your LLM to help with that.'
    },
    {
      id: 'zero-done',
      type: 'paragraph',
      content: 'When the number reaches zero, open **/admin/unparty** once more. It says no unparty references remain, and this step completes itself.'
    },
    {
      id: 'know-heading',
      type: 'heading',
      content: '⚠️ Good to Know'
    },
    {
      id: 'know-list',
      type: 'list',
      content: '**Never rename a page to clear it** — renaming changes its address. Delete my example pages instead, and make your own|**Some names are kept on purpose** — the keys your visitors\' saved settings live under, like their theme color, keep their names so nobody\'s settings reset. They never count|**The count needs GitHub** — a copy deployed straight from your computer, or downloaded as a ZIP, cannot be counted. The page says not counted here instead of guessing|**It only completes when you look** — the step completes the next time an admin opens the page at zero',
      metadata: { style: 'accent' }
    },
    {
      id: 'trouble-heading',
      type: 'heading',
      content: '🧯 If Something Is Off'
    },
    {
      id: 'trouble-list',
      type: 'list',
      content: '**Not counted here** — your site was not deployed from GitHub. Connect your GitHub copy in Vercel and deploy from it|**Not counted yet** — the count has not run. Run npm run dev once, or deploy|**The number did not change** — the count is made when your site builds. Push your changes and wait for Vercel to finish|**A page broke after a change** — you probably renamed or deleted a file something still uses. Open the page, read the error, and ask your LLM which file points at it'
    },
    {
      id: 'llm-heading',
      type: 'heading',
      content: '🤖 Ask Your LLM'
    },
    {
      id: 'llm-prompts',
      type: 'code',
      content: 'My site is a copy of another app, and I am removing its original\nname. Here is the list of files and lines that still mention it:\n[paste one kind from the page]. For each one, tell me whether to\nchange the text, delete the file, or leave it, and why.\n\nI want to remove the setup guide from my copy of the app: the steps\nin prisma/setup-steps.ts and the setup-* articles. Which other files\nlist them, and what do I change so nothing breaks?',
      metadata: { language: 'prompt', emphasis: true, caption: 'Paste one kind at a time; the lists can be long' }
    },
    {
      id: 'done-heading',
      type: 'heading',
      content: '✅ You Are Done When'
    },
    {
      id: 'done-list',
      type: 'list',
      content: '/admin/unparty shows zero|It says no unparty references remain|This step shows as complete in /admin/steps'
    },
    {
      id: 'closing-para',
      type: 'paragraph',
      content: 'That is the whole curriculum. Every word, picture and page on your site is now yours, and so is everything you build next.'
    },
    {
      id: 'final-quote',
      type: 'quote',
      content: 'It started somewhere. Now it is yours.',
      metadata: { author: 'unparty-app', style: 'minimal' }
    }
  ]
};
