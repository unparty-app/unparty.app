import type { EditorialArticle } from '../types';

// Component portfolio (#1433): the home of EffortVisualization
export const COMPONENT_EFFORT_BALL_ARTICLE: EditorialArticle = {
  slug: 'component-effort-ball',
  title: 'EFFORT BALL.',
  subtitle: 'every project as one facet of a ball, sized and lit by its work.',
  description: 'The effort ball draws every project as a facet of one 3D ball: how much work went into it, how recently, and how it compares. Spin it, point at a facet, and see a project in the whole.',
  category: 'MAKE.',
  date: '2026-10-16',
  published: true,
  coverColor: 'theme',
  coverStyle: 'tile',
  presents: { component: 'EffortVisualization', needs: [] },
  unpppType: 'app',
  author: 'justin-murry',
  tags: ['Component', 'Make', 'Effort Ball'],
  sections: [
    {
      id: 'hero',
      type: 'hero',
      content: 'effort ball.'
    },
    {
      id: 'what-it-does',
      type: 'paragraph',
      content: 'Each project is a facet on the ball. The more work it took, the bigger it is, and the more recent the work, the brighter it lights. Drag it around and point at a facet to see which project it is.'
    },
    {
      id: 'component',
      type: 'component',
      metadata: { componentName: 'EffortVisualization', componentProps: { height: '480px', rotationSpeed: 0.2 } }
    },
    {
      id: 'make-it-yours',
      type: 'heading',
      content: 'make it yours.'
    },
    {
      id: 'how-to-use',
      type: 'paragraph',
      content: 'Give it a project id (unpppId) and it lights that project within the whole. It used to sit on every project page, and it is heavy: one draw call for each facet, every frame. So the project pages show the statline now, a quick read of where the work goes by kind of build, and the ball lives here for whoever wants to spin it.'
    },
    {
      id: 'embed',
      type: 'code',
      content: '{ type: \'component\', metadata: { componentName: \'EffortVisualization\', componentProps: { unpppId: \'theunpartyapp\', height: \'480px\' } } }',
      metadata: { language: 'ts', caption: 'Add this section to any article to embed Effort Ball.' }
    }
  ]
};
