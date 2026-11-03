'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useUser } from '@/lib/auth-stub.client'
import { useTheme } from '../contexts/ThemeContext'

export interface StepQuestionData {
  id: string
  text: string
  type: 'TEXT' | 'MULTIPLE_CHOICE' | 'RANKING' | 'SCALE'
  choices: string[]
}

interface StepQuestionProps {
  question: StepQuestionData
}

type ResponseData = string | string[] | number | null

/**
 * A single Step question, answerable inline wherever a Step is rendered
 * (StepModal / EmbeddableStepCard / EmbeddableStepScroll's modal). Same
 * sign-in-gated submit pattern as EditorialRanking/EditorialText — anyone
 * can interact, only a signed-in user can save (POST /api/questions),
 * which also drives the existing step-completion check for question-based
 * steps server-side.
 */
export default function StepQuestion({ question }: StepQuestionProps) {
  const { isSignedIn } = useUser()
  const { colorValue } = useTheme()
  // Which question's saved response has finished loading (loading until it matches)
  const [loadedQuestionId, setLoadedQuestionId] = useState<string | null>(null)
  const loadingExisting = Boolean(isSignedIn) && loadedQuestionId !== question.id
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [text, setText] = useState('')
  const [choice, setChoice] = useState<string | null>(null)
  const [ranking, setRanking] = useState<string[]>([])
  const [scale, setScale] = useState<number | null>(null)

  useEffect(() => {
    if (!isSignedIn) return
    let cancelled = false
    fetch(`/api/questions/${question.id}/response`)
      .then(res => (res.ok ? res.json() : { response: null }))
      .then(data => {
        if (cancelled || !data.response) return
        const rd = data.response.responseData
        if (question.type === 'TEXT' && typeof rd === 'string') setText(rd)
        else if (question.type === 'MULTIPLE_CHOICE' && typeof rd === 'string') setChoice(rd)
        else if (question.type === 'RANKING' && Array.isArray(rd)) setRanking(rd)
        else if (question.type === 'SCALE') setScale(typeof rd === 'number' ? rd : Number(rd) || null)
        setSubmitted(true)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadedQuestionId(question.id)
      })
    return () => {
      cancelled = true
    }
  }, [question.id, question.type, isSignedIn])

  const responseData: ResponseData =
    question.type === 'TEXT' ? text
      : question.type === 'MULTIPLE_CHOICE' ? choice
        : question.type === 'RANKING' ? ranking
          : scale

  const hasAnswer =
    question.type === 'RANKING' ? ranking.length > 0
      : question.type === 'TEXT' ? text.trim().length > 0
        : responseData !== null

  const markUnsaved = () => setSubmitted(false)

  const handleSubmit = async () => {
    if (!hasAnswer) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: question.id, responseData }),
      })
      if (!res.ok) throw new Error('Failed to save response')
      setSubmitted(true)
    } catch {
      setError('Failed to save response')
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingExisting) {
    return <div className="my-3 h-20 animate-pulse rounded-lg" style={{ backgroundColor: 'var(--background-highlight)' }} />
  }

  return (
    <div className="my-3 rounded-lg border p-4" style={{ borderColor: `${colorValue}20`, backgroundColor: `${colorValue}05` }}>
      <p className="mb-3 font-google-sans-code text-sm font-bold" style={{ color: 'var(--foreground)' }}>
        {question.text}
      </p>

      {question.type === 'MULTIPLE_CHOICE' && (
        <div className="space-y-2">
          {question.choices.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => {
                setChoice(c)
                markUnsaved()
              }}
              className="block w-full rounded-lg border-2 p-3 text-left font-google-sans-code text-sm transition-colors"
              style={{ borderColor: choice === c ? colorValue : `${colorValue}20`, color: 'var(--foreground)' }}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {question.type === 'RANKING' && (
        <div className="space-y-2">
          {ranking.map((c, i) => (
            <div key={c} className="flex items-center gap-2 rounded-lg border p-2 font-google-sans-code text-sm" style={{ borderColor: `${colorValue}30` }}>
              <span className="font-bold" style={{ color: colorValue }}>{i + 1}</span>
              <span className="flex-1" style={{ color: 'var(--foreground)' }}>{c}</span>
              <button
                type="button"
                aria-label="Remove from ranking"
                onClick={() => {
                  setRanking(ranking.filter(x => x !== c))
                  markUnsaved()
                }}
                className="font-google-sans-code"
                style={{ color: 'var(--text-muted)' }}
              >
                ×
              </button>
            </div>
          ))}
          {question.choices.filter(c => !ranking.includes(c)).map(c => (
            <button
              key={c}
              type="button"
              onClick={() => {
                setRanking([...ranking, c])
                markUnsaved()
              }}
              className="block w-full rounded-lg border-2 p-3 text-left font-google-sans-code text-sm"
              style={{ borderColor: `${colorValue}20`, color: 'var(--foreground)' }}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {question.type === 'TEXT' && (
        <textarea
          value={text}
          onChange={e => {
            setText(e.target.value)
            markUnsaved()
          }}
          placeholder="Your answer..."
          rows={3}
          className="w-full rounded-lg border-2 p-3 font-google-sans-code text-sm"
          style={{ borderColor: `${colorValue}20`, color: 'var(--foreground)', backgroundColor: 'transparent' }}
        />
      )}

      {question.type === 'SCALE' && (
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
            <button
              key={n}
              type="button"
              onClick={() => {
                setScale(n)
                markUnsaved()
              }}
              className="flex size-8 items-center justify-center rounded-full border-2 font-vt323 text-sm"
              style={{
                borderColor: scale === n ? colorValue : `${colorValue}20`,
                backgroundColor: scale === n ? colorValue : 'transparent',
                color: scale === n ? '#fff' : 'var(--foreground)',
              }}
            >
              {n}
            </button>
          ))}
        </div>
      )}

      {error && (
        <p className="mt-2 font-google-sans-code text-xs" style={{ color: '#ef4444' }}>
          {error}
        </p>
      )}

      <div className="mt-3">
        {!isSignedIn ? (
          <Link
            href="/sign-in"
            className="inline-block rounded-lg px-4 py-2 font-vt323 text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: colorValue }}
          >
            Sign in to answer
          </Link>
        ) : submitted ? (
          <span className="font-vt323 text-xs uppercase tracking-wide" style={{ color: colorValue }}>
            ✓ saved
          </span>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!hasAnswer || submitting}
            className="rounded-lg px-4 py-2 font-vt323 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ backgroundColor: colorValue }}
          >
            {submitting ? 'Saving...' : 'Save'}
          </button>
        )}
      </div>
    </div>
  )
}
