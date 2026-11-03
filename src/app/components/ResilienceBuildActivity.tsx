'use client';

import React, { useDeferredValue, useMemo, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import StepNumberOverlay from './editorial/StepNumberOverlay';
import { InkUnderline } from './depend/ink';
import { useSiteWords, wordField, WordField, listWords } from './YourWords';

interface Scenario {
  question: string;
  choices: {
    text: string;
    insight: string;
    outcome: string;
  }[];
}

const scenarios: Scenario[] = [
  {
    question: "You are feeling overwhelmed. What's your first step?",
    choices: [
      {
        text: "Spiral and do nothing.",
        insight: "Chill out, but let it out. Hoot and holler, do whatever you need to get by, but don't get stuck there.",
        outcome: "Track your progress, not your outcome."
      },
      {
        text: "Take a nap.",
        insight: "Stop tripping, get some rest. Your desire to prove people wrong makes you annoying and will likely lead to burnout.",
        outcome: "Create a goal and celebrate yourself every chance you get."
      }
    ]
  },
  {
    question: "Someone gives you unsolicited feedback. What is your next move?",
    choices: [
      {
        text: "Punch them in the face.",
        insight: "Do not punch anyone, you can not afford the charge. Take the truth in the feedback, throw the nonsense out.",
        outcome: "Everyone has an opinion. Not everyone thinks through their opinions. Be better than most."
      },
      {
        text: "Ignore the advice.",
        insight: "Adapting is important, but staying true to you matters too.",
        outcome: "You feel unsure, realizing the need to balance feedback with personal vision."
      }
    ]
  },
  {
    question: "Your friends make money than you. How are you feeling?",
    choices: [
      {
        text: "Meh. Capitalism is for losers.",
        insight: "You do need a plan to survive, rejecting the norm only gets you so far.",
        outcome: "Create a goal for how you can build your next step and eat."
      },
      {
        text: "Start immediately applying for a 9 to 5.",
        insight: "No one cares, pick a lane and trust your gut. Don't make your sacrifice your circle's problem.",
        outcome: "Growth takes time and resilience."
      }
    ]
  }
];

/**
 * ResilienceBuildActivity - three moments that test a builder, two ways to
 * meet each, and what each choice says back. On the page, from the left: a
 * heading with the ink underline and three hand-drawn rings for where you
 * are (each ticks once answered); the moment, and its two choices as cards
 * with a theme-color edge (side by side from a tablet up); then everything
 * you chose, its insight and its outcome. Last, YourWords' ink field: the
 * words of what you chose, next to this site's own, the ones you share lit in
 * the theme color, and a line to add your own; counted in the browser, never
 * sent (#676).
 */
const ResilienceBuilderActivity: React.FC = () => {
  const { colorValue } = useTheme();
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
  const [chosen, setChosen] = useState<number[]>([]);
  const [note, setNote] = useState('');
  const typedNote = useDeferredValue(note);
  const site = useSiteWords();
  const activityComplete = chosen.length === scenarios.length;
  // Your words: the choices you made and what they said back, then your own
  const { field, shared } = useMemo(() => {
    const picked = chosen.map((c, i) => {
      const choice = scenarios[i].choices[c];
      return `${choice.text} ${choice.insight} ${choice.outcome}`;
    });
    return wordField(site, `${picked.join(' ')} ${typedNote}`);
  }, [site, chosen, typedNote]);

  const handleChoice = (choiceIndex: number) => {
    setChosen((prev) => [...prev, choiceIndex]);
    if (currentScenarioIndex < scenarios.length - 1) setCurrentScenarioIndex(currentScenarioIndex + 1);
  };
  const startOver = () => {
    setChosen([]);
    setNote('');
    setCurrentScenarioIndex(0);
  };
  const edge = `${colorValue}40`;

  return (
    <div className="w-full text-left">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-vt323 text-4xl uppercase leading-none text-[var(--foreground)]">resilience.</h2>
          <InkUnderline color={colorValue} className="mt-1 h-2 w-28" />
        </div>
        {/* Where you are: a ring a moment, ticked once answered */}
        <ol className="flex items-center gap-2" aria-label="Your progress">
          {scenarios.map((_, i) => {
            const done = i < chosen.length;
            const here = !activityComplete && i === currentScenarioIndex;
            return (
              <li key={i} className="relative size-7" aria-current={here ? 'step' : undefined}>
                <StepNumberOverlay number={done ? '✓' : i + 1} colorValue={colorValue} weight={done || here ? 'bold' : 'thin'} className="h-full w-full" />
                <span className="sr-only">{done ? `moment ${i + 1}, answered` : `moment ${i + 1}`}</span>
              </li>
            );
          })}
        </ol>
      </div>

      {!activityComplete ? (
        <div key={currentScenarioIndex} className="article-view-enter mt-8">
          <p className="font-space-grotesk text-xl leading-snug text-[var(--foreground)] sm:text-2xl">{scenarios[currentScenarioIndex].question}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2" role="group" aria-label="Answer choices">
            {scenarios[currentScenarioIndex].choices.map((choice, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleChoice(index)}
                className="group flex min-h-24 items-start gap-3 rounded-xl border p-5 text-left transition-colors duration-200 hover:bg-[var(--background-highlight)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{ borderColor: edge, outlineColor: colorValue }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = colorValue; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = edge; }}
                aria-label={`Choice ${index + 1}: ${choice.text}`}
              >
                <span className="relative size-7 shrink-0">
                  <StepNumberOverlay number={index + 1} colorValue={colorValue} weight="thin" className="h-full w-full" />
                </span>
                <span className="pt-0.5 font-space-grotesk text-base leading-snug text-[var(--foreground)]">{choice.text}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="article-view-enter mt-8">
          <ul className="space-y-6" aria-label="Your insights and outcomes">
            {chosen.map((choiceIndex, i) => {
              const scenario = scenarios[i];
              const choice = scenario.choices[choiceIndex];
              return (
                <li key={i} className="border-t pt-5" style={{ borderColor: edge }}>
                  <p className="font-google-sans-code text-[10px] uppercase tracking-wide text-[var(--text-muted)]">{scenario.question}</p>
                  <p className="mt-1 font-vt323 text-xl uppercase leading-none" style={{ color: colorValue }}>{choice.text}</p>
                  <p className="mt-3 font-space-grotesk text-base leading-relaxed text-[var(--foreground)]">{choice.insight}</p>
                  <p className="mt-2 flex items-start gap-2 font-space-grotesk text-sm leading-relaxed text-[var(--text-muted)]">
                    <span className="relative mt-0.5 size-5 shrink-0">
                      <StepNumberOverlay number="✓" colorValue={colorValue} weight="thin" className="h-full w-full" />
                    </span>
                    {choice.outcome}
                  </p>
                </li>
              );
            })}
          </ul>
          <div className="mt-10">
            <p className="font-google-sans-code text-[10px] uppercase tracking-wide text-[var(--text-muted)]">your words.</p>
            <label className="relative mt-3 block">
              <span className="sr-only">in your words: what will you do on the next hard day?</span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder="and the next hard day?"
                className="w-full resize-none bg-transparent font-space-grotesk text-base leading-relaxed text-[var(--foreground)] outline-none placeholder:text-[var(--text-muted)] md:text-lg"
              />
              <InkUnderline color={colorValue} className="pointer-events-none absolute -bottom-1 left-0 h-2.5 w-2/3" />
            </label>
            <p className="mt-6 min-h-[1.5rem] font-space-grotesk text-sm leading-relaxed text-[var(--foreground)] md:text-base" role="status">
              {shared.length > 0 ? (
                <>
                  you and this site both keep coming back to <span style={{ color: colorValue }}>{listWords(shared)}</span>.
                </>
              ) : (
                <>none of these are here yet. maybe that&apos;s what you build.</>
              )}
            </p>
            <WordField field={field} writing label="your words and this site's" className="mt-6" />
          </div>
          <button type="button" onClick={startOver} className="mt-6 font-google-sans-code text-[10px] uppercase tracking-wide text-[var(--text-muted)] transition-colors hover:text-[var(--foreground)]">
            start over
          </button>
        </div>
      )}
    </div>
  );
};

export default ResilienceBuilderActivity;
