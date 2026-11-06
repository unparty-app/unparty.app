import type { EditorialArticle } from '../types';

// SETUP. curriculum step 7 (prisma/setup-steps.ts, #1094)
// Admin checks read sessionClaims.metadata.role (src/utils/roles.ts, src/proxy.ts),
// which needs the session token claim from the sign-in step. FOUNDER_USER_ID is read by
// prisma/setup-steps.ts (SETUP. access) and /api/founders/responses.
export const SETUP_MAKE_YOURSELF_ADMIN_ARTICLE: EditorialArticle = {
  slug: 'setup-make-yourself-admin',
  title: 'MAKE YOURSELF ADMIN.',
  subtitle: 'One label on your account and one line in .env, and your site starts treating you as its owner.',
  description: 'How non-technical founders make themselves the admin of their own Next.js site: add role admin to your Clerk public metadata, save your Clerk user ID as FOUNDER_USER_ID in .env, re-run the setup seed, and confirm it worked. Plus how to make sure .env is never committed to git.',
  category: 'SETUP.',
  date: '2026-09-28',
  updated: '2026-11-05',
  published: true,
  author: 'justin-murry',
  readTime: '6 min',
  tags: ['Admin', 'Clerk', 'Public Metadata', 'Environment Variables', 'Setup', 'Non-Technical Founders', 'Software You Own'],
  sections: [
    {
      id: 'hero-owner',
      type: 'hero',
      content: 'you own the place. act like it.',
      metadata: { style: 'highlight' }
    },
    {
      id: 'intro',
      type: 'paragraph',
      content: 'This step needs [a database](/article/setup-database) and [sign-in](/article/setup-sign-in) first. You can sign in to your site now, but it does not know you are the owner. It treats you like any new visitor: stuck on the waitlist, locked out of the admin tools, unable to see this checklist. Two small changes fix that. A label on your account tells your site you are an admin. Your account\'s ID in **.env** tells it you are the founder.',
      metadata: { dropCap: true }
    },
    {
      id: 'two-things-table',
      type: 'table',
      metadata: {
        headers: ['What you set', 'Where', 'What it unlocks'],
        rows: [
          ['role: admin', 'Your account, in Clerk', 'The members area (/party) and the admin tools'],
          ['FOUNDER_USER_ID', 'Your .env file', 'This setup checklist and your founder answers']
        ]
      }
    },
    {
      id: 'challenge-admin',
      type: 'challenge',
      userPrompt: 'MAKE YOURSELF ADMIN.',
      label: 'BUILD.',
      pollEnabled: false,
      stepOne: { emoji: '1️⃣', action: 'Label it.', description: 'Add role: admin to your account.' },
      stepTwo: { emoji: '2️⃣', action: 'Claim it.', description: 'Your user ID in .env.' },
      stepThree: { emoji: '3️⃣', action: 'Prove it.', description: 'Sign in again and look around.' },
      successMetric: 'your site knows you own it.'
    },
    {
      id: 'divider-role',
      type: 'divider'
    },
    {
      id: 'role-heading',
      type: 'heading',
      content: '1️⃣ Add the Admin Label'
    },
    {
      id: 'role-para',
      type: 'paragraph',
      content: 'Clerk keeps a small note on every account called **public metadata**. Your site reads one label from it: **role**. In the [Clerk dashboard](https://dashboard.clerk.com):'
    },
    {
      id: 'role-steps',
      type: 'list',
      content: 'Open **Users** and click your own account, the one you signed up with in the last step|Scroll to **Metadata** and click **Edit** next to **Public**|Add the role line shown below, then click **Save**',
      metadata: { numbered: true }
    },
    {
      id: 'role-code',
      type: 'code',
      content: '{\n  "role": "admin"\n}',
      metadata: { language: 'json', emphasis: true, caption: 'If something is already there, like "waitlistStatus", keep it and add a comma before the new line' }
    },
    {
      id: 'role-note',
      type: 'personal',
      content: 'Only give this label to people you would trust with everything. An admin can change every step, article, and setting on your site.'
    },
    {
      id: 'id-heading',
      type: 'heading',
      content: '2️⃣ Save Your User ID in .env'
    },
    {
      id: 'id-para',
      type: 'paragraph',
      content: 'Every Clerk account has an ID that starts with **user_**. You will find yours at the top of your account page in Clerk, next to a copy button. Add it to the same **.env** file that already holds your database strings and Clerk keys:'
    },
    {
      id: 'id-code',
      type: 'code',
      content: '# .env (below your Clerk keys)\nFOUNDER_USER_ID="user_…"',
      metadata: { language: 'bash', caption: 'Paste your own ID between the quotes' }
    },
    {
      id: 'seed-para',
      type: 'paragraph',
      content: 'Now run the setup seed again. Last time it said no one could see the steps. This time it gives them to you:'
    },
    {
      id: 'seed-code',
      type: 'code',
      content: '# Give yourself access to the setup checklist\nnpm run db:seed:setup',
      metadata: { language: 'bash', emphasis: true, caption: 'It should print "FOUNDER_USER_ID granted access to SETUP."' }
    },
    {
      id: 'prove-heading',
      type: 'heading',
      content: '3️⃣ Prove It Worked'
    },
    {
      id: 'prove-para',
      type: 'paragraph',
      content: 'Restart your site with **Ctrl + C** and **npm run dev**. Then **sign out and sign back in**. Your sign-in carries a copy of your labels, and signing in again is the surest way to get a fresh one. Now check three things:'
    },
    {
      id: 'prove-list',
      type: 'list',
      content: '**/party** opens, instead of sending you to the waitlist. Your site sees role: admin|**/admin/steps** lists your steps, including the **SETUP.** ones you are following right now. The admin tools trust you|The seed printed **FOUNDER_USER_ID granted access to SETUP.** Your site knows you are the founder'
    },
    {
      id: 'prove-quote',
      type: 'quote',
      content: 'Same site, same account. Now it knows whose it is.',
      metadata: { author: 'unparty-app', style: 'highlight' }
    },
    {
      id: 'divider-env',
      type: 'divider'
    },
    {
      id: 'env-heading',
      type: 'heading',
      content: '🔒 .env Never Leaves Your Computer'
    },
    {
      id: 'env-para',
      type: 'paragraph',
      content: 'Your **.env** file now holds everything that makes your site yours: the password to your database, the secret key to your sign-in, and your founder ID. It is the one file in your copy that must never be committed. Your copy already protects it: git is told to ignore every **.env** file. Check that for yourself, once:'
    },
    {
      id: 'env-code',
      type: 'code',
      content: '# Should print: .env\ngit check-ignore .env\n\n# Should print nothing\ngit ls-files .env',
      metadata: { language: 'bash', emphasis: true, caption: 'Run these inside your copy. The first prints .env, the second prints nothing' }
    },
    {
      id: 'env-rules',
      type: 'list',
      content: '**Keep the name exactly .env** — git ignores it by name. **keys.txt**, **env.backup**, or **my-keys.env** are not ignored and would be committed|**Watch your Changes list** — in GitHub Desktop, **.env** should never appear. If it ever does, stop and do not commit|**Never force it** — nothing in this setup asks you to add .env to git. If a tool or tutorial does, the answer is no|**If it ever gets committed**, treat every key in it as leaked: reset your Neon password, roll your Clerk secret key, and update .env and Vercel with the new values',
      metadata: { style: 'accent' }
    },
    {
      id: 'trouble-heading',
      type: 'heading',
      content: '🧯 If It Did Not Work'
    },
    {
      id: 'trouble-list',
      type: 'list',
      content: '**/party still sends you to the waitlist** — sign out and back in first. If it still does, check the session token from **Add sign-in**: under **Sessions** in Clerk, the claims must include **"metadata": "{{user.public_metadata}}"**|**/admin/steps is empty or shows an error** — the role did not reach your site. Check the spelling: **"role": "admin"**, lowercase, in **Public** metadata (not Private or Unsafe)|**The seed says FOUNDER_USER_ID is not set** — the line is not in **.env**, or it has a typo in the name. It must be exactly **FOUNDER_USER_ID**, and the file must be named exactly **.env**'
    },
    {
      id: 'llm-heading',
      type: 'heading',
      content: '🤖 Ask Your LLM'
    },
    {
      id: 'llm-prompts',
      type: 'code',
      content: 'I set "role": "admin" in my Clerk public metadata and signed in\nagain, but [describe what happens]. Read src/proxy.ts and\nsrc/utils/roles.ts and tell me what my site checks. Do not change\nanything, and do not ask me for my keys.\n\nRun git check-ignore .env and git ls-files .env in this project\nand tell me in plain words whether my .env file is safe from\nbeing committed.',
      metadata: { language: 'prompt', emphasis: true, caption: 'Your user ID is not a secret, but your keys are. Describe them; never paste them' }
    },
    {
      id: 'done-heading',
      type: 'heading',
      content: '✅ You Are Done When'
    },
    {
      id: 'done-list',
      type: 'list',
      content: 'Your account in Clerk has **"role": "admin"** in its public metadata|**.env** has **FOUNDER_USER_ID**, and **npm run db:seed:setup** says it granted you access|After signing in again, **/party** opens and **/admin/steps** shows the SETUP. steps|**git check-ignore .env** prints **.env**, and **git ls-files .env** prints nothing'
    },
    {
      id: 'closing-para',
      type: 'paragraph',
      content: 'Your site has a memory, it lets people in, and it knows you own it. Open **/admin/steps** to find this checklist inside your site: the **SETUP.** steps list first, and marking one **Completed** keeps your place. **Already live?** Put **FOUNDER_USER_ID** in Vercel and redeploy.'
    },
    {
      id: 'final-quote',
      type: 'quote',
      content: 'The keys stay with you. That is what owning it means.',
      metadata: { author: 'unparty-app', style: 'minimal' }
    }
  ]
};
