import type { EditorialArticle } from '../types';

// Component portfolio (#1433): the home of PriorityTable. Set published: true to publish
// it, which completes its MAKE. step
export const COMPONENT_PRIORITY_TABLE_ARTICLE: EditorialArticle = {
  slug: 'component-priority-table',
  title: 'PRIORITY TABLE.',
  subtitle: 'what deserves the work next?',
  description: 'Every unppp ranked by one effort-driven priority score: recent commit activity, step links and story mentions merged into a sortable table — the same scores behind the /status dashboard.',
  category: 'MAKE.',
  date: '2026-10-14',
  published: false,
  coverColor: 'theme',
  coverStyle: 'tile',
  // needs, found by npm run create:component-article -- --needs:
  //   neon: src/lib/unppp-priority-scores.ts
  presents: { component: 'PriorityTable', needs: ['neon'] },
  author: 'justin-murry',
  tags: ['Component', 'Make', 'Priority Table'],
  sections: [
    {
      id: 'hero',
      type: 'hero',
      content: 'priority table.'
    },
    {
      id: 'what-it-does',
      type: 'paragraph',
      content: 'every unppp in one sortable table, ranked by an effort-driven priority score: real commit activity from the repos, plus points for the steps that link to each project and the stories that mention it — the same scores /status reads.'
    },
    {
      id: 'component',
      type: 'component',
      metadata: { componentName: 'PriorityTable', componentProps: {} }
    },
    {
      id: 'make-it-yours',
      type: 'heading',
      content: 'make it yours.'
    },
    {
      id: 'how-to-use',
      type: 'paragraph',
      content: 'no props: it fetches the scores itself (/api/unppp/priority-score, backed by your database) and still ranks on the repo signal alone when that fetch has nothing. sort any column, tap a row to visit the project. born the same week as the unppp table, when the weekly sprint summary needed an honest answer to "what next?".'
    },
    {
      id: 'embed',
      type: 'code',
      content: '{ type: \'component\', metadata: { componentName: \'PriorityTable\', componentProps: {} } }',
      metadata: { language: 'ts', caption: 'Add this section to any article to embed Priority Table.' }
    },
    {
      id: 'where-heading',
      type: 'heading',
      content: 'try it where it lives.'
    },
    // /priority · /priority
    {
      id: 'where-priority',
      type: 'personal',
      content: 'the full dashboard: every unppp ranked, sorted your way.',
      metadata: { avatar: '/svgs/unparty/founders-rocket-avatar.webp', storyLink: '/priority' },
    }
  ]
};
