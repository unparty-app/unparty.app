import type { EditorialArticle } from '../types';

// Component portfolio (#1433): the home of HtmlEmbed. Write the TODO. parts, then
// set published: true. That publishes it and completes its MAKE. step
export const COMPONENT_HTML_EMBED_ARTICLE: EditorialArticle = {
  slug: 'component-html-embed',
  title: 'HTML EMBED.',
  subtitle: 'any page, inside this one.',
  description: 'Put any web page inside an article, at the height you choose.',
  category: 'MAKE.',
  date: '2026-10-09',
  updated: '2026-11-04',
  published: true,
  coverColor: 'theme',
  coverStyle: 'tile',
  // needs: the DependConfig.json ids it runs on, e.g. ['neon', 'clerk']
  presents: { component: 'HtmlEmbed', needs: [] },
  author: 'justin-murry',
  tags: ['Component', 'Make', 'HTML Embed'],
  sections: [
    {
      id: 'hero',
      type: 'hero',
      content: 'html embed.'
    },
    {
      id: 'what-it-does',
      type: 'paragraph',
      content: 'put any web page inside an article, at the height you choose.'
    },
    {
      id: 'component',
      type: 'component',
      metadata: { componentName: 'HtmlEmbed', componentProps: { src: 'https://theunpartyrunway.unparty.app/founder/black.html', height: '700px' } }
    },
    {
      id: 'make-it-yours',
      type: 'heading',
      content: 'make it yours.'
    },
    {
      id: 'how-to-use',
      type: 'paragraph',
      content: 'give it a url. height and title are optional.'
    },
    {
      id: 'embed',
      type: 'code',
      content: '{ type: \'component\', metadata: { componentName: \'HtmlEmbed\', componentProps: { src: \'https://theunpartyrunway.unparty.app/founder/black.html\', height: \'700px\' } } }',
      metadata: { language: 'ts', caption: 'Add this section to any article to embed HTML Embed.' }
    },
    {
      id: 'where-heading',
      type: 'heading',
      content: 'try it where it lives.'
    },
    // /story/ml · ML.
    {
      id: 'where-story-ml',
      type: 'personal',
      content: 'ml.',
      metadata: { avatar: '/covers/cover-001.png', storyLink: '/article/setup-start-here' },
    }
  ]
};
