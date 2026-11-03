import type { EditorialArticle } from '../types';

// Component portfolio (#1433): the home of SponsorCard
export const COMPONENT_SPONSOR_CARD_ARTICLE: EditorialArticle = {
  slug: 'component-sponsor-card',
  title: 'SPONSOR CARD.',
  subtitle: 'a way for the people your work helped to help it keep going.',
  description: 'SponsorCard shows your sponsor links, GitHub Sponsors and a Polar checkout link, as a card with a cover and one line in your words. It reads FoundersConfig.json, and it hides itself when there is nothing to link to.',
  category: 'MAKE.',
  date: '2026-10-16',
  updated: '2026-10-15',
  published: true,
  coverColor: 'theme',
  coverStyle: 'kaleidoscope',
  // Runs on nothing but FoundersConfig.json
  presents: { component: 'SponsorCard', needs: [] },
  unpppType: 'service',
  author: 'justin-murry',
  tags: ['Component', 'Make', 'Sponsor Card'],
  sections: [
    {
      id: 'hero',
      type: 'hero',
      content: 'sponsor card.'
    },
    // The card is sized for a row, so it sits beside its words, as in a story
    {
      id: 'component',
      type: 'columns',
      columnSections: [
        [{ id: 'what-it-does', type: 'paragraph', content: 'People who get value from your work can pay you for it. Sponsor Card puts your GitHub Sponsors and Polar links on your homepage, with your cover and one line in your words.' }],
        [{ id: 'card', type: 'component', metadata: { componentName: 'SponsorCard', componentProps: {} } }],
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
      content: 'Set "sponsor" in FoundersConfig.json: your GitHub Sponsors account name as github, a Polar checkout link as polarUrl, a cover, and a pitch. With neither link set, the card shows nowhere. Keep .github/FUNDING.yml pointing at the same accounts, so the sponsor button on your repo matches.'
    },
    {
      id: 'embed',
      type: 'code',
      content: '{ type: \'component\', metadata: { componentName: \'SponsorCard\', componentProps: {} } }',
      metadata: { language: 'ts', caption: 'Add this section to any article to embed Sponsor Card. In a story it reads best in columns, beside a line of yours.' }
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
      content: 'on the homepage, in the row after the start.',
      metadata: { avatar: '/covers/cover-001.png', storyLink: '/' },
    },
    // /story/dash · DASH.
    {
      id: 'where-story-dash',
      type: 'personal',
      content: 'next to "you think highly of yourself."',
      metadata: { avatar: '/covers/cover-001.png', storyLink: '/article/setup-start-here' },
    }
  ]
};
