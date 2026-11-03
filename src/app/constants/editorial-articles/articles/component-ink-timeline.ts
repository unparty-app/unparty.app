import type { EditorialArticle } from '../types';

// Component portfolio (#1433): the home of InkTimeline. Set published: true to publish
// it, which completes its MAKE. step
export const COMPONENT_INK_TIMELINE_ARTICLE: EditorialArticle = {
  slug: 'component-ink-timeline',
  title: 'INK TIMELINE.',
  subtitle: 'how steadily do you ship?',
  description: "A hand-drawn timeline of everything you've published, month by month, drawn from your own site: one pen line that draws itself in, a tally mark per month, and a breathing dot at now. Or one line per area of your work, to see where your effort goes.",
  category: 'MAKE.',
  date: '2026-10-12',
  published: true,
  coverColor: 'theme',
  coverStyle: 'kaleidoscope',
  // needs: none found (npm run create:component-article -- --needs). Add DependConfig.json ids if it runs on any
  presents: { component: 'InkTimeline', needs: [] },
  author: 'justin-murry',
  tags: ['Component', 'Make', 'Ink Timeline'],
  sections: [
    {
      id: 'hero',
      type: 'hero',
      content: 'ink timeline.'
    },
    {
      id: 'what-it-does',
      type: 'paragraph',
      content: "one pen line for everything you've built, month by month, ending on the project that uses it now. the timeline starts where steady work begins, so one early piece doesn't flatten the line."
    },
    {
      id: 'component',
      type: 'component',
      metadata: { componentName: 'InkTimeline', componentProps: { source: 'shipped' } }
    },
    {
      id: 'effort-para',
      type: 'paragraph',
      content: 'and where the effort goes, one line per area:'
    },
    {
      id: 'component-effort',
      type: 'component',
      metadata: { componentName: 'InkTimeline', componentProps: { source: 'effort' } }
    },
    {
      id: 'make-it-yours',
      type: 'heading',
      content: 'make it yours.'
    },
    {
      id: 'how-to-use',
      type: 'paragraph',
      content: "name a source and it draws your own data: **shipped** (everything you've published), **effort** (one line per area in founder.resume.areas, the steepest is where your time goes now) or **momentum** (the SETUP. and MAKE. steps you've finished)."
    },
    {
      id: 'embed',
      type: 'code',
      content: '{ type: \'component\', metadata: { componentName: \'InkTimeline\', componentProps: { source: \'shipped\' } } }',
      metadata: { language: 'ts', caption: 'Add this section to any article to embed Ink Timeline.' }
    },
    {
      id: 'where-heading',
      type: 'heading',
      content: 'try it where it lives.'
    },
    // /article/vibe-coding-invisible-to-google · There Is No Such Thing As Vibe Coding.
    {
      id: 'where-article-vibe-coding-invisible-to-google',
      type: 'personal',
      content: 'the shipped line, as evidence that every page is built to be found.',
      metadata: { avatar: '/svgs/unparty/founders-rocket-avatar.webp', storyLink: '/article/setup-start-here' },
    }
  ]
};
