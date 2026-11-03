'use client';

import React, { useState, useMemo } from "react";
import type { ClaudeConversation, ClaudeSummaryStats } from "../utils/claudeReportParser";

interface CreativityScoreDisplayProps {
  conversations: ClaudeConversation[];
  summaryStats: ClaudeSummaryStats;
}

const CreativityScoreDisplay: React.FC<CreativityScoreDisplayProps> = ({
  conversations,
  summaryStats,
}) => {
  // Conversation count options for filtering
  const conversationOptions = [10, 25, 50, 100, 250, conversations.length];
  const [selectedCount, setSelectedCount] = useState(50);

  // Filter conversations based on selected count (most recent)
  const filteredConversations = useMemo(() => {
    return conversations.slice(0, Math.min(selectedCount, conversations.length));
  }, [conversations, selectedCount]);

  // Calculate creativity metrics
  const creativityMetrics = useMemo(() => {
    const convos = filteredConversations;
    
    if (convos.length === 0) {
      return {
        topicDiversity: 0,
        engagementDepth: 0,
        discussionBreadth: 0,
        totalScore: 0,
      };
    }

    // 1. Topic Diversity (40%): unique topics / total conversations
    const allTopics: string[] = [];
    convos.forEach(conv => allTopics.push(...conv.topics));
    const uniqueTopics = new Set(allTopics).size;
    const topicDiversity = Math.min(1.0, uniqueTopics / (convos.length * 2)); // Normalize: assume ~2 topics per conv is baseline

    // 2. Engagement Depth (30%): average messages per conversation vs. median
    const messageCounts = convos.map(c => c.messageCount);
    const avgMessages = messageCounts.reduce((a, b) => a + b, 0) / messageCounts.length;
    const medianMessages = summaryStats.avgMessagesPerConversation;
    const engagementDepth = Math.min(1.0, avgMessages / Math.max(medianMessages, 1));

    // 3. Discussion Breadth (30%): topic distribution evenness (Shannon entropy normalized)
    const topicFrequency = new Map<string, number>();
    allTopics.forEach(topic => {
      topicFrequency.set(topic, (topicFrequency.get(topic) || 0) + 1);
    });
    
    let entropy = 0;
    const totalTopicMentions = allTopics.length;
    topicFrequency.forEach(count => {
      const p = count / totalTopicMentions;
      entropy -= p * Math.log2(p);
    });
    
    // Normalize entropy (max entropy = log2(unique topics))
    const maxEntropy = uniqueTopics > 1 ? Math.log2(uniqueTopics) : 1;
    const discussionBreadth = maxEntropy > 0 ? entropy / maxEntropy : 0;

    // Weighted total score (0-100)
    const totalScore = (
      topicDiversity * 40 +
      engagementDepth * 30 +
      discussionBreadth * 30
    );

    return {
      topicDiversity,
      engagementDepth,
      discussionBreadth,
      totalScore: Math.min(100, Math.max(0, totalScore)),
    };
  }, [filteredConversations, summaryStats]);

  // Get sample conversations to display
  const sampleConversations = useMemo(() => {
    return filteredConversations.slice(0, 5);
  }, [filteredConversations]);

  return (
    <div className="w-full max-w-3xl">
      {/* Header */}
      <h2 className="mb-4 font-google-sans-code text-2xl font-bold uppercase tracking-wide">
        LLM. HOW TO MEASURE THE QUALITY OF YOUR DATA
      </h2>

      {/* How It Works */}
      <div className="mb-6 rounded border border-gray-200/10 bg-gray-500/5 p-4">
        <h3 className="mb-2 font-google-sans-code text-xs uppercase tracking-wide text-gray-400">
          How it works
        </h3>
        <p className="font-google-sans-code text-xs leading-relaxed text-gray-300">
          Clean through your LLM data for: <span className="text-yellow-400">FOCUS.</span> (number of subjects discussed), <span className="text-yellow-400">DISCIPLINE.</span> (message volume per conversation), and <span className="text-yellow-400">CONSISTENCY.</span> (even distribution of topics). Your score reflects the creativity and range of your AI collaborations.
        </p>
      </div>

      {/* Conversation Count Selector */}
      <div className="mb-6">
        <p className="mb-2 font-google-sans-code text-xs uppercase tracking-wide text-gray-400">
          Analyze conversations:
        </p>
        <div className="flex flex-wrap gap-2">
          {conversationOptions.map((num) => (
            <button
              key={num}
              onClick={() => setSelectedCount(num)}
              className={`
                rounded border px-3 py-1 font-google-sans-code text-xs uppercase tracking-wide
                transition-all
                ${
                  selectedCount === num
                    ? "border-yellow-400/40 bg-yellow-400/10 text-yellow-400"
                    : "border-gray-200/10 text-gray-400 hover:border-gray-200/20 hover:bg-gray-500/5"
                }
              `}
            >
              {num === conversations.length ? `All ${num}` : num}
            </button>
          ))}
        </div>
        <p className="mt-2 font-google-sans-code text-xs tabular-nums text-gray-400">
          {filteredConversations.length} of {summaryStats.totalConversations} conversations analyzed
        </p>
      </div>

      {/* Score Display */}
      <div className="mb-6 flex flex-col gap-6 rounded border border-gray-200/10 p-6 md:flex-row md:items-center md:justify-between">
        {/* Circular Score Indicator */}
        <div className="flex justify-center md:justify-start">
          <CircularProgress score={creativityMetrics.totalScore} />
        </div>

        {/* Score Breakdown */}
        <div className="flex-1 space-y-3 font-google-sans-code text-sm">
          <ScoreBreakdown
            label="Topic Diversity"
            value={creativityMetrics.topicDiversity}
            weight={40}
          />
          <ScoreBreakdown
            label="Engagement Depth"
            value={creativityMetrics.engagementDepth}
            weight={30}
          />
          <ScoreBreakdown
            label="Discussion Breadth"
            value={creativityMetrics.discussionBreadth}
            weight={30}
          />
        </div>
      </div>

      {/* Conversation Evidence */}
      <div className="space-y-0 rounded border border-gray-200/10">
        <div className="border-b border-gray-200/10 p-4">
          <h3 className="font-google-sans-code text-xs uppercase tracking-wide text-gray-400">
            Data Behind Your Score
          </h3>
          <p className="mt-1 font-google-sans-code text-xs text-gray-500">
            Sample of {filteredConversations.length} analyzed conversations
          </p>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {sampleConversations.map((conv) => (
            <div
              key={conv.id}
              className="border-b border-gray-200/10 p-4 transition-all hover:bg-gray-500/5"
            >
              <div className="mb-2 flex items-start justify-between gap-4">
                <p className="flex-1 font-google-sans-code text-sm font-bold">{conv.title}</p>
                <span className="whitespace-nowrap font-google-sans-code text-xs tabular-nums text-gray-400">
                  {new Date(conv.timestamp).toLocaleDateString()}
                </span>
              </div>
              <p className="mb-3 font-google-sans-code text-xs text-gray-300 line-clamp-2">
                {conv.firstMessage}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-google-sans-code text-xs tabular-nums text-gray-400">
                  {conv.messageCount} msg • {conv.characterCount.toLocaleString()} chars
                </span>
                <span className="text-gray-400">•</span>
                <div className="flex flex-wrap gap-1">
                  {conv.topics.slice(0, 5).map((topic, idx) => (
                    <span
                      key={idx}
                      className="rounded bg-gray-500/10 px-2 py-0.5 font-google-sans-code text-xs uppercase tracking-wide text-gray-400"
                    >
                      {topic}
                    </span>
                  ))}
                  {conv.topics.length > 5 && (
                    <span className="font-google-sans-code text-xs text-gray-400">
                      +{conv.topics.length - 5}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Circular Progress Indicator Component
const CircularProgress: React.FC<{ score: number }> = ({ score }) => {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  return (
    <svg width="120" height="120" className="relative">
      <circle
        cx="60"
        cy="60"
        r={radius}
        stroke="rgb(156 163 175 / 0.1)"
        strokeWidth="10"
        fill="none"
      />
      <circle
        cx="60"
        cy="60"
        r={radius}
        stroke="#F9C22E"
        strokeWidth="10"
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={circumference - progress}
        strokeLinecap="round"
        className="transition-all duration-500"
        transform="rotate(-90 60 60)"
      />
      <text
        x="60"
        y="60"
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-white font-google-sans-code text-2xl font-bold tabular-nums"
      >
        {Math.round(score)}
      </text>
    </svg>
  );
};

// Score Breakdown Component
const ScoreBreakdown: React.FC<{ label: string; value: number; weight: number }> = ({
  label,
  value,
  weight,
}) => {
  const weightedScore = value * weight;
  
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs uppercase tracking-wide text-gray-300">{label}</span>
      <div className="flex items-center gap-3">
        {/* Progress bar */}
        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-gray-500/10">
          <div
            className="h-full bg-yellow-400 transition-all duration-500"
            style={{ width: `${value * 100}%` }}
          />
        </div>
        {/* Score value */}
        <span className="w-12 text-right tabular-nums text-yellow-400">
          {weightedScore.toFixed(1)}
        </span>
      </div>
    </div>
  );
};

export default CreativityScoreDisplay;
