'use client';

import type { ChallengeStep } from '../constants/editorial-articles/types';
import { useTheme } from '../contexts/ThemeContext';
import ChallengeSteps from './editorial/ChallengeSteps';

const ETHOS = 'grounded in resilience, committed to real-world growth, and rooted in supporting others.';

const PILLARS: ChallengeStep[] = [
  { icon: 'Hammer', action: 'Grounded progress.', description: 'what will you build this week?', answer: true },
  { icon: 'RotateCcw', action: 'Resilience through reflection.', description: 'what setback will you learn from this week?', answer: true },
  { icon: 'Users', action: 'Community impact.', description: 'who will you support this week?', answer: true },
];

/**
 * ResilienceReflection - the ethos over three pillars, each asking for one
 * action this week. It's a challenge's steps (ChallengeSteps), so an action is
 * written on a pen line, rings its pillar's icon in ink, and rises below as
 * words. Those are the reader's own, so they join their cloud and go with their
 * worksheet, and with all three written the site's ask writes itself on.
 */
export default function ResilienceReflection() {
  const { colorValue } = useTheme();
  return (
    <div className="my-8 w-screen mx-[calc(50%-50vw)] px-4 py-8 text-left sm:px-6 lg:px-12" style={{ backgroundColor: `${colorValue}10` }}>
      <div className="mx-auto max-w-4xl">
        <ChallengeSteps steps={PILLARS} cover="cover-006" caption={ETHOS} />
      </div>
    </div>
  );
}
