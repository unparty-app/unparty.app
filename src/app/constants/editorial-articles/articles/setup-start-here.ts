import type { EditorialArticle } from '../types';

// SETUP. curriculum index (#1106): the whole path on one page, linked from the
// homepage. The step list itself is the SetupCurriculum component, which reads
// prisma/setup-steps.ts, so this article never needs editing when a step lands.
export const SETUP_START_HERE_ARTICLE: EditorialArticle = {
  slug: 'setup-start-here',
  title: 'START HERE.',
  subtitle: 'one button, then one step at a time.',
  description: 'The SETUP. curriculum for software you own: get your own copy of the code, run it on your computer, put it on the internet at your own domain, fill it with your own covers, stories and articles, and make it yours. Step-by-step guides written for non-technical founders.',
  category: 'SETUP.',
  date: '2026-10-01',
  updated: '2026-11-04',
  published: true,
  // Joins the app hub (/unppp/app): where building your own app starts
  unpppType: 'app',
  presents: { component: 'SetupCurriculum' },
  coverColor: 'theme',
  author: 'justin-murry',
  readTime: '1 min',
  tags: ['Setup', 'Software You Own', 'Non-Technical Founders', 'Curriculum'],
  sections: [
    {
      id: 'deploy-button',
      type: 'component',
      metadata: {
        componentName: 'BuildYours',
        componentProps: { deploy: true, pitch: 'Yours is already live. Anyone reading this can get their own with one button.', placement: 'start-here' }
      }
    },
    {
      id: 'own-columns',
      type: 'columns',
      metadata: { layout: '1:1:1', mobile: 'stack' },
      columnSections: [
        [{ id: 'own-own', type: 'personal', content: '**you own** the code and the content.', metadata: { icon: 'Heart' } }],
        [{ id: 'own-depend', type: 'personal', content: '**you depend on** github and vercel, in your name.', metadata: { icon: 'Link2' } }],
        [{ id: 'own-choose', type: 'personal', content: '**you choose** the rest, if and when you want it.', metadata: { icon: 'Boxes' } }]
      ]
    },
    {
      id: 'no-code-note',
      type: 'personal',
      content: 'no code needed. every step says what to click.',
      metadata: { icon: 'Lightbulb' }
    },
    {
      id: 'hero-steps',
      type: 'hero',
      content: 'one step at a time.',
      metadata: { icon: 'Hammer' }
    },
    {
      id: 'curriculum',
      type: 'component',
      metadata: {
        componentName: 'SetupCurriculum',
        componentProps: { variant: 'full' }
      }
    },
    {
      id: 'hero-stuck',
      type: 'hero',
      content: 'if you get stuck.',
      metadata: { icon: 'HelpCircle' }
    },
    {
      id: 'stuck-columns',
      type: 'columns',
      metadata: { layout: '1:2' },
      leftSections: [
        { id: 'stuck-new', type: 'personal', content: 'these steps are new. some may not match what you see.', metadata: { icon: 'AlertCircle' } },
        { id: 'stuck-safe', type: 'personal', content: 'sign-in, the database and admin are the least tested. your live site keeps working without them.', metadata: { icon: 'Check' } },
        { id: 'stuck-key', type: 'personal', content: 'an LLM can help. never paste a key.', metadata: { icon: 'KeyRound' } }
      ],
      rightSections: [
        {
          id: 'stuck-prompt',
          type: 'code',
          content: 'I am setting up my own copy of a website.\nThe step: [its title and instruction].\nI expected: [what it said].\nI see: [what happened, the exact error].\nI have no coding background. Tell me the\none thing to check first. Do not ask me\nfor any secret keys.',
          metadata: { language: 'prompt', emphasis: true, caption: 'Copy this into Claude, or any LLM you use' }
        }
      ]
    },
    {
      id: 'final-quote',
      type: 'quote',
      content: 'You build it. You own it.',
      metadata: { style: 'minimal' }
    }
  ]
};
