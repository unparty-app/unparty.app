import type { EditorialArticle } from '../types';

// SETUP. curriculum step 5 (prisma/setup-steps.ts, #1094)
// Neon plan details checked against neon.com/pricing on 2026-09-28
export const SETUP_DATABASE_ARTICLE: EditorialArticle = {
  slug: 'setup-database',
  title: 'CREATE YOUR DATABASE.',
  subtitle: 'Optional. When you want your site to remember people: choose a plan, create a Postgres database on Neon, and connect it to your copy.',
  description: 'A step-by-step database setup guide for non-technical founders. Estimate what a Neon Postgres database will cost with an interactive calculator, create your database, copy the pooled and direct connection strings into .env, and create your tables with Prisma.',
  category: 'SETUP.',
  date: '2026-09-28',
  updated: '2026-11-02',
  published: true,
  presents: { component: 'DatabaseCalculator' },
  author: 'justin-murry',
  readTime: '8 min',
  tags: ['Database', 'Postgres', 'Neon', 'Prisma', 'Setup', 'Non-Technical Founders', 'Software You Own'],
  sections: [
    {
      id: 'hero-memory',
      type: 'hero',
      content: 'give your site a memory.',
      metadata: { style: 'highlight' }
    },
    {
      id: 'intro',
      type: 'paragraph',
      content: 'Your site runs without a database: everything you write still shows. What it lacks is memory: the people who sign in, the steps they finish, the questions they answer, the thoughts they leave. Add one when you want those. (Only showing a list? [A Google Sheet](/article/setup-google-sheet) may be all you need.) Yours will be Postgres, run for you by a company called Neon, so you never have to look after a server. In this step you choose a plan, create the database, connect your copy to it, and create its tables.',
      metadata: { dropCap: true }
    },
    {
      id: 'postgres-note',
      type: 'personal',
      content: '(Postgres is the database. Neon is the company that runs it. You rent the running; the data is yours.)'
    },
    {
      id: 'cost-heading',
      type: 'heading',
      content: '🧮 How Much Will It Cost?'
    },
    {
      id: 'cost-para',
      type: 'paragraph',
      content: 'For a new site, most likely nothing. Use the calculator below before you sign up for anything. Start with the **Dev / Personal** scenario, which is where you are today, then move the sliders to see when you would outgrow the free plan:'
    },
    {
      id: 'sliders-list',
      type: 'list',
      content: '**Storage** — how much your site remembers. A brand-new copy uses a few megabytes|**Compute size** — how powerful the database computer is while it is awake. 0.25 CU is plenty to start|**Active hours** — how many hours a month it is awake. Neon puts it to sleep after 5 quiet minutes, so a small site is awake far less than the 744 hours in a month'
    },
    {
      id: 'calculator',
      type: 'component',
      metadata: {
        componentName: 'DatabaseCalculator',
        componentProps: { live: false }
      }
    },
    {
      id: 'calculator-note',
      type: 'personal',
      content: 'Prices come from neon.com/pricing as of September 28, 2026. Check there before you pay for anything.'
    },
    {
      id: 'choose-list',
      type: 'list',
      content: '**Start on Free** — 0.5 GB of storage and 100 compute hours a month is room for a new site, and it costs $0|**Move to Launch** when the calculator says you have outgrown Free. There is no monthly minimum: you pay only for the hours and gigabytes you use|**Skip Scale** for now. It is for sites that need more than 16 CU, which yours will not for a long time',
      metadata: { style: 'accent' }
    },
    {
      id: 'sleep-note',
      type: 'personal',
      content: 'Free databases always sleep after 5 minutes without visitors. The first visit after a quiet spell takes a moment longer while it wakes up. That is normal, not broken.'
    },
    {
      id: 'challenge-database',
      type: 'challenge',
      userPrompt: 'CREATE YOUR DATABASE.',
      label: 'BUILD.',
      pollEnabled: false,
      stepOne: { emoji: '1️⃣', action: 'Create it.', description: 'A Neon project, on the Free plan.' },
      stepTwo: { emoji: '2️⃣', action: 'Connect it.', description: 'Two connection strings in .env.' },
      stepThree: { emoji: '3️⃣', action: 'Fill it.', description: 'Create your tables with one command.' },
      successMetric: 'your site has a memory.'
    },
    {
      id: 'divider-account',
      type: 'divider'
    },
    {
      id: 'account-heading',
      type: 'heading',
      content: '1️⃣ Create Your Neon Account'
    },
    {
      id: 'account-para',
      type: 'paragraph',
      content: 'Go to [neon.com](https://neon.com) and sign up. Use the same business email as your GitHub account, or sign in with GitHub, so everything about your build lives under one identity. You do not need a credit card for the Free plan.'
    },
    {
      id: 'project-heading',
      type: 'heading',
      content: '2️⃣ Create Your Database'
    },
    {
      id: 'project-steps',
      type: 'list',
      content: 'Create a new **project**. Neon makes the database inside it for you|**Project name** — your site name, the same one you gave your repository|**Postgres version** — leave the default|**Region** — choose **AWS US East (N. Virginia)**. Your live site will run in Washington, D.C. by default, and a database next door answers faster|Click **Create project**',
      metadata: { numbered: true }
    },
    {
      id: 'strings-heading',
      type: 'heading',
      content: '3️⃣ Copy Your Two Connection Strings'
    },
    {
      id: 'strings-para',
      type: 'paragraph',
      content: 'A **connection string** is your database\'s address and password in one line. Your copy needs two versions of it. Your site uses a **pooled** connection, which lets many visitors share the database at once. The setup tools use a **direct** connection, which they need to create tables. On your project dashboard:'
    },
    {
      id: 'strings-steps',
      type: 'list',
      content: 'Click **Connect**|With **Connection pooling** turned on, copy the string. This is your **DATABASE_URL**. Its address contains **-pooler**|Turn **Connection pooling** off and copy the string again. This is your **DIRECT_DATABASE_URL**. It is the same line without **-pooler**',
      metadata: { numbered: true }
    },
    {
      id: 'strings-note',
      type: 'personal',
      content: 'If Neon offers a ready-made Prisma snippet, it may call the second one DIRECT_URL. In your copy it has to be named DIRECT_DATABASE_URL.'
    },
    {
      id: 'env-heading',
      type: 'heading',
      content: '4️⃣ Put Them in .env'
    },
    {
      id: 'env-para',
      type: 'paragraph',
      content: 'In the top folder of your copy (the one with **package.json** in it), create a file named **.env**. The name starts with a dot and has nothing after "env". Paste both strings into it, each inside quotes:'
    },
    {
      id: 'env-code',
      type: 'code',
      content: '# .env (git ignores this file, so it never leaves your computer)\nDATABASE_URL="postgresql://…@ep-your-project-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"\nDIRECT_DATABASE_URL="postgresql://…@ep-your-project.us-east-1.aws.neon.tech/neondb?sslmode=require"',
      metadata: { language: 'bash', caption: 'Yours will have your own username, password, and project name where these show …' }
    },
    {
      id: 'env-why',
      type: 'paragraph',
      content: 'Every key your site needs goes in this one **.env** file: your site and the tool that creates your tables both read it. Git ignores it, so it stays on your computer. Never commit it, and never rename it to something git does not ignore.'
    },
    {
      id: 'tables-heading',
      type: 'heading',
      content: '5️⃣ Create Your Tables'
    },
    {
      id: 'tables-para',
      type: 'paragraph',
      content: 'Your database is empty. One command builds every table your site needs, from the plan in **prisma/schema.prisma**. A second adds the setup steps you are following right now, so your site can track them with you:'
    },
    {
      id: 'tables-code',
      type: 'code',
      content: '# Create every table your site needs\nnpm run db:push\n\n# Add the SETUP. steps you are following right now\nnpm run db:seed:setup',
      metadata: { language: 'bash', emphasis: true, caption: 'Run these inside your copy, in the same terminal you used for npm run dev' }
    },
    {
      id: 'tables-results',
      type: 'list',
      content: '**db:push** ends with "Your database is now in sync with your Prisma schema"|**db:seed:setup** prints "SETUP. curriculum seeded", then a note that no one can see the steps yet. That is expected: you give yourself access in **Make yourself admin**, then run it once more'
    },
    {
      id: 'seed-warning',
      type: 'quote',
      content: 'Never run npm run db:seed on a database with real data. It deletes steps and progress before it starts. db:seed:setup is safe to run any time.',
      metadata: { author: 'unparty-app', style: 'highlight' }
    },
    {
      id: 'restart-para',
      type: 'paragraph',
      content: 'Stop your site with **Ctrl + C** and start it again with **npm run dev**. It now has a database to read from.'
    },
    {
      id: 'divider-secret',
      type: 'divider'
    },
    {
      id: 'secret-heading',
      type: 'heading',
      content: '🔑 Your Connection Strings Are Passwords'
    },
    {
      id: 'secret-list',
      type: 'list',
      content: 'Anyone with a connection string can read and delete everything in your database|Never paste one into a chat, an email, or a regular file. When you ask an LLM about an error, delete the part between **postgresql://** and **@** first|If one leaks, reset the password in Neon (**Roles** on your project dashboard), then copy both new strings into **.env** again',
      metadata: { style: 'accent' }
    },
    {
      id: 'llm-heading',
      type: 'heading',
      content: '🤖 Ask Your LLM'
    },
    {
      id: 'llm-prompts',
      type: 'code',
      content: 'I ran npm run db:push and got this error: [paste it, with the\npassword part of any connection string removed]. What does it\nmean, and what should I check first?\n\nRead prisma/schema.prisma and tell me, in plain words, what my\nsite stores about the people who use it.\n\nUsing the Neon pricing page, tell me when a site with [describe\nyour traffic] would outgrow the Free plan.',
      metadata: { language: 'prompt', emphasis: true, caption: 'Describe your keys; never paste them' }
    },
    {
      id: 'done-heading',
      type: 'heading',
      content: '✅ You Are Done When'
    },
    {
      id: 'done-list',
      type: 'list',
      content: 'You have a Neon project, and you know which plan it is on (Free is fine)|**.env** has both strings, and only **DATABASE_URL** contains **-pooler**|**npm run db:push** says your database is in sync|**npm run db:seed:setup** says the SETUP. curriculum was seeded'
    },
    {
      id: 'closing-para',
      type: 'paragraph',
      content: 'Your site has a memory. **Already live?** Put both strings in Vercel, add a **CRON_SECRET** the way **Deploy** shows, and redeploy. Sign-in comes next if you want it: [Add sign-in](/article/setup-sign-in), then [Make yourself admin](/article/setup-make-yourself-admin), and this checklist appears inside your site with your progress saved.'
    },
    {
      id: 'final-quote',
      type: 'quote',
      content: 'A site that remembers is a site you can build on.',
      metadata: { author: 'unparty-app', style: 'minimal' }
    }
  ]
};
