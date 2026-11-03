"use client";

import React, { useState } from "react";
import { useLocalStorageValue, writeLocalStorage } from "@/hooks/useLocalStorage";

type VoteRecord = {
  userVote: 'more' | 'nah' | 'meh' | null;
  moreCount: number;
  nahCount: number;
  mehCount: number;
};

function parseVoteRecord(raw: string | null): VoteRecord | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as VoteRecord;
  } catch {
    return null; // Invalid data, ignore
  }
}

type FeatureVoteProps = {
  unpppId: string;
  featureName: string;
  description?: string;
  tagline?: string;
  debt?: number;
  initialMoreCount?: number;
  initialNahCount?: number;
  initialMehCount?: number; 
};

const FeatureVote: React.FC<FeatureVoteProps> = ({ 
  unpppId,
  featureName, 
  description,
  tagline,
  debt,
  initialMoreCount = 0,
  initialNahCount = 0,
  initialMehCount = 0
}) => {
  // Saved vote from localStorage (privacy-first, local-only); a vote cast
  // this session wins, which also covers blocked storage
  const storageKey = `vote_${unpppId}`;
  const storedVote = parseVoteRecord(useLocalStorageValue(storageKey));
  const [castVote, setCastVote] = useState<(VoteRecord & { unpppId: string }) | null>(null);
  const record = castVote?.unpppId === unpppId ? castVote : storedVote;

  const moreCount = record?.moreCount ?? initialMoreCount;
  const nahCount = record?.nahCount ?? initialNahCount;
  const mehCount = record?.mehCount ?? initialMehCount;
  const userVote = record?.userVote ?? null;

  // iOS app's score calculation
  const balance = moreCount - nahCount;
  const score = Math.max(0, (moreCount * 2) - nahCount);

  const handleVote = (isMore: boolean) => {
    if (userVote) return; // One vote per user (privacy-first)
    
    const newMoreCount = isMore ? moreCount + 1 : moreCount;
    const newNahCount = isMore ? nahCount : nahCount + 1;
    const newMehCount = isMore ? mehCount : mehCount + 2;
    const vote = isMore ? 'more' : 'nah';
    
    const newRecord: VoteRecord = {
      userVote: vote,
      moreCount: newMoreCount,
      nahCount: newNahCount,
      mehCount: newMehCount
    };
    setCastVote({ ...newRecord, unpppId });

    // Save to localStorage (local-first, no external API)
    writeLocalStorage(storageKey, JSON.stringify(newRecord));
  };

  // iOS app's color logic: green > 5, red < -5, neutral otherwise
  const balanceColor = balance > 5 ? 'text-green-400' : balance < -5 ? 'text-red-400' : 'text-gray-400';

  return (
    <div className="group flex items-center justify-between border-b border-gray-200/10 py-4 transition-colors dark:border-gray-700/10">
      {/* Content */}
      <div className="flex flex-1 flex-col gap-1">
        <div className="flex items-baseline gap-2">
          <span className="font-google-sans-code text-sm uppercase tracking-wide" style={{ color: 'var(--foreground)' }}>
            {featureName}
          </span>
          {debt !== undefined && debt > 0 && (
            <span className="font-google-sans-code text-xs text-gray-400" title="Technical debt">
              {debt}d
            </span>
          )}
          <span className={`font-google-sans-code text-xs tabular-nums ${balanceColor}`}>
            {balance > 0 ? `+${balance}` : balance}
          </span>
          {score > 50 && <span className="text-xs" title="High priority">🏆</span>}
          {score > 100 && <span className="text-xs" title="Critical priority">⭐</span>}
        </div>
        <span className="font-google-sans-code text-xs" style={{ color: 'var(--text-muted)' }}>
          {tagline || description}
        </span>
      </div>

      {/* Voting Actions - iOS binary pattern */}
      {!userVote ? (
        <div className="flex gap-2">
          <button
            onClick={() => handleVote(true)}
            className="flex items-center gap-1 rounded border border-green-500/20 px-3 py-1 font-google-sans-code text-xs uppercase tracking-wide text-green-400 transition-all hover:border-green-500/40 hover:bg-green-500/10"
            aria-label="Vote yes, high interest"
          >
            <span>🪩</span>
            <span className="tabular-nums">{moreCount}</span>
          </button>
          <button
            onClick={() => handleVote(false)}
            className="flex items-center gap-1 rounded border border-red-500/20 px-3 py-1 font-google-sans-code text-xs uppercase tracking-wide text-red-400 transition-all hover:border-red-500/40 hover:bg-red-500/10"
            aria-label="Vote meh, low interest"
          >
            <span>🟡</span>
            <span className="tabular-nums">{mehCount}</span>
          </button>
          <button
            onClick={() => handleVote(false)}
            className="flex items-center gap-1 rounded border border-red-500/20 px-3 py-1 font-google-sans-code text-xs uppercase tracking-wide text-red-400 transition-all hover:border-red-500/40 hover:bg-red-500/10"
            aria-label="Vote nah, low interest"
          >
            <span>👾</span>
            <span className="tabular-nums">{nahCount}</span>
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className={`font-google-sans-code text-xs ${userVote === 'more' ? 'text-green-400' : userVote === 'meh' ? 'text-yellow-400' : 'text-red-400'}`}>
            {userVote === 'more' ? '👍 Voted' : '👎 Voted'}
          </span>
        </div>
      )}
    </div>
  );
};

export default FeatureVote;