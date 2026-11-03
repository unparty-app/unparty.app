'use client';
import React from 'react';

/**
 * EmbeddableComponents - Wrapped versions of components for use in EditorialSection
 *
 * Components that require context providers (like ColorSelectionProvider) must be
 * wrapped here before being embedded in story/article markdown files.
 *
 * This ensures they have access to required contexts when dynamically loaded.
 */

import { ColorSelectionProvider } from '../../contexts/ColorSelectionContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useArticleBackground } from '../../contexts/ArticleBackgroundContext';
import { useBrandColors } from '../../hooks/useBrandColors';
import { CSS_COLOR_ROLES } from '../../utils/importColorsCss';
import { useUser } from '@/lib/auth-stub.client';
import { useFetch } from '@/hooks/useFetch';
import ColorMatchingGame from '../ColorMatchingGame';
import ColorPicker from '../ColorPicker';
import Invite from '../Invite';
import { BusinessWorksheetContent } from '../BusinessWorksheet';
import DependCardScroll from '../DependCard';
import { getDependItems, findPlan } from '../../../utils/dependCosts';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import FounderCta from '../../founders/components/FounderCta';
import BuildYoursCard from '../build-yours/BuildYoursCard';
import { DEPLOY_URL } from '../../constants/organization';
import BuildYourStack from '../depend/BuildYourStack';
import InkPath from '../resume/InkPath';
import InkSystem from '../resume/InkSystem';
import NextStep from '../resume/NextStep';
import { useChartSource } from '../resume/useChartSource';
import InkTimeline from '../resume/InkTimeline';
import InkWords from '../resume/InkWords';
import StackLedger from '../resume/StackLedger';
import ViewsChart from '../resume/ViewsChart';
import RepoFocus from '../RepoFocus';
import type { FocusData, PathStop, StackLine, TimelineMonth, TimelineSeries, ViewsData, WordCount, WordSource, SystemLink, SystemNode } from '../resume/types';
import StepModal, { StepCardContent, type StepModalStep, type StepModalUnppp } from '../StepModal';
import ColorSphere from '../ColorSphere';
import { resolveCoverSrc, isVideoCover } from './CoverImageBackground';
import CoverVideo from '../CoverVideo';
import UnpppsConfig from '../../../data/UnpppsConfig.json';

/**
 * Lazy-loaded components - defined at module level for optimal performance
 * React.lazy must NOT be called inside component bodies to avoid memory leaks
 * and re-fetching on every render
 */
const LazyLogo3d = React.lazy(() => import('../Logo3d'));
const LazyAIWrapped = React.lazy(() => import('../AIWrappedVisualization'));
const LazySplineEmbed = React.lazy(() => import('../SplineEmbed'));
const LazyYouTubeEmbed = React.lazy(() => import('../YouTubeEmbed'));
const LazyTikTokEmbed = React.lazy(() => import('../TikTokEmbed'));
const LazyInstagramEmbed = React.lazy(() => import('../InstagramEmbed'));

/**
 * EmbeddableColorMatchingGame - ColorMatchingGame wrapped with ColorSelectionProvider
 * 
 * Used in stories via: :::component[name=ColorMatchingGame]:::
 * 
 * Provides access to:
 * - ColorSelectionContext (selectedColors, customColors, allColors)
 * - ThemeContext (already available in EditorialSection)
 */
export const EmbeddableColorMatchingGame: React.FC = () => {
  return (
    <ColorSelectionProvider>
      <ColorMatchingGame />
    </ColorSelectionProvider>
  );
};

/**
 * EmbeddableColorPalette - ColorPicker wrapped with ColorSelectionProvider
 *
 * Used in stories/docs via: :::component[name=ColorPalette]:::
 *
 * The full ADD experience from /color - pick or import a 5-color palette
 * (upload a .css exported from UNCOLOR, tap a cover palette, or hand-pick
 * hex colors) and see it drawn in ink (InkPalette). Provides
 * its own ColorSelectionContext so it works standalone inside article/doc
 * content, independent of the /color page.
 */
export const EmbeddableColorPalette: React.FC = () => {
  return (
    <ColorSelectionProvider>
      <ColorPicker />
    </ColorSelectionProvider>
  );
};

/**
 * EmbeddableInvite - Waitlist invitation component
 *
 * Used in stories via: :::component[name=WaitlistInvite]:::
 *
 * Routes the reader into the waitlist flow based on their sign-in/submission
 * state (sign in → complete the problem worksheet → await approval → /party),
 * plus request invite and learn more actions, following component audit guidelines:
 * - CSS variables for light/dark mode
 * - Monospaced fonts
 * - Subtle borders
 * - Left-aligned text
 */
export const EmbeddableInvite: React.FC = () => {
  return <Invite />;
};

/**
 * EmbeddableLogo3d - 3D Spline logo component
 *
 * Used in stories via: :::component[name=Logo3d]:::
 *
 * Embeds interactive 3D Spline scene
 */
export const EmbeddableLogo3d: React.FC = () => {
  return (
    <React.Suspense fallback={
      <div className="flex h-[600px] w-full items-center justify-center bg-background-highlight">
        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading 3D scene...</div>
      </div>
    }>
      <LazyLogo3d />
    </React.Suspense>
  );
};

/**
 * EmbeddableSplineEmbed - Customizable 3D Spline scene component
 *
 * Used in stories via: :::component[name=SplineEmbed,scene=URL]:::
 *
 * Props:
 * - scene: URL to Spline scene (required)
 * - width: Optional width override
 * - height: Optional height override
 * - className: Optional additional CSS classes
 *
 * Examples:
 * :::component[name=SplineEmbed,scene=https://prod.spline.design/tLK98DRBRgvzrMYb/scene.splinecode]:::
 * :::component[name=SplineEmbed,scene=/scene.splinecode,width=800px]:::
 */
export const EmbeddableSplineEmbed: React.FC<Record<string, unknown>> = (props) => {
  const { scene, width, height, className } = props as {
    scene: string;
    width?: string;
    height?: string;
    className?: string;
  };

  if (!scene) {
    return (
      <div className="mx-auto my-8 flex w-full max-w-4xl items-center justify-center rounded-xl border-2 border-red-200 bg-red-50 p-8 dark:border-red-800 dark:bg-red-950">
        <div className="font-google-sans-code text-sm text-red-600 dark:text-red-400">
          Error: SplineEmbed requires a &quot;scene&quot; prop
        </div>
      </div>
    );
  }

  return (
    <React.Suspense
      fallback={
        <div className="flex h-[600px] w-full items-center justify-center bg-background-highlight">
          <div className="font-google-sans-code text-sm" style={{ color: 'var(--text-muted)' }}>Loading 3D scene...</div>
        </div>
      }
    >
      <LazySplineEmbed scene={scene} width={width} height={height} className={className} />
    </React.Suspense>
  );
};

/**
 * EmbeddableYouTubeEmbed - YouTube video embed component
 *
 * Used in stories via: :::component[name=YouTubeEmbed,videoId=VIDEO_ID]:::
 *
 * Props:
 * - videoId: YouTube video ID or full URL (required)
 * - title: Optional caption text (optional)
 * - aspectRatio: '16:9' | '4:3' | '1:1' | '9:16' (optional, default: '16:9')
 *
 * Features:
 * - Privacy-enhanced embedding (youtube-nocookie.com)
 * - Theme-aware border accent
 * - Responsive aspect ratios
 * - Lazy loading
 */
export const EmbeddableYouTubeEmbed: React.FC<Record<string, unknown>> = (props) => {
  const { videoId, title, aspectRatio } = props as {
    videoId: string;
    title?: string;
    aspectRatio?: '16:9' | '4:3' | '1:1' | '9:16';
  };

  return (
    <React.Suspense
      fallback={
        <div className="mx-auto my-8 flex aspect-video w-full max-w-4xl items-center justify-center rounded-xl border-2 border-border bg-black">
          <div className="font-google-sans-code text-sm ">
            thinking...
          </div>
        </div>
      }
    >
      <LazyYouTubeEmbed videoId={videoId} title={title} aspectRatio={aspectRatio} />
    </React.Suspense>
  );
};

/**
 * EmbeddableTikTokEmbed - TikTok video embed component
 *
 * Used in stories via: :::component[name=TikTokEmbed,videoUrl=VIDEO_URL]:::
 *
 * Props:
 * - videoUrl: TikTok video URL or @username/video/ID format (required)
 * - title: Optional caption text (optional)
 * - aspectRatio: '9:16' | '1:1' | '16:9' (optional, default: '9:16')
 *
 * Features:
 * - Multiple URL format support (standard, short links, direct)
 * - Theme-aware border accent
 * - Responsive aspect ratios
 * - Lazy loading
 * - Dark mode support
 */
export const EmbeddableTikTokEmbed: React.FC<Record<string, unknown>> = (props) => {
  const { videoUrl, title, aspectRatio } = props as {
    videoUrl: string;
    title?: string;
    aspectRatio?: '9:16' | '1:1' | '16:9';
  };

  return (
    <React.Suspense
      fallback={
        <div className="mx-auto my-8 flex aspect-[9/16] w-full max-w-md items-center justify-center rounded-xl border-2 border-border bg-black">
          <div className="font-google-sans-code text-sm text-gray-300">
            thinking...
          </div>
        </div>
      }
    >
      <LazyTikTokEmbed videoUrl={videoUrl} title={title} aspectRatio={aspectRatio} />
    </React.Suspense>
  );
};

/**
 * Lazy-loaded FormulaDisplay component
 */
const LazyFormulaDisplay = React.lazy(() => import('../FormulaDisplay'));

/**
 * Lazy-loaded Strike component
 */
const LazyStrike = React.lazy(() => import('../Strike'));

/**
 * EmbeddableFormulaDisplay - Math formula display component
 *
 * Used in stories via: :::formula[steps=STEP1|+ STEP2|- STEP3,result=RESULT]:::
 * Or via component syntax: :::component[name=FormulaDisplay,steps=...,result=...]:::
 *
 * Props:
 * - steps: Pipe-separated formula steps (e.g., "STARTING INVENTORY|+ PURCHASES|- ENDING")
 * - result: The result label (e.g., "COGS (Cost of Goods)")
 * - title: Optional title for the formula
 * - align: 'left' | 'center' | 'right' (optional, default: 'left')
 *
 * Features:
 * - Minimalistic, sleek styling with theme integration
 * - font-rounded (Nunito) for text labels
 * - font-vt323 for numbers and operators
 * - Dark mode support
 * - Accessible with proper ARIA labels
 */
export const EmbeddableFormulaDisplay: React.FC<Record<string, unknown>> = (props) => {
  const { steps, result, title, align } = props as {
    steps?: string;
    result?: string;
    title?: string;
    align?: 'left' | 'center' | 'right';
  };

  return (
    <React.Suspense
      fallback={
        <div className="my-8 flex items-center justify-center rounded-lg border border-border bg-background-highlight p-4">
          <div className="font-rounded text-sm" style={{ color: 'var(--text-muted)' }}>Loading formula...</div>
        </div>
      }
    >
      <LazyFormulaDisplay steps={steps} result={result} title={title} align={align} />
    </React.Suspense>
  );
};

/**
 * EmbeddableStrike - Strikethrough text component with vt323 font and animations
 *
 * Used in stories via: :::component[name=Strike,text=YOUR TEXT,variant=animated]:::
 *
 * Props:
 * - text: The text to strike through (required)
 * - font: 'vt323' | 'mono' | 'default' (optional, default: 'vt323')
 * - variant: 'standard' | 'bold' | 'double' | 'animated' | 'glitch' (optional, default: 'standard')
 * - color: Strike color (hex or 'theme' for current theme color) (optional, default: 'theme')
 * - animate: Enable animation effect (optional, default: false)
 * - thickness: Line thickness in pixels (optional, default: 2)
 *
 * Features:
 * - Theme-aware coloring via ThemeContext
 * - Multiple visual styles and animations
 * - VT323 retro font support
 * - Dark mode compatible
 */
/**
 * EmbeddableCta - the site's call to action inside a story or article:
 * :::component[name=Cta,label=build yours,href=/article/setup-start-here]:::
 *
 * The same pill as /founders and the Fab (FounderCta: theme ring, theme-color
 * pill, arrow), and the same consent-gated `cta_clicked` { cta, placement }
 * event, so one funnel compares every ask. placement defaults to the page's
 * path (e.g. /story/personal-mission).
 */
export const EmbeddableCta: React.FC<Record<string, unknown>> = (props) => {
  const pathname = usePathname();
  const { label, href, placement } = props as { label?: string; href?: string; placement?: string };
  if (!label || !href) {
    return (
      <span className="font-google-sans-code text-sm" style={{ color: 'var(--text-muted)' }}>
        [Cta needs a label and an href]
      </span>
    );
  }
  return <FounderCta cta={{ label, href }} placement={placement || pathname || 'article'} />;
};

/**
 * EmbeddableBuildYours - the site's ask as a full-bleed theme band: the brand
 * brain and "build yours" writing itself in when scrolled to, the pitch, and
 * a "start here" link (BuildYoursCard). With no props it uses the site's one
 * ask (FoundersConfig founder.cta), so adding a conversion point to any
 * article is one section; label, href, pitch, action and placement override.
 */
export const EmbeddableBuildYours: React.FC<Record<string, unknown>> = (props) => {
  const { label, href, pitch, action, placement, deploy } = props as { label?: string; href?: string; pitch?: string; action?: string; placement?: string; deploy?: boolean };
  // deploy: the Deploy Button, from FoundersConfig site.source. No source, no button
  if (deploy && !DEPLOY_URL) return null;
  return <BuildYoursCard label={label} href={deploy ? DEPLOY_URL : href} pitch={pitch} action={action} placement={placement} />;
};

/**
 * EmbeddableBuildYourStack - what it costs to build your own copy and what
 * each service lets you build (BuildYourStack, from DependConfig.json). Place
 * it under "build yours". `lens` picks the starting point (try, build, sell);
 * href and placement override where "start building" goes and how it's tracked.
 */
export const EmbeddableBuildYourStack: React.FC<Record<string, unknown>> = (props) => {
  const { lens, href, placement } = props as { lens?: string; href?: string; placement?: string };
  return <BuildYourStack lens={lens} href={href} placement={placement} />;
};

/**
 * The resume's ink charts. Each takes its data as props, or a `source`
 * naming one of the site owner's live charts ('shipped', 'effort',
 * 'momentum', 'stack', 'views', 'path'), fetched from /api/resume
 * (useChartSource), so an article can show the owner's own numbers without
 * writing them into it.
 *
 * EmbeddableInkTimeline - a running total as one pen line, a tally mark per
 * month and the latest point breathing (`months`), or one running total per
 * area of work (`series`): the resume's opening, EFFORT. and MOMENTUM. Its months come computed, from a TS article or a page that
 * builds one (src/app/founders/resume-data.ts); a markdown directive can't
 * carry them.
 */
export const EmbeddableInkTimeline: React.FC<Record<string, unknown>> = (props) => {
  const chart = useChartSource<{ months?: TimelineMonth[]; series?: TimelineSeries[]; label?: string }>(
    props,
    p => Array.isArray(p.months) || Array.isArray(p.series)
  );
  if (!chart || (!chart.months?.length && !chart.series?.length)) return null;
  return <InkTimeline months={chart.months} series={chart.series} label={chart.label ?? 'Month by month'} />;
};

/** EmbeddableInkPath - projects by stage, as cover circles, with an arc to each one they lead to */
export const EmbeddableInkPath: React.FC<Record<string, unknown>> = (props) => {
  const chart = useChartSource<{ stops?: PathStop[]; label?: string }>(props, p => Array.isArray(p.stops));
  if (!chart?.stops?.length) return null;
  return <InkPath stops={chart.stops} label={chart.label ?? 'Projects by stage, and where each leads'} />;
};

/** EmbeddableInkSystem - how things connect while they run: a spine, a labeled stroke to each */
export const EmbeddableInkSystem: React.FC<Record<string, unknown>> = (props) => {
  const chart = props as { hub?: SystemNode; links?: SystemLink[]; label?: string };
  if (!chart.hub || !chart.links?.length) return null;
  return <InkSystem hub={chart.hub} links={chart.links} label={chart.label ?? 'How the pieces connect'} />;
};

/**
 * EmbeddableNextStep - "where are you starting from?" over the owner's path:
 * a starting point lights up the project to start with and where it leads
 * (#624). Takes the path's stops and starting points, or `source: 'path'`
 */
export const EmbeddableNextStep: React.FC<Record<string, unknown>> = (props) => {
  const chart = useChartSource<{ stops?: PathStop[]; startingPoints?: string[]; canMatch?: boolean; label?: string }>(props, p => Array.isArray(p.stops));
  if (!chart?.stops?.length) return null;
  return <NextStep stops={chart.stops} startingPoints={chart.startingPoints ?? []} canMatch={chart.canMatch} label={chart.label ?? 'Projects by stage, and where each leads'} />;
};

/**
 * EmbeddableInkWords - the site owner's most used words (/api/words), sized by
 * how often they appear, with a stories / articles / both switch. Give it
 * `words` counted on the server, or leave them out and it fetches them
 */
export const EmbeddableInkWords: React.FC<Record<string, unknown>> = (props) => {
  const { words, from, limit, filter } = props as { words?: WordCount[]; from?: WordSource; limit?: string | number; filter?: string | boolean };
  return <InkWords words={words} from={from} limit={limit ? Number(limit) : undefined} filter={filter !== false && filter !== 'false'} />;
};

/** EmbeddableStackLedger - a pen-drawn bar per service, by what it costs a month */
export const EmbeddableStackLedger: React.FC<Record<string, unknown>> = (props) => {
  const chart = useChartSource<{ lines?: StackLine[] }>(props, p => Array.isArray(p.lines));
  if (!chart?.lines?.length) return null;
  return <StackLedger lines={chart.lines} />;
};

/** EmbeddableViewsChart - thirty days of pageviews as a pen line, then the top pages */
export const EmbeddableViewsChart: React.FC<Record<string, unknown>> = (props) => {
  const chart = useChartSource<Partial<Pick<ViewsData, 'days' | 'top'>>>(props, p => Array.isArray(p.days));
  if (!chart?.days?.length) return null;
  return <ViewsChart days={chart.days} top={chart.top ?? []} />;
};

/** EmbeddableRepoFocus - where the owner's hours went, a repo a row, week by week (`source: 'focus'`) */
export const EmbeddableRepoFocus: React.FC<Record<string, unknown>> = (props) => {
  const chart = useChartSource<Partial<FocusData>>(props, p => Array.isArray(p.rows));
  if (!chart?.rows?.length || !chart.weeks?.length) return null;
  return <RepoFocus weeks={chart.weeks} recent={chart.recent ?? 4} rows={chart.rows} focus={chart.focus ?? 0} totalHours={chart.totalHours ?? 0} rate={chart.rate ?? null} sentence={chart.sentence ?? ''} />;
};

export const EmbeddableStrike: React.FC<Record<string, unknown>> = (props) => {
  const { text, font, variant, color, animate, thickness } = props as {
    text: string;
    font?: 'vt323' | 'mono' | 'default';
    variant?: 'standard' | 'bold' | 'double' | 'animated' | 'glitch';
    color?: string;
    animate?: boolean;
    thickness?: number;
  };

  if (!text) {
    return (
      <span className="font-google-sans-code text-sm text-red-600 dark:text-red-400">
        [Strike component requires text prop]
      </span>
    );
  }

  return (
    <React.Suspense
      fallback={
        <span className="font-google-sans-code text-sm" style={{ color: 'var(--text-muted)' }}>...</span>
      }
    >
      <LazyStrike
        text={text}
        font={font}
        variant={variant}
        color={color}
        animate={animate}
        thickness={thickness}
      />
    </React.Suspense>
  );
};

/**
 * EmbeddableInstagramEmbed - Instagram post/reel embed component
 *
 * Used in stories via: :::component[name=InstagramEmbed,postUrl=URL]:::
 *
 * Props:
 * - postUrl: Instagram post, reel, or TV URL (required)
 * - title: Optional caption text (optional)
 * - aspectRatio: '1:1' | '4:5' | '9:16' (optional, default: '1:1')
 */
export const EmbeddableInstagramEmbed: React.FC<Record<string, unknown>> = (props) => {
  const { postUrl, title, aspectRatio } = props as {
    postUrl: string;
    title?: string;
    aspectRatio?: '1:1' | '4:5' | '9:16';
  };

  return (
    <React.Suspense
      fallback={
        <div className="mx-auto my-8 flex aspect-square w-full max-w-lg items-center justify-center rounded-xl border-2 border-border bg-black">
          <div className="font-google-sans-code text-sm text-gray-300">
            thinking...
          </div>
        </div>
      }
    >
      <LazyInstagramEmbed postUrl={postUrl} title={title} aspectRatio={aspectRatio} />
    </React.Suspense>
  );
};

/**
 * Lazy-loaded StoryPreview component
 */
const LazyStoryPreview = React.lazy(() => import('../StoryPreview'));
const LazyArticlePreview = React.lazy(() => import('../ArticlePreview'));

/**
 * EmbeddableStoryPreview - Story section preview component
 *
 * Used in articles via: :::component[name=StoryPreview,coverId=cover-001,sectionIds=hero|about-me|why,showMetadata=true]:::
 *
 * Props:
 * - coverId: Story cover ID (required, e.g., 'cover-001')
 * - sectionIds: Pipe-separated section IDs to display (optional, e.g., 'hero|about-me|why')
 * - sectionRange: Section index range as 'start-end' (optional, e.g., '0-3')
 * - maxSections: Maximum number of sections (optional)
 * - showMetadata: Display story header (optional, default: 'true')
 */
export const EmbeddableStoryPreview: React.FC<Record<string, unknown>> = (props) => {
  const { coverId, sectionIds, sectionRange, maxSections, showMetadata } = props as {
    coverId: string;
    sectionIds?: string;
    sectionRange?: string;
    maxSections?: string;
    showMetadata?: string;
  };

  if (!coverId) {
    return (
      <div className="mx-auto my-8 flex w-full max-w-4xl items-center justify-center rounded-xl border-2 border-red-200 bg-red-50 p-8 dark:border-red-800 dark:bg-red-950">
        <div className="font-google-sans-code text-sm text-red-600 dark:text-red-400">
          Error: StoryPreview requires a &quot;coverId&quot; prop
        </div>
      </div>
    );
  }

  // Parse sectionIds from pipe-separated string to array
  const parsedSectionIds = sectionIds ? sectionIds.split('|').map(id => id.trim()) : undefined;

  // Parse sectionRange from 'start-end' string to object
  const parsedSectionRange = sectionRange ? (() => {
    const [start, end] = sectionRange.split('-').map(n => parseInt(n.trim(), 10));
    return { start, end };
  })() : undefined;

  // Parse maxSections to number
  const parsedMaxSections = maxSections ? parseInt(maxSections, 10) : undefined;

  // Parse showMetadata to boolean (default true)
  const parsedShowMetadata = showMetadata === 'false' ? false : true;

  return (
    <React.Suspense
      fallback={
        <div className="mx-auto my-8 flex w-full max-w-4xl items-center justify-center rounded-xl border-2 border-border p-8">
          <div className="font-google-sans-code text-sm" style={{ color: 'var(--text-muted)' }}>
            Loading story preview...
          </div>
        </div>
      }
    >
      <LazyStoryPreview
        coverId={coverId}
        sectionIds={parsedSectionIds}
        sectionRange={parsedSectionRange}
        maxSections={parsedMaxSections}
        showMetadata={parsedShowMetadata}
      />
    </React.Suspense>
  );
};

/**
 * EmbeddableArticlePreview - Article section preview component
 *
 * The article-slug counterpart to StoryPreview, for embedding one article's
 * sections inside another (StoryPreview is reserved for the Story/coverId
 * model at /story/[slug] and can't reference an article).
 *
 * Used via: :::component[name=ArticlePreview,slug=some-article-slug,sectionIds=hero|about-me,showMetadata=true]:::
 *
 * Props:
 * - slug: Article slug (required, e.g., 'theunpartycharette-unlocal_status')
 * - sectionIds: Pipe-separated section IDs to display (optional) — fragile for
 *   MD-sourced target articles, since mdArticleUtils.ts assigns ids from a
 *   counter shared across every block type; prefer sourceComponentName when
 *   targeting a 'component' section
 * - sourceComponentName: Show the 'component' section whose componentName
 *   matches (e.g. 'ColorPalette') — stable across edits/reordering in the
 *   source article, unlike positional sectionIds (optional)
 * - sectionRange: Section index range as 'start-end' (optional)
 * - maxSections: Maximum number of sections (optional)
 * - showMetadata: Display article header (optional, default: 'true')
 */
export const EmbeddableArticlePreview: React.FC<Record<string, unknown>> = (props) => {
  // Accepts values either as directive strings (from :::component[...]:::,
  // parsed by parseComponentParams) or already-typed (from a TS-authored
  // article's componentProps, e.g. a real string[] for sectionIds) - both
  // paths flow through the same registry entry.
  const { slug, sectionIds, sourceComponentName, sectionRange, maxSections, showMetadata } = props as {
    slug: string;
    sectionIds?: string | string[];
    sourceComponentName?: string;
    sectionRange?: string | { start: number; end: number };
    maxSections?: string | number;
    showMetadata?: string | boolean;
  };

  if (!slug) {
    return (
      <div className="mx-auto my-8 flex w-full max-w-4xl items-center justify-center rounded-xl border-2 border-red-200 bg-red-50 p-8 dark:border-red-800 dark:bg-red-950">
        <div className="font-google-sans-code text-sm text-red-600 dark:text-red-400">
          Error: ArticlePreview requires a &quot;slug&quot; prop
        </div>
      </div>
    );
  }

  const parsedSectionIds = Array.isArray(sectionIds)
    ? sectionIds
    : sectionIds
    ? sectionIds.split('|').map(id => id.trim())
    : undefined;

  const parsedSectionRange = typeof sectionRange === 'object'
    ? sectionRange
    : sectionRange
    ? (() => {
        const [start, end] = sectionRange.split('-').map(n => parseInt(n.trim(), 10));
        return { start, end };
      })()
    : undefined;

  const parsedMaxSections = typeof maxSections === 'number' ? maxSections : maxSections ? parseInt(maxSections, 10) : undefined;

  const parsedShowMetadata = showMetadata === false || showMetadata === 'false' ? false : true;

  return (
    <React.Suspense
      fallback={
        <div className="mx-auto my-8 flex w-full max-w-4xl items-center justify-center rounded-xl border-2 border-border p-8">
          <div className="font-google-sans-code text-sm" style={{ color: 'var(--text-muted)' }}>
            Loading article preview...
          </div>
        </div>
      }
    >
      <LazyArticlePreview
        slug={slug}
        sectionIds={parsedSectionIds}
        sourceComponentName={sourceComponentName}
        sectionRange={parsedSectionRange}
        maxSections={parsedMaxSections}
        showMetadata={parsedShowMetadata}
      />
    </React.Suspense>
  );
};

/**
 * EmbeddableBusinessWorksheet - BusinessWorksheet rendered inline in a story
 *
 * Used in stories via: :::component[name=BusinessWorksheet,initialCategory=core]:::
 *
 * Props:
 * - initialCategory: Starting category — 'core' | 'budget' | 'brand' | 'product' | 'risk' | 'grow' (optional, default: 'core')
 *
 * Renders the full worksheet UI inline in the story (no modal overlay, no trigger button).
 */
export const EmbeddableBusinessWorksheet: React.FC<Record<string, unknown>> = (props) => {
  const { initialCategory } = props as { initialCategory?: string };
  return (
    <BusinessWorksheetContent
      initialCategory={initialCategory || 'core'}
      showCloseButton={false}
      singleCategory={true}
    />
  );
};

/**
 * EmbeddableAIWrappedVisualization - AI conversation analytics "Wrapped" visualization
 *
 * Used in stories via: :::component[name=AIWrappedVisualization]:::
 */
export const EmbeddableAIWrappedVisualization: React.FC = () => {
  return (
    <React.Suspense fallback={
      <div style={{ height: '460px', background: '#0C0032', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#F9C22E', fontFamily: 'monospace', fontSize: '11px', letterSpacing: '0.15em' }}>LOADING...</span>
      </div>
    }>
      <LazyAIWrapped />
    </React.Suspense>
  );
};

/**
 * BrandPaletteSwatch - one tappable color sphere shared by every row in
 * EmbeddableBrandPalette (fetched sections and the signed-in "your brand."
 * row alike), so they stay visually identical and share one interaction.
 *
 * The swatch is a ColorSphere (the UNCOLOR iOS app's masked-sphere
 * technique) rather than a flat fill, for cross-app visual parity — and
 * because the texture's highlight/shadow structure keeps the swatch visible
 * even when its own hex becomes the page background, where a flat circle
 * simply vanished.
 *
 * Tapping sets (or, if already active, clears) the article's background via
 * ArticleBackgroundContext — deliberately not ThemeContext, so the site's
 * mood-color accents are untouched. The active ring uses var(--foreground)
 * (remapped by the article's background override) instead of the swatch's
 * own hex: active means the page background IS that hex, which made an
 * own-color ring invisible exactly when it was shown.
 */
const BrandPaletteSwatch: React.FC<{
  name: string;
  hex: string;
  isActive: boolean;
  onSelect: () => void;
}> = ({ name, hex, isActive, onSelect }) => (
  <button
    type="button"
    onClick={onSelect}
    aria-pressed={isActive}
    aria-label={`${isActive ? 'Clear' : 'Set'} page background: ${name} ${hex}`}
    className="flex shrink-0 flex-col items-center gap-2 bg-transparent p-0 transition-transform hover:scale-105"
  >
    {/* p-[3px] + 50px sphere = the same size-14 footprint as the loading
        skeleton; the padding gap lets the active ring read as a halo. */}
    <span
      className="block rounded-full p-[3px] transition-shadow"
      style={{ boxShadow: isActive ? '0 0 0 2px var(--foreground)' : 'none' }}
    >
      <ColorSphere colors={[hex]} size={50} />
    </span>
    <div className="text-center font-google-sans-code text-xs leading-snug" style={{ color: 'var(--text-muted)' }}>
      {name}
    </div>
    <div className="font-vt323 text-sm" style={{ color: 'var(--foreground)' }}>
      {hex}
    </div>
  </button>
);

/**
 * EmbeddableBrandPalette - Live brand color palette from theunpartybrand releases
 *
 * Used in stories via: :::component[name=BrandPalette]:::
 *
 * Fetches /api/brand-colors (ISR-cached, falls back to local colors.ts).
 * Shows swatches with name + hex, plus release version. Signed-in users with
 * a saved brand palette (UserProfile.brandColors) also see their own colors
 * in a "your brand." row. Tapping any swatch recolors the page's background
 * (see BrandPaletteSwatch) — purely a display/interaction layer otherwise.
 */
export const EmbeddableBrandPalette: React.FC = () => {
  const { colorValue } = useTheme();
  const { backgroundOverride, setBackgroundOverride } = useArticleBackground();
  const { isSignedIn } = useUser();
  const { brandColors } = useBrandColors();
  const [sections, setSections] = React.useState<Record<string, { name: string; hex: string }[]>>({});
  const [meta, setMeta] = React.useState<{ version: string; source: string } | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch('/api/brand-colors')
      .then(r => r.json())
      .then(data => {
        setSections(data.sections ?? {});
        setMeta({ version: data.version, source: data.source });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = (hex: string) => {
    setBackgroundOverride(backgroundOverride === hex ? null : hex);
  };

  const savedColors = isSignedIn && brandColors
    ? CSS_COLOR_ROLES
        .filter(({ key }) => brandColors[key])
        .map(({ key, label }) => ({ name: label.toLowerCase(), hex: brandColors[key] as string }))
    : [];

  if (loading) {
    return (
      <div className="my-8 w-full space-y-8">
        <div className="h-4 w-32 animate-pulse rounded" style={{ backgroundColor: `${colorValue}15` }} />
        <div className="flex gap-5 overflow-x-auto pb-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex shrink-0 flex-col items-center gap-2">
              <div className="size-14 animate-pulse rounded-full" style={{ backgroundColor: `${colorValue}15` }} />
              <div className="h-3 w-10 animate-pulse rounded" style={{ backgroundColor: `${colorValue}15` }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const hasSections = Object.keys(sections).length > 0;

  return (
    <div className="my-8 w-full space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span
          className="font-google-sans-code text-xs uppercase tracking-wider"
          style={{ color: 'var(--text-muted)' }}
        >
          theunpartybrand
        </span>
        {meta && (
          <span
            className="rounded border px-1.5 py-0.5 font-google-sans-code text-xs"
            style={{ borderColor: `${colorValue}40`, color: colorValue }}
          >
            {meta.source === 'release' ? `v${meta.version}` : 'local'}
          </span>
        )}
      </div>

      {/* Signed-in user's own saved brand colors, if any */}
      {savedColors.length > 0 && (
        <div>
          <div className="mb-3 font-vt323 text-xl" style={{ color: colorValue }}>
            your brand.
          </div>
          <div className="flex gap-5 overflow-x-auto pb-3" style={{ scrollbarWidth: 'none' }}>
            {savedColors.map(({ name, hex }) => (
              <BrandPaletteSwatch
                key={`saved-${name}`}
                name={name}
                hex={hex}
                isActive={backgroundOverride === hex}
                onSelect={() => handleSelect(hex)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Dynamic sections — renders whatever sections exist in the release */}
      {hasSections ? Object.entries(sections).map(([sectionKey, colors]) => (
        <div key={sectionKey}>
          <div
            className="mb-3 font-vt323 text-xl"
            style={{ color: colorValue }}
          >
            {sectionKey}.
          </div>
          <div className="flex gap-5 overflow-x-auto pb-3" style={{ scrollbarWidth: 'none' }}>
            {colors.map(({ name, hex }) => (
              <BrandPaletteSwatch
                key={`${sectionKey}-${name}`}
                name={name}
                hex={hex}
                isActive={backgroundOverride === hex}
                onSelect={() => handleSelect(hex)}
              />
            ))}
          </div>
        </div>
      )) : savedColors.length === 0 && (
        <div className="font-google-sans-code text-sm" style={{ color: 'var(--text-muted)' }}>
          palette unavailable
        </div>
      )}
    </div>
  );
};

/**
 * EmbeddableDependCard - Real dependency cost cards (DependCardScroll) from
 * src/data/DependConfig.json, each with the SETUP. step that adds it, via
 * getDependItems() (src/utils/dependCosts.ts).
 *
 * Used in articles via a `component` section with
 * metadata.componentName = 'DependCardScroll'.
 *
 * Props:
 * - title: Row heading (optional)
 */
export const EmbeddableDependCard: React.FC<Record<string, unknown>> = (props) => {
  const { title } = props as { title?: string };
  // Each card shows the service's starting plan
  const items = React.useMemo(
    () => getDependItems().map(item => {
      const plan = findPlan(item);
      return { ...item, cost: plan.cost, payFrequency: plan.payFrequency };
    }),
    []
  );
  return <DependCardScroll title={title} items={items} />;
};

type UnpppStepRow = StepModalStep & { id: string };

function useUnpppSteps(unpppId: string) {
  // A failed request renders as "no steps"
  const { data, loading } = useFetch<{ steps?: UnpppStepRow[] }>(`/api/unppp/${unpppId}/steps`);
  return { steps: data?.steps ?? [], loading };
}

function getUnpppVisual(unpppId: string): StepModalUnppp | undefined {
  const unppp = UnpppsConfig.unppps.find(u => u.id === unpppId) as
    | { cover?: string; coverVideo?: string; color?: string }
    | undefined;
  if (!unppp) return undefined;
  return { cover: unppp.cover, coverVideo: unppp.coverVideo, color: unppp.color };
}

/**
 * EmbeddableStepCard - A single unppp Step (title/description/cover/icon),
 * rendered inline in the story flow — no modal, no click required (this one
 * already shows its full content, so there's nothing a click would reveal).
 *
 * Fetches the public /api/unppp/[unpppId]/steps route (ALL_USERS-visible
 * steps only) and shows the step matching `stepId`, or the top-priority
 * step (the API already orders by priority desc, createdAt asc) when no
 * `stepId` is given. Renders nothing if the unppp has no matching steps yet.
 *
 * Props:
 * - unpppId: which unppp's steps to read, or 'all' for ALL_USERS steps
 *   across every unppp (required)
 * - stepId: pin to a specific step (optional; defaults to the first result)
 */
export const EmbeddableStepCard: React.FC<Record<string, unknown>> = (props) => {
  const { unpppId, stepId } = props as { unpppId: string; stepId?: string };
  const { steps, loading } = useUnpppSteps(unpppId);

  if (loading || steps.length === 0) return null;

  const step = (stepId ? steps.find(s => s.id === stepId) : undefined) ?? steps[0];

  return (
    <div className="my-8">
      <StepCardContent step={step} unppp={getUnpppVisual(unpppId)} />
    </div>
  );
};

/**
 * EmbeddableStepScroll - Horizontal row of an unppp's Steps as outlined
 * circles, matching ChallengeSteps' circle treatment (theme-color ring,
 * cover fills the circle, muted/no controls since this is a small preview
 * not the primary way the video gets watched). Title sits beside the
 * circle, line-clamped to two lines — a Step's title is free text of
 * unpredictable length (unlike ChallengeStep's short, fixed action labels),
 * so it needs room to actually wrap rather than being crammed inside the
 * circle itself.
 *
 * Clicking a circle opens the same StepModal used on the /theunparty*
 * showcase pages (via UnpppSteps) — the row is the always-visible teaser,
 * the modal is where the full description (and, with a cover video, its
 * mute toggle) lives.
 *
 * Fetches the same public /api/unppp/[unpppId]/steps route as
 * EmbeddableStepCard. Renders nothing if the unppp has no matching steps yet.
 *
 * Props:
 * - unpppId: which unppp's steps to read, or 'all' for ALL_USERS steps
 *   across every unppp (required)
 * - title: row heading (optional)
 */
export const EmbeddableStepScroll: React.FC<Record<string, unknown>> = (props) => {
  const { unpppId, title } = props as { unpppId: string; title?: string };
  const { colorValue } = useTheme();
  const { steps, loading } = useUnpppSteps(unpppId);
  const [openStep, setOpenStep] = React.useState<UnpppStepRow | null>(null);

  if (loading || steps.length === 0) return null;

  return (
    <div className="my-8 w-full space-y-3">
      {title && (
        <div className="font-vt323 text-xl" style={{ color: colorValue }}>
          {title}
        </div>
      )}
      <ul className="flex flex-nowrap items-center justify-center gap-6 overflow-x-auto pb-2 pt-2 snap-x snap-mandatory scrollbar-hide">
        {steps.map(step => (
          <li key={step.id} className="snap-start">
            <div
              role="button"
              tabIndex={0}
              onClick={() => setOpenStep(step)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setOpenStep(step);
                }
              }}
              aria-label={`Open step: ${step.title}`}
              className="flex w-52 shrink-0 cursor-pointer items-center gap-3 transition-opacity hover:opacity-80"
            >
              <div
                className="relative size-16 shrink-0 overflow-hidden rounded-full border-4"
                style={{
                  borderColor: colorValue,
                  backgroundColor: 'var(--background)',
                  boxShadow: `0 14px 36px -16px ${colorValue}55`,
                }}
              >
                {step.cover && isVideoCover(step.cover) && (
                  <CoverVideo src={step.cover} alt="" className="size-full object-cover" hideMuteToggle />
                )}
                {step.cover && !isVideoCover(step.cover) && (
                  <Image src={resolveCoverSrc(step.cover)} alt="" fill sizes="64px" className="object-cover" />
                )}
                {!step.cover && step.icon && (
                  <span className="flex size-full items-center justify-center text-xl">{step.icon}</span>
                )}
              </div>
              <span
                className="line-clamp-2 font-google-sans-code text-sm leading-tight"
                style={{ color: 'var(--foreground)' }}
              >
                {step.title}
              </span>
            </div>
          </li>
        ))}
      </ul>
      <StepModal step={openStep} unppp={getUnpppVisual(unpppId)} onClose={() => setOpenStep(null)} />
    </div>
  );
};

/**
 * EmbeddableHtmlEmbed - Inline iframe embed for external HTML pages
 *
 * Used in stories via: :::component[name=HtmlEmbed,src=https://example.com/page.html,height=700px]:::
 *
 * Props:
 * - src: Full URL of the HTML page to embed (required)
 * - height: iframe height (optional, default: '600px')
 * - title: Accessibility title (optional)
 */
export const EmbeddableHtmlEmbed: React.FC<Record<string, unknown>> = (props) => {
  const { src, height, title } = props as {
    src: string;
    height?: string;
    title?: string;
  };
  const { colorValue } = useTheme();

  if (!src) {
    return (
      <div className="mx-auto my-8 flex w-full max-w-4xl items-center justify-center rounded-xl border-2 border-red-200 bg-red-50 p-8 dark:border-red-800 dark:bg-red-950">
        <div className="font-google-sans-code text-sm text-red-600 dark:text-red-400">
          Error: HtmlEmbed requires a &quot;src&quot; prop
        </div>
      </div>
    );
  }

  return (
    <div
      className="mx-auto my-8 w-full max-w-4xl overflow-hidden rounded-xl border"
      style={{ borderColor: `${colorValue}40` }}
    >
      <iframe
        src={src}
        title={title || 'Embedded page'}
        className="w-full border-0"
        style={{ height: height || '600px' }}
        loading="lazy"
      />
    </div>
  );
};
