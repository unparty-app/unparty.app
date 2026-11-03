'use client';
import React from 'react';

import { useAuth } from '@/lib/auth-stub.client';
import { useTheme } from '@/app/contexts/ThemeContext';
import type { ChallengeStep } from '@/app/constants/editorial-articles';

interface ChallengePollProps {
  challengeId: string;
  articleSlug: string;
  userPrompt?: string;
  stepOne?: ChallengeStep;
  stepTwo?: ChallengeStep;
  stepThree?: ChallengeStep;
  successMetric?: string;
}

interface VoteData {
  id: string;
  selectedOption: string;
  createdAt: string;
  updatedAt: string;
}

interface PollResults {
  totalVotes: number;
  results: {
    stepOne: { count: number; percentage: number };
    stepTwo: { count: number; percentage: number };
    stepThree: { count: number; percentage: number };
  };
}

const ChallengePoll: React.FC<ChallengePollProps> = ({
  challengeId,
  articleSlug,
  userPrompt,
  stepOne,
  stepTwo,
  stepThree,
  successMetric,
}) => {
  const { userId } = useAuth();
  const { colorValue } = useTheme();

  const [userVote, setUserVote] = React.useState<VoteData | null>(null);
  const [results, setResults] = React.useState<PollResults | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        if (userId) {
          const voteResponse = await fetch(`/api/challenges/${challengeId}/vote`);
          if (voteResponse.ok) {
            const voteData = await voteResponse.json();
            setUserVote(voteData.vote);
          }
        }

        const resultsResponse = await fetch(`/api/challenges/${challengeId}/results`);
        if (resultsResponse.ok) {
          const resultsData = await resultsResponse.json();
          setResults(resultsData);
        }
      } catch (err) {
        console.error('[ChallengePoll] Error fetching data:', err);
        setError('Failed to load poll data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [challengeId, userId]);

  const handleVote = async (selectedOption: 'stepOne' | 'stepTwo' | 'stepThree') => {
    if (!userId) {
      setError('Please sign in to vote');
      return;
    }

    if (submitting) return;

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch(`/api/challenges/${challengeId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleSlug, selectedOption }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit vote');
      }

      const data = await response.json();
      setUserVote(data.response);

      const resultsResponse = await fetch(`/api/challenges/${challengeId}/results`);
      if (resultsResponse.ok) {
        const resultsData = await resultsResponse.json();
        setResults(resultsData);
      }
    } catch (err) {
      console.error('[ChallengePoll] Error submitting vote:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit vote');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="my-8">
        <div className="h-48 animate-pulse rounded-lg bg-background-highlight" />
      </div>
    );
  }

  const steps = [
    { key: 'stepOne' as const, data: stepOne },
    { key: 'stepTwo' as const, data: stepTwo },
    { key: 'stepThree' as const, data: stepThree },
  ].filter((step) => step.data);

  const hasVoted = !!userVote;
  const showResults = hasVoted && results;

  return (
    <div
      className="relative overflow-hidden rounded-xl border-l-4 p-4 text-left sm:p-6 vh-card-elevated"
      style={{ borderColor: colorValue, backgroundColor: 'var(--background)' }}
    >
      {/* Challenge Label */}
      <div className="mb-4 flex items-center gap-2">
        <div className="size-2 rounded-full" style={{ backgroundColor: colorValue }} />
        <span
          className="font-vt323 text-xs font-bold uppercase tracking-widest"
          style={{ color: colorValue }}
        >
          build.
        </span>
      </div>

      {/* Challenge Prompt */}
      {userPrompt && (
        <div className="mb-6">
          <p
            className="font-google-sans-code text-base font-bold leading-relaxed sm:text-lg"
            style={{ color: 'var(--foreground)' }}
          >
            {userPrompt}
          </p>
        </div>
      )}

      {/* Authentication Warning */}
      {!userId && (
        <div
          className="mb-4 rounded-lg border p-4"
          style={{ borderColor: `${colorValue}40`, backgroundColor: 'var(--background)' }}
        >
          <p className="font-google-sans-code text-sm" style={{ color: 'var(--text-muted)' }}>
            📌 you need to be on the list for this. 
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 rounded-lg border  p-4" style={{ backgroundColor: 'var(--background)' }}>
          <p className="font-google-sans-code text-sm text-red-500">{error}</p>
        </div>
      )}

      {/* Poll Options */}
      <div className="grid gap-4 md:grid-cols-3">
        {steps.map(({ key, data }) => {
          if (!data) return null;

          const isSelected = userVote?.selectedOption === key;
          const voteCount = results?.results[key]?.count || 0;
          const percentage = results?.results[key]?.percentage || 0;

          return (
            <button
              key={key}
              onClick={() => handleVote(key)}
              disabled={submitting || !userId || hasVoted}
              className={`group relative overflow-hidden rounded-lg border-2 p-6 text-left transition-all duration-200 ${
                submitting || !userId || hasVoted
                  ? 'cursor-not-allowed opacity-60'
                  : 'cursor-pointer hover:shadow-lg'
              }`}
              style={{
                borderColor: isSelected ? colorValue : `${colorValue}25`,
                backgroundColor: isSelected ? `${colorValue}10` : 'var(--background)',
              }}
              onMouseEnter={(e) => {
                if (!isSelected && !hasVoted && userId) {
                  e.currentTarget.style.borderColor = `${colorValue}60`;
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = `${colorValue}25`;
                }
              }}
            >
              {/* Emoji */}
              <div className="mb-3 text-4xl">{data.emoji}</div>

              {/* Action */}
              <div
                className="mb-2 font-google-sans-code text-lg font-bold uppercase"
                style={{ color: isSelected ? colorValue : 'var(--foreground)' }}
              >
                {data.action}
              </div>

              {/* Description */}
              <div
                className="font-google-sans-code text-xs"
                style={{ color: 'var(--text-muted)' }}
              >
                {data.description}
              </div>

              {/* Selected Indicator */}
              {isSelected && (
                <div className="absolute right-4 top-4">
                  <div
                    className="flex h-6 w-6 items-center justify-center rounded-full"
                    style={{ backgroundColor: colorValue }}
                  >
                    <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              )}

              {/* Results Bar */}
              {showResults && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-vt323 text-base font-bold" style={{ color: 'var(--foreground)' }}>
                      {percentage}%
                    </span>
                    <span className="font-vt323 text-sm" style={{ color: 'var(--text-muted)' }}>
                      {voteCount} {voteCount === 1 ? 'vote' : 'votes'}
                    </span>
                  </div>
                  <div
                    className="h-2 overflow-hidden rounded-full"
                    style={{ backgroundColor: `${colorValue}15` }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: isSelected ? colorValue : `${colorValue}40`,
                      }}
                    />
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Success Metric */}
      {showResults && successMetric && (
        <div
          className="mt-6 rounded-lg border p-4"
          style={{ borderColor: `${colorValue}40`, backgroundColor: 'var(--background)' }}
        >
          <p
            className="font-google-sans-code text-sm font-bold uppercase tracking-wide"
            style={{ color: 'var(--foreground)' }}
          >
            {successMetric}
          </p>
          {results && (
            <p className="mt-2 font-google-sans-code text-xs" style={{ color: 'var(--text-muted)' }}>
              Total votes: <span className="font-vt323 text-base">{results.totalVotes}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default ChallengePoll;
