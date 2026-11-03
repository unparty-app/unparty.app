import type { EditorialArticle } from '../types';

// SETUP. curriculum, optional step `gitignore` (prisma/setup-steps.ts, #1106).
// Explains the copy's .gitignore and the one rule for generated files written at
// its top (also in CLAUDE.md's Generated Files list): track a generated file only
// when it can't be regenerated. Covers the trap that a new .gitignore line never
// untracks a file git already tracks (iconManifest.json / imageManifest.json were
// listed from 2026-02-20 and still committed 7 more times), and that ignoring a leaked
// key doesn't take it back out of history.
export const SETUP_GITIGNORE_ARTICLE: EditorialArticle = {
  slug: 'setup-gitignore',
  title: 'GITIGNORE.',
  subtitle: 'What git saves, what it never sees, and the one rule for the files your site makes itself.',
  description: 'How non-technical founders read the .gitignore in their own copy: why keys, downloads and logs never reach GitHub, how to check any file in one command, the one rule for generated files, and how to stop tracking a file git already saves.',
  category: 'SETUP.',
  date: '2026-10-02',
  published: true,
  author: 'justin-murry',
  readTime: '6 min',
  tags: ['Git', 'gitignore', 'Secrets', 'GitHub Desktop', 'Setup', 'Non-Technical Founders', 'Software You Own'],
  sections: [
    {
      id: 'hero-gitignore',
      type: 'hero',
      content: 'some files never leave your computer.',
      metadata: { style: 'highlight' }
    },
    {
      id: 'intro',
      type: 'paragraph',
      content: 'Every commit saves a snapshot of your project, and every push sends it to GitHub. One small file decides what is left out of that snapshot: **.gitignore**, in the top folder of your copy. It keeps your keys on your computer, skips the tools anyone can download again, and leaves out the files your site rebuilds by itself. Your copy arrived with it already set up. This step is about reading it, so you always know what you are sending.',
      metadata: { dropCap: true }
    },
    {
      id: 'ignored-table',
      type: 'table',
      metadata: {
        headers: ['Left out', 'Why'],
        rows: [
          ['.env', 'Your keys and passwords. Only .env.example, the empty template, is saved'],
          ['node_modules', 'The tools npm ci downloads. Anyone can download them again'],
          ['.next', 'What npm run dev and npm run build make. Rebuilt every time'],
          ['Files ending in .log', 'Crash and debug logs. They can hold details from your computer'],
          ['Generated lists', 'Files the build makes again on every run (the rule below)']
        ]
      }
    },
    {
      id: 'challenge-gitignore',
      type: 'challenge',
      userPrompt: 'GITIGNORE.',
      label: 'BUILD.',
      pollEnabled: false,
      stepOne: { emoji: '1️⃣', action: 'Read.', description: 'Open your .gitignore.' },
      stepTwo: { emoji: '2️⃣', action: 'Check.', description: 'Ask git about one file.' },
      stepThree: { emoji: '3️⃣', action: 'Untrack.', description: 'Stop saving a file git already has.' },
      successMetric: 'git tells you which line keeps .env off GitHub.'
    },
    {
      id: 'before-list',
      type: 'list',
      content: '**Your copy on your computer** — from [Get your copy](/article/setup-get-your-copy)|**A .env file** — from [Create your database](/article/setup-database), so there is something worth keeping private',
      metadata: { style: 'accent' }
    },
    {
      id: 'divider-read',
      type: 'divider'
    },
    {
      id: 'read-heading',
      type: 'heading',
      content: '1️⃣ Read Your .gitignore'
    },
    {
      id: 'read-para',
      type: 'paragraph',
      content: 'Open **.gitignore** in your editor. If you cannot see it, your computer is hiding files that start with a dot: on a Mac, press **Cmd + Shift + .** in Finder. Each line is a pattern, and git leaves out every file that matches one. Lines that start with **#** are notes for people.'
    },
    {
      id: 'read-code',
      type: 'code',
      content: '# env files: secrets stay on your computer (.env.example is the template)\n.env*\n!.env.example',
      metadata: { language: 'bash', caption: 'The two lines that protect your keys' }
    },
    {
      id: 'read-list',
      type: 'list',
      content: '**A star means anything** — .env* matches .env, .env.local and .env.backup alike|**An exclamation mark means except** — !.env.example brings the template back, so the next person knows which keys to fill in|**A slash at the start means only the top folder** — /node_modules is the one next to package.json'
    },
    {
      id: 'divider-check',
      type: 'divider'
    },
    {
      id: 'check-heading',
      type: 'heading',
      content: '2️⃣ Ask Git About One File'
    },
    {
      id: 'check-para',
      type: 'paragraph',
      content: 'You never have to guess. Open **Terminal** in your project folder (in GitHub Desktop: **Repository → Open in Terminal**) and ask about any file:'
    },
    {
      id: 'check-code',
      type: 'code',
      content: 'git check-ignore -v .env\n\n.gitignore:47:.env*\t.env',
      metadata: { language: 'bash', emphasis: true, caption: 'The answer names the file, the line number and the pattern that matched' }
    },
    {
      id: 'check-result',
      type: 'paragraph',
      content: 'If it prints nothing, git will save that file. GitHub Desktop shows the same thing another way: an ignored file never appears in the **Changes** list, no matter how often you edit it. To leave out a new file, right-click it in **Changes** and choose **Ignore file**, which adds its line to .gitignore for you.'
    },
    {
      id: 'divider-rule',
      type: 'divider'
    },
    {
      id: 'rule-heading',
      type: 'heading',
      content: '3️⃣ The One Rule for Files Your Site Makes'
    },
    {
      id: 'rule-para',
      type: 'paragraph',
      content: 'Some files are written by your site\'s own scripts, not by you: lists of your icons and images, the colors of each cover, which stories mention which project. Each of them follows one rule, written at the top of your .gitignore:'
    },
    {
      id: 'rule-quote',
      type: 'quote',
      content: 'Save a generated file only when it can\'t be made again.',
      metadata: { author: 'unparty-app', style: 'highlight' }
    },
    {
      id: 'rule-table',
      type: 'table',
      metadata: {
        headers: ['File', 'Made by', 'Saved?'],
        rows: [
          ['Icon and image lists', 'Every build', 'No: the build makes them again'],
          ['Cover colors', 'A tool that only runs on a Mac', 'Yes: Vercel cannot make them'],
          ['Video details', 'ffprobe, which not every computer has', 'Yes'],
          ['Cover file types', 'Every build, but pages read it right away', 'Yes: a fresh copy needs it before its first build']
        ]
      }
    },
    {
      id: 'rule-why',
      type: 'paragraph',
      content: 'Saving a file the build makes again is not harmless. It changes on every run, so it shows up in every change you review, and two changes to it clash with each other. Leaving out a file the build can\'t make breaks your site the first time it is built somewhere new.'
    },
    {
      id: 'untrack-heading',
      type: 'heading',
      content: '🧹 Adding a Line Is Not Enough'
    },
    {
      id: 'untrack-para',
      type: 'paragraph',
      content: 'A line in .gitignore only stops git from picking up **new** files. A file git already saves keeps being saved with every commit, line or no line. To stop saving it, tell git to forget it while leaving it on your computer:'
    },
    {
      id: 'untrack-code',
      type: 'code',
      content: 'git rm --cached src/data/iconManifest.json\ngit check-ignore -v src/data/iconManifest.json',
      metadata: { language: 'bash', emphasis: true, caption: '--cached means: stop saving it, keep the file. Then commit' }
    },
    {
      id: 'untrack-result',
      type: 'paragraph',
      content: 'GitHub Desktop now lists the file as deleted. Commit that. The file stays on your computer, git stops saving it, and on every other computer the next pull removes it until a build makes it again. This copy had exactly this problem: two lists sat in .gitignore for seven months and were still saved in seven more commits.'
    },
    {
      id: 'warning-heading',
      type: 'heading',
      content: '⚠️ What .gitignore Cannot Do'
    },
    {
      id: 'warning-list',
      type: 'list',
      content: '**It cannot take back the past** — a file saved before its line was added stays in your history, and anyone with access to your repository can still read that old version|**If a key ever reached GitHub, replace the key** — make a new one where you got it (Neon, Clerk, Polar…) and put it in .env. Deleting the file afterwards is not enough|**Keep the name .env** — .env.backup is still left out, but env.txt or keys.env.txt is saved like any other file|**Never delete the .env lines** — they are the only thing between your keys and GitHub',
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
      content: '**.env shows up in GitHub Desktop** — do not commit. Check the name has nothing after env except a dot and a word, and that the .env lines are still in .gitignore|**A file keeps coming back after you ignored it** — git already saved it. Run git rm --cached on it, then commit|**A page breaks after you ignored a generated file** — the site needs it before any build. Take its line back out of .gitignore and commit the file again'
    },
    {
      id: 'llm-heading',
      type: 'heading',
      content: '🤖 Ask Your LLM'
    },
    {
      id: 'llm-prompts',
      type: 'code',
      content: 'Here is my .gitignore: [paste it]. Explain each line in plain\nwords, and tell me if anything private could still be saved.\n\nA script in my project writes this file: [file name]. Is it\nmade by every build, or only on some computers? Should it be\nsaved in git or added to .gitignore?\n\nI think I committed a key by mistake. Here is the file name\n(not the key): [file name]. Walk me through replacing the key\nand stopping git from saving that file.',
      metadata: { language: 'prompt', emphasis: true }
    },
    {
      id: 'done-heading',
      type: 'heading',
      content: '✅ You Are Done When'
    },
    {
      id: 'done-list',
      type: 'list',
      content: 'git check-ignore -v .env prints the .gitignore line that protects it|.env has never appeared in GitHub Desktop\'s Changes list|You can say whether a new generated file belongs in git or in .gitignore, and why'
    },
    {
      id: 'closing-para',
      type: 'paragraph',
      content: 'Next, let your computer check your work as you go: [Local guardrails](/article/setup-local-guardrails) turns on the checks that run each time you commit and push.'
    },
    {
      id: 'final-quote',
      type: 'quote',
      content: 'Know what you send before you send it.',
      metadata: { author: 'unparty-app', style: 'minimal' }
    }
  ]
};
