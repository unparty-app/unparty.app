import type { EditorialArticle } from './types';
import { EDITORIAL_SECTION_GUIDE } from './articles/editorial-section-guide';
import { SETUP_START_HERE_ARTICLE } from './articles/setup-start-here';
import { SETUP_GITHUB_ARTICLE } from './articles/setup-github';
import { SETUP_GET_YOUR_CLAUDE_ARTICLE } from './articles/setup-get-your-claude';
import { SET_A_CLAUDE_SPEND_LIMIT_ARTICLE } from './articles/set-a-claude-spend-limit';
import { SETUP_GET_YOUR_COPY_ARTICLE } from './articles/setup-get-your-copy';
import { SETUP_INSTALL_TOOLS_ARTICLE } from './articles/setup-install-tools';
import { SETUP_DATABASE_ARTICLE } from './articles/setup-database';
import { SETUP_SIGN_IN_ARTICLE } from './articles/setup-sign-in';
import { SETUP_MAKE_YOURSELF_ADMIN_ARTICLE } from './articles/setup-make-yourself-admin';
import { SETUP_FIRST_RUN_ARTICLE } from './articles/setup-first-run';
import { SETUP_DEPLOY_ARTICLE } from './articles/setup-deploy';
import { SETUP_DOMAIN_ARTICLE } from './articles/setup-domain';
import { SETUP_FIRST_COVER_ARTICLE } from './articles/setup-first-cover';
import { SETUP_FIRST_STORY_ARTICLE } from './articles/setup-first-story';
import { SETUP_FIRST_POEM_ARTICLE } from './articles/setup-first-poem';
import { SETUP_FIRST_CODE_ARTICLE } from './articles/setup-first-code';
import { SETUP_GOOGLE_SHEET_ARTICLE } from './articles/setup-google-sheet';
import { SETUP_FIRST_ARTICLE_ARTICLE } from './articles/setup-first-article';
import { SETUP_FIRST_PROJECT_PAGE_ARTICLE } from './articles/setup-first-project-page';
import { SETUP_IDENTITY_ARTICLE } from './articles/setup-identity';
import { SETUP_PAYMENTS_ARTICLE } from './articles/setup-payments';
import { SETUP_BASELINE_ARTICLE } from './articles/setup-baseline';
import { SETUP_FILE_UPLOADS_ARTICLE } from './articles/setup-file-uploads';
import { SETUP_WAITLIST_ARTICLE } from './articles/setup-waitlist';
import { SETUP_SLACK_ARTICLE } from './articles/setup-slack';
import { SETUP_EMAIL_ARTICLE } from './articles/setup-email';
import { SETUP_MUSIC_ARTICLE } from './articles/setup-music';
import { SETUP_OBSERVABILITY_ARTICLE } from './articles/setup-observability';
import { SETUP_SEARCH_ARTICLE } from './articles/setup-search';
import { SETUP_GITHUB_APP_ARTICLE } from './articles/setup-github-app';
import { SETUP_LOCAL_GUARDRAILS_ARTICLE } from './articles/setup-local-guardrails';
import { SETUP_GITIGNORE_ARTICLE } from './articles/setup-gitignore';
import { SETUP_BRAND_ARTICLE } from './articles/setup-brand';
import { COMPONENT_COLOR_MATCHING_GAME_ARTICLE } from './articles/component-color-matching-game';
import { COMPONENT_RESILIENCE_BUILD_ACTIVITY_ARTICLE } from './articles/component-resilience-build-activity';
import { COMPONENT_WAITLIST_INVITE_ARTICLE } from './articles/component-waitlist-invite';
import { COMPONENT_ABOUT_ARTICLE } from './articles/component-about';
import { COMPONENT_DEFINITIONS_ARTICLE } from './articles/component-definitions';
import { COMPONENT_SPLINE_EMBED_ARTICLE } from './articles/component-spline-embed';
import { COMPONENT_FILM_CALCULATOR_ARTICLE } from './articles/component-film-calculator';
import { COMPONENT_PROBLEM_WORKSHEET_ARTICLE } from './articles/component-problem-worksheet';
import { COMPONENT_YOUTUBE_EMBED_ARTICLE } from './articles/component-youtube-embed';
import { COMPONENT_TIKTOK_EMBED_ARTICLE } from './articles/component-tiktok-embed';
import { COMPONENT_FORMULA_DISPLAY_ARTICLE } from './articles/component-formula-display';
import { COMPONENT_GOAL_BUDGET_ARTICLE } from './articles/component-goal-budget';
import { COMPONENT_STRIKE_ARTICLE } from './articles/component-strike';
import { COMPONENT_STORY_TABLE_ARTICLE } from './articles/component-story-table';
import { COMPONENT_UNPPP_TABLE_ARTICLE } from './articles/component-unppp-table';
import { COMPONENT_EXPENSD_ARTICLE } from './articles/component-expensd';
import { COMPONENT_FIVE_THINGS_CHALLENGE_ARTICLE } from './articles/component-five-things-challenge';
import { COMPONENT_INSTAGRAM_EMBED_ARTICLE } from './articles/component-instagram-embed';
import { COMPONENT_VERSE_CARD_SCROLL_ARTICLE } from './articles/component-verse-card-scroll';
import { COMPONENT_DEPEND_CARD_SCROLL_ARTICLE } from './articles/component-depend-card-scroll';
import { COMPONENT_STEP_CARD_ARTICLE } from './articles/component-step-card';
import { COMPONENT_STEP_SCROLL_ARTICLE } from './articles/component-step-scroll';
import { COMPONENT_STORY_PREVIEW_ARTICLE } from './articles/component-story-preview';
import { COMPONENT_CTA_ARTICLE } from './articles/component-cta';
import { COMPONENT_BUILD_YOURS_ARTICLE } from './articles/component-build-yours';
import { COMPONENT_BUILD_YOUR_STACK_ARTICLE } from './articles/component-build-your-stack';
import { COMPONENT_ARTICLE_PREVIEW_ARTICLE } from './articles/component-article-preview';
import { COMPONENT_BUSINESS_WORKSHEET_ARTICLE } from './articles/component-business-worksheet';
import { COMPONENT_AI_WRAPPED_ARTICLE } from './articles/component-ai-wrapped';
import { COMPONENT_HTML_EMBED_ARTICLE } from './articles/component-html-embed';
import { COMPONENT_COLOR_PALETTE_ARTICLE } from './articles/component-color-palette';
import { COMPONENT_LOGO_3D_ARTICLE } from './articles/component-logo-3d';
import { COMPONENT_INK_TIMELINE_ARTICLE } from './articles/component-ink-timeline';
import { COMPONENT_INK_PATH_ARTICLE } from './articles/component-ink-path';
import { COMPONENT_STACK_LEDGER_ARTICLE } from './articles/component-stack-ledger';
import { COMPONENT_VIEWS_CHART_ARTICLE } from './articles/component-views-chart';
import { COMPONENT_INK_WORDS_ARTICLE } from './articles/component-ink-words';
import { COMPONENT_NEXT_STEP_ARTICLE } from './articles/component-next-step';
import { COMPONENT_BLOG_ARTICLE } from './articles/component-blog';
import { COMPONENT_ARTICLE_TABLE_ARTICLE } from './articles/component-article-table';
import { COMPONENT_PRIORITY_TABLE_ARTICLE } from './articles/component-priority-table';
import { COMPONENT_COMMUNICATION_STYLE_GAME_ARTICLE } from './articles/component-communication-style-game';
import { COMPONENT_MINI_MAZE_ARTICLE } from './articles/component-mini-maze';
import { COMPONENT_EXPLORE_RESILIENCE_ARTICLE } from './articles/component-explore-resilience';
import { COMPONENT_RESILIENCE_REFLECTION_ARTICLE } from './articles/component-resilience-reflection';
import { COMPONENT_LIVE_SCALE_ARTICLE } from './articles/component-live-scale';
import { COMPONENT_SPONSOR_CARD_ARTICLE } from './articles/component-sponsor-card';
import { COMPONENT_LANGUAGE_VISUALIZATION_ARTICLE } from './articles/component-language-visualization';
import { COMPONENT_LINK_PREVIEW_ARTICLE } from './articles/component-link-preview';
import { COMPONENT_DOUBTS_CLOUD_ARTICLE } from './articles/component-doubts-cloud';
import { COMPONENT_DELETE_YOUR_DOUBTS_ARTICLE } from './articles/component-delete-your-doubts';
import { COMPONENT_DISCO_BALL_ARTICLE } from './articles/component-disco-ball';
import { COMPONENT_DRAW_YOUR_ICONS_ARTICLE } from './articles/component-draw-your-icons';
import { COMPONENT_VALUES_BADGE_ARTICLE } from './articles/component-values-badge';
import { COMPONENT_EFFORT_BALL_ARTICLE } from './articles/component-effort-ball';
import { COMPONENT_YOUR_WORDS_ARTICLE } from './articles/component-your-words';
import { COMPONENT_ARTICLE_LIST_ARTICLE } from './articles/component-article-list';
import { COMPONENT_REPO_FOCUS_ARTICLE } from './articles/component-repo-focus';
import { COMPONENT_TYPE_STATLINE_ARTICLE } from './articles/component-type-statline';
import { COMPONENT_BUILD_RHYTHM_ARTICLE } from './articles/component-build-rhythm';
import { COMPONENT_INK_SYSTEM_ARTICLE } from './articles/component-ink-system';
import { COMPONENT_COMPONENT_TABLE_ARTICLE } from './articles/component-component-table';

// Editorial Articles Registry
export const EDITORIAL_ARTICLES: EditorialArticle[] = [
                      EDITORIAL_SECTION_GUIDE,
                             
  
  
  
  // Linked from SETUP. steps (prisma/setup-steps.ts)
  SETUP_START_HERE_ARTICLE,
  
  
  SETUP_GITHUB_ARTICLE,
  SETUP_GET_YOUR_CLAUDE_ARTICLE,
  SET_A_CLAUDE_SPEND_LIMIT_ARTICLE,
  SETUP_GET_YOUR_COPY_ARTICLE,
  SETUP_INSTALL_TOOLS_ARTICLE,
  SETUP_DATABASE_ARTICLE,
  SETUP_SIGN_IN_ARTICLE,
  SETUP_MAKE_YOURSELF_ADMIN_ARTICLE,
  SETUP_FIRST_RUN_ARTICLE,
  SETUP_DEPLOY_ARTICLE,
  SETUP_DOMAIN_ARTICLE,
  SETUP_FIRST_COVER_ARTICLE,
  SETUP_FIRST_STORY_ARTICLE,
  SETUP_FIRST_POEM_ARTICLE,
  SETUP_FIRST_CODE_ARTICLE,
  SETUP_GOOGLE_SHEET_ARTICLE,
  SETUP_FIRST_ARTICLE_ARTICLE,
  SETUP_FIRST_PROJECT_PAGE_ARTICLE,
  SETUP_IDENTITY_ARTICLE,
  SETUP_PAYMENTS_ARTICLE,
  SETUP_BASELINE_ARTICLE,
  SETUP_FILE_UPLOADS_ARTICLE,
  SETUP_WAITLIST_ARTICLE,
  SETUP_SLACK_ARTICLE,
  SETUP_EMAIL_ARTICLE,
  SETUP_MUSIC_ARTICLE,
  SETUP_OBSERVABILITY_ARTICLE,
  SETUP_SEARCH_ARTICLE,
  SETUP_GITHUB_APP_ARTICLE,
  SETUP_GITIGNORE_ARTICLE,
  SETUP_LOCAL_GUARDRAILS_ARTICLE,
  SETUP_BRAND_ARTICLE,
  
  // Component portfolio homes (src/lib/component-portfolio.ts, #1433)
  COMPONENT_COLOR_MATCHING_GAME_ARTICLE,
  COMPONENT_RESILIENCE_BUILD_ACTIVITY_ARTICLE,
  COMPONENT_WAITLIST_INVITE_ARTICLE,
  COMPONENT_ABOUT_ARTICLE,
  COMPONENT_DEFINITIONS_ARTICLE,
  COMPONENT_SPLINE_EMBED_ARTICLE,
  COMPONENT_FILM_CALCULATOR_ARTICLE,
  COMPONENT_PROBLEM_WORKSHEET_ARTICLE,
  COMPONENT_YOUTUBE_EMBED_ARTICLE,
  COMPONENT_TIKTOK_EMBED_ARTICLE,
  COMPONENT_FORMULA_DISPLAY_ARTICLE,
  COMPONENT_GOAL_BUDGET_ARTICLE,
  COMPONENT_STRIKE_ARTICLE,
  COMPONENT_STORY_TABLE_ARTICLE,
  COMPONENT_UNPPP_TABLE_ARTICLE,
  COMPONENT_EXPENSD_ARTICLE,
  COMPONENT_FIVE_THINGS_CHALLENGE_ARTICLE,
  COMPONENT_INSTAGRAM_EMBED_ARTICLE,
  COMPONENT_VERSE_CARD_SCROLL_ARTICLE,
  COMPONENT_DEPEND_CARD_SCROLL_ARTICLE,
  COMPONENT_STEP_CARD_ARTICLE,
  COMPONENT_STEP_SCROLL_ARTICLE,
  COMPONENT_STORY_PREVIEW_ARTICLE,
  COMPONENT_CTA_ARTICLE,
  COMPONENT_BUILD_YOURS_ARTICLE,
  COMPONENT_BUILD_YOUR_STACK_ARTICLE,
  COMPONENT_ARTICLE_PREVIEW_ARTICLE,
  COMPONENT_BUSINESS_WORKSHEET_ARTICLE,
  COMPONENT_AI_WRAPPED_ARTICLE,
  COMPONENT_HTML_EMBED_ARTICLE,
  COMPONENT_COLOR_PALETTE_ARTICLE,
  COMPONENT_LOGO_3D_ARTICLE,
  COMPONENT_INK_TIMELINE_ARTICLE,
  COMPONENT_INK_PATH_ARTICLE,
  COMPONENT_STACK_LEDGER_ARTICLE,
  COMPONENT_VIEWS_CHART_ARTICLE,
  COMPONENT_INK_WORDS_ARTICLE,
  COMPONENT_NEXT_STEP_ARTICLE,
  COMPONENT_BLOG_ARTICLE,
  COMPONENT_ARTICLE_TABLE_ARTICLE,
  COMPONENT_PRIORITY_TABLE_ARTICLE,
  COMPONENT_COMMUNICATION_STYLE_GAME_ARTICLE,
  COMPONENT_MINI_MAZE_ARTICLE,
  COMPONENT_EXPLORE_RESILIENCE_ARTICLE,
  COMPONENT_RESILIENCE_REFLECTION_ARTICLE,
  COMPONENT_LIVE_SCALE_ARTICLE,
  COMPONENT_SPONSOR_CARD_ARTICLE,
  COMPONENT_LANGUAGE_VISUALIZATION_ARTICLE,
  COMPONENT_LINK_PREVIEW_ARTICLE,
  COMPONENT_DOUBTS_CLOUD_ARTICLE,
  COMPONENT_DELETE_YOUR_DOUBTS_ARTICLE,
  COMPONENT_DISCO_BALL_ARTICLE,
  COMPONENT_DRAW_YOUR_ICONS_ARTICLE,
  COMPONENT_VALUES_BADGE_ARTICLE,
  COMPONENT_EFFORT_BALL_ARTICLE,
  COMPONENT_YOUR_WORDS_ARTICLE,
  COMPONENT_ARTICLE_LIST_ARTICLE,
  COMPONENT_REPO_FOCUS_ARTICLE,
  COMPONENT_TYPE_STATLINE_ARTICLE,
  COMPONENT_BUILD_RHYTHM_ARTICLE,
  COMPONENT_INK_SYSTEM_ARTICLE,
  
  COMPONENT_COMPONENT_TABLE_ARTICLE,
  
  // Add more converted articles here
];

// Helper functions
export function getEditorialArticle(slug: string): EditorialArticle | null {
  // JSON-backed articles (edited/created via unseen) take precedence — they hold
  // the most recent version of a slug that's ever been edited from the app.
  if (typeof window === 'undefined') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { loadJSONArticle } = require('../../utils/jsonArticleUtils');
      const jsonArticle = loadJSONArticle(slug);
      if (jsonArticle) {
        return jsonArticle;
      }
    } catch (error) {
      console.warn('Error loading JSON article:', error);
    }
  }

  // Then check TypeScript articles
  const tsArticle = EDITORIAL_ARTICLES.find(article => article.slug === slug);
  if (tsArticle) {
    return tsArticle;
  }

  // Then check MD articles (only in server environment)
  if (typeof window === 'undefined') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getAllMDArticles } = require('../../utils/mdArticleUtils');
      const mdArticles = getAllMDArticles();
      return mdArticles.find((article: EditorialArticle) => article.slug === slug) || null;
    } catch (error) {
      console.warn('Error loading MD articles:', error);
    }
  }

  return null;
}

export function getPublishedEditorialArticles(): EditorialArticle[] {
  // JSON-backed articles shadow TS articles of the same slug — filter TS articles
  // whose slug has a JSON override so a stale TS copy never gets served alongside it.
  let jsonArticles: EditorialArticle[] = [];
  if (typeof window === 'undefined') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getAllJSONArticles } = require('../../utils/jsonArticleUtils');
      jsonArticles = getAllJSONArticles().filter((article: EditorialArticle) => article.published);
    } catch (error) {
      console.warn('Error loading JSON articles:', error);
    }
  }
  const jsonSlugs = new Set(jsonArticles.map(a => a.slug));

  const tsArticles = EDITORIAL_ARTICLES.filter(article => article.published && !jsonSlugs.has(article.slug));

  // Add MD articles if in server environment
  if (typeof window === 'undefined') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getAllMDArticles } = require('../../utils/mdArticleUtils');
      const mdArticles = getAllMDArticles().filter((article: EditorialArticle) => article.published);
      return [...jsonArticles, ...tsArticles, ...mdArticles];
    } catch (error) {
      console.warn('Error loading MD articles:', error);
    }
  }

  return [...jsonArticles, ...tsArticles];
}

export function getEditorialArticlesByCategory(category: string): EditorialArticle[] {
  const allArticles = getPublishedEditorialArticles();
  return allArticles.filter(article =>
    article.category.toLowerCase() === category.toLowerCase()
  );
}

export function getEditorialArticlesForUnppp(unpppId: string): EditorialArticle[] {
  if (typeof window === 'undefined') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getMDArticlesForUnppp } = require('../../utils/mdArticleUtils');
      return getMDArticlesForUnppp(unpppId).filter((article: EditorialArticle) => article.published);
    } catch (error) {
      console.warn('Error loading MD articles for UNPPP:', error);
    }
  }
  return [];
}
