import type { EditorialArticle } from '../types';

// Component portfolio (#1433): the home of GoalBudget
export const COMPONENT_GOAL_BUDGET_ARTICLE: EditorialArticle = {
  slug: 'component-goal-budget',
  title: 'GOAL BUDGET.',
  subtitle: 'what the work is worth, what it costs to run, and the steps to get there.',
  description: 'Goal Budget prices a goal the way it really costs: the hours it takes to build, at what an hour of that work is worth plus the LLM, and what it adds to run each month. The hours come from real projects, measured from git, or from your own count. On your own copy, every number is yours.',
  category: 'MAKE.',
  date: '2026-10-09',
  updated: '2026-10-16',
  published: true,
  coverColor: 'theme',
  coverStyle: 'kaleidoscope',
  // needs, found by npm run create:component-article -- --needs:
  //   clerk: src/app/components/GoalBudget.tsx
  //   neon: src/app/api/steps/progress/route.ts
  presents: { component: 'GoalBudget', needs: ['clerk', 'neon'] },
  author: 'justin-murry',
  tags: ['Component', 'Make', 'Goal Budget'],
  sections: [
    {
      id: 'hero',
      type: 'hero',
      content: 'goal budget.'
    },
    {
      id: 'what-it-does',
      type: 'paragraph',
      content: 'built to connect you to your development cost. AI and infrastructure cost can add up pretty quickly and suddenly, learn from my mistakes and set a goal budget.'
    },
    {
      id: 'component',
      type: 'component',
      metadata: { componentName: 'GoalBudget', componentProps: {} }
    },
    {
      id: 'only-yours',
      type: 'paragraph',
      content: 'Pick a goal, then pick what it is like. Every project under LIKE. is one of mine, with the hours it really took. If none of them is close, count your own. Your goal, its name and your hours stay in your browser. Sign in, and the milestones you tick save to your progress.'
    },
    {
      id: 'make-it-yours',
      type: 'heading',
      content: 'make it yours.'
    },
    {
      id: 'how-to-use',
      type: 'paragraph',
      content: 'Your copy measures against **baseline** in FoundersConfig.json: what an hour of your work is worth (**pay**, over **hoursPerYear**), what an hour costs in an LLM (**llmPerHour**), and the projects you have built, with their real hours. It starts with mine, measured from my own repos. Keep them while you start, then put in your own. What it costs to run comes from the stack you pick, so nothing is counted twice.'
    },
    {
      id: 'embed',
      type: 'code',
      content: '{ type: \'component\', metadata: { componentName: \'GoalBudget\', componentProps: {} } }',
      metadata: { language: 'ts', caption: 'Add this section to any article to embed Goal Budget.' }
    },
    {
      id: 'where-heading',
      type: 'heading',
      content: 'try it where it lives.'
    },
    // /goal-budget · GOAL.
    {
      id: 'where-goal-budget',
      type: 'personal',
      content: 'the goal on its own page, with nothing around it.',
      metadata: { avatar: '/covers/cover-001.png', storyLink: '/goal-budget' },
    },
    // /story/auth · THEM THAT GOT
    {
      id: 'where-story-auth',
      type: 'personal',
      content: 'build your runway. be realistic about your dreams.',
      metadata: { avatar: '/covers/cover-002.png', storyLink: '/article/setup-start-here' },
    },
    // /story/feat · FEAT.
    {
      id: 'where-story-feat',
      type: 'personal',
      content: 'record what failed and what worked, then set the next goal.',
      metadata: { avatar: '/covers/cover-001.png', storyLink: '/article/setup-start-here' },
    }
  ]
};
