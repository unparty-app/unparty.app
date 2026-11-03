import type { EditorialArticle } from '../types';

// SETUP. curriculum step 14 (prisma/setup-steps.ts, #1094)
// ./create-article (bash; Git Bash on Windows) writes the file, appends an export to
// index.ts and registers it in EDITORIAL_ARTICLES (getEditorialArticle only serves TS
// articles listed there, so an unregistered one 404s). /article sorts newest first.
export const SETUP_FIRST_ARTICLE_ARTICLE: EditorialArticle = {
  slug: 'setup-first-article',
  title: 'YOUR FIRST ARTICLE.',
  subtitle: 'Longer writing, built from sections. Like the page you are reading.',
  description: 'How non-technical founders publish an article on their own Next.js site: create and register it with one command, fill in its sections, check it with the type checker, and push it live with GitHub Desktop.',
  category: 'SETUP.',
  date: '2026-09-29',
  published: true,
  author: 'justin-murry',
  readTime: '7 min',
  tags: ['Articles', 'Writing', 'TypeScript', 'Setup', 'Non-Technical Founders', 'Software You Own'],
  sections: [
    {
      id: 'hero-article',
      type: 'hero',
      content: 'built from blocks. read as one.',
      metadata: { style: 'highlight' }
    },
    {
      id: 'intro',
      type: 'paragraph',
      content: 'A story is one page of words under a picture. An **article** is longer, and it is built from **sections**: a headline, paragraphs, headings, lists, quotes, tables, code. This page is one. Every setup step you have read was written the way you are about to write yours, in a file that lists its sections in order.',
      metadata: { dropCap: true }
    },
    {
      id: 'files-table',
      type: 'table',
      metadata: {
        headers: ['File', 'What it holds'],
        rows: [
          ['articles/my-first-article.ts', 'Your article: its details and its sections'],
          ['registry.ts', 'The list of articles your site shows. The command adds yours'],
          ['index.ts', 'A line the command adds for you. Leave it alone']
        ]
      }
    },
    {
      id: 'challenge-article',
      type: 'challenge',
      userPrompt: 'YOUR FIRST ARTICLE.',
      label: 'BUILD.',
      pollEnabled: false,
      stepOne: { emoji: '1️⃣', action: 'Create.', description: 'One command asks the questions.' },
      stepTwo: { emoji: '2️⃣', action: 'Write it.', description: 'Fill in the sections.' },
      stepThree: { emoji: '3️⃣', action: 'Check it.', description: 'One check, then push.' },
      successMetric: 'your article has its own page.'
    },
    {
      id: 'divider-create',
      type: 'divider'
    },
    {
      id: 'create-heading',
      type: 'heading',
      content: '1️⃣ Create the File'
    },
    {
      id: 'create-para',
      type: 'paragraph',
      content: 'Your copy has a small program that asks you a few questions, writes the article file, and adds it to your site\'s list of articles. On a Mac, run it in Terminal inside your copy. On Windows, open **Git Bash** from the Start menu (it came with git), move into your copy with **cd**, and run it there:'
    },
    {
      id: 'create-code',
      type: 'code',
      content: '# Answer the questions it asks, then press Enter\n./create-article',
      metadata: { language: 'bash', emphasis: true, caption: 'Press Enter to skip any optional question' }
    },
    {
      id: 'answers-table',
      type: 'table',
      metadata: {
        headers: ['It asks', 'Answer with', 'Why'],
        rows: [
          ['Slug', 'my-first-article', 'Your article\'s address. Lowercase words joined by dashes'],
          ['Export const name', 'Press Enter', 'The name your code uses for it. The suggestion is right'],
          ['Title', 'Your headline', 'Shown at the top and in search results'],
          ['Description', 'One sentence', 'What Google and link previews show'],
          ['Category', 'A short label, like NOTES.', 'Groups your articles'],
          ['Published?', 'y', 'n keeps it hidden as a draft'],
          ['Author', 'Your name', 'The byline']
        ]
      }
    },
    {
      id: 'create-done',
      type: 'paragraph',
      content: 'It finishes by printing the file it made and a **Registered:** line with a name in capitals, like **MY_FIRST_ARTICLE**. That line means your site will show the article once you write it.'
    },
    {
      id: 'write-heading',
      type: 'heading',
      content: '2️⃣ Write It'
    },
    {
      id: 'write-para',
      type: 'paragraph',
      content: 'Open **src/app/constants/editorial-articles/articles/my-first-article.ts**. At the top are your answers. Below them, under **sections**, is a **hero** (your big opening line) and a long menu of other section types, each switched off with **//** at the start of the line. Change the hero, then switch sections on by deleting the **//** and filling in the **...**:'
    },
    {
      id: 'write-code',
      type: 'code',
      content: '  coverImage: \'/covers/cover-001.png\',   // your cover, across the top\n  sections: [\n    {\n      id: \'hero\',\n      type: \'hero\',\n      content: \'WHY I STARTED.\',\n      metadata: { size: \'large\', emphasis: true }\n    },\n    { id: \'intro\', type: \'paragraph\', content: \'Every section needs its own id.\', metadata: { dropCap: true } },\n    { id: \'heading-1\', type: \'heading\', content: \'What Changed\' },\n    { id: \'list-1\', type: \'list\', content: \'First thing|Second thing|Third thing\' },\n    { id: \'quote-1\', type: \'quote\', content: \'Say the true thing.\', metadata: { style: \'highlight\' } },',
      metadata: { language: 'typescript', emphasis: true, caption: 'Add coverImage below the author line. Each section sits between { and }, followed by a comma' }
    },
    {
      id: 'rules-heading',
      type: 'heading',
      content: '✍️ Five Rules for Section Text'
    },
    {
      id: 'rules-list',
      type: 'list',
      content: '**Apostrophes need a backslash** — the text sits between single quotes, so **it\'s** must be typed as **it\\\'s**. Or write around it: **it is**|**Every id is different** — **intro**, **heading-1**, **heading-2**. Two sections with the same id confuse the page|**List items are split by the pipe character** — the tall straight line (Shift + backslash on most keyboards). An item itself can never contain one|**Bold and links work in paragraphs and lists** — two stars for **bold**, and [words](/article/setup-first-story) for a link|**A drop cap takes the first letter** — so start that paragraph with a plain letter, not a symbol or a star',
      metadata: { style: 'accent' }
    },
    {
      id: 'list-heading',
      type: 'heading',
      content: '3️⃣ Check It and Publish'
    },
    {
      id: 'check-para',
      type: 'paragraph',
      content: 'Let your copy check your work. This reads every file and reports anything that does not fit together: a missing comma, an unescaped apostrophe, a name typed two ways:'
    },
    {
      id: 'check-code',
      type: 'code',
      content: '# Check the whole project (takes about a minute)\nnpx tsc --noEmit',
      metadata: { language: 'bash', emphasis: true, caption: 'No output at all means everything checks out' }
    },
    {
      id: 'check-errors',
      type: 'paragraph',
      content: 'If it prints errors, each one starts with a file name and two numbers: the line and the column. Open that file, go to that line, and fix what it describes. Then run it again until it prints nothing.'
    },
    {
      id: 'view-para',
      type: 'paragraph',
      content: 'Start your site with **npm run dev** and check:'
    },
    {
      id: 'view-list',
      type: 'list',
      content: '**localhost:3000/article/my-first-article** shows your article, with your cover and every section you switched on|**localhost:3000/article** lists it near the top. Newest articles come first, and **search articles** finds it by title',
      metadata: { numbered: true }
    },
    {
      id: 'push-para',
      type: 'paragraph',
      content: 'In GitHub Desktop, the **Changes** list should hold three files: your article, **registry.ts** and **index.ts**. Write a summary like "Publish my first article", click **Commit to main**, then **Push origin**.'
    },
    {
      id: 'publish-quote',
      type: 'quote',
      content: 'Headline, sections, done. The same way this page was made.',
      metadata: { author: 'unparty-app', style: 'highlight' }
    },
    {
      id: 'divider-trouble',
      type: 'divider'
    },
    {
      id: 'trouble-heading',
      type: 'heading',
      content: '🧯 If Something Is Off'
    },
    {
      id: 'trouble-list',
      type: 'list',
      content: '**The page says 404** — **published** is **false**, or the command could not register it: it says so when it finishes, and prints what to add to **registry.ts** yourself|**tsc says "Cannot find name"** — you renamed the name in capitals in your article file. Change it back, or change it in **registry.ts** to match|**The command says the name is already used** — another article has that name in capitals. Run it again and type a different one when it asks for the export name|**tsc says "Unterminated string literal"** — an apostrophe ended your text early. Add a backslash before it|**./create-article says "Permission denied"** — run **bash create-article** instead|**Windows says ./create-article is not recognized** — you are in PowerShell. Use Git Bash for this one command'
    },
    {
      id: 'llm-heading',
      type: 'heading',
      content: '🤖 Ask Your LLM'
    },
    {
      id: 'llm-prompts',
      type: 'code',
      content: 'Here is a draft I wrote: [paste it]. Tighten it without changing\nmy voice, and split it into a headline, short paragraphs, two or\nthree headings, and one list.\n\n(In Claude Code, inside your copy)\nTurn my draft into sections in\nsrc/app/constants/editorial-articles/articles/my-first-article.ts\nand run npx tsc --noEmit until it prints nothing. Do not change\nmy words.',
      metadata: { language: 'prompt', emphasis: true, caption: 'Your words, your voice. Let it do the typing, not the thinking' }
    },
    {
      id: 'done-heading',
      type: 'heading',
      content: '✅ You Are Done When'
    },
    {
      id: 'done-list',
      type: 'list',
      content: 'Your article file has your headline and at least a paragraph, a heading and a list|The command printed a **Registered** line, and **npx tsc --noEmit** prints nothing|**/article/my-first-article** shows it on your computer and on your live site|It is near the top of **/article**'
    },
    {
      id: 'closing-para',
      type: 'paragraph',
      content: 'Stories and articles are what you publish. Next is **Your first project page**: a page of its own for something you are building, the way unparty has one for each of its projects.'
    },
    {
      id: 'final-quote',
      type: 'quote',
      content: 'One section at a time. That is how every page here was built.',
      metadata: { author: 'unparty-app', style: 'minimal' }
    }
  ]
};
