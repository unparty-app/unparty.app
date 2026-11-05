import type { EditorialArticle } from '../types';

// Component portfolio (#1433): the home of StoryPreview (#1647). Write the TODO. parts
// under "try it where it lives", then set published: true. That publishes it and
// completes its MAKE. step
export const COMPONENT_STORY_PREVIEW_ARTICLE: EditorialArticle = {
  slug: 'component-story-preview',
  title: 'STORY PREVIEW.',
  subtitle: 'a story, in its own big lines.',
  description: "A story inside an article, as a row of its highlights: the story's card, then the lines its author set big, one card each. Swipe them on a phone, see them side by side on a wide screen, and read the whole story in one tap.",
  category: 'MAKE.',
  date: '2026-10-09',
  updated: '2026-11-04',
  published: true,
  coverColor: 'theme',
  coverStyle: 'compound-eye',
  // needs: the DependConfig.json ids it runs on, e.g. ['neon', 'clerk']
  presents: { component: 'StoryPreview', needs: [] },
  author: 'justin-murry',
  tags: ['Component', 'Make', 'Story Preview'],
  sections: [
    {
      id: 'hero',
      type: 'hero',
      content: 'story preview.'
    },
    {
      id: 'what-it-does',
      type: 'paragraph',
      content: 'an article tells the whole journey. a story is the personal part of it. this shows a story without taking over the page: its card first, then the lines you set big in it, one card each, and one tap into the whole story.'
    },
    {
      id: 'component',
      type: 'component',
      metadata: { componentName: 'StoryPreview', componentProps: { coverId: 'cover-001' } }
    },
    {
      id: 'make-it-yours',
      type: 'heading',
      content: 'make it yours.'
    },
    {
      id: 'how-to-use',
      type: 'paragraph',
      content: 'give it a story\'s **coverId**. the cards are the lines you wrote with # in that story, so the story picks its own highlights. to choose them yourself, list section ids in **sectionIds**; **maxSections** keeps it to that many.'
    },
    {
      id: 'embed',
      type: 'code',
      content: '{ type: \'component\', metadata: { componentName: \'StoryPreview\', componentProps: { coverId: \'cover-001\' } } }',
      metadata: { language: 'ts', caption: 'Add this section to any article to embed Story Preview.' }
    },
    {
      id: 'where-heading',
      type: 'heading',
      content: 'try it where it lives.'
    },
    // /article/unparty-app-story · unparty.app
    {
      id: 'where-article-unparty-app-story',
      type: 'personal',
      content: 'unparty.app.',
      metadata: { avatar: '/covers/cover-001.png', storyLink: '/article/setup-start-here' },
    },
    // /article/unparty-quit-story · YOU DO NOT HAVE HATERS. 
    {
      id: 'where-article-unparty-quit-story',
      type: 'personal',
      content: 'you do not have haters.',
      metadata: { avatar: '/covers/cover-001.png', storyLink: '/article/setup-start-here' },
    },
    // /article/unparty-runway-story · RULE 01:
    {
      id: 'where-article-unparty-runway-story',
      type: 'personal',
      content: 'rule 01.',
      metadata: { avatar: '/covers/cover-001.png', storyLink: '/article/setup-start-here' },
    },
    // /article/unparty-unppp-story · do you unppp?
    {
      id: 'where-article-unparty-unppp-story',
      type: 'personal',
      content: 'do you unppp?.',
      metadata: { avatar: '/covers/cover-001.png', storyLink: '/article/setup-start-here' },
    },
    // /article/xcode-shortcuts-guide-macos-ios-development · XCODE SHORTCUTS.
    {
      id: 'where-article-xcode-shortcuts-guide-macos-ios-development',
      type: 'personal',
      content: 'xcode shortcuts.',
      metadata: { avatar: '/covers/cover-001.png', storyLink: '/article/setup-start-here' },
    }
  ]
};
