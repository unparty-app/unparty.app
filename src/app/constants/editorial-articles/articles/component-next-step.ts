import type { EditorialArticle } from '../types';

// Component portfolio (#1433): the home of NextStep. Set published: true to publish
// it, which completes its MAKE. step
export const COMPONENT_NEXT_STEP_ARTICLE: EditorialArticle = {
  slug: 'component-next-step',
  title: 'NEXT STEP.',
  subtitle: 'where are you starting from?',
  description: 'A map of your projects by stage and where each one leads. A reader picks a starting point and the project to begin with lights up — or, with a model key set, they can say where they are in their own words.',
  category: 'MAKE.',
  date: '2026-10-14',
  published: false,
  coverColor: 'theme',
  coverStyle: 'tile',
  // needs, found by npm run create:component-article -- --needs:
  //   claude: src/lib/llm.ts
  presents: { component: 'NextStep', needs: ['claude'] },
  author: 'justin-murry',
  tags: ['Component', 'Make', 'Next Step'],
  sections: [
    {
      id: 'hero',
      type: 'hero',
      content: 'next step.'
    },
    {
      id: 'what-it-does',
      type: 'paragraph',
      content: "your projects by stage, drawn as stops on one path. a reader picks where they're starting — a brand, a journal — and the stop to start with lights up, along with where it leads next."
    },
    {
      id: 'component',
      type: 'component',
      metadata: { componentName: 'NextStep', componentProps: { source: 'path' } }
    },
    {
      id: 'make-it-yours',
      type: 'heading',
      content: 'make it yours.'
    },
    {
      id: 'how-to-use',
      type: 'paragraph',
      content: "give it `source: 'path'` and it draws your own projects from the resume data: each project's stage and starting points become the stops. with a model key set (ANTHROPIC_API_KEY), free-text matching turns on and a reader can answer in their own words — your model picks their starting stop."
    },
    {
      id: 'embed',
      type: 'code',
      content: '{ type: \'component\', metadata: { componentName: \'NextStep\', componentProps: { source: \'path\' } } }',
      metadata: { language: 'ts', caption: 'Add this section to any article to embed Next Step.' }
    },
    {
      id: 'where-heading',
      type: 'heading',
      content: 'try it where it lives.'
    },
    // /founders · the resume's BUILDING. chapter swaps its path chart for NextStep
    // when the projects declare starting points (resume-data.ts)
    {
      id: 'where-founders',
      type: 'personal',
      content: 'under BUILDING. on the resume, asking every visitor where they are starting from.',
      metadata: { avatar: '/svgs/unparty/founders-rocket-avatar.webp', storyLink: '/founders' },
    }
  ]
};
