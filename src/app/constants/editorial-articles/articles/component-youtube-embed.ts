import type { EditorialArticle } from '../types';

// Component portfolio (#1433): the home of YouTubeEmbed. Write the TODO. parts, then
// set published: true. That publishes it and completes its MAKE. step
export const COMPONENT_YOUTUBE_EMBED_ARTICLE: EditorialArticle = {
  slug: 'component-youtube-embed',
  title: 'YOUTUBE EMBED.',
  subtitle: 'a video, in your story.',
  description: 'A YouTube video, right where you are writing about it.',
  category: 'MAKE.',
  date: '2026-10-09',
  updated: '2026-11-04',
  published: true,
  coverColor: 'theme',
  // needs: the DependConfig.json ids it runs on, e.g. ['neon', 'clerk']
  presents: { component: 'YouTubeEmbed', needs: [] },
  author: 'justin-murry',
  tags: ['Component', 'Make', 'YouTube Embed'],
  sections: [
    {
      id: 'hero',
      type: 'hero',
      content: 'youtube embed.'
    },
    {
      id: 'what-it-does',
      type: 'paragraph',
      content: 'a YouTube video, right where you are writing about it.'
    },
    {
      id: 'component',
      type: 'component',
      metadata: { componentName: 'YouTubeEmbed', componentProps: { videoId: 'https://youtu.be/0lzMS6qYekM' } }
    },
    {
      id: 'make-it-yours',
      type: 'heading',
      content: 'make it yours.'
    },
    {
      id: 'how-to-use',
      type: 'paragraph',
      content: 'give it the video\'s url or id.'
    },
    {
      id: 'embed',
      type: 'code',
      content: '{ type: \'component\', metadata: { componentName: \'YouTubeEmbed\', componentProps: { videoId: \'https://youtu.be/0lzMS6qYekM\' } } }',
      metadata: { language: 'ts', caption: 'Add this section to any article to embed YouTube Embed.' }
    },
    {
      id: 'where-heading',
      type: 'heading',
      content: 'try it where it lives.'
    },
    // /story/unppp · UNPPP.
    {
      id: 'where-story-unppp',
      type: 'personal',
      content: 'unppp.',
      metadata: { avatar: '/covers/cover-030.png', storyLink: '/article/setup-start-here' },
    },
    // /story/dtla · know your city
    {
      id: 'where-story-dtla',
      type: 'personal',
      content: 'know your city.',
      metadata: { avatar: '/covers/cover-001.png', storyLink: '/article/setup-start-here' },
    },
    // /story/friend · friend.
    {
      id: 'where-story-friend',
      type: 'personal',
      content: 'friend.',
      metadata: { avatar: '/covers/cover-001.png', storyLink: '/article/setup-start-here' },
    },
    // /story/synesthesia · SYNESTHESIA
    {
      id: 'where-story-synesthesia',
      type: 'personal',
      content: 'synesthesia.',
      metadata: { avatar: '/svgs/unparty/founders-rocket-avatar.webp', storyLink: '/article/setup-start-here' },
    }
  ]
};
