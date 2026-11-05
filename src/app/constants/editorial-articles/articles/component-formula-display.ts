import type { EditorialArticle } from '../types';

// Component portfolio (#1433): the home of FormulaDisplay. Write the TODO. parts, then
// set published: true. That publishes it and completes its MAKE. step
export const COMPONENT_FORMULA_DISPLAY_ARTICLE: EditorialArticle = {
  slug: 'component-formula-display',
  title: 'FORMULA DISPLAY.',
  subtitle: 'business math, one line at a time.',
  description: 'Math written as plain steps, easy to follow without a math background.',
  category: 'MAKE.',
  date: '2026-10-09',
  updated: '2026-11-04',
  published: true,
  coverColor: 'theme',
  coverStyle: 'tile',
  // needs: the DependConfig.json ids it runs on, e.g. ['neon', 'clerk']
  presents: { component: 'FormulaDisplay', needs: [] },
  author: 'justin-murry',
  tags: ['Component', 'Make', 'Formula Display'],
  sections: [
    {
      id: 'hero',
      type: 'hero',
      content: 'formula display.'
    },
    {
      id: 'what-it-does',
      type: 'paragraph',
      content: 'math written as plain steps, easy to follow without a math background.'
    },
    {
      id: 'component',
      type: 'component',
      metadata: { componentName: 'FormulaDisplay', componentProps: { steps: 'STARTING INVENTORY|+ PURCHASES|- ENDING INVENTORY', result: 'COGS (Cost of Goods)', title: 'COGS.' } }
    },
    {
      id: 'make-it-yours',
      type: 'heading',
      content: 'make it yours.'
    },
    {
      id: 'how-to-use',
      type: 'paragraph',
      content: 'give it steps, separated with a bar.'
    },
    {
      id: 'embed',
      type: 'code',
      content: '{ type: \'component\', metadata: { componentName: \'FormulaDisplay\', componentProps: { steps: \'STARTING INVENTORY|+ PURCHASES|- ENDING INVENTORY\', result: \'COGS (Cost of Goods)\', title: \'COGS.\' } } }',
      metadata: { language: 'ts', caption: 'Add this section to any article to embed Formula Display.' }
    }
  ]
};
