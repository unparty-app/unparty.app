import type { EditorialArticle } from '../types';

// Component portfolio (#1433): the home of ValuesBadge
export const COMPONENT_VALUES_BADGE_ARTICLE: EditorialArticle = {
  slug: 'component-values-badge',
  title: 'VALUES BADGE.',
  subtitle: 'say once what your site stands for.',
  description: 'ValuesBadge shows one line about what your site stands for, with a cover, on the homepage row and in the footer. The words come from FoundersConfig.json, and an empty line hides it everywhere.',
  category: 'MAKE.',
  date: '2026-10-16',
  published: true,
  coverColor: 'theme',
  coverStyle: 'compound-eye',
  // Runs on nothing but FoundersConfig.json
  presents: { component: 'ValuesBadge', needs: [] },
  unpppType: 'app',
  author: 'justin-murry',
  tags: ['Component', 'Make', 'Values Badge'],
  sections: [
    {
      id: 'hero',
      type: 'hero',
      content: 'values badge.'
    },
    // The card is sized for a row, so it sits beside its words, as in a story
    {
      id: 'component',
      type: 'columns',
      columnSections: [
        [{ id: 'what-it-does', type: 'paragraph', content: 'unparty.app is MIT: anyone can use it, change it, and sell what they build. What it stands for is not a license term. It is a line on the page: you do you, but there is no place for hate.' }],
        [{ id: 'card', type: 'component', metadata: { componentName: 'ValuesBadge', componentProps: {} } }],
      ],
      metadata: { layout: '1:1', verticalAlign: 'center', mobile: 'peek' }
    },
    {
      id: 'make-it-yours',
      type: 'heading',
      content: 'make it yours.'
    },
    {
      id: 'how-to-use',
      type: 'paragraph',
      content: 'Set "values" in FoundersConfig.json: a label, the line, and a cover. The footer shows the line without the cover. Leave the line empty and the badge is gone from every page.'
    },
    {
      id: 'embed',
      type: 'code',
      content: '{ type: \'component\', metadata: { componentName: \'ValuesBadge\', componentProps: {} } }',
      metadata: { language: 'ts', caption: 'Add this section to any article to embed Values Badge. In a story it reads best in columns, beside a line of yours.' }
    },
    {
      id: 'where-heading',
      type: 'heading',
      content: 'try it where it lives.'
    },
    // / · —
    {
      id: 'where-home',
      type: 'personal',
      content: 'on the homepage row, and in every footer.',
      metadata: { avatar: '/covers/cover-001.png', storyLink: '/' },
    },
    // /story/personal-mission · MY FRIENDS DO NOT LIKE MY WRITING.
    {
      id: 'where-story-personal-mission',
      type: 'personal',
      content: 'next to "talk to real people."',
      metadata: { avatar: '/svgs/unparty/founders-rocket-avatar.webp', storyLink: '/article/setup-start-here' },
    }
  ]
};
