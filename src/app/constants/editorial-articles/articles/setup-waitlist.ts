import type { EditorialArticle } from '../types';

// SETUP. curriculum, optional step `waitlist` (prisma/setup-steps.ts, #1106)
// Off unless FoundersConfig.json says `"waitlist": true` (#914); /admin's Your site
// group switches it (the file locally, a pull request on a deployed copy).
// src/middleware.ts opens /party only when the session's metadata has role 'admin'
// or waitlistStatus 'approved' (the claim from setup-sign-in). Sign-up lands on
// /waitlist/apply (ProblemWorksheet → UserSubmission PENDING via /api/problem/send);
// everyone else is sent to /waitlist/pending. approveSubmission() in src/lib/waitlist.ts
// is the one approval path for /admin/submissions and the optional GitHub Discussion
// webhook (WAITLIST_REPO_* + GITHUB_WEBHOOK_SECRET). Loops emails need the owner's own
// template IDs in .env (LOOPS_*_ID). #726 (edits create a second submission) is open.
export const SETUP_WAITLIST_ARTICLE: EditorialArticle = {
  slug: 'setup-waitlist',
  title: 'LET PEOPLE IN.',
  subtitle: 'Anyone can sign up. You decide who gets into the members area.',
  description: 'How non-technical founders run a waitlist on their own Next.js site: what visitors see after signing up, how their worksheet reaches you, and how to approve them in one click or straight from Clerk.',
  category: 'SETUP.',
  date: '2026-09-30',
  updated: '2026-10-10',
  published: true,
  author: 'justin-murry',
  readTime: '7 min',
  tags: ['Waitlist', 'Members', 'Approval', 'Clerk', 'Setup', 'Non-Technical Founders', 'Software You Own'],
  sections: [
    {
      id: 'hero-waitlist',
      type: 'hero',
      content: 'the door is yours to open.',
      metadata: { style: 'highlight' }
    },
    {
      id: 'intro',
      type: 'paragraph',
      content: 'Your site has a members area at **/party**: each member\'s activity, their photos, their progress. Anyone can sign up, but signing up does not get them in. They join your waitlist by answering a short worksheet about the problem they are working on, and they stay outside until you approve them. You already walked through this door in [Make yourself admin](/article/setup-make-yourself-admin). This step is about opening it for everyone else.',
      metadata: { dropCap: true }
    },
    {
      id: 'switch-para',
      type: 'paragraph',
      content: 'Your copy starts with the waitlist **off**: anyone who signs up can open /party. Turn it on in **/admin**, under **Your site → Waitlist**. On your own computer it switches right away. On your live site it opens a pull request that turns it on once it deploys. You can also set **"waitlist": true** in **src/data/FoundersConfig.json** yourself. With it on, it works like this:'
    },
    {
      id: 'who-table',
      type: 'table',
      metadata: {
        headers: ['Who', 'Gets into /party'],
        rows: [
          ['You, and anyone with role: admin', 'Always'],
          ['Someone you approved', 'Yes, from their next sign-in'],
          ['Someone who signed up and is waiting', 'No. They see where they stand on the waitlist'],
          ['A visitor who is not signed in', 'No. They are asked to sign in']
        ]
      }
    },
    {
      id: 'challenge-waitlist',
      type: 'challenge',
      userPrompt: 'LET PEOPLE IN.',
      label: 'BUILD.',
      pollEnabled: false,
      stepOne: { emoji: '1️⃣', action: 'Join it.', description: 'See it as a visitor does.' },
      stepTwo: { emoji: '2️⃣', action: 'Approve.', description: 'One click in your admin.' },
      stepThree: { emoji: '3️⃣', action: 'Let in.', description: 'They sign in, they are in.' },
      successMetric: 'someone you approved can open /party.'
    },
    {
      id: 'divider-join',
      type: 'divider'
    },
    {
      id: 'join-heading',
      type: 'heading',
      content: '1️⃣ Join Your Own Waitlist'
    },
    {
      id: 'join-para',
      type: 'paragraph',
      content: 'The best way to understand it is to be a visitor once. Open your site in a private browser window, so you are signed out, and sign up with a second email address:'
    },
    {
      id: 'join-steps',
      type: 'list',
      content: 'Click sign-in and choose **Sign up**. After signing up, your site takes you straight to the worksheet at **/waitlist/apply**|Fill it in: an email, a name, the idea\'s name, a target date, and a few questions about the problem. Submit it|Open **/party**. Instead of the members area, you land on **/waitlist/pending**, which says **You\'re on the list.**|That page is where every waiting visitor ends up. It shows their status, and lets them update their worksheet while they wait',
      metadata: { numbered: true }
    },
    {
      id: 'pending-table',
      type: 'table',
      metadata: {
        headers: ['Their status', 'What /waitlist/pending says'],
        rows: [
          ['Waiting', 'You\'re on the list., with a button to update their worksheet'],
          ['Approved', 'You\'re in, with a button to go to /party'],
          ['Not approved', 'Problem not compatible, with a button to update and resubmit'],
          ['No worksheet yet', 'You\'re not on the waitlist yet, with a button to start one']
        ]
      }
    },
    {
      id: 'divider-approve',
      type: 'divider'
    },
    {
      id: 'approve-heading',
      type: 'heading',
      content: '2️⃣ Approve Them'
    },
    {
      id: 'approve-para',
      type: 'paragraph',
      content: 'Go back to your normal window, where you are signed in as yourself. Every worksheet waits for you in one list:'
    },
    {
      id: 'approve-steps',
      type: 'list',
      content: 'Open **localhost:3000/admin/submissions**|Each row is one worksheet, newest first, marked **PENDING**. Read what they wrote|Click **Approve** to let them in, or **Reject** to say not this time|The row turns **APPROVED**. Behind the scenes your site also labels their account **waitlistStatus: approved**, the label the door actually checks',
      metadata: { numbered: true }
    },
    {
      id: 'reject-note',
      type: 'personal',
      content: 'Rejecting is not final. They see **Problem not compatible** with a button to update and resubmit, and a resubmitted worksheet comes back to your list as a new row.'
    },
    {
      id: 'clerk-heading',
      type: 'heading',
      content: '🔑 Or Let Someone In Directly'
    },
    {
      id: 'clerk-para',
      type: 'paragraph',
      content: 'Sometimes you want to let in a friend, a partner or a customer who never filled in a worksheet. Give their account the label yourself, on the same screen where you made yourself admin:'
    },
    {
      id: 'clerk-steps',
      type: 'list',
      content: 'In your Clerk dashboard, open **Users** and click the person|Scroll to **Metadata** and click **Edit** next to **Public**|Add the line below. If something is already there, keep it and add a comma before the new line|Click **Save**',
      metadata: { numbered: true }
    },
    {
      id: 'clerk-code',
      type: 'code',
      content: '{\n  "waitlistStatus": "approved"\n}',
      metadata: { language: 'json', emphasis: true, caption: 'To take it back later, delete this line and save' }
    },
    {
      id: 'divider-in',
      type: 'divider'
    },
    {
      id: 'in-heading',
      type: 'heading',
      content: '3️⃣ They Sign In, They Are In'
    },
    {
      id: 'in-para',
      type: 'paragraph',
      content: 'Your site reads the label when someone signs in, so a person who was already signed in may still be sent to the waitlist for a moment. In your private window:'
    },
    {
      id: 'in-steps',
      type: 'list',
      content: 'Open **/waitlist/pending**. It now says **You\'re in**|Click **Go to /party**. If it sends you back to the waitlist, sign out and sign in again|**/party** opens: the members area, with **MY PHOTOS.** and their activity',
      metadata: { numbered: true }
    },
    {
      id: 'in-quote',
      type: 'quote',
      content: 'Anyone can knock. You choose who comes in.',
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
      content: '**Nobody is told by email yet** — approving someone does not email them until you set up email, a later optional step. Until then, tell them yourself, or let them find **You\'re in** on their next visit|**Editing a worksheet adds a row** — if someone updates their worksheet while waiting, a second row appears in your list. Approve either one; both let them in|**Your photo prompts wait for approval too** — visitors can answer [Photo prompts](/article/setup-file-uploads) before they are approved. Their photos appear under MY PHOTOS. in /party once you let them in|**The live site shares the list** — your computer and your live site use one database, so approving on either one works on both'
    },
    {
      id: 'github-heading',
      type: 'heading',
      content: '🐙 Later: Review in GitHub'
    },
    {
      id: 'github-para',
      type: 'paragraph',
      content: 'unparty reviews its own waitlist in GitHub Discussions: every worksheet opens a discussion in a **Pending** category, and moving it to **Approve** lets the person in, the same as the button. Your copy can do the same once your site is connected to GitHub, which the GitHub repo discovery step sets up. It is optional; the button does everything on its own.'
    },
    {
      id: 'trouble-heading',
      type: 'heading',
      content: '🧯 If Something Is Off'
    },
    {
      id: 'trouble-list',
      type: 'list',
      content: '**You approved them, but /party still sends them to the waitlist** — they need to sign out and in again. If that does not help, open them in Clerk: Public metadata should show **"waitlistStatus": "approved"**. If it does not, add it by hand as above|**Even you are sent to the waitlist** — your admin label is missing, or the session token from [Add sign-in](/article/setup-sign-in) is not set. See [Make yourself admin](/article/setup-make-yourself-admin)|**/admin/submissions is empty** — no one has submitted a worksheet yet, or you are signed in as your test account. Sign in as yourself|**Approve and Reject are missing on a row** — they only appear on rows marked PENDING'
    },
    {
      id: 'llm-heading',
      type: 'heading',
      content: '🤖 Ask Your LLM'
    },
    {
      id: 'llm-prompts',
      type: 'code',
      content: 'Here are the worksheets waiting on my waitlist: [paste them].\nMy site is for [describe who it is for]. Which of these fit best,\nand what one question would you ask each person before approving?\n\nSomeone says they were approved but cannot open /party on my\nsite. Walk me through what to check in Clerk, step by step.',
      metadata: { language: 'prompt', emphasis: true, caption: 'It can help you read. Who gets in is your call' }
    },
    {
      id: 'done-heading',
      type: 'heading',
      content: '✅ You Are Done When'
    },
    {
      id: 'done-list',
      type: 'list',
      content: 'Your test account signed up, filled in the worksheet, and saw **You\'re on the list.**|Its row appeared in **/admin/submissions**, and you approved it|After signing in again, your test account opened **/party**|You know how to let someone in straight from Clerk'
    },
    {
      id: 'closing-para',
      type: 'paragraph',
      content: 'Your members area is no longer just yours. You decide who joins it, one worksheet at a time, and everyone who is waiting knows exactly where they stand.'
    },
    {
      id: 'final-quote',
      type: 'quote',
      content: 'A waitlist is a promise: we read every one.',
      metadata: { author: 'unparty-app', style: 'minimal' }
    }
  ]
};
