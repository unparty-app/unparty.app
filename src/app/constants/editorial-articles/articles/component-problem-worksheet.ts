import type { EditorialArticle } from '../types';

// Component portfolio (#1433): the home of ProblemWorksheet. Write the TODO. parts, then
// set published: true. That publishes it and completes its MAKE. step
export const COMPONENT_PROBLEM_WORKSHEET_ARTICLE: EditorialArticle = {
  slug: 'component-problem-worksheet',
  title: 'PROBLEM WORKSHEET.',
  subtitle: 'your problem, in words you pick.',
  description: 'Answer each question by picking five words from your site\'s word cloud. the words point to the kind of build your problem is.',
  category: 'MAKE.',
  date: '2026-10-09',
  updated: '2026-11-04',
  published: true,
  coverColor: 'theme',
  coverStyle: 'tile',
  // needs, what it can't run without (/build locks it until the stack has both):
  //   clerk: src/app/api/problem/send/route.ts (sign-in; 401 without it)
  //   neon: src/app/api/problem/send/route.ts (each submit is a UserSubmission row)
  // Optional, skipped when unset: loops (LOOPS_IDEA_*_ID emails), slack (SLACK_WEBHOOK_URL),
  // github (WAITLIST_REPO_* Discussion for review)
  presents: { component: 'ProblemWorksheet', needs: ['clerk', 'neon'] },
  author: 'justin-murry',
  tags: ['Component', 'Make', 'Problem Worksheet'],
  sections: [
    {
      id: 'hero',
      type: 'hero',
      content: 'problem worksheet.'
    },
    {
      id: 'what-it-does',
      type: 'paragraph',
      content: 'answer each question by picking five words from your site\'s word cloud. the words point to the kind of build your problem is.'
    },
    {
      id: 'component',
      type: 'component',
      metadata: { componentName: 'ProblemWorksheet', componentProps: {} }
    },
    {
      id: 'make-it-yours',
      type: 'heading',
      content: 'make it yours.'
    },
    {
      id: 'how-to-use',
      type: 'paragraph',
      content: 'no props. the more you write, the more words it offers.'
    },
    {
      id: 'embed',
      type: 'code',
      content: '{ type: \'component\', metadata: { componentName: \'ProblemWorksheet\', componentProps: {} } }',
      metadata: { language: 'ts', caption: 'Add this section to any article to embed Problem Worksheet.' }
    },
    {
      id: 'where-heading',
      type: 'heading',
      content: 'try it where it lives.'
    },
    // /waitlist/apply · /waitlist/apply
    {
      id: 'where-waitlist-apply',
      type: 'personal',
      content: 'the waitlist/apply page.',
      metadata: { avatar: '/svgs/unparty/founders-rocket-avatar.webp', storyLink: '/waitlist/apply' },
    },
    // /story/mood · MOOD.
    {
      id: 'where-story-mood',
      type: 'personal',
      content: 'mood.',
      metadata: { avatar: '/covers/cover-001.png', storyLink: '/article/setup-start-here' },
    }
  ]
};
