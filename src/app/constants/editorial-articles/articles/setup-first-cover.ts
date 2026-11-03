import type { EditorialArticle } from '../types';

// SETUP. curriculum step 12 (prisma/setup-steps.ts, #1094)
// docs/guides/ImageHandling.md (the listed source) is about SVG vs PNG, so this is
// written from the code: cover-NNN pairs with story-NNN (generate-placeholder-stories:
// /^cover-\d+\.(png|jpg|svg)$/i), cover-extensions.json is only regenerated at build
// (resolveCoverSrc assumes .png otherwise), COVER_IMAGES in covers-data.ts is a manual
// list whose rows show the first five, and extract-colors (Swift, Mac only) works out
// a palette only for a cover that has none, or one named after --.
export const SETUP_FIRST_COVER_ARTICLE: EditorialArticle = {
  slug: 'setup-first-cover',
  title: 'YOUR FIRST COVER.',
  subtitle: 'Every story on your site starts with a picture. Add your first one.',
  description: 'How non-technical founders add a cover image to their own Next.js site: pick a photo, shrink it under 1MB, name it with the next cover number, register it with two commands and one line of code, and publish it with GitHub Desktop.',
  category: 'SETUP.',
  date: '2026-09-29',
  updated: '2026-11-02',
  published: true,
  author: 'justin-murry',
  readTime: '6 min',
  tags: ['Covers', 'Images', 'Photos', 'Setup', 'Non-Technical Founders', 'Software You Own'],
  sections: [
    {
      id: 'hero-cover',
      type: 'hero',
      content: 'a picture first. words later.',
      metadata: { style: 'highlight' }
    },
    {
      id: 'intro',
      type: 'paragraph',
      content: 'Until now, everything on your site came with your copy. This is the first thing you add yourself. On your site, a **cover** is the picture a story is built around: every story has one, and they share a number. Your cover gets its number in this step. The next step writes the story that goes with it.',
      metadata: { dropCap: true }
    },
    {
      id: 'cover-table',
      type: 'table',
      metadata: {
        headers: ['Your file', 'Where it lives', 'What it pairs with'],
        rows: [
          ['cover-052.jpg', 'public/covers/', 'story-052.md, in the next step'],
          ['Your gallery entry', 'src/app/covers/covers-data.ts', 'The /covers page']
        ]
      }
    },
    {
      id: 'challenge-cover',
      type: 'challenge',
      userPrompt: 'YOUR FIRST COVER.',
      label: 'BUILD.',
      pollEnabled: false,
      stepOne: { emoji: '1️⃣', action: 'Pick it.', description: 'One photo, under 1MB.' },
      stepTwo: { emoji: '2️⃣', action: 'Add it.', description: 'Next number, two commands.' },
      stepThree: { emoji: '3️⃣', action: 'Ship it.', description: 'See it, then push it.' },
      successMetric: 'your picture is on your site.'
    },
    {
      id: 'divider-pick',
      type: 'divider'
    },
    {
      id: 'pick-heading',
      type: 'heading',
      content: '1️⃣ Pick a Photo and Shrink It'
    },
    {
      id: 'pick-para',
      type: 'paragraph',
      content: 'Choose a photo you took or have the rights to. **Wide** photos work best: your site shows covers in a wide frame. Camera and phone photos are far bigger than a website needs, and your copy refuses any cover over **1MB**. Aim for about **2000 pixels** on the long side, saved as a **JPG**:'
    },
    {
      id: 'shrink-list',
      type: 'list',
      content: '**On a Mac** — open it in **Preview**. **Tools → Adjust Size**, set the width to **2000**, click **OK**. Then **File → Export**, choose **JPEG**, and slide **Quality** to the middle|**On Windows** — open it in **Photos**. Click **⋯ → Resize image**, set the long side to **2000**, and save a copy as **JPG**|**From an iPhone** — photos may arrive as **.heic**, which your site cannot use. Exporting from Preview or Photos as above turns them into JPG'
    },
    {
      id: 'add-heading',
      type: 'heading',
      content: '2️⃣ Add It to Your Copy'
    },
    {
      id: 'add-para',
      type: 'paragraph',
      content: 'Open the **public/covers** folder in your copy. Your copy came with numbered covers, so find the highest one: **cover-051.png** if you have not added any. Yours is the next number up. Name your file exactly like this and move it into that folder:'
    },
    {
      id: 'add-name',
      type: 'code',
      content: 'cover-052.jpg',
      metadata: { language: 'text', emphasis: true, caption: 'Lowercase, three digits, a dash. Use .jpg or .png, never .jpeg, .webp or .heic' }
    },
    {
      id: 'register-para',
      type: 'paragraph',
      content: 'Your site keeps a list of every cover and its file type, and a list of each cover\'s colors. The build updates both, but your computer does not, so run the commands yourself. In the terminal, inside your copy:'
    },
    {
      id: 'register-code',
      type: 'code',
      content: '# Record that cover-052 is a .jpg (without this, your site looks for .png)\nnpm run generate-cover-extensions\n\n# Check every cover is under 1MB\nnpm run audit:covers\n\n# Mac only: pick your cover\'s colors (skip on Windows)\nnpm run extract-colors',
      metadata: { language: 'bash', emphasis: true, caption: 'The size check should end with "all within the 1.0MB limit"' }
    },
    {
      id: 'colors-note',
      type: 'personal',
      content: 'The colors command looks at every cover again, not just yours, and its picks shift a little each time. GitHub Desktop will show hundreds of changed lines in cover-colors.json. That is normal. On Windows, skip it: your cover still shows everywhere, and only its link-preview image falls back to default colors.'
    },
    {
      id: 'gallery-para',
      type: 'paragraph',
      content: 'Last, put it in your gallery. Open **src/app/covers/covers-data.ts**, find the line **export const COVER_IMAGES**, and add yours as the first entry right below it. The gallery shows the first five covers in each row, so first is where you will see it:'
    },
    {
      id: 'gallery-code',
      type: 'code',
      content: 'export const COVER_IMAGES: CoverImage[] = [\n  { filename: \'cover-052.jpg\', format: \'jpg\', category: \'unparty\' },\n  // …the covers that were already here',
      metadata: { language: 'typescript', emphasis: true, caption: 'Keep the category as unparty for now' }
    },
    {
      id: 'ship-heading',
      type: 'heading',
      content: '3️⃣ See It, Then Ship It'
    },
    {
      id: 'ship-para',
      type: 'paragraph',
      content: 'Start your site with **npm run dev** and check two places:'
    },
    {
      id: 'ship-list',
      type: 'list',
      content: '**localhost:3000/covers/cover-001.png** shows your photo on its own. The file is in the right place with the right name|**localhost:3000/covers** shows it first in the **unparty** row. Your site knows about it',
      metadata: { numbered: true }
    },
    {
      id: 'push-para',
      type: 'paragraph',
      content: 'Now publish it. In GitHub Desktop, the **Changes** list should hold your photo, **covers-data.ts**, **cover-extensions.json** and, on a Mac, **cover-colors.json**. Write a summary like "Add my first cover", click **Commit to main**, then **Push origin**. A few minutes later it is on your live site too.'
    },
    {
      id: 'ship-quote',
      type: 'quote',
      content: 'The first thing on your site that did not come with it.',
      metadata: { author: 'unparty-app', style: 'highlight' }
    },
    {
      id: 'divider-warn',
      type: 'divider'
    },
    {
      id: 'warn-heading',
      type: 'heading',
      content: '⚠️ Before You Add More'
    },
    {
      id: 'warn-list',
      type: 'list',
      content: '**Leave the covers that came with your copy** — stories, articles and pages point at them by name. Deleting or renaming one breaks whatever uses it. Clearing them out is a later step|**Never reuse a number** — a number already in the folder already has a story|**Nothing stops a big file for you** — your copy checks cover sizes on pull requests, and on commits only if you installed its checks. Pushing straight to main skips both, so run **npm run audit:covers** every time|**A photo is public once pushed** — anything in public/covers can be opened by anyone who guesses the address, even before a story links to it'
    },
    {
      id: 'trouble-heading',
      type: 'heading',
      content: '🧯 If It Does Not Show'
    },
    {
      id: 'trouble-list',
      type: 'list',
      content: '**/covers/cover-001.png says 404** — the file is not in **public/covers**, or its name differs from what you typed: check for **.JPG**, **.jpeg** or a hidden **.jpg.jpg**|**The gallery shows a broken image** — run **npm run generate-cover-extensions** again. Without it, your site looks for **cover-052.png**|**audit:covers lists your file as too big** — shrink it further, or lower the JPEG quality, and run the check again|**npm run extract-colors says swift is not found** — you are on Windows, or Apple\'s Command Line Tools are missing. Skip it; your cover still works|**You replaced a cover\'s picture and its colors stayed** — a cover keeps the colors it has. Name it to pick again: **npm run extract-colors -- cover-052**'
    },
    {
      id: 'llm-heading',
      type: 'heading',
      content: '🤖 Ask Your LLM'
    },
    {
      id: 'llm-prompts',
      type: 'code',
      content: 'I have a photo that is [size] MB and [width] × [height] pixels.\nOn a [Mac / Windows] computer, walk me through making it a JPG\nunder 1MB and about 2000 pixels wide, one click at a time.\n\n(In Claude Code, inside your copy)\nI added public/covers/cover-001.png. Run npm run\ngenerate-cover-extensions and npm run audit:covers, add it as the\nfirst entry in COVER_IMAGES in src/app/covers/covers-data.ts, and\ntell me what changed.',
      metadata: { language: 'prompt', emphasis: true, caption: 'Use your own cover number in place of 052' }
    },
    {
      id: 'done-heading',
      type: 'heading',
      content: '✅ You Are Done When'
    },
    {
      id: 'done-list',
      type: 'list',
      content: '**public/covers** has your photo, named with the next cover number and under 1MB|**npm run audit:covers** ends with **all within the 1.0MB limit**|Your cover is first in the **unparty** row at **/covers**, on your computer and on your live site|The commit with your cover is pushed, and Vercel shows it **Ready**'
    },
    {
      id: 'closing-para',
      type: 'paragraph',
      content: 'Your cover is up, but for now it is just a picture. Next is **Your first story**: the words that go with it, under the same number.'
    },
    {
      id: 'final-quote',
      type: 'quote',
      content: 'Every story here starts with a picture. Yours just did.',
      metadata: { author: 'unparty-app', style: 'minimal' }
    }
  ]
};
