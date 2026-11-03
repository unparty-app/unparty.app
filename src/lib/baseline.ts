/**
 * The baseline a goal's budget is measured against (FoundersConfig `baseline`,
 * read as BASELINE from organization.ts): what an hour of building is worth,
 * what it costs in an LLM, and real projects with their measured hours to
 * compare a new one with.
 *
 * A copy ships with unparty's, measured from unparty's own repos
 * (theunpartyrunway's run-repo-analysis: commits within 2 hours are one work
 * session, each +15 minutes, at most 4 hours). Its owner replaces it with
 * their own. It holds only measurements, no premiums. Infra isn't in it: the
 * stack a project runs on is priced by DependConfig, so it's never counted twice.
 *
 * `rhythm` is when those hours happened, a year at a time: commits by local
 * hour and weekday, measured once from the same repos. It ships as a record of
 * what it took, never re-fetched from unparty.
 *
 * Pure (no app imports), so scripts/polar-pricing.ts prices with the same rate.
 */

export interface BaselinePay {
  // Whose pay it is, like "seed-stage founder"
  label: string;
  yearly: number;
}

export interface BaselineProject {
  // A project's id when the site has one; any short name otherwise
  id: string;
  name?: string;
  // The project this copy of the site is built from: what "this site" took
  site?: boolean;
  hours: number;
  sessions?: number;
  commits?: number;
  // First and last day of work, YYYY-MM-DD
  from?: string;
  to?: string;
}

// One year of when the work happened, counted from git commits in the
// author's own local time
export interface BaselineRhythmYear {
  year: number;
  commits: number;
  repos?: number;
  // The last day counted, YYYY-MM-DD, when the year isn't over
  through?: string;
  // Commits in each hour of the day, 0 (midnight) to 23
  hours: number[];
  // Commits on each day of the week, Monday first
  days: number[];
}

export interface Baseline {
  // Where the numbers come from, in a line
  source?: string;
  // The day they were measured, YYYY-MM-DD
  measured?: string;
  // Market pay to price an hour by: the rate is their median ÷ hoursPerYear
  pay: BaselinePay[];
  hoursPerYear: number;
  // What an hour of building costs in an LLM
  llmPerHour: number;
  projects: BaselineProject[];
  // When the hours happened, a year at a time, oldest first: how the work
  // grew as much as how much there was
  rhythm?: BaselineRhythmYear[];
}

export interface BuildCost {
  hours: number;
  labor: number;
  llm: number;
  total: number;
}

function median(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** What an hour of building is worth: the median pay ÷ hours a year */
export function hourlyRate(baseline: Baseline): number {
  return baseline.hoursPerYear > 0 ? median(baseline.pay.map((p) => p.yearly)) / baseline.hoursPerYear : 0;
}

/** What `hours` of building cost: the hours at the rate, plus the LLM */
export function buildCost(hours: number, baseline: Baseline): BuildCost {
  const labor = hours * hourlyRate(baseline);
  const llm = hours * baseline.llmPerHour;
  return { hours, labor, llm, total: labor + llm };
}

/** The baseline's projects, most hours first */
export function baselineProjects(baseline: Baseline): BaselineProject[] {
  return [...baseline.projects].sort((a, b) => b.hours - a.hours);
}

export const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

/** The rhythm's years, oldest first; [] when the baseline has none */
export function rhythmYears(baseline: Baseline | null): BaselineRhythmYear[] {
  return [...(baseline?.rhythm ?? [])].sort((a, b) => a.year - b.year);
}

/** What share of a year's commits fall in the hours from `from` up to `to` (wrapping past midnight) */
export function hourShare(year: BaselineRhythmYear, from: number, to: number): number {
  const total = year.hours.reduce((sum, n) => sum + n, 0);
  if (!total) return 0;
  const inside = year.hours.reduce((sum, n, hour) => sum + ((from <= to ? hour >= from && hour < to : hour >= from || hour < to) ? n : 0), 0);
  return inside / total;
}

/** An hour of the day as said: 0 → "midnight", 12 → "noon", 15 → "3pm" */
export const hourName = (hour: number) =>
  hour === 0 ? 'midnight' : hour === 12 ? 'noon' : hour < 12 ? `${hour}am` : `${hour - 12}pm`;

/** The hour of the day with the most commits */
export function peakHour(year: BaselineRhythmYear): number {
  return year.hours.reduce((best, n, hour) => (n > year.hours[best] ? hour : best), 0);
}

/** The days of the week, busiest first */
export function dayOrder(year: BaselineRhythmYear): string[] {
  return WEEKDAYS.map((day, index) => ({ day, n: year.days[index] ?? 0 }))
    .sort((a, b) => b.n - a.n)
    .map(({ day }) => day);
}
