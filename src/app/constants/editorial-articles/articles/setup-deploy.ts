import type { EditorialArticle } from '../types';

// SETUP. curriculum step 10 (prisma/setup-steps.ts, #1094)
// Replaces docs/guides/DEPLOYMENT.md + src/app/theunpartyapp/VERCEL_ENV_SETUP.md for buyers.
// Checked against the code: a copy builds and runs with no keys (src/lib/clerk-on.ts,
// src/lib/db-on.ts), `npm run build` never migrates, Stripe is unused, and the five
// vercel.json crons fail closed in production without CRON_SECRET (src/app/api/cron/*/route.ts).
// Keys are only for a builder who has already added the optional steps.
export const SETUP_DEPLOY_ARTICLE: EditorialArticle = {
  slug: 'setup-deploy',
  title: 'DEPLOY.',
  subtitle: 'Used the button? Your site is already live, and this is how it stays that way. If not, put it on the internet, where anyone can open it.',
  description: 'How non-technical founders deploy their own Next.js site to Vercel: import the GitHub repository, deploy with no keys, and check the live site. If you added a database or sign-in, paste those keys into Vercel with a CRON_SECRET for the scheduled jobs.',
  category: 'SETUP.',
  date: '2026-09-29',
  updated: '2026-11-03',
  published: true,
  author: 'justin-murry',
  readTime: '7 min',
  tags: ['Deploy', 'Vercel', 'Environment Variables', 'Cron Jobs', 'Setup', 'Non-Technical Founders', 'Software You Own'],
  sections: [
    {
      id: 'hero-deploy',
      type: 'hero',
      content: 'off your laptop. onto the internet.',
      metadata: { style: 'highlight' }
    },
    {
      id: 'intro',
      type: 'paragraph',
      content: 'Until now, your site has only lived at **localhost:3000**, an address that works on your computer and nowhere else. This step gives it a real address anyone can open. **Vercel** does the work: it watches your repository on GitHub, builds your site whenever the code changes, and serves it to the world. You set it up once, and from then on, publishing is a push.',
      metadata: { dropCap: true }
    },
    {
      id: 'button-note',
      type: 'personal',
      content: '(Used the button in [Get your copy](/article/setup-get-your-copy)? Your repository is already connected and live. Skip to **What Changes Now**. Keys you add later still go in Vercel, as **2️⃣** shows.)'
    },
    {
      id: 'where-table',
      type: 'table',
      metadata: {
        headers: ['On your computer', 'On the internet'],
        rows: [
          ['localhost:3000', 'your-site.vercel.app (your own domain in the next step)'],
          ['Your keys in .env, if you added any', 'The same keys in Vercel\'s Environment Variables'],
          ['npm run dev', 'Vercel builds and runs it for you after every push']
        ]
      }
    },
    {
      id: 'challenge-deploy',
      type: 'challenge',
      userPrompt: 'DEPLOY.',
      label: 'BUILD.',
      pollEnabled: false,
      stepOne: { emoji: '1️⃣', action: 'Connect.', description: 'Point Vercel at your repository.' },
      stepTwo: { emoji: '2️⃣', action: 'Key it.', description: 'Only if you added any.' },
      stepThree: { emoji: '3️⃣', action: 'Ship it.', description: 'Deploy, then check it live.' },
      successMetric: 'your site has a real address.'
    },
    {
      id: 'divider-connect',
      type: 'divider'
    },
    {
      id: 'connect-heading',
      type: 'heading',
      content: '1️⃣ Connect Your Repository'
    },
    {
      id: 'connect-para',
      type: 'paragraph',
      content: 'Go to [vercel.com](https://vercel.com) and sign up with **Continue with GitHub**, using the same GitHub account that holds your copy. Signing in through GitHub is what lets Vercel see your repository and rebuild it when it changes.'
    },
    {
      id: 'plan-note',
      type: 'personal',
      content: 'Vercel asks you to pick a plan. The free **Hobby** plan is for personal, non-commercial projects. If your site is for a business or makes money, Vercel\'s terms call for **Pro**. Compare them at [vercel.com/pricing](https://vercel.com/pricing), and choose knowing what your site is for.'
    },
    {
      id: 'connect-steps',
      type: 'list',
      content: 'In your Vercel dashboard, click **Add New…** and choose **Project**|Find your repository under **Import Git Repository** and click **Import**|Not in the list? Your repository is private, so Vercel needs permission first. Click **Adjust GitHub App Permissions**, choose **Only select repositories**, pick yours, and save|On the next screen, leave the settings as they are: Vercel recognizes **Next.js** and uses your copy\'s own build command|**No keys to add?** Skip to 3️⃣ and click **Deploy**. It needs none',
      metadata: { numbered: true }
    },
    {
      id: 'keys-heading',
      type: 'heading',
      content: '2️⃣ Your Keys, If You Have Any'
    },
    {
      id: 'keys-para',
      type: 'paragraph',
      content: 'Your site needs no keys to go live. **Have no .env file? Skip to 3️⃣.** Added a database or sign-in already? Your **.env** file never leaves your computer, so Vercel has never seen your keys, and you give them to it directly. First, one new key. With a database, your site runs five small jobs once a day, like clearing out visitor data older than 30 days. Vercel starts each job and sends a password along with it, so your site knows the request really came from Vercel. That password is **CRON_SECRET**, and you make it yourself:'
    },
    {
      id: 'cron-code',
      type: 'code',
      content: '# Prints a long random password (works on Mac and Windows)\nnode -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"',
      metadata: { language: 'bash', emphasis: true, caption: 'Copy what it prints. Anything long and random works' }
    },
    {
      id: 'cron-env',
      type: 'code',
      content: '# .env\nCRON_SECRET="the-long-random-string-it-printed"',
      metadata: { language: 'bash', caption: 'Keep .env as the one complete list of your keys' }
    },
    {
      id: 'paste-para',
      type: 'paragraph',
      content: 'Now hand all of them to Vercel at once. Back on the import screen:'
    },
    {
      id: 'paste-steps',
      type: 'list',
      content: 'Open the **Environment Variables** section|Open **.env** in your editor, select everything, and copy it|Click into the first **Key** box and paste. Vercel splits the file into one row per key|Check each value: no quote marks around it, no spaces at either end',
      metadata: { numbered: true }
    },
    {
      id: 'keys-table',
      type: 'table',
      metadata: {
        headers: ['Key', 'From which step'],
        rows: [
          ['DATABASE_URL', 'Create your database (the one with -pooler)'],
          ['DIRECT_DATABASE_URL', 'Create your database'],
          ['NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', 'Add sign-in'],
          ['CLERK_SECRET_KEY', 'Add sign-in'],
          ['FOUNDER_USER_ID', 'Make yourself admin'],
          ['CRON_SECRET', 'This step']
        ]
      }
    },
    {
      id: 'keys-note',
      type: 'paragraph',
      content: 'Add the rows you have, and leave out the rest. Later steps add more, like payments and email, and each one goes in both places: **.env** and Vercel. A key added after your first deploy needs a redeploy before your site sees it.'
    },
    {
      id: 'ship-heading',
      type: 'heading',
      content: '3️⃣ Deploy and Check It Live'
    },
    {
      id: 'ship-para',
      type: 'paragraph',
      content: 'Click **Deploy**. Vercel copies your code, runs the same build your copy was tested with, and publishes the result. The first build takes a few minutes. The log scrolls a lot, and two lines in it look like problems but are not: **Swift not available, using pre-generated colors** and **ffprobe not available, using pre-generated video metadata**. Your copy ships with those files already made.'
    },
    {
      id: 'ship-check',
      type: 'paragraph',
      content: 'When Vercel celebrates, open your new address (it ends in **.vercel.app**) and walk it the way you did in **First run**:'
    },
    {
      id: 'ship-list',
      type: 'list',
      content: 'The homepage opens, at an address anyone can visit|An article opens, and **/admin** sends you to sign in|In Vercel, open your project\'s **Settings**. Under **Build and Deployment**, **Node.js Version** says **24.x**, the same version as your computer|**If you added sign-in:** sign in with your usual account. Your computer and your live site share the same sign-in and the same database, so you are already admin|**If you added a database:** under **Cron Jobs**, click **Run** next to **/api/cron/db-cleanup**, then check **Logs**: it should answer without **Unauthorized**',
      metadata: { numbered: true }
    },
    {
      id: 'ship-quote',
      type: 'quote',
      content: 'Same code, same you. Now with an address.',
      metadata: { author: 'unparty-app', style: 'highlight' }
    },
    {
      id: 'divider-changes',
      type: 'divider'
    },
    {
      id: 'changes-heading',
      type: 'heading',
      content: '⚠️ What Changes Now'
    },
    {
      id: 'changes-list',
      type: 'list',
      content: '**Pushing to main publishes** — every time you push to your main branch in GitHub Desktop, Vercel rebuilds and your live site updates within minutes. Anything you push is live|**Other branches get a preview** — push a different branch and Vercel gives it its own private test address, leaving your live site alone|**Changing a key needs a redeploy** — edit a value in Vercel\'s Environment Variables, then open **Deployments**, click **⋯** on the newest one, and choose **Redeploy**|**One database, two sites, if you added one** — your computer and your live site read and write the same database. Delete a step on localhost and it is gone from the live site too|**Sign-in says Development mode, if you added it** — you are still using Clerk\'s development keys. That is fine for now. The domain step switches you to production keys|**Five jobs answer Unauthorized in your logs** — they run once a day and have nothing to do without a database. Harmless',
      metadata: { style: 'accent' }
    },
    {
      id: 'trouble-heading',
      type: 'heading',
      content: '🧯 If the Build Fails'
    },
    {
      id: 'trouble-list',
      type: 'list',
      content: '**Sign in says no sign-in here yet on your live site, after you added it** — the two Clerk keys are missing or swapped in Vercel. The one starting **pk_** is the publishable key. Fix them, then redeploy|**The site builds but pages say they cannot reach the database** — a value probably kept its quote marks or picked up a space. Edit it, then redeploy|**A cron job answers Unauthorized** — **CRON_SECRET** is missing in Vercel, or you changed it without redeploying'
    },
    {
      id: 'llm-heading',
      type: 'heading',
      content: '🤖 Ask Your LLM'
    },
    {
      id: 'llm-prompts',
      type: 'code',
      content: 'My Next.js site failed to build on Vercel. Here is the end of the\nbuild log: [paste the last 40 lines]. What went wrong, in plain\nwords, and what should I change in Vercel? Do not ask me for my keys.\n\nRead vercel.json and the files in src/app/api/cron/ in this project.\nExplain in plain words what each scheduled job does and what\nhappens if CRON_SECRET is missing.',
      metadata: { language: 'prompt', emphasis: true, caption: 'Build logs are safe to paste. Your keys are not' }
    },
    {
      id: 'done-heading',
      type: 'heading',
      content: '✅ You Are Done When'
    },
    {
      id: 'done-list',
      type: 'list',
      content: 'Your project in Vercel is connected to your repository and its latest deployment says **Ready**|Your **.vercel.app** address opens your homepage and your articles|If you added any keys, Vercel has them too, with a **CRON_SECRET** that also sits in **.env**'
    },
    {
      id: 'closing-para',
      type: 'paragraph',
      content: 'Your site is live. Next is **Your domain**: trading **.vercel.app** for an address that is yours.'
    },
    {
      id: 'final-quote',
      type: 'quote',
      content: 'Built on your computer. Running for everyone.',
      metadata: { author: 'unparty-app', style: 'minimal' }
    }
  ]
};
