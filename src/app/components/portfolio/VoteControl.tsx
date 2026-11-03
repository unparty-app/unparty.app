'use client';

import { InkCircle } from '../depend/ink';
import type { ComponentVote } from './useComponentVotes';

const CHOICES: { id: ComponentVote; label: string; hint: string }[] = [
  { id: 'more', label: 'MORE.', hint: 'I want to make this mine' },
  { id: 'meh', label: 'MEH.', hint: 'maybe later' },
  { id: 'nah', label: 'NAH.', hint: 'not for me' },
];

interface VoteControlProps {
  name: string; // For the buttons' labels
  value?: ComponentVote;
  onVote: (choice: ComponentVote) => void;
  color: string;
}

/**
 * MORE. / MEH. / NAH. for one component, the chosen one circled in pen.
 * Choosing it again takes the vote back.
 */
export default function VoteControl({ name, value, onVote, color }: VoteControlProps) {
  return (
    <span className="inline-flex items-center gap-3" role="group" aria-label={`your vote on ${name}`}>
      {CHOICES.map((choice) => {
        const chosen = value === choice.id;
        return (
          <button
            key={choice.id}
            type="button"
            onClick={() => onVote(choice.id)}
            aria-pressed={chosen}
            aria-label={`${choice.label} ${choice.hint}`}
            title={choice.hint}
            className="relative px-1 font-vt323 text-lg leading-none transition-opacity hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
            style={{ color, opacity: chosen ? 1 : 0.55, outlineColor: color }}
          >
            {choice.label}
            {chosen && <InkCircle key={choice.id} color={color} className="absolute -inset-x-1.5 -inset-y-1 h-[calc(100%+0.5rem)] w-[calc(100%+0.75rem)]" />}
          </button>
        );
      })}
    </span>
  );
}
