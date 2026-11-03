import type { EditorialArticle } from '../types';

// SETUP. curriculum step 15 (prisma/setup-steps.ts, #1094)
// ./create-page writes src/app/<name>/page.tsx (UnpppPageShell + EditorialArticle, with
// metadata and cover taken from the article) and adds the route to STATIC_ROUTES in
// src/lib/site-routes.ts, since only /theunparty* folders are discovered for the sitemap.
// Deliberately no AboutComponent: it reads UnpppsConfig.json, which a buyer's project
// does not have (the founder page comes from FoundersConfig, #832 / #589).
export const SETUP_FIRST_PROJECT_PAGE_ARTICLE: EditorialArticle = {
  slug: 'setup-first-project-page',
  title: 'YOUR FIRST PROJECT PAGE.',
  subtitle: 'An article lives in the article list. A project page lives at an address of its own.',
  description: 'How non-technical founders give one of their projects its own page on their Next.js site: create it with one command from an article they already wrote, check it, and push it live with GitHub Desktop.',
  category: 'SETUP.',
  date: '2026-09-29',
  published: true,
  author: 'justin-murry',
  readTime: '5 min',
  tags: ['Project Page', 'Pages', 'Next.js', 'Setup', 'Non-Technical Founders', 'Software You Own'],
  sections: [
    {
      id: 'hero-project-page',
      type: 'hero',
      content: 'one project. one address.',
      metadata: { style: 'highlight' }
    },
    {
      id: 'intro',
      type: 'paragraph',
      content: 'Your article sits at **/article/my-first-article**, one of many in a list. A **project page** is different: it gets a short address of its own, like **/my-project**, that you can print on a card or put in your bio. On unparty, every project has one. This step gives your first project its page, built from the article you wrote in the last step.',
      metadata: { dropCap: true }
    },
    {
      id: 'pieces-table',
      type: 'table',
      metadata: {
        headers: ['What', 'Where', 'Who writes it'],
        rows: [
          ['The page', 'src/app/my-project/page.tsx', 'The command'],
          ['What it shows', 'Your article (and its cover)', 'You, in the last step'],
          ['The sitemap entry', 'src/lib/site-routes.ts', 'The command, so search engines find it']
        ]
      }
    },
    {
      id: 'challenge-project-page',
      type: 'challenge',
      userPrompt: 'YOUR FIRST PROJECT PAGE.',
      label: 'BUILD.',
      pollEnabled: false,
      stepOne: { emoji: '1️⃣', action: 'Name it.', description: 'A short address for your project.' },
      stepTwo: { emoji: '2️⃣', action: 'Create.', description: 'One command, two answers.' },
      stepThree: { emoji: '3️⃣', action: 'Ship it.', description: 'Check it, then push.' },
      successMetric: 'your project has its own address.'
    },
    {
      id: 'divider-name',
      type: 'divider'
    },
    {
      id: 'name-heading',
      type: 'heading',
      content: '1️⃣ Pick the Address'
    },
    {
      id: 'name-para',
      type: 'paragraph',
      content: 'The page name becomes the address: **my-project** becomes **yourname.com/my-project**. Choose it like you would a street name, because changing it later breaks every link people have shared:'
    },
    {
      id: 'name-list',
      type: 'list',
      content: '**Short and lowercase** — letters and numbers, with dashes between words: **bakery**, **spring-menu**, **studio-2026**|**Named after the project, not the page** — **bakery**, not **bakery-page**|**Not already taken** — your copy already uses names like **article**, **covers**, **founders** and **admin**. The command tells you if yours is|**Not starting with theunparty** — those names belong to the projects that came with your copy'
    },
    {
      id: 'create-heading',
      type: 'heading',
      content: '2️⃣ Create the Page'
    },
    {
      id: 'create-para',
      type: 'paragraph',
      content: 'Like **./create-article**, this is a small program that asks questions and writes the file. On a Mac, run it in Terminal inside your copy. On Windows, use **Git Bash**:'
    },
    {
      id: 'create-code',
      type: 'code',
      content: '# Answer the two questions it asks\n./create-page',
      metadata: { language: 'bash', emphasis: true, caption: 'It stops with an error, and changes nothing, if an answer does not fit' }
    },
    {
      id: 'answers-table',
      type: 'table',
      metadata: {
        headers: ['It asks', 'Answer with'],
        rows: [
          ['Page name', 'The address you picked, like my-project'],
          ['Article to show', 'Your article\'s name in capitals, like MY_FIRST_ARTICLE. It is the name ./create-article printed']
        ]
      }
    },
    {
      id: 'create-result',
      type: 'paragraph',
      content: 'It prints the file it made and a **Sitemap** line. The page takes everything from your article: its title, its description, its cover, and its link preview. There is nothing to fill in. Edit the article later, and the page changes with it.'
    },
    {
      id: 'cover-note',
      type: 'personal',
      content: 'No picture at the top? Your article has no coverImage. Add the line from Your first article, and the page picks it up.'
    },
    {
      id: 'ship-heading',
      type: 'heading',
      content: '3️⃣ Check It and Ship It'
    },
    {
      id: 'check-code',
      type: 'code',
      content: '# Check the whole project (no output means it is fine)\nnpx tsc --noEmit\n\n# Start your site\nnpm run dev',
      metadata: { language: 'bash', emphasis: true }
    },
    {
      id: 'check-list',
      type: 'list',
      content: '**localhost:3000/my-project** shows your article, with its cover|**The browser tab** shows your article\'s title|**localhost:3000/sitemap.xml** lists **/my-project**. Search engines will find it|**A private window** opens it too. Project pages are public, like articles',
      metadata: { numbered: true }
    },
    {
      id: 'push-para',
      type: 'paragraph',
      content: 'In GitHub Desktop, the **Changes** list should hold two files: your new **page.tsx** and **site-routes.ts**. Write a summary like "Add my first project page", click **Commit to main**, then **Push origin**. A few minutes later, **yourname.com/my-project** is live.'
    },
    {
      id: 'ship-quote',
      type: 'quote',
      content: 'An address you can say out loud. That is a project page.',
      metadata: { author: 'unparty-app', style: 'highlight' }
    },
    {
      id: 'divider-next',
      type: 'divider'
    },
    {
      id: 'warn-heading',
      type: 'heading',
      content: '⚠️ Good to Know'
    },
    {
      id: 'warn-list',
      type: 'list',
      content: '**Your article stays where it was** — it now lives at two addresses: in the article list and on the project page. That is expected|**unparty\'s project pages show more** — effort charts, repository stats, onboarding steps. Those read data about unparty\'s own projects, so yours starts with just the article|**Renaming means a new page** — to change the address, run **./create-page** again with the new name, then delete the old folder and its line in **site-routes.ts**. Old links stop working|**Your founder page is its own step** — the page about you, at **/founders**, is filled in during **Make it yours: identity**',
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
      content: '**"is not registered"** — the article name does not match one in **registry.ts**. Copy it exactly from what **./create-article** printed, capitals and all|**"already exists"** — pick another page name. Your copy uses that one|**"use lowercase letters, numbers and dashes only"** — no spaces or capitals in the page name|**The page says 404** — the article is **published: false**. Project pages hide drafts, just like the article list. Set it to true|**Windows says ./create-page is not recognized** — you are in PowerShell. Use Git Bash for this one command'
    },
    {
      id: 'llm-heading',
      type: 'heading',
      content: '🤖 Ask Your LLM'
    },
    {
      id: 'llm-prompts',
      type: 'code',
      content: 'I am making a web page for my project, [describe it]. Suggest five\nshort, lowercase addresses for it, like bakery or spring-menu, and\nsay which is easiest to remember.\n\n(In Claude Code, inside your copy)\nRun ./create-page with the page name [my-project] and the article\n[MY_FIRST_ARTICLE], run npx tsc --noEmit, and tell me the address.',
      metadata: { language: 'prompt', emphasis: true, caption: 'Pick the name yourself. It is the part people will remember' }
    },
    {
      id: 'done-heading',
      type: 'heading',
      content: '✅ You Are Done When'
    },
    {
      id: 'done-list',
      type: 'list',
      content: '**./create-page** printed your file and a **Sitemap** line|**npx tsc --noEmit** prints nothing|**/my-project** shows your article, with its cover, on your computer and on your live site|**/sitemap.xml** on your live site lists it'
    },
    {
      id: 'closing-para',
      type: 'paragraph',
      content: 'Your copy runs, it is live at your own address, it knows you own it, and it holds your cover, your story, your article, and your first project page. One required step remains, and it is the last: **Make it yours: identity**, where your founder page and your name replace unparty\'s everywhere. After that, the optional steps add payments, email, uploads and more, one at a time, whenever you need them.'
    },
    {
      id: 'final-quote',
      type: 'quote',
      content: 'Everything here started as somebody else\'s. Now it is yours.',
      metadata: { author: 'unparty-app', style: 'minimal' }
    }
  ]
};
