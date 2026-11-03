/**
 * Build Status Type Definitions
 *
 * Formerly modeled real Next.js build output (route type, bundle size) from
 * .next/app-path-routes-manifest.json — that pipeline was dead in production
 * (the generated file was gitignored and never deployed). Now sourced
 * directly from the UNPPP priority-score system (src/lib/unppp-priority-scores.ts),
 * scoped to the 49 UnpppsConfig.json entries — each id doubles as a real
 * app route (src/app/<id>/).
 */

import type { Classification } from '@/utils/percentile-classification';

export type PriorityTier = Classification; // 'YAH.' | 'MEH.' | 'NAH.'

export interface RouteInfo {
  route: string;
  name: string;
  tier: PriorityTier;
  combined: number;
  repoTotal: number;
  unpppTotal: number;
}

export interface BuildStats {
  total: number;
  'YAH.': number;
  'MEH.': number;
  'NAH.': number;
  avgCombined?: number;
  matchedCount?: number;
}

export type ContentType = 'story' | 'article';

/** View counts for one content type, broken out by the source that reported them. */
export interface ConnectSourceViews {
  vercel: number;
  ga: number;
}

export type ConnectStats = Record<ContentType, ConnectSourceViews>;

/**
 * Time/cost per unppp — devHours + polarPrice from scripts/polar-pricing.ts's
 * output (unppp-repo-time.json, unparty-polar-unppp-cost-estimate.json),
 * already joined per-id by getUnpppPriorityData() (src/utils/unpppPriority.ts).
 * Not yet wired to a consumer — see status/page.tsx's existing untyped
 * "UNPPP PRIORITY" table for where this data is rendered today.
 */
export interface AboutInfo {
  route: string;
  devHours: number;
  polarPrice: number;
  confidence: 'high' | 'low';
}

export interface AboutStats {
  total: number;
  high: number;
  low: number;
  totalDevHours: number;
  totalPolarPrice: number;
}

export interface BuildStatusData {
  routes: RouteInfo[];
  stats: BuildStats;
  timestamp: string;
}

export const PRIORITY_TIER_DESCRIPTIONS: Record<PriorityTier, string> = {
  'YAH.': 'Top tercile — high combined priority score',
  'MEH.': 'Middle tercile',
  'NAH.': 'Bottom tercile — low combined priority score'
};

export const PRIORITY_TIER_COLORS: Record<PriorityTier, string> = {
  'YAH.': '#10b981', // green
  'MEH.': '#f59e0b', // amber
  'NAH.': '#6b7280'  // gray
};

export const VERCEL_QUERIES: Record<ContentType, string> = {
  story: 'PageViews across unparty-app stories',
  article: 'PageViews across unparty-app articles'
};

export const GA_QUERIES: Record<ContentType, string> = {
  story: 'Organic search sessions landing on /story/* pages',
  article: 'Organic search sessions landing on /article/* pages'
};

