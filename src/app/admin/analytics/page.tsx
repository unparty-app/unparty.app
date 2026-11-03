'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

import { Users, Activity, Target, Award } from '@/app/components/icons';

interface PlatformMetrics {
  platformMetrics: {
    totalUsers: number;
    activeUsersLast30Days: number;
    activeUserPercentage: number;
  };
  ideaMetrics: {
    totalIdeasStarted: number;
    totalIdeasCompleted: number;
    ideasInProgress: number;
    completionRate: number;
  };
  pillarMetrics: {
    aboutPillarUsers: number;
    buildPillarUsers: number;
    connectPillarUsers: number;
    fullJourneyUsers: number;
    aboutAdoptionRate: number;
    buildAdoptionRate: number;
    connectAdoptionRate: number;
    fullJourneyRate: number;
  };
  targetAudienceMetrics: {
    nonTechnicalFounders: number;
    successfulNonTechFounders: number;
    nonTechFounderSuccessRate: number;
  };
  platformSuccessScore: {
    userGrowth: number;
    activeUserRatio: number;
    ideaCompletionRate: number;
    pillarAdoptionRate: number;
    nonTechFounderSuccessRate: number;
  };
  cohortAnalysis: Array<{
    week: string;
    newUsers: number;
    retained: number;
    retentionRate: number;
  }>;
  keyMilestones: Array<{
    milestone: string;
    _count: { milestone: number };
  }>;
  recentSuccesses: Array<{
    userId: string;
    userType: string;
    totalIdeasCompleted: number;
    totalIdeasStarted: number;
    createdAt: string;
    milestones: Array<{
      milestone: string;
      achievedAt: string;
    }>;
  }>;
}

const MetricsDashboard = () => {
  const { colorValue } = useTheme();
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/analytics/metrics');
        if (!response.ok) {
          throw new Error('Failed to fetch metrics');
        }
        const data = await response.json();
        setMetrics(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="mb-4 size-8 animate-spin rounded-full border-4 border-theme-line border-t-blue-600"></div>
          <p className="font-google-sans-code text-[var(--text-muted)] ">Loading metrics...</p>
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
        <p className="font-google-sans-code text-red-800 dark:text-red-400">
          Error loading metrics: {error || 'Unknown error'}
        </p>
      </div>
    );
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const formatPercentage = (num: number) => {
    return `${num.toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-google-sans-code text-3xl font-bold" style={{ color: colorValue }}>
          Platform Leadership Metrics
        </h1>
        <p className="mt-2 font-google-sans-code text-[var(--text-muted)] ">
          Tracking unparty&apos;s position as the leading platform for non-technical founders
        </p>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-theme-line bg-[var(--background-highlight)] p-6 ">
          <div className="flex items-center gap-3">
            <div 
              className="rounded-lg p-2"
              style={{ backgroundColor: `${colorValue}20` }}
            >
              <Users size={20} style={{ color: colorValue }} />
            </div>
            <div>
              <p className="font-google-sans-code text-sm text-[var(--text-muted)] ">Total Users</p>
              <p className="font-google-sans-code text-2xl font-bold">{formatNumber(metrics.platformMetrics.totalUsers)}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-theme-line bg-[var(--background-highlight)] p-6 ">
          <div className="flex items-center gap-3">
            <div 
              className="rounded-lg p-2"
              style={{ backgroundColor: `${colorValue}20` }}
            >
              <Activity size={20} style={{ color: colorValue }} />
            </div>
            <div>
              <p className="font-google-sans-code text-sm text-[var(--text-muted)] ">Active Users (30d)</p>
              <p className="font-google-sans-code text-2xl font-bold">{formatNumber(metrics.platformMetrics.activeUsersLast30Days)}</p>
              <p className="font-google-sans-code text-xs text-[var(--text-muted)]">
                {formatPercentage(metrics.platformMetrics.activeUserPercentage)} of total
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-theme-line bg-[var(--background-highlight)] p-6 ">
          <div className="flex items-center gap-3">
            <div 
              className="rounded-lg p-2"
              style={{ backgroundColor: `${colorValue}20` }}
            >
              <Target size={20} style={{ color: colorValue }} />
            </div>
            <div>
              <p className="font-google-sans-code text-sm text-[var(--text-muted)] ">Ideas Completed</p>
              <p className="font-google-sans-code text-2xl font-bold">{formatNumber(metrics.ideaMetrics.totalIdeasCompleted)}</p>
              <p className="font-google-sans-code text-xs text-[var(--text-muted)]">
                {formatPercentage(metrics.ideaMetrics.completionRate)} completion rate
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-theme-line bg-[var(--background-highlight)] p-6 ">
          <div className="flex items-center gap-3">
            <div 
              className="rounded-lg p-2"
              style={{ backgroundColor: `${colorValue}20` }}
            >
              <Award size={20} style={{ color: colorValue }} />
            </div>
            <div>
              <p className="font-google-sans-code text-sm text-[var(--text-muted)] ">Full Journey Users</p>
              <p className="font-google-sans-code text-2xl font-bold">{formatNumber(metrics.pillarMetrics.fullJourneyUsers)}</p>
              <p className="font-google-sans-code text-xs text-[var(--text-muted)]">
                {formatPercentage(metrics.pillarMetrics.fullJourneyRate)} using all pillars
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Three-Pillar Adoption */}
      <div className="rounded-xl border border-theme-line bg-[var(--background-highlight)] p-6 ">
        <h2 className="mb-4 font-google-sans-code text-xl font-bold">Three-Pillar Adoption</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="text-center">
            <div className="mx-auto mb-2 h-4 w-32 rounded-full bg-[var(--background-highlight)] ">
              <div 
                className="h-4 rounded-full"
                style={{ 
                  width: `${metrics.pillarMetrics.aboutAdoptionRate}%`,
                  backgroundColor: colorValue
                }}
              />
            </div>
            <p className="font-google-sans-code text-lg font-bold">ABOUT</p>
            <p className="font-google-sans-code text-sm text-[var(--text-muted)] ">
              {formatNumber(metrics.pillarMetrics.aboutPillarUsers)} users 
              ({formatPercentage(metrics.pillarMetrics.aboutAdoptionRate)})
            </p>
          </div>
          
          <div className="text-center">
            <div className="mx-auto mb-2 h-4 w-32 rounded-full bg-[var(--background-highlight)] ">
              <div 
                className="h-4 rounded-full"
                style={{ 
                  width: `${metrics.pillarMetrics.buildAdoptionRate}%`,
                  backgroundColor: colorValue
                }}
              />
            </div>
            <p className="font-google-sans-code text-lg font-bold">BUILD</p>
            <p className="font-google-sans-code text-sm text-[var(--text-muted)] ">
              {formatNumber(metrics.pillarMetrics.buildPillarUsers)} users 
              ({formatPercentage(metrics.pillarMetrics.buildAdoptionRate)})
            </p>
          </div>
          
          <div className="text-center">
            <div className="mx-auto mb-2 h-4 w-32 rounded-full bg-[var(--background-highlight)] ">
              <div 
                className="h-4 rounded-full"
                style={{ 
                  width: `${metrics.pillarMetrics.connectAdoptionRate}%`,
                  backgroundColor: colorValue
                }}
              />
            </div>
            <p className="font-google-sans-code text-lg font-bold">CONNECT</p>
            <p className="font-google-sans-code text-sm text-[var(--text-muted)] ">
              {formatNumber(metrics.pillarMetrics.connectPillarUsers)} users 
              ({formatPercentage(metrics.pillarMetrics.connectAdoptionRate)})
            </p>
          </div>
        </div>
      </div>

      {/* Target Audience Success */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-theme-line bg-[var(--background-highlight)] p-6 ">
          <h2 className="mb-4 font-google-sans-code text-xl font-bold">Non-Technical Founder Success</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-google-sans-code text-sm">Total Non-Technical Founders</span>
              <span className="font-google-sans-code font-bold">{formatNumber(metrics.targetAudienceMetrics.nonTechnicalFounders)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-google-sans-code text-sm">Successful (Ideas Completed)</span>
              <span className="font-google-sans-code font-bold">{formatNumber(metrics.targetAudienceMetrics.successfulNonTechFounders)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-google-sans-code text-sm">Success Rate</span>
              <span className="font-google-sans-code font-bold" style={{ color: colorValue }}>
                {formatPercentage(metrics.targetAudienceMetrics.nonTechFounderSuccessRate)}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-theme-line bg-[var(--background-highlight)] p-6 ">
          <h2 className="mb-4 font-google-sans-code text-xl font-bold">Platform Success Score</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-google-sans-code text-sm">User Growth</span>
              <span className="font-google-sans-code font-bold">{formatNumber(metrics.platformSuccessScore.userGrowth)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-google-sans-code text-sm">Active User Ratio</span>
              <span className="font-google-sans-code font-bold">{formatPercentage(metrics.platformSuccessScore.activeUserRatio)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-google-sans-code text-sm">Idea Completion Rate</span>
              <span className="font-google-sans-code font-bold">{formatPercentage(metrics.platformSuccessScore.ideaCompletionRate)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-google-sans-code text-sm">Pillar Adoption Rate</span>
              <span className="font-google-sans-code font-bold">{formatPercentage(metrics.platformSuccessScore.pillarAdoptionRate)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Successes */}
      <div className="rounded-xl border border-theme-line bg-[var(--background-highlight)] p-6 ">
        <h2 className="mb-4 font-google-sans-code text-xl font-bold">Recent Success Stories</h2>
        <div className="space-y-3">
          {metrics.recentSuccesses.slice(0, 5).map((success) => (
            <div key={success.userId} className="flex items-center justify-between rounded-lg border border-theme-line p-3 ">
              <div>
                <p className="font-google-sans-code text-sm font-medium">{success.userType.replace('_', ' ')}</p>
                <p className="font-google-sans-code text-xs text-[var(--text-muted)] ">
                  {success.totalIdeasCompleted} of {success.totalIdeasStarted} ideas completed
                  • {success.milestones.length} milestones achieved
                </p>
              </div>
              <div className="text-right">
                <p className="font-google-sans-code text-xs text-[var(--text-muted)]">
                  {new Date(success.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cohort Retention */}
      <div className="rounded-xl border border-theme-line bg-[var(--background-highlight)] p-6 ">
        <h2 className="mb-4 font-google-sans-code text-xl font-bold">Weekly Cohort Retention</h2>
        <div className="space-y-2">
          {metrics.cohortAnalysis.slice(0, 8).map((cohort) => (
            <div key={cohort.week} className="flex items-center gap-4">
              <span className="w-20 font-google-sans-code text-xs text-[var(--text-muted)] ">
                {new Date(cohort.week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-full rounded-full bg-[var(--background-highlight)] ">
                    <div 
                      className="h-2 rounded-full"
                      style={{ 
                        width: `${Math.min(cohort.retentionRate, 100)}%`,
                        backgroundColor: colorValue
                      }}
                    />
                  </div>
                  <span className="w-12 font-google-sans-code text-xs">
                    {formatPercentage(cohort.retentionRate)}
                  </span>
                </div>
              </div>
              <span className="w-16 font-google-sans-code text-xs text-[var(--text-muted)] ">
                {cohort.retained}/{cohort.newUsers}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MetricsDashboard;