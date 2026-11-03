import type { EditorialArticle } from '../types';

// Component portfolio (#1433): the home of CommunicationStyleGame. Set published: true to publish
// it, which completes its MAKE. step
export const COMPONENT_COMMUNICATION_STYLE_GAME_ARTICLE: EditorialArticle = {
  slug: 'component-communication-style-game',
  title: 'COMMUNICATION STYLE GAME.',
  subtitle: 'how do you explain things?',
  description: 'The same question, four ways to answer it — direct, story, visual, practical. Pick the voice you would actually use, problem after problem, and find the communication style you lean on.',
  category: 'MAKE.',
  date: '2026-10-14',
  published: false,
  coverColor: 'theme',
  // needs: none found (npm run create:component-article -- --needs). Add DependConfig.json ids if it runs on any
  presents: { component: 'CommunicationStyleGame', needs: [] },
  author: 'justin-murry',
  tags: ['Component', 'Make', 'Communication Style Game'],
  sections: [
    {
      id: 'hero',
      type: 'hero',
      content: 'communication style game.'
    },
    {
      id: 'what-it-does',
      type: 'paragraph',
      content: "the same question — adding fractions, photosynthesis — with four ways to answer it: direct, story, visual or practical. pick the voice you'd actually use and the game shows you the style you lean on."
    },
    {
      id: 'component',
      type: 'component',
      metadata: { componentName: 'CommunicationStyleGame', componentProps: {} }
    },
    {
      id: 'make-it-yours',
      type: 'heading',
      content: 'make it yours.'
    },
    {
      id: 'how-to-use',
      type: 'paragraph',
      content: "the problems and answers live in the component's own arrays — rewrite them for your field and the game becomes yours. it dates to the site's first month, built while theunpartybot was learning that the same answer lands differently depending on who's asking."
    },
    {
      id: 'embed',
      type: 'code',
      content: '{ type: \'component\', metadata: { componentName: \'CommunicationStyleGame\', componentProps: {} } }',
      metadata: { language: 'ts', caption: 'Add this section to any article to embed Communication Style Game.' }
    },
    {
      id: 'where-heading',
      type: 'heading',
      content: 'try it where it lives.'
    },
    // /theunpartybot · Starting With Priorities
    {
      id: 'where-theunpartybot',
      type: 'personal',
      content: 'where it was born: the bot concept that starts with how people communicate.',
      metadata: { avatar: '/covers/cover-001.png', storyLink: '/article/setup-start-here' },
    }
  ]
};
