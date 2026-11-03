'use client';

import React, { useState } from 'react';

interface Milestone {
  id: number;
  title: string;
  description: string;
  date: string;
  completed: boolean;
}

const milestones: Milestone[] = [
  { id: 1, title: 'ABOUT.', description: 'you should know enough to search for solutions.', date: '2023-01-15', completed: true },
  { id: 2, title: 'BUILD.', description: 'you should know enough to share your solutions.', date: '2023-04-10', completed: false },
  { id: 3, title: 'CONNECT.', description: 'you should know enough to connect with those searching for your problems.', date: '2023-08-30', completed: false },
];

const ProgressTracker: React.FC = () => {
  const [milestoneData, setMilestoneData] = useState(milestones);

  const toggleCompletion = (id: number) => {
    setMilestoneData((prev) =>
      prev.map((milestone) =>
        milestone.id === id ? { ...milestone, completed: !milestone.completed } : milestone
      )
    );
  };

  return (
    <div className="mx-auto max-w-xl rounded-lg  p-6  shadow-lg">
      <h2 className="mb-4 text-2xl font-bold">PROGRESS.</h2>
      <div className="space-y-4">
        {milestoneData.map((milestone) => (
          <div
            key={milestone.id}
            className={`border p-4 ${milestone.completed ? 'border-green-500' : 'border-gray-500'} rounded-md`}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">{milestone.title}</h3>
              <button
                onClick={() => toggleCompletion(milestone.id)}
                className={`text-sm ${milestone.completed ? 'text-green-400' : 'text-gray-400'} hover:underline`}
              >
                {milestone.completed ? 'Completed' : 'Mark as Complete'}
              </button>
            </div>
            <p className="text-gray-300">{milestone.description}</p>
            <p className="text-sm text-gray-400">Date: {milestone.date}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-lg  p-4">
        <h4 className="mb-2 text-lg font-semibold">Readiness Checklist</h4>
        <ul className="space-y-2">
          <li className="flex items-center">
            <input type="checkbox" className="mr-2" />
            <label>Do I have the resources I need to execute this?</label>
          </li>
          <li className="flex items-center">
            <input type="checkbox" className="mr-2" />
            <label>Am I prepared for any obstacles ahead?</label>
          </li>
          <li className="flex items-center">
            <input type="checkbox" className="mr-2" />
            <label>Is my project aligned with my long-term goals?</label>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default ProgressTracker;