import type { EditorialArticle } from '../types';
import { SOURCE_REPO_URL } from '../../organization';

// SETUP. curriculum step 3 (prisma/setup-steps.ts, #1094): the Deploy Button
// first (#1310). The button itself comes from `site.source` in FoundersConfig
export const SETUP_GET_YOUR_COPY_ARTICLE: EditorialArticle = {
  slug: 'setup-get-your-copy',
  title: 'GET YOUR COPY.',
  subtitle: 'One button: your own private repository on your GitHub account, and a live site on your Vercel account.',
  description: 'A step-by-step guide for non-technical founders to get their own copy of this site. Click one button to create a private repository on your GitHub account and put it online with Vercel, then download it with GitHub Desktop when you want to change it. No keys and no terminal required.',
  category: 'SETUP.',
  date: '2026-09-28',
  updated: '2026-11-03',
  published: true,
  author: 'justin-murry',
  readTime: '5 min',
  tags: ['GitHub', 'Vercel', 'GitHub Desktop', 'Visual Studio Code', 'Setup', 'Non-Technical Founders', 'Software You Own'],
  sections: [
    {
      id: 'hero-copy',
      type: 'hero',
      content: 'make your own copy.',
      metadata: { style: 'highlight' }
    },
    {
      id: 'intro',
      type: 'paragraph',
      content: 'One button makes a copy of this whole site that belongs to you: a private repository in your own GitHub account, and a live site on your own Vercel account. It needs no keys. After this, the original can change or disappear, and your copy stays exactly where you put it.',
      metadata: { dropCap: true }
    },
    {
      id: 'already-note',
      type: 'personal',
      content: '(Already reading this on your own site? You did this part. Skip to **Download It**.)'
    },
    {
      id: 'where-heading',
      type: 'heading',
      content: '🧭 Where Your Copy Lives'
    },
    {
      id: 'where-table',
      type: 'table',
      metadata: {
        headers: ['Place', 'What it is', 'Why it matters'],
        rows: [
          ['Your GitHub account', 'A private repository you own', 'The official version of your site, with every change saved'],
          ['Vercel', 'Your live website', 'It publishes whatever is in your GitHub repository'],
          ['Your computer (later)', 'A downloaded copy (a clone)', 'Where you and Claude make changes before they go live']
        ]
      }
    },
    {
      id: 'challenge-copy',
      type: 'challenge',
      userPrompt: 'GET YOUR COPY.',
      label: 'BUILD.',
      pollEnabled: false,
      stepOne: { emoji: '1️⃣', action: 'Click.', description: 'Deploy your copy with one button.' },
      stepTwo: { emoji: '2️⃣', action: 'Check it.', description: 'Open your new site and your new repository.' },
      stepThree: { emoji: '3️⃣', action: 'Open it.', description: 'Download it when you want to change it.' },
      successMetric: 'your copy is live, at an address of its own.'
    },
    {
      id: 'divider-deploy',
      type: 'divider'
    },
    {
      id: 'deploy-heading',
      type: 'heading',
      content: '1️⃣ Click the Button'
    },
    {
      id: 'deploy-button',
      type: 'component',
      metadata: {
        componentName: 'BuildYours',
        componentProps: { deploy: true, action: 'deploy your copy', pitch: 'A private copy on your GitHub, live on your Vercel. It needs no keys.', placement: 'get-your-copy' }
      }
    },
    {
      id: 'deploy-steps',
      type: 'list',
      content: 'Sign in to Vercel with **Continue with GitHub**, using the account from [the GitHub step](/article/setup-github). New to Vercel? This creates your account|Choose a **Repository name**: your business or site name, lowercase with dashes (for example, **my-studio-site**)|Leave your repository **private**. That is the default|Click **Create**, and wait a few minutes while Vercel builds your site',
      metadata: { numbered: true }
    },
    {
      id: 'deploy-plan',
      type: 'paragraph',
      content: 'Vercel asks you to pick a plan. The free **Hobby** plan is for personal, non-commercial projects. If your site is for a business or makes money, Vercel\'s terms call for **Pro**. Compare them at [vercel.com/pricing](https://vercel.com/pricing), and choose knowing what your site is for.'
    },
    {
      id: 'check-heading',
      type: 'heading',
      content: '2️⃣ Check It'
    },
    {
      id: 'check-list',
      type: 'list',
      content: '**Your site** opens at an address ending in **.vercel.app**, with this same setup path on its homepage|**Your repository** is on your GitHub account, marked **Private**, with a single commit. Everything after that is your history, not mine|**/admin** sends you to a sign-in page that says there is no sign-in yet. That is expected, and adding it is an optional step'
    },
    {
      id: 'updates-para',
      type: 'paragraph',
      content: `Your copy is independent from the first click, so later releases of the original do not reach it on their own. New releases appear at [the source repository](${SOURCE_REPO_URL}), and you take what you want from them.`
    },
    {
      id: 'template-note',
      type: 'personal',
      content: `Button not working? Open [the source repository](${SOURCE_REPO_URL}), click **Use this template**, choose **Private**, then follow [Deploy](/article/setup-deploy).`
    },
    {
      id: 'template-quote',
      type: 'quote',
      content: 'Your repository, your account, your history. From the first commit.',
      metadata: { author: 'unparty-app', style: 'highlight' }
    },
    {
      id: 'clone-heading',
      type: 'heading',
      content: '3️⃣ Download It'
    },
    {
      id: 'clone-para',
      type: 'paragraph',
      content: 'You can stop here and come back. To change your site, you need it on your computer. Downloading a repository is called **cloning**. [GitHub Desktop](https://desktop.github.com) does it with a few clicks, and it brings everything it needs along with it, so you do not have to install anything else first:'
    },
    {
      id: 'clone-steps',
      type: 'list',
      content: 'Download GitHub Desktop, open it, and sign in with your GitHub account|Choose **File → Clone repository**|On the **GitHub.com** tab, pick the repository you just created|Set **Local path** to a folder you will remember, like **Documents/Projects**|Click **Clone**',
      metadata: { numbered: true }
    },
    {
      id: 'clone-note',
      type: 'personal',
      content: 'When it finishes, GitHub Desktop says "No local changes." That is exactly right: your computer and GitHub match.'
    },
    {
      id: 'open-heading',
      type: 'heading',
      content: '4️⃣ Open It in Your Editor'
    },
    {
      id: 'open-para',
      type: 'paragraph',
      content: 'An editor is where you read and change the files. Install [Visual Studio Code](https://code.visualstudio.com), which is free. Then, in GitHub Desktop, choose **Repository → Open in Visual Studio Code**. If you set up Claude Code in [the last step](/article/setup-get-your-claude), open this same folder there too.'
    },
    {
      id: 'map-para',
      type: 'paragraph',
      content: 'You will see a lot of files. You do not need to understand them yet. These are the ones worth knowing by name:'
    },
    {
      id: 'map-list',
      type: 'list',
      content: '**src/app** — your pages. Each folder is a web address on your site|**public** — images, covers, and anything else visitors can download|**prisma** — the shape of your database|**.env.example** — the list of keys you can add later, each one optional|**CLAUDE.md** — instructions that teach Claude Code how this codebase works. It reads this file on its own'
    },
    {
      id: 'terminal-heading',
      type: 'heading',
      content: '⌨️ Already Comfortable in a Terminal?'
    },
    {
      id: 'terminal-code',
      type: 'code',
      content: '# Clone your repository (use your own username and repo name)\ncd ~/Projects\ngit clone https://github.com/your-username/your-repo.git\ncd your-repo\n\n# Open it with Claude Code\nclaude',
      metadata: { language: 'bash', caption: 'On a Mac, the first git command may ask to install developer tools. Say yes; that is expected' }
    },
    {
      id: 'divider-private',
      type: 'divider'
    },
    {
      id: 'private-heading',
      type: 'heading',
      content: '🔒 Keep It Private'
    },
    {
      id: 'private-list',
      type: 'list',
      content: 'Leave your repository **Private**. Your content, your customers\' pages, and your settings history live in it|Invite people only through **Settings → Collaborators**, and only people you would hand your office keys to|Your keys never go in the repository. If you add any, they go in a file called **.env**, which git ignores',
      metadata: { style: 'accent' }
    },
    {
      id: 'llm-heading',
      type: 'heading',
      content: '🤖 Your First Look Around'
    },
    {
      id: 'llm-para',
      type: 'paragraph',
      content: 'This is the moment Claude Code starts earning its place. Open it in your new folder and ask for a tour before you touch anything:'
    },
    {
      id: 'llm-prompts',
      type: 'code',
      content: 'Read CLAUDE.md and give me a five-sentence tour of how this\ncodebase is organized. Do not change anything.\n\nWhere does the text on my homepage come from? List the file\npaths only.\n\nExplain what package.json and .env.example are for, as if I\nhave never opened a codebase before.',
      metadata: { language: 'prompt', emphasis: true, caption: 'Tours first, edits later. Ask it to explain before it changes anything' }
    },
    {
      id: 'done-heading',
      type: 'heading',
      content: '✅ You Are Done When'
    },
    {
      id: 'done-list',
      type: 'list',
      content: 'Your **.vercel.app** address opens your own site|A **private** repository exists under **your** username|When you are ready to change it: GitHub Desktop shows it with **No local changes**, and the folder is open in your editor'
    },
    {
      id: 'closing-para',
      type: 'paragraph',
      content: 'That is the moment this site becomes yours. Next is **Install the tools**: the few programs your computer needs to run it, so you can see your copy working there before you change a single word.'
    },
    {
      id: 'final-quote',
      type: 'quote',
      content: 'Access you rent. A copy you own.',
      metadata: { author: 'unparty-app', style: 'minimal' }
    }
  ]
};
