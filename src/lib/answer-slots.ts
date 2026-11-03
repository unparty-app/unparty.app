// The challenge's three questions (#265): plain data, so server routes can read
// them without the tab's store (src/lib/challenge-answers.ts)

export const ANSWER_SLOTS = [
  { id: 'about', label: 'ABOUT.', prompt: 'What is your problem?' },
  { id: 'build', label: 'BUILD.', prompt: 'What is your solution?' },
  { id: 'connect', label: 'CONNECT.', prompt: 'What do you need?' },
] as const;

export type AnswerSlot = (typeof ANSWER_SLOTS)[number]['id'];

/** The longest answer, the same limit as a Thought */
export const MAX_ANSWER_LENGTH = 1000;
