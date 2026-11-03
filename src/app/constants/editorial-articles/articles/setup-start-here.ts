import type { EditorialArticle } from '../types';

// SETUP. curriculum index (#1106): the whole path on one page, linked from the
// homepage. The step list itself is the SetupCurriculum component, which reads
// prisma/setup-steps.ts, so this article never needs editing when a step lands.
export const SETUP_START_HERE_ARTICLE: EditorialArticle = {
  slug: 'setup-start-here',
  title: 'START HERE.',
  subtitle: 'Every step from an empty folder to a live site with your name on it, in the order you take them.',
  description: 'The SETUP. curriculum for software you own: get your own copy of the code, run it on your computer, put it on the internet at your own domain, fill it with your own covers, stories and articles, and make it yours. Step-by-step guides written for non-technical founders.',
  category: 'SETUP.',
  date: '2026-10-01',
  updated: '2026-11-03',
  published: true,
  // Joins the app hub (/unppp/app): where building your own app starts
  unpppType: 'app',
  presents: { component: 'SetupCurriculum' },
  coverColor: 'theme',
  author: 'justin-murry',
  readTime: '3 min',
  tags: ['Setup', 'Software You Own', 'Non-Technical Founders', 'Curriculum'],
  sections: [
    {
      id: 'hero-start',
      type: 'hero',
      content: 'build your own.',
      metadata: { style: 'highlight' }
    },
    {
      id: 'intro',
      type: 'paragraph',
      content: 'This site is yours. Not an account on it: the whole thing. Every page, every component, the database design, and the articles that explain them, in a private repository on your own GitHub account. The steps below take you from that repository to a live site at your own address, with your name on it.',
      metadata: { dropCap: true }
    },
    {
      id: 'no-code-note',
      type: 'personal',
      content: '(You do not need to know how to code. Every step says what to click, and what done looks like.)'
    },
    {
      id: 'own-heading',
      type: 'heading',
      content: 'What You Own, What You Depend On.'
    },
    {
      id: 'own-list',
      type: 'list',
      content: '**You own** the code, the content, and the history you build from here. It sits in your repo.|**You depend on** two services: GitHub stores your code and Vercel hosts your site. Each is an account in your name, and each can be switched out for whatever you want.|**You choose** the rest. A database, sign-in, payments, email, Slack, music and more are optional steps you add when and if you want them'
    },
    {
      id: 'path-heading',
      type: 'heading',
      content: 'Where to start'
    },
    {
      id: 'path-para',
      type: 'paragraph',
      content: 'Each setup step builds one after the other. Finish **SHIP.** and your app lives online; finish **YOURS.** and it is all yours.'
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
      id: 'llm-heading',
      type: 'heading',
      content: 'Build WITH or WITHOUT LLM.'
    },
    {
      id: 'llm-para',
      type: 'paragraph',
      content: 'An LLM partner is optional, but would suggest using Claude Code to understand a bit more about how AI really works. Before you start, it can help you plan:'
    },
    {
      id: 'llm-prompts',
      type: 'code',
      content: 'I am about to set up my own copy of a Next.js website, step by step,\nwithout a coding background. Ask me what computer I use, then tell me\nwhat to have ready before I start.\n\nI am on this step: [paste the step title and what you see].\nWalk me through it one click at a time, and stop when I am stuck.',
      metadata: { language: 'prompt', emphasis: true, caption: 'Copy either of these into Claude, or any LLM you use' }
    },
    {
      id: 'stuck-heading',
      type: 'heading',
      content: 'If You Get Stuck.'
    },
    {
      id: 'stuck-para',
      type: 'paragraph',
      content: 'These steps are new, and some of them may not match what you see. The optional ones have had the least testing: **sign-in**, the **database**, and **making yourself admin**. Your live site keeps working without them, so a step that goes wrong will not take it down. An LLM is good at exactly this: tell it the step you are on, what you expected and what you see instead, and paste the error. Never paste a key.'
    },
    {
      id: 'stuck-prompt',
      type: 'code',
      content: 'I am following a setup step for my own copy of a Next.js website.\nThe step: [paste its title and the instruction].\nI expected: [what it said would happen].\nI see: [what happened, and the exact error].\nI have no coding background. Tell me the one thing to check first,\nand do not ask me for any secret keys.',
      metadata: { language: 'prompt', emphasis: true, caption: 'Copy this into Claude, or any LLM you use' }
    },
    {
      id: 'closing-para',
      type: 'paragraph',
      content: 'Start with what you own, then [set up GitHub](/article/setup-github). Take one step at a time. Each one is done when its checklist is, and none of them is a race.'
    },
    {
      id: 'final-quote',
      type: 'quote',
      content: 'You build it. You own it.',
      metadata: { style: 'minimal' }
    }
  ]
};
