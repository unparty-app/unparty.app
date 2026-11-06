import type { EditorialArticle } from '../types';

// SETUP. curriculum step 8 (prisma/setup-steps.ts, #1094)
// A copy has no accounts at this point: no database, no sign-in, /admin locked
// (src/lib/clerk-on.ts, src/lib/db-on.ts). Those are optional steps now.
export const SETUP_FIRST_RUN_ARTICLE: EditorialArticle = {
  slug: 'setup-first-run',
  title: 'FIRST RUN.',
  subtitle: 'Your copy runs. Start it up and walk through it, so you know what working looks like before you change anything.',
  description: 'How non-technical founders check their own Next.js site on their computer: start it, walk the pages anyone can open, and see that /admin and /party stay locked until they add sign-in.',
  category: 'SETUP.',
  date: '2026-09-29',
  updated: '2026-11-05',
  published: true,
  author: 'justin-murry',
  readTime: '5 min',
  tags: ['First Run', 'Admin', 'npm run dev', 'Setup', 'Non-Technical Founders', 'Software You Own'],
  sections: [
    {
      id: 'hero-first-run',
      type: 'hero',
      content: 'how to party.',
      metadata: { style: 'highlight' }
    },
    {
      id: 'intro',
      type: 'paragraph',
      content: 'Your copy runs. This step changes nothing. It is a walk through your own site, start to finish, so you know what working looks like before you start changing things. When something breaks later, this is what you compare against. It has no database and no sign-in yet, and it does not need them for people to read it.',
      metadata: { dropCap: true }
    },
    {
      id: 'challenge-first-run',
      type: 'challenge',
      userPrompt: 'FIRST RUN.',
      label: 'BUILD.',
      pollEnabled: false,
      stepOne: { emoji: '1️⃣', action: 'Start it.', description: 'Run your site.' },
      stepTwo: { emoji: '2️⃣', action: 'Walk it.', description: 'The pages anyone can open.' },
      stepThree: { emoji: '3️⃣', action: 'Try the locks.', description: 'The doors that stay shut.' },
      successMetric: 'you have seen all of it, working.'
    },
    {
      id: 'divider-start',
      type: 'divider'
    },
    {
      id: 'start-heading',
      type: 'heading',
      content: '1️⃣ Start It Fresh'
    },
    {
      id: 'start-para',
      type: 'paragraph',
      content: 'If your site is still running from the last step, stop it first with **Ctrl + C**. Then, inside your copy:'
    },
    {
      id: 'start-code',
      type: 'code',
      content: '# Switch to your copy\'s Node version (fnm use on Windows)\nnvm use\n\n# Start your site\nnpm run dev\n\n# Then open this in your browser:\n# http://localhost:3000',
      metadata: { language: 'bash', emphasis: true, caption: 'These two commands are all you need every time you come back' }
    },
    {
      id: 'start-note',
      type: 'paragraph',
      content: 'It looks the same as the first time you ran it in **Install the tools**. That is the point: this is your site, whole.'
    },
    {
      id: 'walk-heading',
      type: 'heading',
      content: '2️⃣ Walk Your Site'
    },
    {
      id: 'walk-para',
      type: 'paragraph',
      content: 'Your site has pages anyone can open. Visit each of these:'
    },
    {
      id: 'walk-table',
      type: 'table',
      metadata: {
        headers: ['Visit', 'Who can see it', 'What it proves'],
        rows: [
          ['/', 'Everyone', 'Your homepage runs'],
          ['/article/setup-first-run', 'Everyone', 'Your copy carries every article, including this one'],
          ['/covers', 'Everyone', 'Your pictures are all there'],
          ['/founders', 'Everyone', 'Your site reads its own settings. It still says unparty until the identity step']
        ]
      }
    },
    {
      id: 'locked-heading',
      type: 'heading',
      content: '3️⃣ Try the Locks'
    },
    {
      id: 'locked-para',
      type: 'paragraph',
      content: 'Now try the doors that stay shut. They open for you later, if you want them to:'
    },
    {
      id: 'locked-list',
      type: 'list',
      content: '**localhost:3000/admin** and **localhost:3000/party** send you to sign in|**localhost:3000/sign-in** says **no sign-in here yet**, with the step that connects it',
      metadata: { numbered: true }
    },
    {
      id: 'walk-quote',
      type: 'quote',
      content: 'Open where it should be open. Locked where it should be locked.',
      metadata: { author: 'unparty-app', style: 'highlight' }
    },
    {
      id: 'divider-normal',
      type: 'divider'
    },
    {
      id: 'normal-heading',
      type: 'heading',
      content: '⚠️ Normal on a New Site'
    },
    {
      id: 'normal-list',
      type: 'list',
      content: '**Sign in says no sign-in here yet** — your site has no accounts, so nobody can sign in, you included|**Some sections are empty** — thoughts, votes and books read from a database. Add one when you want them|**Songs have no play button** — Apple Music is not connected, so a song is a link to it. That is an optional step too|**The first visit to each page is slow** — your computer builds each page the first time you open it. The second visit is fast',
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
      content: '**A page shows an error** — stop your site with **Ctrl + C**, run **npm run dev** again, and reload. Still there? Ask your LLM below, with what the terminal printed|**Nothing opens at localhost:3000** — your site may have started somewhere else. The terminal prints its address; **localhost:3001** means something else is using 3000'
    },
    {
      id: 'llm-heading',
      type: 'heading',
      content: '🤖 Ask Your LLM'
    },
    {
      id: 'llm-prompts',
      type: 'code',
      content: 'I am running my copy of a Next.js site with npm run dev. When I\nopen [the page] I see [describe it], and the terminal printed:\n[paste it]. Is this normal for a brand-new site, or is something\nmisconfigured? Do not change anything, and do not ask me for my keys.\n\nRead src/proxy.ts in this project and list, in plain words,\nwhich pages anyone can open and which ones need sign-in or admin.',
      metadata: { language: 'prompt', emphasis: true, caption: 'Paste what the terminal says. Never paste what is in .env' }
    },
    {
      id: 'done-heading',
      type: 'heading',
      content: '✅ You Are Done When'
    },
    {
      id: 'done-list',
      type: 'list',
      content: '**npm run dev** starts your site at **localhost:3000**|The homepage, an article, **/covers** and **/founders** all open|**/admin** and **/party** send you to sign in, and **/sign-in** says **no sign-in here yet**'
    },
    {
      id: 'closing-para',
      type: 'paragraph',
      content: 'You have seen your whole site working, on your own computer. Next is **Deploy**: putting it on the internet, at an address anyone can open. A [database](/article/setup-database), [sign-in](/article/setup-sign-in) and [your admin tools](/article/setup-make-yourself-admin) are there when you want people to sign in, leave thoughts or save their progress.'
    },
    {
      id: 'final-quote',
      type: 'quote',
      content: 'Know what working looks like. Then change it.',
      metadata: { author: 'unparty-app', style: 'minimal' }
    }
  ]
};
