/**
 * LanguagesPage Component — Editorial Rework
 *
 * The /languages transparency page, recomposed in the app's premium
 * editorial language (issue #575): a single scrolling long-form page with a
 * reading progress bar and an OutlineRail scrollspy instead of the old
 * six-tab nav bar. Follows the FoundersPage.tsx architecture the
 * raw-repo-metadata rebuild (issues #310/#311) named as the pattern.
 *
 * @architecture
 * One data fetch, one source of truth: the module-cached getRepoMetadata()
 * feeds every chart on the page, and the org-wide <RepoStats /> instance is
 * the EFFORT chapter wholesale — the old page's parallel aggregate
 * calculations (repoStats/commitStats/aiMetrics) are gone. Stats explain
 * themselves through the existing KpiModal definitions (unparty-kpi.json)
 * instead of hardcoded "WHAT YOU'RE SEEING" prose blocks.
 *
 * Chapters: HERO → STACK (ranked bars, by language or by unppp product +
 * interactive language strip) → ACTIVITY (ranked activity bars) →
 * EFFORT (org-wide RepoStats + effort sphere) → REPOSITORIES (unppp
 * cover-card grid, filterable by language, sortable by metric) →
 * MEASURED (KPI definitions via KpiModal).
 */
'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from '../contexts/ThemeContext';
import type { EditorialSection as EditorialSectionType } from '../constants/editorial-articles/types';
import type { RepositoryMetadata } from '@/types/repository-metadata';
import { getRepoMetadata } from '@/utils/repoMetadataClient';
import { getAggregatedStats, sortReposByMetric } from '@/utils/language-calculations';
import EditorialSectionRenderer from '../components/editorial/EditorialSection';
import OutlineRail from '../components/editorial/OutlineRail';
import Chapter from '../founders/components/Chapter';
import LazyMount from '../founders/components/LazyMount';
import RepoCard from '../founders/components/RepoCard';
import RepoStats from '../components/RepoStats';
import { getKpiConfig, type KpiConfig } from '../components/KpiTile';
import KpiModal from '../components/KpiModal';

// Three.js / D3 charts are client-only — same lazy pattern as /founders
const StackBars = dynamic(() => import('../components/StackBars'), { ssr: false });
const ActivityBars = dynamic(() => import('../components/ActivityBars'), { ssr: false });
const EffortVisualization = dynamic(() => import('../components/EffortVisualization'), { ssr: false });

const HEADER_OFFSET = 88; // matches OutlineRail's jump offset

/** Synthetic sections that drive the OutlineRail scrollspy labels */
const OUTLINE_SECTIONS: EditorialSectionType[] = [
  { id: 'hero', type: 'hero', content: 'LANGUAGES.' },
  { id: 'stack', type: 'heading', content: 'STACK.' },
  { id: 'activity', type: 'heading', content: 'ACTIVITY.' },
  { id: 'effort', type: 'heading', content: 'EFFORT.' },
  { id: 'repositories', type: 'heading', content: 'REPOSITORIES.' },
  { id: 'measured', type: 'heading', content: 'MEASURED.' },
];

/** Repo-grid sort lenses — all served by sortReposByMetric, no new math */
const SORT_OPTIONS = [
  { id: 'activity_score', label: 'ACTIVE.', order: 'desc' },
  { id: 'days_since_push', label: 'RECENT.', order: 'asc' },
  { id: 'contributors', label: 'BUILDERS.', order: 'desc' },
  { id: 'releases', label: 'SHIPPED.', order: 'desc' },
  { id: 'issues', label: 'SCOPE.', order: 'desc' },
] as const;

type SortId = (typeof SORT_OPTIONS)[number]['id'];

/** Every KPI defined for the org view — definitions live in unparty-kpi.json */
const MEASURED_KPI_IDS = [
  'valuation',
  'hours',
  'confidence',
  'active',
  'commits',
  'issues',
  'builders',
  'ai',
  'health',
];

/**
 * Charts mount on scroll here (not behind a tab like the old page), so a
 * WebGL/asset failure must degrade to a quiet placeholder instead of
 * unmounting the article — same recipe as DiscoBallLazy's boundary.
 */
class ChartBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[LanguagesPage] chart render failed:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full min-h-24 items-center justify-center">
          <span className="font-google-sans-code text-xs" style={{ color: 'var(--text-muted)' }}>
            visualization unavailable — the numbers below still stand.
          </span>
        </div>
      );
    }
    return this.props.children;
  }
}

const LanguagesPage = () => {
  const { colorValue } = useTheme();
  const articleRef = useRef<HTMLElement>(null);
  const sectionRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const [repoData, setRepoData] = useState<RepositoryMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [sortId, setSortId] = useState<SortId>('activity_score');
  const [selectedKpi, setSelectedKpi] = useState<KpiConfig | null>(null);

  const registerRef = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) {
      sectionRefs.current.set(id, el);
    } else {
      sectionRefs.current.delete(id);
    }
  }, []);

  // One fetch for the whole page — module-cached, shared with RepoStats
  useEffect(() => {
    let cancelled = false;
    getRepoMetadata()
      .then(data => {
        if (!cancelled) setRepoData(data);
      })
      .catch(err => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Unknown error');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(
    () => (repoData.length > 0 ? getAggregatedStats(repoData, true) : null),
    [repoData]
  );

  // Language segments decorated with how many repos actually use them
  const languageOptions = useMemo(() => {
    if (!stats) return [];
    return stats.languages.map(lang => ({
      ...lang,
      repoCount: repoData.filter(
        repo => (repo.enhanced_metrics?.languages_detail?.[lang.name] ?? 0) > 0
      ).length,
    }));
  }, [stats, repoData]);

  const visibleRepos = useMemo(() => {
    const filtered = selectedLanguage
      ? repoData.filter(
          repo => (repo.enhanced_metrics?.languages_detail?.[selectedLanguage] ?? 0) > 0
        )
      : repoData;
    const sort = SORT_OPTIONS.find(option => option.id === sortId) ?? SORT_OPTIONS[0];
    return sortReposByMetric(filtered, sort.id, sort.order);
  }, [repoData, selectedLanguage, sortId]);

  const measuredKpis = useMemo(
    () => MEASURED_KPI_IDS.map(getKpiConfig).filter((kpi): kpi is KpiConfig => kpi !== null),
    []
  );

  const jumpToRepositories = useCallback(() => {
    const el = sectionRefs.current.get('repositories');
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: Math.max(0, top), behavior: reduce ? 'auto' : 'smooth' });
  }, []);

  /** Strip segments and chips share one behavior: toggle filter, land on the grid */
  const selectLanguage = useCallback(
    (name: string | null, jump = false) => {
      setSelectedLanguage(current => (current === name ? null : name));
      if (jump) jumpToRepositories();
    },
    [jumpToRepositories]
  );

  const analysisDate = repoData[0]?.analysis_date;

  return (
    <div className="relative">
     
      <OutlineRail sections={OUTLINE_SECTIONS} sectionRefs={sectionRefs} />

      <article ref={articleRef} className="mx-auto max-w-4xl px-6 py-12">
        {/* Theme divider motif — full-bleed, same as article headers */}
        

        {/* HERO */}
        <Chapter id="hero" onRef={registerRef} className="mb-20">
          <EditorialSectionRenderer
            section={{
              id: 'hero-title',
              type: 'hero',
              content: 'LANGUAGES.',
              metadata: { emphasis: true },
            }}
          />
          <div className="mt-12">
            <EditorialSectionRenderer
              section={{
                id: 'hero-intro',
                type: 'paragraph',
                content:
                  'Analyzing all the unppps inside unparty.app from a development viewpoint.',
                metadata: { size: 'large' },
              }}
            />
          </div>
        </Chapter>

        {loading ? (
          <div className="my-20 space-y-4">
            <div className="h-10 w-48 animate-pulse rounded bg-background-highlight" />
            <div className="h-4 animate-pulse rounded bg-background-highlight" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-background-highlight" />
            <div className="h-64 animate-pulse rounded-xl bg-background-highlight" />
          </div>
        ) : error || !stats ? (
          <div className="my-20 text-center">
            <p className="font-google-sans-code text-sm" style={{ color: 'var(--text-muted)' }}>
              {error || 'Failed to load repository data'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 font-google-sans-code text-xs font-bold uppercase tracking-wide"
              style={{ color: colorValue }}
            >
              Retry →
            </button>
          </div>
        ) : (
          <>
            {/* STACK — ranked bars by language, or each unppp product's own composition */}
            <Chapter id="stack" onRef={registerRef} className="mb-20">
              <EditorialSectionRenderer
                section={{ id: 'stack-heading', type: 'heading', content: 'STACK.', metadata: { size: 'medium' } }}
              />
              <EditorialSectionRenderer
                section={{
                  id: 'stack-kicker',
                  type: 'paragraph',
                  content: 'Every language across every repository, weighted by bytes of code — or, product by product, what each one is actually built from. Tap a segment of the strip to browse its repositories.',
                  metadata: { style: 'accent' },
                }}
              />

              <ChartBoundary>
                <StackBars repositories={repoData} height="480px" />
              </ChartBoundary>

              {/* Interactive language strip — full-bleed accent band, StatBand treatment */}
              <div
                className="mt-12 w-screen mx-[calc(50%-50vw)] px-4 py-10 sm:px-6 lg:px-12"
                style={{ backgroundColor: `${colorValue}10` }}
              >
                <div className="mx-auto max-w-4xl">
                  <div
                    className="flex h-10 w-full overflow-hidden rounded-full"
                    style={{ backgroundColor: 'var(--background-highlight)' }}
                  >
                    {languageOptions.map(lang => (
                      <button
                        key={lang.name}
                        type="button"
                        onClick={() => selectLanguage(lang.name, true)}
                        aria-pressed={selectedLanguage === lang.name}
                        aria-label={`Browse ${lang.repoCount} ${lang.name} repositories`}
                        title={`${lang.name} — ${lang.percentage}% · ${lang.repoCount} ${lang.repoCount === 1 ? 'repo' : 'repos'}`}
                        className="h-full transition-opacity duration-200 hover:opacity-70"
                        style={{
                          flexGrow: lang.bytes,
                          flexBasis: '4px',
                          backgroundColor: lang.color,
                          opacity: selectedLanguage && selectedLanguage !== lang.name ? 0.25 : 1,
                        }}
                      />
                    ))}
                  </div>
                  <p className="mt-4 font-vt323 text-sm" style={{ color: 'var(--text-muted)' }}>
                    every segment is proportional to bytes of code across the org — no language is
                    hidden, no percentage is hand-picked.
                  </p>
                </div>
              </div>
            </Chapter>

            <EditorialSectionRenderer section={{ id: 'break-stack', type: 'sectionBreak' }} />

            {/* ACTIVITY — the Disco orbit of live repositories */}
            <Chapter id="activity" onRef={registerRef} className="mb-20">
              <EditorialSectionRenderer
                section={{ id: 'activity-heading', type: 'heading', content: 'ACTIVITY.', metadata: { size: 'medium' } }}
              />
              <EditorialSectionRenderer
                section={{
                  id: 'activity-kicker',
                  type: 'paragraph',
                  content: 'Every row is a repository, ranked by activity score — bar length and fill both carry the magnitude. Hover or focus a row for the numbers.',
                  metadata: { style: 'accent' },
                }}
              />
              <div className="mt-8">
                <LazyMount height="560px">
                  <ChartBoundary>
                    <ActivityBars repositories={repoData} height="560px" />
                  </ChartBoundary>
                </LazyMount>
              </div>
            </Chapter>

            <EditorialSectionRenderer section={{ id: 'break-activity', type: 'sectionBreak' }} />

            {/* EFFORT — the org-wide RepoStats instance is the chapter */}
            <Chapter id="effort" onRef={registerRef} className="mb-20">
              <EditorialSectionRenderer
                section={{ id: 'effort-heading', type: 'heading', content: 'EFFORT.', metadata: { size: 'medium' } }}
              />
              <RepoStats />
              <div className="mt-12 w-screen mx-[calc(50%-50vw)] px-4 sm:px-6 lg:px-12">
                <LazyMount height="600px">
                  <ChartBoundary>
                    <EffortVisualization
                      data={repoData}
                      height="600px"
                      defaultLens="ai"
                      rotationSpeed={0.2}
                      enableControls={true}
                    />
                  </ChartBoundary>
                </LazyMount>
              </div>
            </Chapter>

            <EditorialSectionRenderer section={{ id: 'break-effort', type: 'sectionBreak' }} />

            {/* REPOSITORIES — browsable unppp cover-card grid */}
            <Chapter id="repositories" onRef={registerRef} className="mb-20">
              <EditorialSectionRenderer
                section={{ id: 'repositories-heading', type: 'heading', content: 'REPOSITORIES.', metadata: { size: 'medium' } }}
              />
              <EditorialSectionRenderer
                section={{
                  id: 'repositories-kicker',
                  type: 'paragraph',
                  content: 'Every repository building unparty. Filter by language, sort by metric — each card links to its unppp page.',
                  metadata: { style: 'accent' },
                }}
              />

              {/* Language filter chips */}
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedLanguage(null)}
                  aria-pressed={selectedLanguage === null}
                  className="rounded-full border px-3 py-1 font-google-sans-code text-xs font-bold uppercase tracking-wide transition-colors duration-200"
                  style={
                    selectedLanguage === null
                      ? { borderColor: colorValue, color: colorValue, backgroundColor: `${colorValue}15` }
                      : { borderColor: `${colorValue}66`, color: 'var(--text-muted)' }
                  }
                >
                  ALL. {repoData.length}
                </button>
                {languageOptions.map(lang => {
                  const isActive = selectedLanguage === lang.name;
                  return (
                    <button
                      key={lang.name}
                      type="button"
                      onClick={() => selectLanguage(lang.name)}
                      aria-pressed={isActive}
                      className="flex items-center gap-1.5 rounded-full border px-3 py-1 font-google-sans-code text-xs transition-colors duration-200"
                      style={
                        isActive
                          ? { borderColor: lang.color, color: lang.color, backgroundColor: `${lang.color}15` }
                          : { borderColor: `${colorValue}66`, color: 'var(--text-muted)' }
                      }
                    >
                      <span className="size-2 rounded-full" style={{ backgroundColor: lang.color }} />
                      {lang.name}
                      <span style={{ color: isActive ? lang.color : 'var(--text-muted)', opacity: 0.7 }}>
                        {lang.repoCount}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Sort lenses */}
              <div className="mb-8 flex flex-wrap items-center gap-4 border-b pb-3" style={{ borderColor: `${colorValue}66` }}>
                <span className="font-google-sans-code text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                  SORT.
                </span>
                {SORT_OPTIONS.map(option => {
                  const isActive = sortId === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setSortId(option.id)}
                      aria-pressed={isActive}
                      className="relative py-1 font-google-sans-code text-xs uppercase tracking-wide transition-colors duration-200"
                      style={{ color: isActive ? 'var(--foreground)' : 'var(--text-muted)', fontWeight: isActive ? 700 : 400 }}
                    >
                      {option.label}
                      <span
                        className="absolute inset-x-0 -bottom-3.5 h-0.5 transition-opacity duration-200"
                        style={{ backgroundColor: colorValue, opacity: isActive ? 1 : 0 }}
                      />
                    </button>
                  );
                })}
                <span className="ml-auto font-vt323 text-sm" style={{ color: 'var(--text-muted)' }}>
                  {visibleRepos.length} of {repoData.length}
                  {selectedLanguage ? ` use ${selectedLanguage}` : ' repositories'}
                </span>
              </div>

              {/* Cover-card grid — the unppp RepoCard recipe, snapshot-only */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {visibleRepos.map(repo => (
                  <RepoCard key={repo.name} repo={{ meta: repo }} />
                ))}
              </div>
            </Chapter>

            <EditorialSectionRenderer section={{ id: 'break-repositories', type: 'sectionBreak' }} />

            {/* MEASURED — KPI definitions via the existing modal, not prose */}
            <Chapter id="measured" onRef={registerRef} className="mb-20">
              <EditorialSectionRenderer
                section={{ id: 'measured-heading', type: 'heading', content: 'MEASURED.', metadata: { size: 'medium' } }}
              />
              <EditorialSectionRenderer
                section={{
                  id: 'measured-kicker',
                  type: 'paragraph',
                  content: 'Tap any metric for its definition — the same KPIs that price every unppp.',
                  metadata: { style: 'accent' },
                }}
              />
              <div className="flex flex-wrap gap-3">
                {measuredKpis.map(kpi => (
                  <button
                    key={kpi.id}
                    type="button"
                    onClick={() => setSelectedKpi(kpi)}
                    aria-label={`Open ${kpi.label} definition`}
                    className="rounded-full border px-4 py-2 font-google-sans-code text-xs font-bold uppercase tracking-wide transition-all duration-200 hover:scale-[1.03]"
                    style={{ borderColor: `${kpi.color}60`, color: kpi.color, backgroundColor: `${kpi.color}10` }}
                  >
                    {kpi.label}
                  </button>
                ))}
              </div>
            </Chapter>
          </>
        )}

        {/* Footer — provenance */}
        <footer className="mt-20 border-t border-border pt-12">
          <p className="font-vt323 text-xs" style={{ color: 'var(--text-muted)' }}>
            {analysisDate
              ? `repo data analyzed ${new Date(analysisDate).toLocaleDateString()} · metrics combine repository metadata, git history, and valuation data`
              : 'metrics combine repository metadata, git history, and valuation data'}
          </p>
        </footer>
      </article>

      {/* KPI definition modal — reuses unparty-kpi.json copy, zero new prose */}
      <KpiModal kpi={selectedKpi} comparisons={[]} onClose={() => setSelectedKpi(null)} />
    </div>
  );
};

export default LanguagesPage;
