'use client';

import { useState } from 'react';

const LiveScale = () => {
  const [currentValue, setCurrentValue] = useState(5);
  const [votes, setVotes] = useState<number[]>([]);
  const average = votes.length > 0 ? votes.reduce((a, b) => a + b, 0) / votes.length : 0;

  const handleVote = () => {
    setVotes(prev => [...prev, currentValue]);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black p-6 font-google-sans-code text-white">
      {/* Current value display */}
      <div className="mb-12 text-8xl font-bold tabular-nums">
        {currentValue.toFixed(1)}
      </div>

      {/* Slider */}
      <input
        type="range"
        min="1"
        max="10"
        step="0.1"
        value={currentValue}
        onChange={(e) => setCurrentValue(parseFloat(e.target.value))}
        className="mb-8 h-2 w-full max-w-md cursor-pointer appearance-none rounded-lg bg-gray-700"
      />

      {/* Submit button */}
      <button
        onClick={handleVote}
        className="mb-12 rounded-full bg-white px-8 py-3 font-google-sans-code text-lg text-black transition-colors hover:bg-gray-200"
      >
        SUBMIT
      </button>

      {/* Results */}
      {votes.length > 0 && (
        <div className="space-y-2 text-center">
          <div className="text-4xl tabular-nums">{average.toFixed(1)}</div>
          <div className="text-sm text-gray-500">
            {votes.length} vote{votes.length !== 1 ? 's' : ''}
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {votes.map((vote, index) => (
              <span key={index} className="rounded bg-gray-800 px-2 py-1 text-sm">
                {vote.toFixed(1)}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveScale;