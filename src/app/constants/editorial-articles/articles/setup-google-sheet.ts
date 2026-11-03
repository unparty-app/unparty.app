import type { EditorialArticle } from '../types';

// SETUP. optional step `google-sheet` (prisma/setup-steps.ts, #1106), and the
// home of BookTable (#1433). Books was unparty's first database: a Google
// Sheet, later moved to Postgres (scripts/migrate-books.ts). This shows the
// sheet way with those books. Reading takes the published CSV link
// (BOOKS_SHEET_CSV_URL, src/lib/sheet.ts); writing is optional and takes a
// service account (GOOGLE_SHEETS_ID + GOOGLE_SERVICE_ACCOUNT_EMAIL +
// GOOGLE_PRIVATE_KEY, src/lib/sheet-write.ts). Without a link, the table
// reads public/setup-google-sheet/books-sample.csv.
export const SETUP_GOOGLE_SHEET_ARTICLE: EditorialArticle = {
  slug: 'setup-google-sheet',
  title: 'A SHEET IS A DATABASE.',
  subtitle: 'Your site runs without a database. To show a list, a Google Sheet is free, already familiar, and your site can read it.',
  description: 'How to use a Google Sheet as a free database for your own site: lay out the rows, publish the sheet as a CSV link, connect it with one line in .env, and filter it like a database. Shown with the books read while building unparty.',
  category: 'SETUP.',
  date: '2026-10-30',
  updated: '2026-11-02',
  published: true,
  author: 'justin-murry',
  readTime: '6 min',
  presents: { component: 'BookTable', needs: [] },
  tags: ['Google Sheets', 'Database', 'Books', 'Setup', 'Non-Technical Founders', 'Software You Own'],
  sections: [
    {
      id: 'hero-sheet',
      type: 'hero',
      content: 'a sheet is a database.',
      metadata: { style: 'highlight' }
    },
    {
      id: 'intro',
      type: 'paragraph',
      content: 'Your site runs without a database, and a list you show may never need one. A Google Sheet is free with any Google account, you already know how to use it, and your site can read it. Below are the books I read while building unparty, read from a sheet. Ask them something:',
      metadata: { dropCap: true }
    },
    {
      id: 'books',
      type: 'component',
      metadata: { componentName: 'BookTable' }
    },
    {
      id: 'books-note',
      type: 'paragraph',
      content: 'These books are references to research I used at the start of building unparty. I have no relationship with their authors or publishers, I am not selling them, and they were not used to train any AI.'
    },
    {
      id: 'questions-heading',
      type: 'heading',
      content: 'every filter is a question.',
      metadata: { line: true }
    },
    {
      id: 'questions-para',
      type: 'paragraph',
      content: 'Each pill asks the same rows something different, the way you query a database: which books are **missing a quote**, which are written **in all caps**, which **have a publisher**, which are **available**. Fix a row in the sheet and the answer changes on your site. No code, no database to run.'
    },
    {
      id: 'challenge-sheet',
      type: 'challenge',
      userPrompt: 'A SHEET IS A DATABASE.',
      label: 'BUILD.',
      pollEnabled: false,
      stepOne: { emoji: '1️⃣', action: 'Make it.', description: 'One row of headings, one row a book.' },
      stepTwo: { emoji: '2️⃣', action: 'Publish.', description: 'Turn the sheet into a link.' },
      stepThree: { emoji: '3️⃣', action: 'Connect.', description: 'One line in .env.' },
      successMetric: 'your site reads your sheet.'
    },
    {
      id: 'divider-make',
      type: 'divider'
    },
    {
      id: 'make-heading',
      type: 'heading',
      content: '1️⃣ Make the Sheet'
    },
    {
      id: 'make-para',
      type: 'paragraph',
      content: 'Go to [sheets.new](https://sheets.new) to start a blank sheet. Type these headings across the first row, then one book per row under them. Only title and author are needed; leave any other cell empty.'
    },
    {
      id: 'make-code',
      type: 'code',
      content: 'title,author,quote,page,publisher,publisher link,available,condition',
      metadata: { language: 'csv', emphasis: true, caption: 'Any order, any capitals. For available, type yes or no' }
    },
    {
      id: 'make-sample',
      type: 'paragraph',
      content: 'Or start from mine: [download the sample](/setup-google-sheet/books-sample.csv), then in your blank sheet choose **File → Import → Upload** and pick the file.'
    },
    {
      id: 'publish-heading',
      type: 'heading',
      content: '2️⃣ Publish It'
    },
    {
      id: 'publish-list',
      type: 'list',
      content: 'In your sheet, choose **File → Share → Publish to web**|Under **Link**, pick the tab that holds your books|Change **Web page** to **Comma-separated values (.csv)**|Click **Publish**, confirm, and copy the link it shows',
      metadata: { numbered: true }
    },
    {
      id: 'publish-para',
      type: 'paragraph',
      content: 'The link ends in **output=csv**. Anyone who has it can read the sheet, so it only ever holds what your site shows anyway.'
    },
    {
      id: 'connect-heading',
      type: 'heading',
      content: '3️⃣ Connect It'
    },
    {
      id: 'connect-para',
      type: 'paragraph',
      content: 'Open **.env** in your copy and add the link on its own line:'
    },
    {
      id: 'connect-code',
      type: 'code',
      content: 'BOOKS_SHEET_CSV_URL="https://docs.google.com/spreadsheets/d/e/your-link/pub?gid=0&single=true&output=csv"',
      metadata: { language: 'bash', emphasis: true, caption: 'Restart npm run dev after saving .env' }
    },
    {
      id: 'connect-check',
      type: 'paragraph',
      content: 'Open this article on your own site: under the table it now says **read from your google sheet.** For your live site, add the same line in Vercel under **Settings → Environment Variables**, then redeploy.'
    },
    {
      id: 'publish-quote',
      type: 'quote',
      content: 'Rows you can already edit, read by a site you own.',
      metadata: { author: 'unparty-app', style: 'highlight' }
    },
    {
      id: 'write-heading',
      type: 'heading',
      content: '✍️ Write to It (Optional)'
    },
    {
      id: 'write-para',
      type: 'paragraph',
      content: 'Reading needs nothing else. To add books from your site instead of the sheet, give your site its own Google account to write with, called a service account. It is free too.'
    },
    {
      id: 'write-list',
      type: 'list',
      content: 'At [console.cloud.google.com](https://console.cloud.google.com), create a project|In **APIs & Services**, enable the **Google Sheets API**|In **Credentials**, create a **service account**, then add a **JSON key** to it and download the file|In your sheet, click **Share** and add the service account\'s email as an **Editor**',
      metadata: { numbered: true }
    },
    {
      id: 'write-code',
      type: 'code',
      content: '# The id is the long part of your sheet\'s address, between /d/ and /edit\nGOOGLE_SHEETS_ID="your-sheet-id"\nGOOGLE_SERVICE_ACCOUNT_EMAIL="client_email from the JSON file"\nGOOGLE_PRIVATE_KEY="private_key from the JSON file"',
      metadata: { language: 'bash', emphasis: true, caption: 'Signed in as yourself, the table now ends with add a book.' }
    },
    {
      id: 'divider-warn',
      type: 'divider'
    },
    {
      id: 'warn-heading',
      type: 'heading',
      content: '⚠️ Before You Rely on It'
    },
    {
      id: 'warn-list',
      type: 'list',
      content: '**Published means public** — anyone with the link reads every cell. Keep emails, addresses and anything private out of it|**Edits take a few minutes** — Google republishes the link, then your site reads it again every five minutes|**The first row is the headings** — rename one and that column goes blank on your site|**The JSON key is a password** — it goes in .env, which never leaves your computer, and in Vercel. Never in the sheet or in Git',
      metadata: { style: 'accent' }
    },
    {
      id: 'trouble-heading',
      type: 'heading',
      content: '🧯 If It Looks Wrong'
    },
    {
      id: 'trouble-list',
      type: 'list',
      content: '**It still says sample sheet** — .env was not saved, or npm run dev was not restarted|**The sheet did not answer** — the link is not the published CSV one. It ends in output=csv, not /edit|**A column is empty** — its heading is spelled differently. Check the first row|**add a book. never shows** — writing needs all three Google lines in .env, and you signed in as yourself|**Adding says it could not write** — the sheet is not shared with the service account email as an Editor'
    },
    {
      id: 'outgrow-heading',
      type: 'heading',
      content: '🌱 When You Outgrow It'
    },
    {
      id: 'outgrow-para',
      type: 'paragraph',
      content: 'A sheet is a great first database for a list you show: books, events, products, links. When your site needs sign-ins, private data, or people saving their own progress, that is a real database: [create your database](/article/setup-database). This site\'s own /books page made that move and reads Postgres. Both work; pick the one your build needs.'
    },
    {
      id: 'llm-heading',
      type: 'heading',
      content: '🤖 Ask Your LLM'
    },
    {
      id: 'llm-prompts',
      type: 'code',
      content: 'I keep a list of [what you keep] in a Google Sheet. Suggest the column\nheadings for it, one row per item, and which ones my site should filter by.\n\n(In Claude Code, inside your copy)\nAdd BOOKS_SHEET_CSV_URL to my .env with this link: [paste it].\nThen open /article/setup-google-sheet and tell me what the table reads from.',
      metadata: { language: 'prompt', emphasis: true, caption: 'Your list, your columns. Let it suggest, then you decide' }
    },
    {
      id: 'done-heading',
      type: 'heading',
      content: '✅ You Are Done When'
    },
    {
      id: 'done-list',
      type: 'list',
      content: 'Your sheet has a row of headings and at least one book|The table on this article, on your site, says read from your google sheet.|Each filter shows the rows you expect, and a fix in the sheet shows up within a few minutes|(Optional) Signed in, add a book. puts a new row in your sheet'
    },
    {
      id: 'final-quote',
      type: 'quote',
      content: 'Start with the database you already have.',
      metadata: { author: 'unparty-app', style: 'minimal' }
    }
  ]
};
