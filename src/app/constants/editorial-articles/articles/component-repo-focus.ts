import type { EditorialArticle } from '../types';

// Component portfolio (#1433): the home of RepoFocus (#453, once RepoPreview).
// Set published: true to publish it, which completes its MAKE. step
export const COMPONENT_REPO_FOCUS_ARTICLE: EditorialArticle = {
  slug: 'component-repo-focus',
  title: 'REPO FOCUS.',
  subtitle: 'where did my hours go?',
  description: 'Twelve weeks of your repos, a row each, a stroke a week as tall as the hours you put in, and one sentence on how your focus moved. Measured from your commits on every build and priced at your own hourly rate.',
  category: 'MAKE.',
  date: '2026-10-20',
  published: true,
  coverColor: 'theme',
  coverStyle: 'compound-eye',
  presents: { component: 'RepoFocus', needs: ['github'] },
  author: 'justin-murry',
  tags: ['Component', 'Make', 'Repo Focus'],
  sections: [
    {
      id: 'hero',
      type: 'hero',
      content: 'repo focus.'
    },
    {
      id: 'what-it-does',
      type: 'paragraph',
      content: 'you can feel where your time goes, but it is hard to see. this reads your commits and opens on the repo with your hours now: a stroke a week, the last four in your color, a dot where you released. tap any repo below to see it instead. then do something with it: **price yours** opens Goal Budget with what it took, and **take it** opens what it released, to try and keep in your own repo.'
    },
    {
      id: 'component',
      type: 'component',
      metadata: { componentName: 'RepoFocus', componentProps: { source: 'focus' } }
    },
    {
      id: 'how-hours-heading',
      type: 'heading',
      content: 'how the hours are counted.'
    },
    {
      id: 'how-hours',
      type: 'paragraph',
      content: 'commits less than two hours apart are one work session. a session counts from its first commit to its last, plus fifteen minutes, and never more than four hours. it is the same rule your [baseline](/article/setup-baseline) was measured with, run again on every build, so nothing here is typed in by hand. commits are not the whole job, so read it as where your attention went, not a timesheet.'
    },
    {
      id: 'make-it-yours',
      type: 'heading',
      content: 'make it yours.'
    },
    {
      id: 'how-to-use',
      type: 'paragraph',
      content: 'install [your GitHub App](/article/setup-github-app) on the repos you build in. the next build reads their commits, private ones included, and this fills in with your own. the hours are priced at the rate in your baseline, so set that to your own pay too.'
    },
    {
      id: 'embed',
      type: 'code',
      content: '{ type: \'component\', metadata: { componentName: \'RepoFocus\', componentProps: { source: \'focus\' } } }',
      metadata: { language: 'ts', caption: 'Add this section to any article to embed Repo Focus.' }
    }
  ]
};
