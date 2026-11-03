'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@/lib/auth-stub.client';
import Link from 'next/link';
import { useTheme } from '@/app/contexts/ThemeContext';
import MissingQuestion from './MissingQuestion';

interface Question {
  id: string;
  text: string;
  type: string;
  userResponse?: {
    responseData: string;
    completedAt: string;
  };
}

interface EditorialTextProps {
  questionId: string;
  categoryId?: string;
  maxLength?: number; // Optional character limit (default: 500)
}

/**
 * EditorialText Component
 * 
 * Embeds admin-managed text questions into editorial articles.
 * Uses the same UI pattern as EditorialRanking for consistency.
 * Connects to the existing Question system and admin panel.
 * 
 * Mobile-first design with:
 * - Textarea min-height: 120px for comfortable typing
 * - Touch targets: min-h-[44px] for buttons
 * - Character count display with font-vt323
 * - Theme-aware styling with CSS variables
 */
export default function EditorialText({ questionId, categoryId = 'core', maxLength = 500 }: EditorialTextProps) {
  const { isSignedIn } = useUser();
  const { colorValue } = useTheme();
  const [question, setQuestion] = useState<Question | null>(null);
  const [textInput, setTextInput] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Why the question didn't load: MissingQuestion shows it to the owner only
  const [missing, setMissing] = useState<string | null>(null);

  // Fetch question data
  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        setLoading(true);
        setError(null);
        setMissing(null);
        
        // Fetch questions from the category and find the specific one
        const response = await fetch(`/api/questions?category=${categoryId}`);
        if (!response.ok) {
          throw new Error("couldn't be loaded");
        }
        
        const data = await response.json();
        const foundQuestion = data.questions.find((q: Question) => q.id === questionId);
        
        if (!foundQuestion) {
          throw new Error("isn't in your database yet");
        }
        
        if (foundQuestion.type !== 'text') {
          throw new Error("isn't a text question");
        }
        
        setQuestion(foundQuestion);
        
        // Set initial text if user has already responded
        if (foundQuestion.userResponse?.responseData) {
          setTextInput(foundQuestion.userResponse.responseData);
          setSubmitted(true);
        }
        
      } catch (err) {
        setMissing(err instanceof Error ? err.message : "couldn't be loaded");
      } finally {
        setLoading(false);
      }
    };

    fetchQuestion();
  }, [questionId, categoryId, isSignedIn]);

  // Handle submitting text response
  const handleSubmit = async () => {
    if (!question || textInput.trim().length === 0) return;

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionId: question.id,
          responseData: textInput.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit response');
      }

      setSubmitted(true);
    } catch (err) {
      console.error('Error submitting response:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit response');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle clearing input (ESC key)
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitted) {
        setTextInput('');
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [submitted]);

  // Calculate character count and remaining
  const charCount = textInput.length;
  const charsRemaining = maxLength - charCount;
  const isOverLimit = charCount > maxLength;

  // Loading state
  if (loading) {
    return (
      <div className="my-8 rounded-xl border-2 border-border p-8 text-center">
        <div className="inline-block size-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" 
             style={{ borderColor: colorValue, borderRightColor: 'transparent' }}
        />
        <p className="mt-4 font-google-sans-code text-sm" style={{ color: 'var(--text-muted)' }}>thinking...</p>
      </div>
    );
  }

  if (missing) return <MissingQuestion questionId={questionId} reason={missing} />;

  // Error state - theme-aware styling
  if (error || !question) {
    return (
      <div className="my-8 rounded-xl border-2 p-6" style={{ borderColor: `${colorValue}20`, backgroundColor: `${colorValue}05` }}>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: `${colorValue}40` }}>
            <span className="text-xl">⚠️</span>
          </div>
          <h3 className="font-google-sans-code text-sm font-bold uppercase tracking-wide" style={{ color: colorValue }}>
            ERROR
          </h3>
        </div>
        <p className="font-google-sans-code text-sm" style={{ color: 'var(--text-muted)' }}>
          {error || '👾 oh no, nothing here. unparty-app is MEH!'}
        </p>
      </div>
    );
  }

  // Submitted state
  if (submitted) {
    return (
      <div className="my-8 rounded-xl border-2 p-6" style={{ borderColor: colorValue, backgroundColor: `${colorValue}10` }}>
        {/* Success Header - On Brand */}
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
              RESPONSE SAVED.
            </h3>
          </div>
        </div>

        {/* Question Reference */}
        <p className="mb-4 font-google-sans-code text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
          {question.text}
        </p>

        {/* Saved Response Display */}
        <div className="mb-6 rounded-lg border bg-white/70 p-4 dark:bg-white/10" style={{ borderColor: `${colorValue}20` }}>
          <p className="whitespace-pre-wrap font-google-sans-code text-sm leading-relaxed" style={{ color: 'var(--foreground)' }}>
            {textInput}
          </p>
        </div>

        {/* Character Count */}
        <div className="mb-4 flex items-center justify-between">
          <span className="font-vt323 text-sm" style={{ color: 'var(--text-muted)' }}>
            {charCount} character{charCount !== 1 ? 's' : ''}
          </span>
          <span className="font-vt323 text-sm" style={{ color: 'var(--text-muted)' }}>
            {textInput.split(/\s+/).filter(Boolean).length} word{textInput.split(/\s+/).filter(Boolean).length !== 1 ? 's' : ''}
          </span>
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

  // Interactive text input state
  return (
    <div className="my-8 rounded-xl border-2 p-6" style={{ borderColor: `${colorValue}20`, backgroundColor: `${colorValue}05` }}>
      {/* Question Header */}
      <div className="mb-6">
        <div className="mb-3 flex items-center gap-2">
          <div 
            className="size-2 rounded-full"
            style={{ backgroundColor: colorValue }}
          />
          <span 
            className="font-google-sans-code text-xs font-bold uppercase tracking-widest"
            style={{ color: colorValue }}
          >
            ✍️ WRITE.
          </span>
        </div>
        <h3 className="font-google-sans-code text-base font-bold" style={{ color: 'var(--foreground)' }}>
          {question.text}
        </h3>
      </div>

      <div className="space-y-4">
        {/* Text Input Area */}
        <div>
          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Type your response here..."
            className="w-full rounded-xl border-2 bg-white/70 p-5 font-google-sans-code text-sm leading-relaxed transition-colors duration-200 focus:outline-none dark:bg-white/5 sm:p-4"
            style={{ 
              borderColor: textInput.length > 0 ? `${colorValue}40` : 'transparent',
              minHeight: '120px',
              color: 'var(--foreground)',
              resize: 'vertical'
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = `${colorValue}40`}
            onBlur={(e) => e.currentTarget.style.borderColor = textInput.length > 0 ? `${colorValue}40` : 'transparent'}
          />
        </div>

        {/* Character Count Display */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span 
              className="font-vt323 text-sm"
              style={{ color: isOverLimit ? '#ef4444' : 'var(--text-muted)' }}
            >
              {charCount} / {maxLength}
            </span>
            {textInput.trim().length > 0 && (
              <span className="font-vt323 text-sm" style={{ color: 'var(--text-muted)' }}>
                {textInput.split(/\s+/).filter(Boolean).length} word{textInput.split(/\s+/).filter(Boolean).length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          {!isOverLimit && charsRemaining <= 50 && charsRemaining > 0 && (
            <span className="font-vt323 text-xs" style={{ color: 'var(--text-muted)' }}>
              {charsRemaining} remaining
            </span>
          )}
        </div>

        {/* Over Limit Warning */}
        {isOverLimit && (
          <div className="rounded-lg border-2 border-red-500/20 bg-red-50/20 p-3 dark:bg-red-900/5">
            <p className="font-google-sans-code text-xs text-red-600 dark:text-red-400">
              Response exceeds maximum length by {charCount - maxLength} character{charCount - maxLength !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {/* Submit Button / Sign-in Prompt */}
        {isSignedIn ? (
          <button
            onClick={handleSubmit}
            disabled={submitting || textInput.trim().length === 0 || isOverLimit}
            className="min-h-[44px] w-full rounded-xl px-6 py-4 font-google-sans-code text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:py-3"
            style={{ backgroundColor: colorValue }}
          >
            {submitting ? 'Saving...' : 'Save Response'}
          </button>
        ) : (
          <div className="rounded-xl border-2 p-4 text-center" style={{ borderColor: `${colorValue}20` }}>
            <p className="mb-3 font-vt323 text-sm" style={{ color: 'var(--text-muted)' }}>
              Sign in to save your response.
            </p>
            <Link
              href="/sign-in"
              className="inline-block rounded-lg px-6 py-3 font-google-sans-code text-sm font-bold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: colorValue }}
            >
              Sign In
            </Link>
          </div>
        )}

        {/* Helper Text */}
        <p className="text-center font-google-sans-code text-xs" style={{ color: 'var(--text-muted)' }}>
          Press <kbd className="rounded border px-1.5 py-0.5 font-vt323 text-xs" style={{ borderColor: `${colorValue}20` }}>ESC</kbd> to clear
        </p>
      </div>
    </div>
  );
}
