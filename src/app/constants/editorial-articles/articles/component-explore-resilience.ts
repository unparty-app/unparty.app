import type { EditorialArticle } from '../types';

// Component portfolio (#1433): the home of ExploreResilience. Published, which
// completes its MAKE. step
export const COMPONENT_EXPLORE_RESILIENCE_ARTICLE: EditorialArticle = {
  slug: 'component-explore-resilience',
  title: 'EXPLORE RESILIENCE.',
  subtitle: 'what it took, and what it means for yours.',
  description: 'Every commit behind this site, by the hour of the day and the day of the week, from 2024 on. Drag across the hours you have, tap your days, and see how long a build like this one would take you at that pace, then price yours.',
  category: 'MAKE.',
  date: '2026-10-14',
  updated: '2026-10-18',
  published: true,
  coverColor: 'theme',
  coverStyle: 'tile',
  // needs: none. It reads FoundersConfig baseline and nothing else
  presents: { component: 'ExploreResilience', needs: [] },
  author: 'justin-murry',
  tags: ['Component', 'Make', 'Explore Resilience', 'Baseline'],
  sections: [
    {
      id: 'hero',
      type: 'hero',
      content: 'explore resilience.'
    },
    {
      id: 'what-it-does',
      type: 'paragraph',
      content: 'every commit i made building this, by the hour of the day and the day of the week, a year at a time. drag across the hours you have, tap your days, and see how long this site would take you at that pace.'
    },
    {
      id: 'component',
      type: 'component',
      metadata: { componentName: 'ExploreResilience', componentProps: {} }
    },
    {
      id: 'the-why',
      type: 'personal',
      content: 'know what it takes before you start.'
    },
    {
      id: 'make-it-yours',
      type: 'heading',
      content: 'make it yours.'
    },
    {
      id: 'how-to-use',
      type: 'paragraph',
      content: 'Your copy draws it from **baseline** in FoundersConfig.json: **rhythm** for the day and the week, and **projects** for the builds it measures against. It ships with mine. [Know your baseline](/article/setup-baseline) shows how to measure your own from git, or delete **rhythm** to leave it out. Mark the project your site is built from with **"site": true**, and it leads, named by your site’s address.'
    },
    {
      id: 'embed',
      type: 'code',
      content: '{ type: \'component\', metadata: { componentName: \'ExploreResilience\', componentProps: {} } }',
      metadata: { language: 'ts', caption: 'Add this section to any article to embed Explore Resilience.' }
    },
    {
      id: 'where-heading',
      type: 'heading',
      content: 'try it where it lives.'
    },
    // /theunpartycloud · theunpartycloud
    {
      id: 'where-theunpartycloud',
      type: 'personal',
      content: 'on the cloud page.',
      metadata: { avatar: '/covers/cover-001.png', storyLink: '/article/setup-start-here' },
    }
  ]
};
