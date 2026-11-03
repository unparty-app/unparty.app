// Data the resume charts draw (InkTimeline, StackLedger, ViewsChart), plain
// and serializable so an article's component section can carry it as props

import type { BeltRelease } from '@/lib/project-belt';

/** One month on an ink timeline: how many landed that month, and the total so far */
export interface TimelineMonth {
  month: string; // YYYY-MM
  count: number;
  total: number;
}

/** One line on an ink timeline: an area of the founder's work, month by month */
export interface TimelineSeries {
  name: string;
  color?: string; // The owner's color for it; the theme color by default
  months: TimelineMonth[];
}

/** One service on the stack ledger, its cost spread to a month */
export interface StackLine {
  id: string;
  name: string;
  plan: string;
  monthly: number;
}

/** The last thirty days of traffic */
export interface ViewsData {
  visitors: number;
  pageviews: number;
  days: number[]; // Pageviews a day, oldest first
  top: Array<{ path: string; views: number; title?: string; cover?: string | null }>;
}

/** Where a project stands, from first thought to taking money */
export const PATH_STAGES = ['idea', 'building', 'shipped', 'selling'] as const;
export type PathStage = (typeof PATH_STAGES)[number];

/** One project on the ink path */
/** Something in a running system, for InkSystem */
export interface SystemNode {
  name: string;
  cover?: string;
  href?: string;
}

/** A connection: which way things travel from the hub's side, and what travels */
export interface SystemLink {
  node: SystemNode;
  direction: 'in' | 'out' | 'both';
  says: string;
  then?: { node: SystemNode; direction: 'out' | 'both'; says: string }; // What that node talks to in turn
}

export interface PathStop {
  id: string;
  name: string;
  stage: PathStage;
  tagline?: string;
  cover?: string;
  color?: string;
  href?: string;
  leadsTo?: string[]; // Ids of the projects someone moves on to from this one
}

/** Which writing a word count reads */
export type WordSource = 'stories' | 'articles' | 'both';

/** One word and how often it appears */
export interface WordCount {
  word: string;
  count: number;
}

/** One row on RepoFocus: a repo's hours a week, or the rest folded together */
export interface FocusRow {
  name: string;
  hours: number[]; // One per week, oldest first
  total: number;
  // Now against before: more, about the same, less, none now, or none before
  trend: 'rising' | 'steady' | 'easing' | 'quiet' | 'new';
  lastWeek: number; // The last week it had hours
  releases: Array<{ week: number; tag: string }>; // What it released, by week
  price: number | null; // Its hours as a build, at the baseline (Goal Budget's "price yours")
  take: BeltRelease[]; // What it has released to take into your own repo
  folded?: number; // How many repos "everything else" holds
}

/** Where the owner's hours went, week by week (src/lib/focus.ts) */
export interface FocusData {
  weeks: string[]; // Each week's Monday, YYYY-MM-DD
  recent: number; // How many of the last weeks count as now
  rows: FocusRow[];
  focus: number; // The row with the most hours now: where it opens
  totalHours: number;
  rate: number | null; // The baseline's hourly rate; null without a baseline
  sentence: string;
}
