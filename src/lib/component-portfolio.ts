import { EDITORIAL_ARTICLES } from '../app/constants/editorial-articles/registry';

/**
 * The component portfolio (#1433): every component an article or story can
 * embed, each with its home article and its MAKE. step.
 *
 * The names are componentRegistry's keys in EditorialSection.tsx, which is
 * typed by ComponentName, so adding a component there without adding it here
 * (or the other way round) fails `tsc`.
 *
 * The catalog lives in the articles, not in a data file: an article that sets
 * `presents: { component, needs }` is that component's home, so its title and
 * description are the page search engines index. A MAKE. step is done once its
 * home article is published.
 */

export const COMPONENT_NAMES = [
  'ColorMatchingGame',
  'ResilienceBuildActivity',
  'WaitlistInvite',
  'AboutComponent',
  'Definitions',
  'SplineEmbed',
  'FilmCalculator',
  'ProblemWorksheet',
  'YouTubeEmbed',
  'TikTokEmbed',
  'FormulaDisplay',
  'GoalBudget',
  'Strike',
  'StoryTable',
  'BookTable',
  'UnpppTable',
  'Expensd',
  'DatabaseCalculator',
  'SetupCurriculum',
  'FiveThingsChallenge',
  'InstagramEmbed',
  'VerseCardScroll',
  'DependCardScroll',
  'StepCard',
  'StepScroll',
  'StoryPreview',
  'Cta',
  'BuildYours',
  'BuildYourStack',
  'BrandColors',
  'LinkPreview',
  'DoubtsCloud',
  'DeleteYourDoubts',
  'ArticlePreview',
  'BusinessWorksheet',
  'AIWrappedVisualization',
  'HtmlEmbed',
  'BrandPalette',
  'ColorPalette',
  'Logo3d',
  'InkTimeline',
  'StackLedger',
  'ViewsChart',
  'RepoFocus',
  'TypeStatline',
  'BuildRhythm',
  'InkPath',
  'InkSystem',
  'InkWords',
  'NextStep',
  // Found embeddable but unregistered by the missing-components audit (#1433):
  // page-wired or orphaned blocks that render standalone, now in the portfolio
  'Blog',
  'ArticleTable',
  'PriorityTable',
  'CommunicationStyleGame',
  'MiniMaze',
  'ExploreResilience',
  'ResilienceReflection',
  'LiveScale',
  'SponsorCard',
  'LanguageVisualization',
  'EffortVisualization',
  'DiscoBall',
  'IconDrawPad',
  'ValuesBadge',
  'YourWords',
  'ArticleList',
  'ComponentTable',
] as const;

export type ComponentName = (typeof COMPONENT_NAMES)[number];

// Names that don't read well split at their capitals
// (scripts/create-component-article.mjs keeps a copy, for the article slugs)
const LABELS: Partial<Record<ComponentName, string>> = {
  Cta: 'CTA',
  AIWrappedVisualization: 'AI Wrapped',
  HtmlEmbed: 'HTML Embed',
  YouTubeEmbed: 'YouTube Embed',
  TikTokEmbed: 'TikTok Embed',
  AboutComponent: 'About',
  Logo3d: 'Logo 3D',
  IconDrawPad: 'Draw Your Icons',
  EffortVisualization: 'Effort Ball',
};

export const componentLabel = (name: ComponentName) => LABELS[name] ?? name.replace(/([a-z])([A-Z])/g, '$1 $2');

// The label as a URL word: "YouTube Embed" → youtube-embed, "Logo 3D" → logo-3d
export const componentSlug = (name: ComponentName) => componentLabel(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// The MAKE. step's id, stable so re-seeding never touches anyone's progress
export const makeStepId = (name: ComponentName) => `make-${componentSlug(name)}`;

export interface PortfolioHome {
  slug: string;
  title: string;
  blurb: string;
  published: boolean;
  // MAKE. for the component articles; a SETUP. or brand article that also
  // presents a component keeps its own
  category: string;
}

export interface PortfolioItem {
  name: ComponentName;
  label: string;
  stepId: string;
  // The article that presents it, if one does yet
  home: PortfolioHome | null;
  // DependConfig.json ids it runs on
  needs: string[];
  // Its MAKE. step is done: the home article is published
  done: boolean;
}

// EDITORIAL_ARTICLES, not getEditorialArticle(): that one also reads JSON/MD
// files on the server, so the server render could disagree with the browser's
export function getPortfolio(): PortfolioItem[] {
  return COMPONENT_NAMES.map((name) => {
    const article = EDITORIAL_ARTICLES.find((a) => a.presents?.component === name);
    const home = article
      ? { slug: article.slug, title: article.title, blurb: article.subtitle || article.description, published: article.published, category: article.category }
      : null;
    return {
      name,
      label: componentLabel(name),
      stepId: makeStepId(name),
      home,
      needs: article?.presents?.needs ?? [],
      done: Boolean(home?.published),
    };
  });
}
