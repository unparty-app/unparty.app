'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@/lib/auth-stub.client';
import { X } from '@/app/components/icons';
import Link from 'next/link';
import { useTheme } from '@/app/contexts/ThemeContext';
import { foundersQuestions } from '@/app/founders/foundersquestions';
import type { Question } from '@/types/questions';

interface FoundersQuestionEmbedProps {
  questionId: string;
  categoryId?: string;
}

/**
 * FoundersQuestionEmbed Component
 * 
 * Universal component for embedding founder questions in editorial stories.
 * Loads questions from foundersquestions.json and persists answers to database.
 * 
 * Supports all question types: text, multipleChoice, ranking, scale.
 * Questions visible to all, but answering requires authentication.
 * 
 * Database Integration:
 * - Authenticated users: Saves to database via /api/questions
 * - Triggers step completion check after submission
 * - Loads existing answers from database first, falls back to localStorage
 * - Unauthenticated users: Falls back to localStorage only
 * - Maintains localStorage backup for offline functionality
 */
// Starting answer for an unanswered question, by question type
function defaultAnswerFor(question: Question): string | string[] | number {
  if (question.type === 'ranking') return [];
  if (question.type === 'scale') return question.scaleMin ?? 0;
  return '';
}

export default function FoundersQuestionEmbed({ 
  questionId, 
  categoryId = 'core' 
}: FoundersQuestionEmbedProps) {
  const { isSignedIn } = useUser();
  const { colorValue } = useTheme();
  const [question, setQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState<string | string[] | number>('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load question from JSON and check database/localStorage for saved answer
  useEffect(() => {
    const loadQuestion = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Find question in JSON file by category and questionId
        const category = foundersQuestions.categories.find(
          (cat) => cat.id === categoryId
        );
        
        if (!category) {
          throw new Error(`Category '${categoryId}' not found`);
        }
        
        const foundQuestion = category.questions.find(
          (q) => q.id === questionId
        );
        
        if (!foundQuestion) {
          throw new Error(`Question '${questionId}' not found in category '${categoryId}'`);
        }
        
        // Question is already properly typed from TypeScript data file
        setQuestion(foundQuestion);
        
        // Check database first for saved answer (if authenticated)
        if (isSignedIn) {
          try {
            const response = await fetch(`/api/questions/${questionId}/response`);
            
            if (response.ok) {
              const data = await response.json();
              if (data.response) {
                // Parse responseData based on question type
                let parsedData = data.response.responseData;
                if (foundQuestion.type === 'ranking' && typeof parsedData === 'string') {
                  parsedData = JSON.parse(parsedData);
                }
                setAnswer(parsedData);
                setSubmitted(true);
                return; // Exit early if database answer found
              }
            }
          } catch (dbError) {
            console.error('Error fetching answer from database:', dbError);
            // Fall through to check localStorage
          }
          
          // Fallback to localStorage if database doesn't have answer
          const storageKey = `founders_question_${questionId}`;
          const savedAnswer = localStorage.getItem(storageKey);
          
          if (savedAnswer) {
            try {
              const parsed = JSON.parse(savedAnswer);
              setAnswer(parsed.responseData);
              setSubmitted(true);
            } catch (parseErr) {
              console.error('Error parsing saved answer:', parseErr);
              // Set defaults on parse error
              setAnswer(defaultAnswerFor(foundQuestion));
            }
          } else {
            // No saved answer, set defaults
            setAnswer(defaultAnswerFor(foundQuestion));
          }
        } else {
          // Not signed in, set defaults
          setAnswer(defaultAnswerFor(foundQuestion));
        }
        
      } catch (err) {
        console.error('Error loading question:', err);
        setError(err instanceof Error ? err.message : 'Failed to load question');
      } finally {
        setLoading(false);
      }
    };

    loadQuestion();
  }, [questionId, categoryId, isSignedIn]);

  // Handle submitting answer to database (or localStorage for unauthenticated users)
  const handleSubmit = async () => {
    if (!question) return;

    // Validation
    if (question.type === 'text' && !answer) {
      setError('Please provide an answer');
      return;
    }
    if (question.type === 'ranking' && (!Array.isArray(answer) || answer.length === 0)) {
      setError('Please rank at least one item');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      if (isSignedIn) {
        // Save to database via API
        const response = await fetch('/api/questions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            questionId: question.id,
            responseData: question.type === 'ranking' ? JSON.stringify(answer) : answer,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to save answer to database');
        }

        // Trigger step completion check
        try {
          await fetch('/api/steps/check-completion', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ questionId: question.id }),
          });
        } catch (completionError) {
          console.error('Error checking step completion:', completionError);
          // Don't fail the submission if completion check fails
        }

        // Also save to localStorage as backup
        const storageKey = `founders_question_${question.id}`;
        const responseData = {
          questionId: question.id,
          categoryId,
          responseData: answer,
          completedAt: new Date().toISOString(),
        };
        localStorage.setItem(storageKey, JSON.stringify(responseData));

      } else {
        // Not signed in - save to localStorage only
        const storageKey = `founders_question_${question.id}`;
        const responseData = {
          questionId: question.id,
          categoryId,
          responseData: answer,
          completedAt: new Date().toISOString(),
        };
        localStorage.setItem(storageKey, JSON.stringify(responseData));
      }

      // Small delay for visual feedback
      setTimeout(() => {
        setSubmitted(true);
        setSubmitting(false);
      }, 300);
    } catch (err) {
      console.error('Error submitting answer:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit answer');
      setSubmitting(false);
    }
  };

  // Update ranking answer
  const updateRankingAnswer = (newRanking: string[]) => {
    setAnswer(newRanking);
  };

  // Loading state
  if (loading) {
    return (
      <div className="my-8 rounded-xl border-2 p-8 text-center" style={{ borderColor: `${colorValue}20` }}>
        <div className="size-8 animate-spin rounded-full border-4 border-border border-t-current mx-auto" style={{ color: colorValue }} />
      </div>
    );
  }

  // Error state
  if (error && !question) {
    return (
      <div className="my-8 rounded-xl border-2 border-red-200/20 bg-red-50/20 p-6 dark:border-red-700/20 dark:bg-red-900/5">
        <p className="font-google-sans-code text-sm text-red-600 dark:text-red-400">
          {error || '👾 oh no, nothing here. unparty-app is MEH!'}
        </p>
      </div>
    );
  }

  if (!question) {
    return null;
  }

  // Not signed in state - Show question but gate interaction
  if (!isSignedIn) {
    return (
      <div className="my-8 rounded-xl border-2 p-8 text-center" style={{ borderColor: `${colorValue}20`, backgroundColor: `${colorValue}05` }}>
        <div className="mb-4 flex justify-center">
          <div className="flex size-12 items-center justify-center rounded-full" style={{ backgroundColor: colorValue }}>
            <span className="text-2xl">🔒</span>
          </div>
        </div>
        <h3 className="mb-2 font-vt323 text-lg uppercase font-bold" style={{ color: 'var(--foreground)' }}>
          Sign in to PARTY.
        </h3>
        <p className="mb-6 font-google-sans-code text-sm" style={{ color: 'var(--text-muted)' }}>
          {question.text}
        </p>
        <Link
          href="/sign-in"
          className="inline-block rounded-lg px-6 py-3 font-google-sans-code text-sm font-bold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: colorValue }}
        >
          Sign In
        </Link>
      </div>
    );
  }

  // Submitted state
  if (submitted) {
    return (
      <div className="my-8 rounded-xl border-2 p-6" style={{ borderColor: colorValue, backgroundColor: `${colorValue}10` }}>
        {/* Success Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: colorValue }}>
            <svg
              className="size-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-google-sans-code text-base font-bold uppercase tracking-wide" style={{ color: colorValue }}>
              ANSWER SAVED.
            </h3>
          </div>
        </div>

        {/* Question Reference */}
        <p className="mb-4 font-google-sans-code text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
          {question.text}
        </p>

        {/* Display answer based on type */}
        <div className="mb-6">
          {question.type === 'ranking' && Array.isArray(answer) && (
            <div className="space-y-2">
              {answer.map((choice, index) => (
                <div
                  key={`submitted-${index}`}
                  className="flex items-center gap-3 rounded-lg border bg-white/70 p-3 dark:bg-white/10"
                  style={{ borderColor: `${colorValue}20` }}
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full font-google-sans-code text-sm font-bold text-white" style={{ backgroundColor: colorValue }}>
                    {index + 1}
                  </span>
                  <span className="font-google-sans-code text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                    {choice}
                  </span>
                </div>
              ))}
            </div>
          )}
          
          {question.type === 'text' && (
            <div className="rounded-lg border bg-white/70 p-4 dark:bg-white/10" style={{ borderColor: `${colorValue}20` }}>
              <p className="font-google-sans-code text-sm whitespace-pre-wrap" style={{ color: 'var(--foreground)' }}>
                {answer as string}
              </p>
            </div>
          )}
          
          {question.type === 'multipleChoice' && (
            <div className="rounded-lg border bg-white/70 p-4 dark:bg-white/10" style={{ borderColor: `${colorValue}20` }}>
              <p className="font-google-sans-code text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                {answer as string}
              </p>
            </div>
          )}
          
          {question.type === 'scale' && (
            <div className="text-center">
              <div className="font-google-sans-code text-4xl font-bold tabular-nums" style={{ color: colorValue }}>
                {question.scalePrefix}{typeof answer === 'number' ? answer.toFixed(question.scaleStep && question.scaleStep < 1 ? 1 : 0) : answer}{question.scaleSuffix}
              </div>
            </div>
          )}
        </div>

        {/* Edit Option */}
        <button
          onClick={() => setSubmitted(false)}
          className="mt-2 font-google-sans-code text-xs uppercase tracking-widest transition-colors"
          style={{ '--hover-color': colorValue, color: 'var(--text-muted)' } as React.CSSProperties}
          onMouseEnter={(e) => e.currentTarget.style.color = colorValue}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          ← EDIT
        </button>
      </div>
    );
  }

  // Interactive state - Render based on question type
  return (
    <div className="my-8 rounded-xl border-2 p-6" style={{ borderColor: `${colorValue}40`, backgroundColor: `${colorValue}05` }}>
      {/* Question Header */}
      <div className="mb-6">
        <h3 className="font-google-sans-code text-base font-bold uppercase tracking-wide mb-2" style={{ color: colorValue }}>
          FOUNDER QUESTION
        </h3>
        <p className="font-google-sans-code text-sm leading-relaxed" style={{ color: 'var(--foreground)' }}>
          {question.text}
        </p>
      </div>

      {/* Render input based on type */}
      <div className="mb-6">
        {question.type === 'text' && (
          <textarea
            value={answer as string}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Share your thoughts..."
            className="w-full min-h-[160px] p-4 rounded-xl border-2 border-border bg-background-highlight focus:border-[#F9C22E] focus:ring-4 focus:ring-[#F9C22E]/20 transition-all duration-200 resize-none font-google-sans-code text-sm leading-relaxed"
            style={{ color: 'var(--foreground)' }}
          />
        )}

        {question.type === 'multipleChoice' && (
          <div className="space-y-3">
            {question.choices?.map((choice, index) => (
              <button
                key={index}
                onClick={() => setAnswer(choice)}
                className={`w-full p-4 text-left rounded-xl border-2 transition-colors duration-200 font-google-sans-code text-sm ${
                  answer === choice
                    ? 'border-[#F9C22E] bg-[#F9C22E]/5'
                    : 'border-border hover:bg-background-highlight'
                }`}
                style={{ color: 'var(--foreground)' }}
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ${
                    answer === choice
                      ? 'border-[#F9C22E] bg-[#F9C22E]'
                      : 'border-border'
                  }`} />
                  <span className="leading-relaxed">{choice}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {question.type === 'ranking' && (
          <div className="space-y-6">
            {/* Ranked items */}
            {Array.isArray(answer) && answer.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-google-sans-code text-xs uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>
                  Your Ranking (click to remove)
                </h4>
                {answer.map((choice, index) => (
                  <div
                    key={`ranked-${index}`}
                    className="flex items-center space-x-4 p-3 bg-[#F9C22E]/5 border-2 border-[#F9C22E]/20 rounded-xl"
                  >
                    <span className="w-7 h-7 bg-[#F9C22E] text-white font-google-sans-code text-sm font-bold rounded-full flex items-center justify-center flex-shrink-0">
                      {index + 1}
                    </span>
                    <span className="font-google-sans-code text-sm leading-relaxed flex-1" style={{ color: 'var(--foreground)' }}>{choice}</span>
                    <button
                      onClick={() => {
                        const newRanking = Array.isArray(answer) ? answer.filter((_, i) => i !== index) : [];
                        updateRankingAnswer(newRanking);
                      }}
                      className="ml-auto transition-opacity hover:opacity-70 p-2"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Available choices */}
            {question.choices && question.choices.filter(choice => 
              !Array.isArray(answer) || !answer.includes(choice)
            ).length > 0 && (
              <div className="space-y-3">
                <h4 className="font-google-sans-code text-xs uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>
                  Available Options (click to rank)
                </h4>
                {question.choices.filter(choice => 
                  !Array.isArray(answer) || !answer.includes(choice)
                ).map((choice, index) => (
                  <button
                    key={`available-${index}`}
                    onClick={() => {
                      const newRanking = Array.isArray(answer) ? [...answer, choice] : [choice];
                      updateRankingAnswer(newRanking);
                    }}
                    className="w-full p-4 text-left border-2 border-border rounded-xl hover:bg-background-highlight transition-colors duration-200 font-google-sans-code text-sm"
                    style={{ color: 'var(--foreground)' }}
                  >
                    <span className="leading-relaxed">{choice}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {question.type === 'scale' && (
          <div className="space-y-6">
            {/* Current value display */}
            <div className="text-center">
              <div className="font-google-sans-code text-5xl sm:text-6xl font-bold tabular-nums" style={{ color: colorValue }}>
                {question.scalePrefix}{typeof answer === 'number' ? answer.toFixed(question.scaleStep && question.scaleStep < 1 ? 1 : 0) : answer}{question.scaleSuffix}
              </div>
            </div>

            {/* Slider with visual fill */}
            <div className="relative">
              <input
                type="range"
                min={question.scaleMin ?? 0}
                max={question.scaleMax ?? 100}
                step={question.scaleStep ?? 1}
                value={typeof answer === 'number' ? answer : 0}
                onChange={(e) => setAnswer(parseFloat(e.target.value))}
                className="w-full h-4 cursor-pointer appearance-none rounded-full transition-all"
                style={{
                  background: `linear-gradient(to right, ${colorValue} 0%, ${colorValue} ${((Number(answer) - (question.scaleMin ?? 0)) / ((question.scaleMax ?? 100) - (question.scaleMin ?? 0))) * 100}%, rgba(209, 213, 219, 0.3) ${((Number(answer) - (question.scaleMin ?? 0)) / ((question.scaleMax ?? 100) - (question.scaleMin ?? 0))) * 100}%, rgba(209, 213, 219, 0.3) 100%)`
                }}
              />

              {/* Custom slider styling */}
              <style jsx>{`
                input[type="range"]::-webkit-slider-thumb {
                  appearance: none;
                  width: 28px;
                  height: 28px;
                  border-radius: 50%;
                  background: ${colorValue};
                  cursor: pointer;
                  border: 3px solid white;
                  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
                  transition: transform 0.15s ease;
                }

                input[type="range"]::-webkit-slider-thumb:hover {
                  transform: scale(1.15);
                }

                input[type="range"]::-webkit-slider-thumb:active {
                  transform: scale(1.05);
                }

                input[type="range"]::-moz-range-thumb {
                  width: 28px;
                  height: 28px;
                  border-radius: 50%;
                  background: ${colorValue};
                  cursor: pointer;
                  border: 3px solid white;
                  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
                  transition: transform 0.15s ease;
                }

                input[type="range"]::-moz-range-thumb:hover {
                  transform: scale(1.15);
                }

                input[type="range"]::-moz-range-thumb:active {
                  transform: scale(1.05);
                }
              `}</style>
            </div>

            {/* Min/Max labels */}
            <div className="flex justify-between font-google-sans-code text-xs" style={{ color: 'var(--text-muted)' }}>
              <span>{question.scalePrefix}{question.scaleMin ?? 0}{question.scaleSuffix}</span>
              <span>{question.scalePrefix}{question.scaleMax ?? 100}{question.scaleSuffix}</span>
            </div>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 rounded-lg border-2 border-red-200/20 bg-red-50/20 p-3 dark:border-red-700/20 dark:bg-red-900/5">
          <p className="font-google-sans-code text-xs text-red-600 dark:text-red-400">
            {error}
          </p>
        </div>
      )}

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full rounded-lg px-6 py-3 font-google-sans-code text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        style={{ backgroundColor: colorValue }}
      >
        {submitting ? 'SUBMITTING...' : 'SUBMIT ANSWER'}
      </button>
    </div>
  );
}
