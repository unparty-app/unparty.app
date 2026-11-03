import type { EditorialArticle } from '../types';

// SETUP. curriculum step 4 (prisma/setup-steps.ts `install-tools`, #1094).
// Tested 2026-09-28 in a clean checkout with no .env files: npm ci on Node 24
// took ~80s, and npm run dev served the site (no sign-in, no database).
// nvm v0.40.8 (github.com/nvm-sh/nvm) and fnm (github.com/Schniz/fnm) both read
// .nvmrc. Recheck the nvm version in the install URL when editing.
export const SETUP_INSTALL_TOOLS_ARTICLE: EditorialArticle = {
  slug: 'setup-install-tools',
  title: 'INSTALL THE TOOLS.',
  subtitle: 'Three tools turn the folder on your computer into a site that runs. By the end of this step, you will see your copy working, before any accounts or keys.',
  description: 'How non-technical founders install git, Node.js, and npm on a Mac or Windows computer, use a version manager (nvm or fnm) that reads the Node version from .nvmrc, install a Next.js codebase with npm ci, and run it locally with npm run dev for the first time.',
  category: 'SETUP.',
  date: '2026-09-28',
  updated: '2026-11-02',
  published: true,
  author: 'justin-murry',
  readTime: '10 min',
  tags: ['Node.js', 'npm', 'git', 'nvm', 'Terminal Basics', 'Setup', 'Non-Technical Founders'],
  sections: [
    {
      id: 'hero-run',
      type: 'hero',
      content: 'three tools, then it runs.',
      metadata: { style: 'highlight' }
    },
    {
      id: 'intro',
      type: 'paragraph',
      content: 'Your copy is on your computer now, but a folder of code is a recipe, not a running site. This step installs what reads the recipe: git, Node.js, and npm. It is the most terminal-heavy step in the whole setup, and every command is copy, paste, Enter. At the end, your site opens in your browser, running on your own computer, before you have created a single account or key.',
      metadata: { dropCap: true }
    },
    {
      id: 'terminal-note',
      type: 'personal',
      content: '(The terminal is only a place to type instructions. Every command in this guide comes with a line saying what it does.)'
    },
    {
      id: 'what-heading',
      type: 'heading',
      content: '🧭 What You Are Installing'
    },
    {
      id: 'what-table',
      type: 'table',
      metadata: {
        headers: ['', 'What it does', 'Mac', 'Windows'],
        rows: [
          ['git', 'Tracks and syncs your changes from the terminal. Claude Code uses it too', 'Command Line Tools', 'Git for Windows'],
          ['Node.js 24', 'Runs your site', 'nvm', 'fnm'],
          ['npm', 'Downloads the parts your copy is built from', 'Comes with Node.js', 'Comes with Node.js']
        ]
      }
    },
    {
      id: 'version-manager-para',
      type: 'paragraph',
      content: 'You will not download Node.js from its website. Instead, you install a small **version manager** (nvm on a Mac, fnm on Windows). Your copy names the exact version it needs in a file called **.nvmrc**, and the version manager reads it. When your copy moves to a newer version someday, you run one command instead of reinstalling anything.'
    },
    {
      id: 'challenge-tools',
      type: 'challenge',
      userPrompt: 'INSTALL THE TOOLS.',
      label: 'BUILD.',
      pollEnabled: false,
      stepOne: { emoji: '1️⃣', action: 'Get git.', description: 'The terminal version of GitHub Desktop.' },
      stepTwo: { emoji: '2️⃣', action: 'Get Node.', description: 'Through a version manager.' },
      stepThree: { emoji: '3️⃣', action: 'Run it.', description: 'npm ci, then npm run dev.' },
      successMetric: 'your site runs.'
    },
    {
      id: 'divider-mac',
      type: 'divider'
    },
    {
      id: 'mac-heading',
      type: 'heading',
      content: '🍎 On a Mac'
    },
    {
      id: 'mac-open',
      type: 'paragraph',
      content: 'Open the **Terminal** app (press ⌘ + Space and type "terminal"). First, git. macOS installs it as part of Apple\'s Command Line Tools, and nvm needs them too. A window pops up: click **Install** and wait a few minutes. If the terminal says they are already installed, move on.'
    },
    {
      id: 'mac-git',
      type: 'code',
      content: '# Install Apple\'s Command Line Tools (includes git)\nxcode-select --install\n\n# Check it worked: prints a version number\ngit --version',
      metadata: { language: 'bash' }
    },
    {
      id: 'mac-nvm-para',
      type: 'paragraph',
      content: 'Next, nvm. Paste the installer, then **quit Terminal completely and open it again** so it picks up the change:'
    },
    {
      id: 'mac-nvm',
      type: 'code',
      content: '# Install nvm (the Node version manager)\ncurl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.8/install.sh | bash\n\n# After reopening Terminal: prints a version number\nnvm --version',
      metadata: { language: 'bash', caption: 'If nvm --version says "command not found", run touch ~/.zshrc, then paste the installer again' }
    },
    {
      id: 'mac-node-para',
      type: 'paragraph',
      content: 'Now move into your copy and let nvm read **.nvmrc**. Type **cd** and a space, drag your project folder onto the Terminal window to fill in the path, and press Enter:'
    },
    {
      id: 'mac-node',
      type: 'code',
      content: '# Move into your copy (drag the folder in after typing "cd ")\ncd ~/Documents/Projects/your-repo\n\n# Install and switch to the Node version your copy asks for\nnvm install\n\n# Make it the default for every new Terminal window\nnvm alias default 24\n\n# Prints v24 and a version number\nnode -v',
      metadata: { language: 'bash' }
    },
    {
      id: 'divider-windows',
      type: 'divider'
    },
    {
      id: 'windows-heading',
      type: 'heading',
      content: '🪟 On Windows'
    },
    {
      id: 'windows-open',
      type: 'paragraph',
      content: 'Open **PowerShell** from the Start menu (not as administrator). Install git and fnm with Windows\' built-in installer, **winget**, then close PowerShell and open it again:'
    },
    {
      id: 'windows-install',
      type: 'code',
      content: '# Install git and fnm (the Node version manager)\nwinget install Git.Git\nwinget install Schniz.fnm\n\n# After reopening PowerShell: both print version numbers\ngit --version\nfnm --version',
      metadata: { language: 'powershell' }
    },
    {
      id: 'windows-profile-para',
      type: 'paragraph',
      content: 'fnm has to load every time PowerShell starts. Windows blocks that by default, so allow it for your account (answer **Y** if asked), add fnm to your PowerShell profile, then close and reopen PowerShell once more:'
    },
    {
      id: 'windows-profile',
      type: 'code',
      content: '# Let your own PowerShell profile run\nSet-ExecutionPolicy -Scope CurrentUser RemoteSigned\n\n# Create your profile if it does not exist, then load fnm from it\nif (!(Test-Path $PROFILE)) { New-Item $PROFILE -Force }\nAdd-Content $PROFILE \'fnm env --use-on-cd --shell powershell | Out-String | Invoke-Expression\'',
      metadata: { language: 'powershell', caption: 'The fnm line comes from fnm\'s own setup instructions' }
    },
    {
      id: 'windows-node-para',
      type: 'paragraph',
      content: 'Now move into your copy and let fnm read **.nvmrc**:'
    },
    {
      id: 'windows-node',
      type: 'code',
      content: '# Move into your copy (use your own path)\ncd $HOME\\Documents\\Projects\\your-repo\n\n# Install and switch to the Node version your copy asks for\nfnm install\nfnm use\n\n# Prints v24 and a version number\nnode -v',
      metadata: { language: 'powershell' }
    },
    {
      id: 'divider-run',
      type: 'divider'
    },
    {
      id: 'install-heading',
      type: 'heading',
      content: '📦 Download Your Copy\'s Parts'
    },
    {
      id: 'install-para',
      type: 'paragraph',
      content: 'Your copy is built from hundreds of open-source parts, listed in **package.json**. One command downloads all of them. It takes a minute or two (about 80 seconds on a recent Mac):'
    },
    {
      id: 'install-code',
      type: 'code',
      content: '# Still inside your copy\nnpm ci',
      metadata: { language: 'bash', emphasis: true, caption: 'Same command on Mac and Windows' }
    },
    {
      id: 'install-why',
      type: 'list',
      content: '**Why npm ci and not npm install?** It installs the exact versions your copy was tested with (they are listed in **package-lock.json**) and changes nothing in your files. GitHub Desktop should still say "No local changes" afterwards|**Yellow lines that start with npm warn install-scripts are expected.** npm lists packages that ship setup scripts and asks you to review them. Your copy installs and runs fine without changing anything|**A line that starts with npm error is a real problem.** Copy the whole message and ask your LLM',
      metadata: { style: 'accent' }
    },
    {
      id: 'run-heading',
      type: 'heading',
      content: '▶️ See It Run'
    },
    {
      id: 'run-code',
      type: 'code',
      content: '# Start your site on your own computer\nnpm run dev\n\n# Then open this in your browser:\n# http://localhost:3000\n\n# To stop it, click the terminal and press Ctrl + C',
      metadata: { language: 'bash', emphasis: true, caption: 'If port 3000 is busy, the terminal shows a different address. Use that one' }
    },
    {
      id: 'run-para',
      type: 'paragraph',
      content: 'Your site opens with the unparty homepage. It is running entirely on your computer: nobody else can see it, and nothing you do here affects anything online. A few things look unfinished, and that is expected:'
    },
    {
      id: 'run-expected',
      type: 'list',
      content: '**Sign in says "no sign-in here yet"** — your site runs without accounts, and **/admin** stays locked until you connect sign-in. You can connect it when you want it, in **Add sign-in**|**Some sections are empty** — they read from a database, which is optional too|**Songs have no play button** — music is an optional step later|**A small "Issues" badge in a corner** — development notes from Next.js. Visitors to your live site never see it'
    },
    {
      id: 'run-quote',
      type: 'quote',
      content: 'Before you change a single word, it runs. Now it is yours to change.',
      metadata: { author: 'unparty-app', style: 'highlight' }
    },
    {
      id: 'llm-heading',
      type: 'heading',
      content: '🤖 Ask Your LLM'
    },
    {
      id: 'llm-prompts',
      type: 'code',
      content: 'I am installing the tools for a Next.js project on a [Mac / Windows]\ncomputer. I ran this command: [paste it]. The terminal printed\nthis: [paste all of it]. What went wrong, and what should I run next?\n\n(In Claude Code, inside your copy)\nRead .nvmrc and package.json. Which Node version does this project\nneed, and what does "npm run dev" actually start? Explain, don\'t\nchange anything.',
      metadata: { language: 'prompt', emphasis: true, caption: 'Paste the whole error, not a summary. The details are the useful part' }
    },
    {
      id: 'done-heading',
      type: 'heading',
      content: '✅ You Are Done When'
    },
    {
      id: 'done-list',
      type: 'list',
      content: '**git --version** and **node -v** both print versions, and node starts with **v24**|**npm ci** finished without any **npm error** lines|**npm run dev** served your site at **localhost:3000**, and you saw the homepage|GitHub Desktop still says **No local changes**'
    },
    {
      id: 'closing-para',
      type: 'paragraph',
      content: 'Next is **First run**, a walk through what you just started. If you ever close everything and come back, you only need two commands inside your copy: **nvm use** (or **fnm use** on Windows), then **npm run dev**.'
    },
    {
      id: 'final-quote',
      type: 'quote',
      content: 'Copy, paste, Enter. That is the whole trick.',
      metadata: { author: 'unparty-app', style: 'minimal' }
    }
  ]
};
