import type { EditorialArticle } from '../types';

// Component portfolio (#1433): the home of IconDrawPad
export const COMPONENT_DRAW_YOUR_ICONS_ARTICLE: EditorialArticle = {
  slug: 'component-draw-your-icons',
  title: 'DRAW YOUR ICONS.',
  seoTitle: 'DRAW YOUR ICONS. the icon pad',
  subtitle: 'every icon on this site, redrawn in your own hand.',
  description: 'Draw Your Icons is a pad for redrawing a site\'s icons by hand: with your finger, a pen or a mouse, on the same grid the icons are drawn on. Try it here and every icon you redraw becomes yours on this device. On your own copy, the drawings become your site\'s icons.',
  category: 'MAKE.',
  date: '2026-10-16',
  published: true,
  coverColor: 'theme',
  coverStyle: 'tile',
  // needs, found by npm run create:component-article -- --needs:
  //   clerk: src/lib/admin.ts
  //   github: src/lib/founders-config-write.ts
  presents: { component: 'IconDrawPad', needs: ['clerk', 'github'] },
  unpppType: 'app',
  author: 'justin-murry',
  tags: ['Component', 'Make', 'Draw Your Icons'],
  sections: [
    {
      id: 'hero',
      type: 'hero',
      content: 'draw your icons.'
    },
    {
      id: 'what-it-does',
      type: 'paragraph',
      content: 'Pick an icon and draw it the way your hand does. Let the lines overshoot. Let the loops run past where they start. Press use mine, then look around: that icon is your drawing on every page you open from here.'
    },
    {
      id: 'component',
      type: 'component',
      metadata: { componentName: 'IconDrawPad', componentProps: {} }
    },
    {
      id: 'only-yours',
      type: 'paragraph',
      content: 'What you draw here stays in your browser. Nothing is sent anywhere, and put the site\'s back undoes it.'
    },
    {
      id: 'make-it-yours',
      type: 'heading',
      content: 'make it yours.'
    },
    {
      id: 'how-to-use',
      type: 'paragraph',
      content: 'On your own copy, the same pad sits in /admin under your icons. Draw as many as you like, from your phone if you want, and save them all at once. Your site\'s icons live in FoundersConfig.json, so every page, button and link takes your hand.'
    },
    {
      id: 'embed',
      type: 'code',
      content: '{ type: \'component\', metadata: { componentName: \'IconDrawPad\', componentProps: { icons: \'Heart|User|Lightbulb\', compact: true } } }',
      metadata: { language: 'ts', caption: 'Add this section to any article to embed Draw Your Icons.' }
    },
    {
      id: 'where-heading',
      type: 'heading',
      content: 'try it where it lives.'
    },
    {
      id: 'where-story',
      type: 'personal',
      content: 'protect what makes you, you.',
      metadata: { avatar: '/covers/cover-001.png', storyLink: '/article/setup-start-here' },
    }
  ]
};
