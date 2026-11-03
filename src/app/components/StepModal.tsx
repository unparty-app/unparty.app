'use client'

import Image from 'next/image'
import Modal from './Modal'
import CoverVideo from './CoverVideo'
import KeywordWrapper from './KeywordWrapper'
import StepQuestion, { type StepQuestionData } from './StepQuestion'
import { resolveCoverSrc, isVideoCover } from './editorial/CoverImageBackground'
import { processInlineFormatting } from '../utils/inlineFormatting'
import { useTheme } from '../contexts/ThemeContext'

export interface StepModalStep {
  title: string
  description: string
  cover?: string | null
  icon?: string | null
  link?: string | null
  questions?: StepQuestionData[]
}

export interface StepModalUnppp {
  cover?: string | null
  coverVideo?: string | null
  color?: string | null
}

interface StepCardContentProps {
  step: StepModalStep
  unppp?: StepModalUnppp
}

/**
 * Shared step visual + copy block: title/description from the Step row, with
 * a visual that falls back in order — the step's own cover, then the related
 * unppp's Kite demo video, then the unppp's cover image, then a flat block
 * in the unppp's color. Most steps won't have their own cover, so the
 * fallback chain is the common case, not an edge case.
 *
 * Used both inside StepModal (below) and directly inline by the editorial
 * embeds (EmbeddableStepCard / EmbeddableStepScroll) that render a step
 * without a modal.
 */
export function StepCardContent({ step, unppp }: StepCardContentProps) {
  const { colorValue } = useTheme()
  const hasStepCover = Boolean(step.cover)
  const hasStepVideo = hasStepCover && isVideoCover(step.cover!)
  const hasUnpppVideo = !hasStepCover && Boolean(unppp?.coverVideo)
  const hasUnpppCover = !hasStepCover && !hasUnpppVideo && Boolean(unppp?.cover)
  const flatColor = unppp?.color || 'var(--background-highlight)'

  return (
    <>
      <div className="relative -mx-6 -mt-6 mb-4 h-48 overflow-hidden rounded-t-xl">
        {hasStepCover && hasStepVideo && (
          <CoverVideo src={step.cover!} alt="" className="size-full object-cover" />
        )}
        {hasStepCover && !hasStepVideo && (
          <Image src={resolveCoverSrc(step.cover!)} alt="" fill sizes="512px" className="object-cover" />
        )}
        {hasUnpppVideo && (
          <CoverVideo src={unppp!.coverVideo!} alt="" className="size-full object-cover" />
        )}
        {hasUnpppCover && (
          <Image src={resolveCoverSrc(unppp!.cover!)} alt="" fill sizes="512px" className="object-cover" />
        )}
        {!hasStepCover && !hasUnpppVideo && !hasUnpppCover && (
          <div className="size-full" style={{ backgroundColor: flatColor }} />
        )}
      </div>

      <div className="flex items-center gap-2">
        {step.icon && <span className="text-2xl leading-none">{step.icon}</span>}
        <h2 className="font-google-sans-code text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
          {step.title}
        </h2>
      </div>
      <p className="mt-3 font-google-sans-code text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        <KeywordWrapper html={processInlineFormatting(step.description)} />
      </p>

      {step.link && (
        <a
          href={step.link}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-block rounded-lg px-4 py-2 font-vt323 text-sm font-bold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: colorValue }}
        >
          Open link ↗
        </a>
      )}

      {step.questions && step.questions.length > 0 && (
        <div className="mt-4">
          {step.questions.map(question => (
            <StepQuestion key={question.id} question={question} />
          ))}
        </div>
      )}
    </>
  )
}

interface StepModalProps {
  step: StepModalStep | null
  unppp?: StepModalUnppp
  onClose: () => void
}

export default function StepModal({ step, unppp, onClose }: StepModalProps) {
  if (!step) return null

  return (
    <Modal isOpen={Boolean(step)} onCloseAction={onClose}>
      <StepCardContent step={step} unppp={unppp} />
    </Modal>
  )
}
