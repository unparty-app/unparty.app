import type { EditorialArticle } from '../types';

// Component portfolio (#1433): the home of Logo3d. Write the TODO. parts, then
// set published: true. That publishes it and completes its MAKE. step
export const COMPONENT_LOGO_3D_ARTICLE: EditorialArticle = {
  slug: 'component-logo-3d',
  title: 'LOGO 3D.',
  subtitle: 'your logo, in three dimensions.',
  description: 'A 3D scene you can move around in, right on the page.',
  category: 'MAKE.',
  date: '2026-10-09',
  updated: '2026-11-04',
  published: true,
  coverColor: 'theme',
  coverStyle: 'tile',
  // needs: the DependConfig.json ids it runs on, e.g. ['neon', 'clerk']
  presents: { component: 'Logo3d', needs: [] },
  author: 'justin-murry',
  tags: ['Component', 'Make', 'Logo 3D'],
  sections: [
    {
      id: 'hero',
      type: 'hero',
      content: 'logo 3d.'
    },
    {
      id: 'what-it-does',
      type: 'paragraph',
      content: 'a 3D scene you can move around in, right on the page.'
    },
    {
      id: 'component',
      type: 'component',
      metadata: { componentName: 'Logo3d', componentProps: {} }
    },
    {
      id: 'make-it-yours',
      type: 'heading',
      content: 'make it yours.'
    },
    {
      id: 'how-to-use',
      type: 'paragraph',
      content: 'no props. it plays /scene.splinecode, so replace that file with your own scene.'
    },
    {
      id: 'embed',
      type: 'code',
      content: '{ type: \'component\', metadata: { componentName: \'Logo3d\', componentProps: {} } }',
      metadata: { language: 'ts', caption: 'Add this section to any article to embed Logo 3D.' }
    }
  ]
};
