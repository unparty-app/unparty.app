import type { EditorialArticle } from '../types';

// SETUP. curriculum step 6 (prisma/setup-steps.ts `sign-in`, #1094).
// The session-token claim is required by src/middleware.ts and
// src/utils/roles.ts, which read sessionClaims.metadata.{role,waitlistStatus}.
// Dashboard paths and JSON checked 2026-09-28 against
// clerk.com/docs/guides/secure/basic-rbac. Recheck when editing.
export const SETUP_SIGN_IN_ARTICLE: EditorialArticle = {
  slug: 'setup-sign-in',
  title: 'ADD SIGN-IN.',
  subtitle: 'Optional. When you want people to sign in: connect your own keys, turn on the one setting your copy depends on, and create the first account on your site, yours.',
  description: 'How non-technical founders connect Clerk authentication to a Next.js site: create a Clerk application, choose sign-in methods, copy the publishable and secret keys into .env, add public metadata to the session token for roles, and sign up as the first user.',
  category: 'SETUP.',
  date: '2026-09-28',
  updated: '2026-11-03',
  published: true,
  author: 'justin-murry',
  readTime: '7 min',
  tags: ['Clerk', 'Authentication', 'Sign In', 'Setup', 'Non-Technical Founders'],
  sections: [
    {
      id: 'hero-door',
      type: 'hero',
      content: 'your door, your keys.',
      metadata: { style: 'highlight' }
    },
    {
      id: 'intro',
      type: 'paragraph',
      content: 'Your site runs without sign-in: everyone can read it, and **/admin** and **/party** stay locked, even for you. Signing in is what opens them, so add it when you want them. This step creates your own sign-in service with Clerk, connects it with two keys, and makes you the first person to sign up.',
      metadata: { dropCap: true }
    },
    {
      id: 'clerk-note',
      type: 'personal',
      content: '(Clerk handles passwords, email codes, and "Continue with Google" so your site never stores a password itself.)'
    },
    {
      id: 'challenge-sign-in',
      type: 'challenge',
      userPrompt: 'ADD SIGN-IN.',
      label: 'BUILD.',
      pollEnabled: false,
      stepOne: { emoji: '1️⃣', action: 'Make an app.', description: 'Your own Clerk application.' },
      stepTwo: { emoji: '2️⃣', action: 'Add keys.', description: 'Two keys in your .env file.' },
      stepThree: { emoji: '3️⃣', action: 'Sign up.', description: 'Be the first account on your site.' },
      successMetric: 'your site knows you.'
    },
    {
      id: 'divider-app',
      type: 'divider'
    },
    {
      id: 'app-heading',
      type: 'heading',
      content: '1️⃣ Create Your Clerk Application'
    },
    {
      id: 'app-para',
      type: 'paragraph',
      content: 'Go to [dashboard.clerk.com](https://dashboard.clerk.com) and sign up. Continuing with GitHub is quickest, since you already have that account. Then create an application:'
    },
    {
      id: 'app-steps',
      type: 'list',
      content: '**Application name** — your site or business name. Visitors see it on your sign-in screen|**Sign-in options** — turn on **Email** and, if you like, **Google**. You can change these any time|Click **Create application**',
      metadata: { numbered: true }
    },
    {
      id: 'app-personal',
      type: 'personal',
      content: 'Clerk\'s free plan is enough to get started. Check clerk.com/pricing as your membership grows.'
    },
    {
      id: 'keys-heading',
      type: 'heading',
      content: '2️⃣ Put Your Keys in .env'
    },
    {
      id: 'keys-para',
      type: 'paragraph',
      content: 'Clerk shows your keys right after you create the application, and you can find them again any time under **API keys** in the dashboard. You need two of them. Add both to the same **.env** file that already holds your database strings:'
    },
    {
      id: 'keys-code',
      type: 'code',
      content: '# .env\nNEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_…"\nCLERK_SECRET_KEY="sk_test_…"',
      metadata: { language: 'bash', caption: 'Paste your own keys between the quotes. The names must match exactly' }
    },
    {
      id: 'keys-list',
      type: 'list',
      content: '**The publishable key (pk_…)** is meant to be public. Your site sends it to every visitor\'s browser, so it is safe to see|**The secret key (sk_…)** is not. Anyone who has it can act as your site. It never goes in a chat, an email, or any file except .env|**test means development.** Keys starting with pk_test and sk_test are for your computer. You get live keys (pk_live, sk_live) when you deploy and connect your domain',
      metadata: { style: 'accent' }
    },
    {
      id: 'claims-heading',
      type: 'heading',
      content: '🔑 The One Setting Your Copy Needs'
    },
    {
      id: 'claims-para',
      type: 'paragraph',
      content: 'Your copy decides who is an admin, and who gets into the members area (**/party**) if you run a waitlist, by reading two labels on each account: **role** and **waitlistStatus**. Clerk keeps those labels on the account but does not send them to your site unless you ask. Ask once, now:'
    },
    {
      id: 'claims-steps',
      type: 'list',
      content: 'In the Clerk dashboard, open **Sessions**|Find **Customize session token** and open its claims editor|Paste the text below, replacing anything already there, and click **Save**',
      metadata: { numbered: true }
    },
    {
      id: 'claims-code',
      type: 'code',
      content: '{\n  "metadata": "{{user.public_metadata}}"\n}',
      metadata: { language: 'json', emphasis: true, caption: 'From Clerk\'s role-based access guide, and exactly what your copy expects' }
    },
    {
      id: 'claims-why',
      type: 'personal',
      content: 'Skip this and nothing breaks today. Then in the next step you make yourself an admin, and your site keeps treating you like a stranger.'
    },
    {
      id: 'signup-heading',
      type: 'heading',
      content: '3️⃣ Sign Up on Your Own Site'
    },
    {
      id: 'signup-para',
      type: 'paragraph',
      content: 'Restart your site so it picks up the new keys: click the terminal, press **Ctrl + C**, then run **npm run dev** again. **Sign in** now takes you to a real sign-in page instead of "no sign-in here yet". Then:'
    },
    {
      id: 'signup-steps',
      type: 'list',
      content: 'Open **http://localhost:3000/sign-up** and create your account, with the same email you have used for everything else|Back in the Clerk dashboard, open **Users**. You are the first one|Open **http://localhost:3000/party**. It sends you to a "pending" page. That is correct, and the next step fixes it',
      metadata: { numbered: true }
    },
    {
      id: 'pending-para',
      type: 'paragraph',
      content: 'Anyone can sign up, and **/party** opens for anyone signed in. If you turn on the waitlist later, only approved members and admins get in. **/admin** is only for admins, and right now that is nobody, including you. **Make yourself admin** is next.'
    },
    {
      id: 'divider-safe',
      type: 'divider'
    },
    {
      id: 'trouble-heading',
      type: 'heading',
      content: '🧯 If Something Looks Wrong'
    },
    {
      id: 'trouble-list',
      type: 'list',
      content: '**Sign in still says "no sign-in here yet"** — the site did not see your keys. Check that both names match exactly, the keys are inside quotes, and you restarted with Ctrl + C and npm run dev|**An error mentions the publishable key** — it was cut off when you copied it. Copy it again from **API keys**|**You signed up, but Users in Clerk is empty** — you are looking at a different application. Check the application name at the top of the dashboard'
    },
    {
      id: 'llm-heading',
      type: 'heading',
      content: '🤖 Ask Your LLM'
    },
    {
      id: 'llm-prompts',
      type: 'code',
      content: 'I added Clerk keys to .env in a Next.js project and restarted it, but\n[describe what you see]. Here is the terminal output: [paste it].\nDo not ask me for my secret key. What should I check?\n\n(In Claude Code, inside your copy)\nRead src/middleware.ts and src/types/globals.d.ts. Explain in plain\nwords who can open /party and /admin, and why the session token\nsetting matters. Don\'t change anything.',
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
      content: '**.env** has **NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY** and **CLERK_SECRET_KEY**, and **/sign-in** shows a real sign-in page|The session token has the **metadata** claim, saved|You signed up at **/sign-up**, and you appear under **Users** in Clerk|**/party** opens for you once you are signed in'
    },
    {
      id: 'closing-para',
      type: 'paragraph',
      content: 'Next is **Make yourself admin**: one label on your account, and your site starts treating you as its owner. **Already live?** Put both keys in Vercel and redeploy, since your site builds the publishable key in. **On your own domain?** Your live site needs real keys: follow step 3️⃣ of [Your domain](/article/setup-domain).'
    },
    {
      id: 'final-quote',
      type: 'quote',
      content: 'The first account on your site should be yours.',
      metadata: { author: 'unparty-app', style: 'minimal' }
    }
  ]
};
