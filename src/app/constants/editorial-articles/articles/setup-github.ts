import type { EditorialArticle } from '../types';

// SETUP. curriculum step 1 (prisma/setup-steps.ts, #1094)
export const SETUP_GITHUB_ARTICLE: EditorialArticle = {
  slug: 'setup-github',
  title: 'SET UP GITHUB.',
  subtitle: 'Give your copy of unparty-app a home: one account, two-factor authentication, and recovery codes you can find when you need them.',
  description: 'A step-by-step GitHub setup guide for non-technical founders and small business owners. Create a GitHub account, choose a username you can keep, turn on two-factor authentication, and store your recovery codes, so your codebase has a safe home before you receive your copy of unparty-app.',
  category: 'SETUP.',
  date: '2026-09-28',
  updated: '2026-11-02',
  published: true,
  author: 'justin-murry',
  readTime: '5 min',
  tags: ['GitHub', 'Two-Factor Authentication', 'Setup', 'Non-Technical Founders', 'Software You Own'],
  sections: [
    {
      id: 'hero-home',
      type: 'hero',
      content: 'your code needs a home.',
      metadata: { style: 'highlight' }
    },
    {
      id: 'intro',
      type: 'paragraph',
      content: 'Your copy of unparty-app lives on GitHub. It is where you receive it, where every change you make gets saved with its history, and where your live site gets published from. You do not need to know how to code, or even what git is, to finish this step. You need an account, and you need it locked down, because soon it will hold your business.',
      metadata: { dropCap: true }
    },
    {
      id: 'drive-note',
      type: 'personal',
      content: '(GitHub is to code what Google Drive is to documents: storage that remembers every version.)'
    },
    {
      id: 'what-heading',
      type: 'heading',
      content: '🧭 What GitHub Does for You'
    },
    {
      id: 'what-list',
      type: 'list',
      content: '**Receives your copy** — your repository gets shared to your GitHub account|**Remembers everything** — every change is saved as a commit you can look back at, compare, or undo|**Publishes your site** — Vercel watches your repository and deploys whenever it changes|**Keeps it private** — free accounts include private repositories, so no one sees your code unless you invite them'
    },
    {
      id: 'challenge-setup',
      type: 'challenge',
      userPrompt: 'SET UP GITHUB.',
      label: 'BUILD.',
      pollEnabled: false,
      stepOne: { emoji: '1️⃣', action: 'Sign up.', description: 'Pick a username you would put on a business card.' },
      stepTwo: { emoji: '2️⃣', action: 'Add 2FA.', description: 'Password plus a code from your phone.' },
      stepThree: { emoji: '3️⃣', action: 'Save codes.', description: 'Somewhere that is not your phone.' },
      successMetric: 'your code has a home.'
    },
    {
      id: 'divider-account',
      type: 'divider'
    },
    {
      id: 'account-heading',
      type: 'heading',
      content: '1️⃣ Create Your Account'
    },
    {
      id: 'account-para',
      type: 'paragraph',
      content: 'Go to [github.com/signup](https://github.com/signup). If you already have a GitHub account, sign in and skip to two-factor authentication. GitHub asks for three things:'
    },
    {
      id: 'account-list',
      type: 'list',
      content: '**Email** — use one you will keep for years, like your business email. Password resets and security alerts go here|**Password** — long and unique. A password manager (1Password, Bitwarden, Apple Passwords) will make and remember one for you|**Username** — this is the one that matters. It is public, and it becomes part of the web address for your code: github.com/**your-username**/your-repo. Short, lowercase, and something you would say out loud to a customer'
    },
    {
      id: 'account-verify',
      type: 'paragraph',
      content: 'GitHub emails you a code to verify the address, then asks a few questions about how you plan to use it. Choose the **Free** plan. Nothing in the setup curriculum needs a paid GitHub plan.'
    },
    {
      id: 'username-note',
      type: 'personal',
      content: 'You can change your username later, but it changes those web addresses too. Pick one you can live with now.'
    },
    {
      id: '2fa-heading',
      type: 'heading',
      content: '2️⃣ Turn On Two-Factor Authentication'
    },
    {
      id: '2fa-para',
      type: 'paragraph',
      content: 'Two-factor authentication (2FA) means signing in takes your password **and** a code from your phone. Your repository is about to hold your website, your content, and the settings that connect it to services you pay for. A stolen password alone should not be enough to get in. GitHub will ask you to turn it on eventually anyway, so do it now while you are here:'
    },
    {
      id: '2fa-steps',
      type: 'list',
      content: 'Click your profile picture in the top-right corner, then **Settings**|In the left sidebar, open **Password and authentication**|Under Two-factor authentication, click **Enable two-factor authentication**|Scan the QR code with an authenticator app (Google Authenticator, Microsoft Authenticator, 1Password, or the one built into Apple Passwords)|Type the 6-digit code the app shows to confirm',
      metadata: { numbered: true }
    },
    {
      id: 'recovery-heading',
      type: 'heading',
      content: '3️⃣ Save Your Recovery Codes'
    },
    {
      id: 'recovery-para',
      type: 'paragraph',
      content: 'Right after you enable 2FA, GitHub shows you a list of **recovery codes**. If you ever lose or replace your phone, these codes are the only way back into your account. Download them and keep them somewhere that is not your phone: your password manager, or printed and filed with your business paperwork.'
    },
    {
      id: 'recovery-quote',
      type: 'quote',
      content: 'Losing your phone should be an inconvenience, not the end of your business.',
      metadata: { author: 'unparty-app', style: 'highlight' }
    },
    {
      id: 'divider-secrets',
      type: 'divider'
    },
    {
      id: 'secrets-heading',
      type: 'heading',
      content: '🔑 What Never Goes on GitHub'
    },
    {
      id: 'secrets-para',
      type: 'paragraph',
      content: 'Optional steps later give you keys and passwords for things like a database, sign-in, and payments. Those never belong in your repository, even a private one. Your copy of unparty-app already keeps them out for you:'
    },
    {
      id: 'secrets-list',
      type: 'list',
      content: 'Keys live in one file called **.env** on your computer, and in Vercel\'s settings for your live site|Your copy is set up so git ignores every **.env** file, which means they are never uploaded|If you ever paste a key into a regular file by accident and push it, treat that key as leaked: create a new one in that service and delete the old one',
      metadata: { style: 'accent' }
    },
    {
      id: 'llm-heading',
      type: 'heading',
      content: '🤖 Ask Your LLM'
    },
    {
      id: 'llm-para',
      type: 'paragraph',
      content: 'If you add an LLM partner in the next step, this is a good first conversation. Paste in what you see and ask for the next click:'
    },
    {
      id: 'llm-prompts',
      type: 'code',
      content: 'I just created a GitHub account for my business. Walk me through\nturning on two-factor authentication, one click at a time.\n\nGitHub showed me this message while I was signing up: [paste it].\nWhat does it mean, and what should I do?\n\nExplain what a repository, a commit, and a branch are, using a\nnotebook as the example. Keep it to one paragraph each.',
      metadata: { language: 'prompt', emphasis: true, caption: 'Copy any of these into Claude, or any LLM you use' }
    },
    {
      id: 'done-heading',
      type: 'heading',
      content: '✅ You Are Done When'
    },
    {
      id: 'done-list',
      type: 'list',
      content: 'You can sign in to GitHub with your password **and** a code from your phone|Your recovery codes are saved somewhere that is not your phone|You know your username. You will need it in **Get your copy**, where your repository gets shared to it'
    },
    {
      id: 'closing-para',
      type: 'paragraph',
      content: 'That is the whole step. Next, you can add an LLM partner to help with everything after this, or go straight to getting your copy. Either way, your code has a home now, and it is yours.'
    },
    {
      id: 'final-quote',
      type: 'quote',
      content: 'Own the place your work lives.',
      metadata: { author: 'unparty-app', style: 'minimal' }
    }
  ]
};
