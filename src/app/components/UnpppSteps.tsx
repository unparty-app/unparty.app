'use client'

import { useEffect, useState } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import StepModal, { type StepModalStep, type StepModalUnppp } from './StepModal'

interface UnpppStepsProps {
  unpppId: string
  unppp?: StepModalUnppp
}

/**
 * Public-facing onboarding steps for a single unppp — fetched from the
 * unauthenticated /api/unppp/[unpppId]/steps route (not /api/steps, which
 * requires a signed-in user and would 401 on these public showcase pages).
 */
export default function UnpppSteps({ unpppId, unppp }: UnpppStepsProps) {
  const { colorValue } = useTheme()
  const [steps, setSteps] = useState<(StepModalStep & { id: string })[]>([])
  const [openStep, setOpenStep] = useState<StepModalStep | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/unppp/${unpppId}/steps`)
      .then(res => (res.ok ? res.json() : { steps: [] }))
      .then(data => {
        if (!cancelled) setSteps(data.steps ?? [])
      })
      .catch(() => {
        if (!cancelled) setSteps([])
      })
    return () => {
      cancelled = true
    }
  }, [unpppId])

  if (steps.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      {steps.map(step => (
        <button
          key={step.id}
          type="button"
          onClick={() => setOpenStep(step)}
          className="flex items-center gap-2 rounded-full border px-3 py-1.5 font-google-sans-code text-sm transition-opacity hover:opacity-70"
          style={{ borderColor: `${colorValue}40`, color: 'var(--foreground)' }}
        >
          {step.icon && <span className="leading-none">{step.icon}</span>}
          {step.title}
        </button>
      ))}
      <StepModal step={openStep} unppp={unppp} onClose={() => setOpenStep(null)} />
    </div>
  )
}
