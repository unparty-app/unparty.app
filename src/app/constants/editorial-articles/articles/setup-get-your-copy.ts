import type { EditorialArticle } from '../types';
import { SOURCE_REPO_URL } from '../../organization';

// SETUP. curriculum step 3 (prisma/setup-steps.ts, #1094): the Deploy Button
// first (#1310). The button itself comes from `site.source` in FoundersConfig
export const SETUP_GET_YOUR_COPY_ARTICLE: EditorialArticle = {
  slug: 'setup-get-your-copy',
  title: 'GET YOUR COPY.',
  subtitle: 'this is starting somewhere.',
  description: 'A step-by-step guide for non-technical founders to get their own copy of this site. Click one button to create a private repository on your GitHub account and put it online with Vercel, then download it with GitHub Desktop when you want to change it. No keys and no terminal required.',
  category: 'SETUP.',
  date: '2026-09-28',
  updated: '2026-11-04',
  published: true,
  author: 'justin-murry',
  readTime: '1 min',
  tags: ['GitHub', 'Vercel', 'GitHub Desktop', 'Visual Studio Code', 'Setup', 'Non-Technical Founders', 'Software You Own'],
  sections: [
    {
      id: 'deploy-button',
      type: 'component',
      metadata: {
        componentName: 'BuildYours',
        componentProps: { deploy: true, pitch: 'Yours is already live. Anyone reading this can get their own with one button.', placement: 'get-your-copy' }
      }
    },
    {
      id: 'deploy-columns',
      type: 'columns',
      metadata: { layout: '1:1' },
      leftSections: [
        { id: 'deploy-heading', type: 'heading', content: 'on vercel.', metadata: { line: true } },
        { id: 'deploy-github', type: 'personal', content: 'continue with github.', metadata: { step: 1 } },
        { id: 'deploy-name', type: 'personal', content: 'name it.', metadata: { step: 2 } },
        { id: 'deploy-private', type: 'personal', content: 'keep it private.', metadata: { step: 3 } },
        { id: 'deploy-create', type: 'personal', content: 'click create.', metadata: { step: 4 } }
      ],
      rightSections: [
        { id: 'check-heading', type: 'heading', content: 'then check.', metadata: { line: true } },
        { id: 'check-site', type: 'personal', content: 'your site opens at .vercel.app.', metadata: { icon: 'Globe' } },
        { id: 'check-repo', type: 'personal', content: 'your code is private, on your github.', metadata: { icon: 'Lock' } },
        { id: 'check-admin', type: 'personal', content: 'your admin page says no sign-in yet. that is expected.', metadata: { icon: 'Check' } }
      ]
    },
    {
      id: 'notes-columns',
      type: 'columns',
      metadata: { layout: '1:1:1', mobile: 'stack' },
      columnSections: [
        [{ id: 'plan-note', type: 'personal', content: 'selling something? vercel\'s terms call for [pro](https://vercel.com/pricing).', metadata: { icon: 'ShoppingBag' } }],
        [{ id: 'updates-note', type: 'personal', content: `yours from the first click. new releases stay at [the source](${SOURCE_REPO_URL}).`, metadata: { icon: 'Package' } }],
        [{ id: 'template-note', type: 'personal', content: `button not working? [use this template](${SOURCE_REPO_URL}), then [put it online](/article/setup-deploy).`, metadata: { icon: 'HelpCircle' } }]
      ]
    },
    {
      id: 'hero-computer',
      type: 'hero',
      content: 'on your computer.',
      metadata: { icon: 'Monitor' }
    },
    {
      id: 'computer-note',
      type: 'personal',
      content: 'you can stop here and come back. this is for when you want to change your site.'
    },
    {
      id: 'computer-columns',
      type: 'columns',
      metadata: { layout: '1:1' },
      leftSections: [
        { id: 'clone-heading', type: 'heading', content: 'download it.', metadata: { line: true } },
        { id: 'clone-desktop', type: 'personal', content: 'get [github desktop](https://desktop.github.com) and sign in.', metadata: { step: 1 } },
        { id: 'clone-file', type: 'personal', content: 'file → clone repository.', metadata: { step: 2 } },
        { id: 'clone-pick', type: 'personal', content: 'pick the one you just made.', metadata: { step: 3 } },
        { id: 'clone-go', type: 'personal', content: 'pick a folder, then clone.', metadata: { step: 4 } }
      ],
      rightSections: [
        { id: 'open-heading', type: 'heading', content: 'open it.', metadata: { line: true } },
        { id: 'open-code', type: 'personal', content: 'get [visual studio code](https://code.visualstudio.com). it is free.', metadata: { step: 1 } },
        { id: 'open-in', type: 'personal', content: 'repository → open in visual studio code.', metadata: { step: 2 } },
        { id: 'open-done', type: 'personal', content: '"no local changes" means you are done.', metadata: { icon: 'Check' } }
      ]
    },
    {
      id: 'hero-inside',
      type: 'hero',
      content: 'what is inside.',
      metadata: { icon: 'Boxes' }
    },
    {
      id: 'inside-columns',
      type: 'columns',
      metadata: { layout: '1:1' },
      leftSections: [
        { id: 'inside-app', type: 'personal', content: '**src/app**: your pages.', metadata: { icon: 'Home' } },
        { id: 'inside-public', type: 'personal', content: '**public**: your images.', metadata: { icon: 'Camera' } },
        { id: 'inside-prisma', type: 'personal', content: '**prisma**: your database.', metadata: { icon: 'Database' } }
      ],
      rightSections: [
        { id: 'inside-env', type: 'personal', content: '**.env.example**: keys you can add later.', metadata: { icon: 'KeyRound' } },
        { id: 'inside-claude', type: 'personal', content: '**CLAUDE.md**: teaches an LLM your code.', metadata: { icon: 'Bot' } }
      ]
    },
    {
      id: 'hero-private',
      type: 'hero',
      content: 'keep it private.',
      metadata: { icon: 'Lock' }
    },
    {
      id: 'private-columns',
      type: 'columns',
      metadata: { layout: '1:1:1', mobile: 'stack' },
      columnSections: [
        [{ id: 'private-repo', type: 'personal', content: 'your content and settings live in it.', metadata: { icon: 'Lock' } }],
        [{ id: 'private-people', type: 'personal', content: 'invite only who you would hand your office keys.', metadata: { icon: 'Users' } }],
        [{ id: 'private-keys', type: 'personal', content: 'keys go in **.env**, never in your code.', metadata: { icon: 'KeyRound' } }]
      ]
    },
    {
      id: 'hero-tour',
      type: 'hero',
      content: 'ask for a tour.',
      metadata: { icon: 'Bot' }
    },
    {
      id: 'llm-prompts',
      type: 'code',
      content: 'Read CLAUDE.md and give me a five-sentence tour of how this\ncodebase is organized. Do not change anything.\n\nWhere does the text on my homepage come from? List the file\npaths only.',
      metadata: { language: 'prompt', emphasis: true, caption: 'Copy this into Claude, or any LLM you use' }
    },
    {
      id: 'terminal-code',
      type: 'code',
      content: 'git clone https://github.com/your-username/your-repo.git\ncd your-repo\nclaude',
      metadata: { language: 'bash', caption: 'Comfortable in a terminal? This does the same' }
    },
    {
      id: 'all-steps-note',
      type: 'personal',
      content: 'every step, in order.',
      metadata: { icon: 'Hammer', storyLink: '/article/setup-start-here' }
    },
    {
      id: 'next-note',
      type: 'personal',
      content: 'next: install the tools.',
      metadata: { icon: 'ArrowRight', storyLink: '/article/setup-install-tools' }
    }
  ]
};
