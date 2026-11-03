'use client';

import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown } from '@/app/components/icons';

interface ComponentVotes {
  id: string;
  upvotes: number;
  downvotes: number;
  hasVoted: 'up' | 'down' | null;
}

const ComponentContainer = ({ children }: { children: React.ReactNode }) => {
  // Keyed by component id; components nobody has voted on read as zero
  const [votes, setVotes] = useState<Record<string, ComponentVotes>>({});

  const handleVote = (componentId: string, voteType: 'up' | 'down') => {
    setVotes(prevVotes => {
      const vote = prevVotes[componentId] ?? { id: componentId, upvotes: 0, downvotes: 0, hasVoted: null };
      // Remove previous vote if exists
      const newUpvotes = vote.hasVoted === 'up' ? vote.upvotes - 1 : vote.upvotes;
      const newDownvotes = vote.hasVoted === 'down' ? vote.downvotes - 1 : vote.downvotes;
      // Clicking the same vote again withdraws it; otherwise add the new vote
      const withdrawing = vote.hasVoted === voteType;
      return {
        ...prevVotes,
        [componentId]: {
          ...vote,
          upvotes: voteType === 'up' && !withdrawing ? newUpvotes + 1 : newUpvotes,
          downvotes: voteType === 'down' && !withdrawing ? newDownvotes + 1 : newDownvotes,
          hasVoted: withdrawing ? null : voteType
        }
      };
    });
  };

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-6">
      <div className="rounded-lg border bg-white shadow-sm">
        <div className="border-b bg-gray-50 p-4">
          <h2 className="text-lg font-medium text-gray-800">Component Library</h2>
          <p className="text-sm text-gray-600">Vote and interact with available components</p>
        </div>

        <div className="divide-y">
          {React.Children.map(children, (child, index) => {
            const componentId = `component-${index}`;
            const componentVotes = votes[componentId] ?? {
              upvotes: 0,
              downvotes: 0,
              hasVoted: null
            };

            return (
              <div key={componentId} className="group">
                <div className="flex items-center justify-between bg-white p-4 transition-colors hover:bg-gray-50">
                  {/* Component Content */}
                  <div className="grow">
                    {child}
                  </div>

                  {/* Voting Controls */}
                  <div className="ml-4 flex items-center space-x-6 px-4">
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVote(componentId, 'up');
                        }}
                        className={`rounded p-1 transition-colors hover:bg-gray-100 ${
                          componentVotes.hasVoted === 'up' ? 'text-green-600' : 'text-gray-400'
                        }`}
                      >
                        <ThumbsUp className="size-5" />
                      </button>
                      <span className="text-sm text-gray-600">{componentVotes.upvotes}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVote(componentId, 'down');
                        }}
                        className={`rounded p-1 transition-colors hover:bg-gray-100 ${
                          componentVotes.hasVoted === 'down' ? 'text-red-600' : 'text-gray-400'
                        }`}
                      >
                        <ThumbsDown className="size-5" />
                      </button>
                      <span className="text-sm text-gray-600">{componentVotes.downvotes}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ComponentContainer;