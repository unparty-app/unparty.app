import type { EditorialArticle } from '../types';

// Component portfolio (#1433): the home of LiveScale. Set published: true to publish
// it, which completes its MAKE. step
export const COMPONENT_LIVE_SCALE_ARTICLE: EditorialArticle = {
  slug: 'component-live-scale',
  title: 'LIVE SCALE.',
  subtitle: 'read the room, one slider.',
  description: 'A 1-to-10 slider with a readout you can see across the room: every vote joins the list and the average settles live. Made for asking one question out loud.',
  category: 'MAKE.',
  date: '2026-10-14',
  published: false,
  coverColor: 'theme',
  coverStyle: 'compound-eye',
  // needs: none found (npm run create:component-article -- --needs). Add DependConfig.json ids if it runs on any
  presents: { component: 'LiveScale', needs: [] },
  author: 'justin-murry',
  tags: ['Component', 'Make', 'Live Scale'],
  sections: [
    {
      id: 'hero',
      type: 'hero',
      content: 'live scale.'
    },
    {
      id: 'what-it-does',
      type: 'paragraph',
      content: 'a slider from 1 to 10, a number big enough to read across the room, and a VOTE button. every vote lands in the row below and the average updates as they come in. the votes live in the component — refresh, and the room starts over.'
    },
    {
      id: 'component',
      type: 'component',
      metadata: { componentName: 'LiveScale', componentProps: {} }
    },
    {
      id: 'make-it-yours',
      type: 'heading',
      content: 'make it yours.'
    },
    {
      id: 'how-to-use',
      type: 'paragraph',
      content: 'no props. ask one question out loud and pass the phone around, or put it on the projector — it fills its frame edge to edge on purpose, so give it room or trim the styles. one of the first components on the site, committed november 2024 as the "LiveScore" version.'
    },
    {
      id: 'embed',
      type: 'code',
      content: '{ type: \'component\', metadata: { componentName: \'LiveScale\', componentProps: {} } }',
      metadata: { language: 'ts', caption: 'Add this section to any article to embed Live Scale.' }
    },
    {
      id: 'where-heading',
      type: 'heading',
      content: 'try it where it lives.'
    },
    // /unppp · /unppp
    {
      id: 'where-unppp',
      type: 'personal',
      content: 'on the unppp page, scoring the idea live.',
      metadata: { avatar: '/svgs/unparty/founders-rocket-avatar.webp', storyLink: '/unppp' },
    }
  ]
};
