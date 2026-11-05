import type { EditorialArticle } from '../types';

// Component portfolio (#1433): the home of MiniMaze. Set published: true to publish
// it, which completes its MAKE. step
export const COMPONENT_MINI_MAZE_ARTICLE: EditorialArticle = {
  slug: 'component-mini-maze',
  title: 'MINI MAZE.',
  subtitle: 'five by five, in pen.',
  description: 'A 5×5 maze in hand-drawn icons: your icon walks it by tap or arrow keys, picking up ideas on the way to the heart, and its path draws itself behind it.',
  category: 'MAKE.',
  date: '2026-10-14',
  updated: '2026-11-04',
  published: true,
  coverColor: 'theme',
  coverStyle: 'compound-eye',
  // needs: none found (npm run create:component-article -- --needs). Add DependConfig.json ids if it runs on any
  presents: { component: 'MiniMaze', needs: [] },
  author: 'justin-murry',
  tags: ['Component', 'Make', 'Mini Maze'],
  sections: [
    {
      id: 'hero',
      type: 'hero',
      content: 'mini maze.'
    },
    {
      id: 'what-it-does',
      type: 'paragraph',
      content: 'a 5×5 maze, new every game. your icon walks it, ideas are worth picking up, and the heart is where it ends. the path you took draws itself behind you.'
    },
    {
      id: 'component',
      type: 'component',
      metadata: { componentName: 'MiniMaze', componentProps: {} }
    },
    {
      id: 'make-it-yours',
      type: 'heading',
      content: 'make it yours.'
    },
    {
      id: 'how-to-use',
      type: 'paragraph',
      content: 'drop it in and it builds its own maze. `player` picks the icon that walks it, and anyone who redrew that icon walks it in their own hand. it was committed in october 2024, in the first weeks of the site — a game before there were articles, stories or steps — and it still runs untouched. the grid size, cells and prizes sit at the top of the file.'
    },
    {
      id: 'embed',
      type: 'code',
      content: '{ type: \'component\', metadata: { componentName: \'MiniMaze\', componentProps: {} } }',
      metadata: { language: 'ts', caption: 'Add this section to any article to embed Mini Maze.' }
    },
    {
      id: 'where-heading',
      type: 'heading',
      content: 'try it where it lives.'
    },
    // /theunpartyplayground · theunpartyplayground
    {
      id: 'where-theunpartyplayground',
      type: 'personal',
      content: 'the playground it was built for: games before the site knew what it was.',
      metadata: { avatar: '/covers/cover-001.png', storyLink: '/article/setup-start-here' },
    }
  ]
};
