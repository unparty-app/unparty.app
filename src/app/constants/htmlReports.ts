export interface HtmlReport {
  /** Matches public/{filename}.html and the /html/[filename] route. */
  filename: string;
  title: string;
  description: string;
  /** Originating repo, shown as a small badge. */
  source: string;
  /**
   * Override for the iframe embed target. Most reports are self-contained
   * documents and can be loaded directly as `/{filename}.html`. A few are
   * bare content fragments styled with theunpartyapp's own Tailwind classes
   * and theme CSS variables (meant to be injected into the app's layout,
   * not viewed standalone) — those need a wrapper that supplies fallback
   * styling instead.
   */
  embedPath?: string;
}

export const HTML_REPORTS: HtmlReport[] = [
  { filename: 'repo-metadata-dashboard', title: 'Repo Metadata', description: 'Org-wide GitHub repository metadata across 43 repos', source: 'theunpartyrunway', embedPath: '/api/reports/repo-metadata-embed' },
  { filename: 'claude_analytics', title: 'Claude Analytics', description: 'Aggregated Claude Code usage & conversation analytics', source: 'theunpartycrawler' },
  { filename: 'natural_topic_discovery_dashboard', title: 'Topic Discovery', description: 'Unsupervised NLP topic-clustering dashboard', source: 'theunpartycrawler' },
  { filename: 'sprint_research', title: 'Sprint Research', description: 'Sprint methodology reference (Core/Risk/Brand/Grow/Budget)', source: 'theunpartycrawler' },
  { filename: 'sprintbrain', title: 'Sprint Brain', description: 'Sprint methodology reference (Core/Risk/Brand/Grow/Budget)', source: 'theunpartycrawler' },
  { filename: 'techdebtproposal', title: 'Tech Debt Proposal', description: 'Proposal for scoring Python scripts on release-readiness', source: 'theunpartycrawler' },
  { filename: 'welcome-colors', title: 'Brand Colors', description: 'Unparty brand color system reference', source: 'theunpartycrawler' },
];
