import type { EditorialArticle } from '../types';

// SETUP. curriculum step 3 (prisma/setup-steps.ts, #1094)
export const SETUP_GET_YOUR_COPY_ARTICLE: EditorialArticle = {
  slug: 'setup-get-your-copy',
  title: 'GET YOUR COPY.',
  subtitle: 'Turn access into ownership: your own private repository, on your own GitHub account, open on your own computer.',
  description: 'A step-by-step guide for non-technical founders to receive their copy of unparty-app. Accept your GitHub invitation, create your own private repository with Use this template, download it with GitHub Desktop, and open it in Visual Studio Code, no terminal required.',
  category: 'SETUP.',
  date: '2026-09-28',
  published: true,
  author: 'justin-murry',
  readTime: '6 min',
  tags: ['GitHub', 'GitHub Desktop', 'Visual Studio Code', 'Setup', 'Non-Technical Founders', 'Software You Own'],
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
      content: 'When you buy unparty-app, you get access to the original repository on GitHub. Access is not the same as owning it. This step turns that access into a copy that is entirely yours: your own private repository, in your own account, downloaded to your own computer. After this, the original can change or disappear, and your copy stays exactly where you put it.',
      metadata: { dropCap: true }
    },
    {
      id: 'borrowed-note',
      type: 'personal',
      content: '(Access is borrowed. A copy is owned. This step is the difference.)'
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
          ['Your computer', 'A downloaded copy (a clone)', 'Where you and Claude make changes before they go live'],
          ['Vercel (later)', 'Your live website', 'It publishes whatever is in your GitHub repository']
        ]
      }
    },
    {
      id: 'challenge-copy',
      type: 'challenge',
      userPrompt: 'GET YOUR COPY.',
      label: 'BUILD.',
      pollEnabled: false,
      stepOne: { emoji: '1️⃣', action: 'Accept.', description: 'Accept your invitation on GitHub.' },
      stepTwo: { emoji: '2️⃣', action: 'Make it yours.', description: 'Create your own private repository.' },
      stepThree: { emoji: '3️⃣', action: 'Open it.', description: 'Download it and open it in your editor.' },
      successMetric: 'your copy is on your computer.'
    },
    {
      id: 'divider-accept',
      type: 'divider'
    },
    {
      id: 'accept-heading',
      type: 'heading',
      content: '1️⃣ Accept Your Invitation'
    },
    {
      id: 'accept-para',
      type: 'paragraph',
      content: 'After you purchase, GitHub sends an invitation to the email on your GitHub account, the one you set up in [the GitHub step](/article/setup-github). Open it and click **View invitation**, then **Accept invitation**. If you cannot find the email, sign in to GitHub and check [github.com/notifications](https://github.com/notifications).'
    },
    {
      id: 'accept-note',
      type: 'personal',
      content: 'Invitations expire after seven days. If yours did, ask for a new one. Nothing is lost.'
    },
    {
      id: 'template-heading',
      type: 'heading',
      content: '2️⃣ Make Your Own Repository'
    },
    {
      id: 'template-para',
      type: 'paragraph',
      content: 'You now have access to the original. Use it once, to create a repository that belongs only to you:'
    },
    {
      id: 'template-steps',
      type: 'list',
      content: 'On the original repository\'s page, click the green **Use this template** button, then **Create a new repository**|**Owner** — choose your own account|**Repository name** — your business or site name, lowercase with dashes (for example, **my-studio-site**)|**Visibility** — choose **Private**|Click **Create repository**',
      metadata: { numbered: true }
    },
    {
      id: 'template-why',
      type: 'paragraph',
      content: 'Your new repository starts with a single commit: the entire app. Everything after that is your history, not mine. Do not use **Fork** instead. A fork of a private repository stays attached to the original, and it is removed if your access to the original ever ends. A repository made from the template is independent from the first click.'
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
      content: '3️⃣ Download It With GitHub Desktop'
    },
    {
      id: 'clone-para',
      type: 'paragraph',
      content: 'Downloading a repository is called **cloning**. [GitHub Desktop](https://desktop.github.com) does it with a few clicks, and it brings everything it needs along with it, so you do not have to install anything else first:'
    },
    {
      id: 'clone-steps',
      type: 'list',
      content: 'Download GitHub Desktop, open it, and sign in with your GitHub account|Choose **File → Clone repository**|On the **GitHub.com** tab, pick the repository you just created (under your username, not the original)|Set **Local path** to a folder you will remember, like **Documents/Projects**|Click **Clone**',
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
      content: '**src/app** — your pages. Each folder is a web address on your site|**public** — images, covers, and anything else visitors can download|**prisma** — the shape of your database|**.env.example** — the list of keys you will fill in during the next few steps|**CLAUDE.md** — instructions that teach Claude Code how this codebase works. It reads this file on its own'
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
      content: 'Leave your repository **Private**. Your content, your customers\' pages, and your settings history live in it|Invite people only through **Settings → Collaborators**, and only people you would hand your office keys to|Your keys still never go in the repository. They arrive in the next steps, in a file called **.env**, which git ignores',
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
      content: 'A **private** repository exists under **your** username, created from the template, not forked|GitHub Desktop shows it with **No local changes**|The folder is open in your editor, and you can see **CLAUDE.md**, **package.json**, and **src**'
    },
    {
      id: 'closing-para',
      type: 'paragraph',
      content: 'That is the moment unparty-app becomes yours. Next is **Install the tools**: the few programs your computer needs to run the site, so you can see your copy working before you change a single word.'
    },
    {
      id: 'final-quote',
      type: 'quote',
      content: 'Access you rent. A copy you own.',
      metadata: { author: 'unparty-app', style: 'minimal' }
    }
  ]
};
