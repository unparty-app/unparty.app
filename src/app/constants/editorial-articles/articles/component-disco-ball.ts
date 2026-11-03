import type { EditorialArticle } from '../types';

// Component portfolio (#1433): the home of DiscoBall. Write the TODO. parts, then
// set published: true. That publishes it and completes its MAKE. step
export const COMPONENT_DISCO_BALL_ARTICLE: EditorialArticle = {
  slug: 'component-disco-ball',
  title: 'DISCO BALL.',
  subtitle: 'a mirror ball in your theme color. spin it, drag it, light the room.',
  description: 'DiscoBall is a 3D mirror ball for your site, in your theme color, with four lighting modes. Drag it around, zoom in, and make it better.',
  category: 'MAKE.',
  date: '2026-10-15',
  published: true,
  coverColor: 'theme',
  coverStyle: 'compound-eye',
  // needs: none found (npm run create:component-article -- --needs). Add DependConfig.json ids if it runs on any
  presents: { component: 'DiscoBall', needs: [] },
  author: 'justin-murry',
  tags: ['Component', 'Make', 'Disco Ball'],
  sections: [
    {
      id: 'hero',
      type: 'hero',
      content: 'disco ball.'
    },
    {
      id: 'what-it-does',
      type: 'paragraph',
      content: 'Every site needs a little play. this one spins in your theme color, catches the light, and lets you drag it around.'
    },
    {
      id: 'component',
      type: 'component',
      metadata: { componentName: 'DiscoBall', componentProps: { height: '420px' } }
    },
    {
      id: 'make-it-yours',
      type: 'heading',
      content: 'make it yours.'
    },
    {
      id: 'how-to-use',
      type: 'paragraph',
      content: 'Pick a lightingMode: party, chill, ambient or dramatic. color and tileColor change the ball and its mirrors (without them it follows your theme color), size is small, medium or large, and a rotationSpeed of 0 holds it still.'
    },
    {
      id: 'improve-heading',
      type: 'heading',
      content: 'make it better.'
    },
    {
      id: 'improve',
      type: 'paragraph',
      content: 'This was always one of my favorite pieces, and it is heavy. it draws every frame, even when nobody is looking, and its night reflections download a lighting file each time it loads. so it left the homepage and got its own page here. if you love 3D, make it lighter: draw only when it moves, or bake the reflections in. then send it back.'
    },
    {
      id: 'embed',
      type: 'code',
      content: '{ type: \'component\', metadata: { componentName: \'DiscoBall\', componentProps: { height: \'420px\' } } }',
      metadata: { language: 'ts', caption: 'Add this section to any article to embed Disco Ball.' }
    },
    {
      id: 'where-heading',
      type: 'heading',
      content: 'try it where it lives.'
    },
    // /theunpartycloud · theunpartycloud
    {
      id: 'where-theunpartycloud',
      type: 'personal',
      content: 'spinning on the cloud page.',
      metadata: { avatar: '/covers/cover-001.png', storyLink: '/article/setup-start-here' },
    },
    // /theunpartyseeme · A Strategic Review of unparty.app
    {
      id: 'where-theunpartyseeme',
      type: 'personal',
      content: 'spinning on seeme.',
      metadata: { avatar: '/covers/cover-001.png', storyLink: '/article/setup-start-here' },
    },
    // /theunpartyspace · Manage Your Space & Generate CSS
    {
      id: 'where-theunpartyspace',
      type: 'personal',
      content: 'spinning on space.',
      metadata: { avatar: '/covers/cover-001.png', storyLink: '/article/setup-start-here' },
    },
    // /theunpartyteam · Budget & Track Your Project Cost
    {
      id: 'where-theunpartyteam',
      type: 'personal',
      content: 'spinning on team.',
      metadata: { avatar: '/covers/cover-001.png', storyLink: '/article/setup-start-here' },
    },
    // /film-calculator · Film ROI Calculator
    {
      id: 'where-film-calculator',
      type: 'personal',
      content: 'spinning under the film calculator.',
      metadata: { avatar: '/svgs/unparty/founders-rocket-avatar.webp', storyLink: '/article/setup-start-here' },
    }
  ]
};
