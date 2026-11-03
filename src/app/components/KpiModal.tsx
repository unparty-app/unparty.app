'use client'

import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import type { KpiConfig } from './KpiTile'

export interface KpiComparison {
  id: string
  displayName: string
  value: string
  isCurrent?: boolean
}

interface KpiModalProps {
  kpi: KpiConfig | null
  comparisons: KpiComparison[]
  onClose: () => void
}

/**
 * Modal presenting a KPI definition (from unparty-kpi.json) plus a table of
 * unppps ranked by that KPI metric. Follows the KeywordModal portal pattern.
 */
const KpiModal: React.FC<KpiModalProps> = ({ kpi, comparisons, onClose }) => {
  const isOpen = kpi !== null

  // ESC key & body scroll management
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!kpi) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-sm"
      style={{ backgroundColor: 'var(--background)' }}
    >
      <div
        className="animate-in fade-in slide-in-from-bottom-4 vh-card-elevated w-full max-w-lg rounded-xl border-2 duration-200"
        style={{
          borderColor: kpi.color,
          backgroundColor: 'var(--background)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          className="flex items-center justify-between border-b p-6"
          style={{ borderColor: `${kpi.color}30` }}
        >
          <div className="flex items-center gap-3">
            <h2 className="font-vt323 text-2xl font-bold" style={{ color: kpi.color }}>
              {kpi.label}
            </h2>
            <span
              className="rounded-full px-3 py-1 font-google-sans-code text-xs font-bold"
              style={{
                backgroundColor: `${kpi.color}20`,
                color: kpi.color,
              }}
            >
              KPI
            </span>
          </div>
          <button
            onClick={onClose}
            className="flex size-10 items-center justify-center rounded-lg transition-colors"
            style={{ color: 'var(--text-muted)', backgroundColor: 'transparent' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--foreground)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-muted)'
            }}
            aria-label="Close KPI definition"
          >
            <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          <p
            className="font-google-sans-code text-sm leading-relaxed"
            style={{ color: 'var(--foreground)' }}
          >
            {kpi.definition}
          </p>

          {comparisons.length > 0 && (
            <div className="mt-6">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200/20 dark:border-gray-700/20">
                    <th className="py-3 pl-0 pr-4 text-left">
                      <span className="font-google-sans-code text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                        UNPPP.
                      </span>
                    </th>
                    <th className="py-3 px-4 text-right">
                      <span className="font-google-sans-code text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                        {kpi.metricLabel}
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisons.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-gray-200/10 last:border-0 dark:border-gray-700/10"
                    >
                      <td className="py-3 pl-0 pr-4">
                        <Link
                          href={`/${row.id}`}
                          className="font-google-sans-code text-sm transition-opacity hover:opacity-70"
                          style={{ color: row.isCurrent ? kpi.color : 'var(--foreground)' }}
                        >
                          {row.displayName}
                          {row.isCurrent && (
                            <span className="ml-2 font-google-sans-code text-xs uppercase" style={{ color: kpi.color }}>
                              this.
                            </span>
                          )}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span
                          className="font-vt323 text-sm font-bold"
                          style={{ color: row.isCurrent ? kpi.color : 'var(--text-muted)' }}
                        >
                          {row.value}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4" style={{ borderColor: `${kpi.color}20` }}>
          <p className="text-center font-google-sans-code text-xs" style={{ color: 'var(--text-muted)' }}>
            TAP. anywhere outside to close
          </p>
        </div>
      </div>

      {/* Click outside to close */}
      <div
        className="absolute inset-0 -z-10"
        onClick={onClose}
        aria-label="Close KPI modal"
      />
    </div>,
    document.body
  )
}

export default KpiModal
