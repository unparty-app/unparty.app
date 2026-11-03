import type { EditorialArticle } from '../types';

// Component portfolio (#1433): the home of WaitlistInvite. Write the TODO. parts, then
// set published: true. That publishes it and completes its MAKE. step
export const COMPONENT_WAITLIST_INVITE_ARTICLE: EditorialArticle = {
  slug: 'component-waitlist-invite',
  title: 'WAITLIST INVITE.',
  subtitle: 'TODO.',
  description: 'TODO.',
  category: 'MAKE.',
  date: '2026-10-09',
  updated: '2026-10-10',
  published: false,
  coverColor: 'theme',
  // needs, found by npm run create:component-article -- --needs:
  //   clerk: src/app/components/Invite.tsx
  presents: { component: 'WaitlistInvite', needs: ['clerk'] },
  author: 'justin-murry',
  tags: ['Component', 'Make', 'Waitlist Invite'],
  sections: [
    {
      id: 'hero',
      type: 'hero',
      content: 'waitlist invite.'
    },
    {
      id: 'what-it-does',
      type: 'paragraph',
      content: 'TODO. What it does, in a sentence or two.'
    },
    {
      id: 'component',
      type: 'component',
      metadata: { componentName: 'WaitlistInvite', componentProps: {} }
    },
    {
      id: 'make-it-yours',
      type: 'heading',
      content: 'make it yours.'
    },
    {
      id: 'how-to-use',
      type: 'paragraph',
      content: 'I did not end up needing a waitlist feature. It is pretty good to go, with just a few decisions you need to make on the user journey for Slack.'
    },
    {
      id: 'embed',
      type: 'code',
      content: '{ type: \'component\', metadata: { componentName: \'WaitlistInvite\', componentProps: {} } }',
      metadata: { language: 'ts', caption: 'Add this section to any article to embed Waitlist Invite.' }
    },
    {
      id: 'where-heading',
      type: 'heading',
      content: 'try it where it lives.'
    },
    // / · every page (the site layout)
    {
      id: 'where-home',
      type: 'personal',
      content: 'TODO.',
      metadata: { avatar: '/svgs/unparty/founders-rocket-avatar.webp', storyLink: '/' },
    }
  ]
};
