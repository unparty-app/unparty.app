'use client'

import React from 'react'
import Badge from './Badge'
import kpiConfigData from '@/data/unparty-kpi.json'

export interface KpiConfig {
  id: string
  label: string
  metricLabel: string
  color: string
  definition: string
}

/** Look up a KPI definition from unparty-kpi.json by id */
export function getKpiConfig(id: string): KpiConfig | null {
  return (kpiConfigData.kpis as KpiConfig[]).find(k => k.id === id) ?? null
}

interface KpiTileProps {
  kpi: KpiConfig
  icon: React.ReactNode
  value: React.ReactNode
  caption?: React.ReactNode
  onClick: () => void
}

/**
 * KPI tile styled to mimic the unppp cards on /unppp/[type]:
 * color-filled "cover" block with the headline value, colored card body
 * with a Badge label, caption, and a MORE. footer. Clicking opens the KPI modal.
 */
export default function KpiTile({ kpi, icon, value, caption, onClick }: KpiTileProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Open ${kpi.label} definition`}
      className="group flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-xl border text-left transition-all duration-200"
      style={{ borderColor: `${kpi.color}40` }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = kpi.color
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = `${kpi.color}40`
      }}
    >
      {/* Color-filled cover block (mirrors the unppp card cover image) */}
      <div
        className="relative flex h-[130px] w-full flex-shrink-0 items-center justify-center overflow-hidden"
        style={{ backgroundColor: kpi.color }}
      >
        <span className="font-vt323 text-5xl leading-none" style={{ color: 'var(--background)' }}>
          {value}
        </span>
      </div>

      {/* Card Body */}
      <div className="flex w-full flex-1 flex-col gap-3 p-4" style={{ backgroundColor: kpi.color }}>
        <div>
          <Badge
            variant="primary"
            size="lg"
            style={{
              borderColor: kpi.color,
              color: 'var(--foreground)',
              backgroundColor: kpi.color,
            }}
          >
            {kpi.label}
          </Badge>
        </div>

        {caption && (
          <div
            className="flex items-center gap-2 font-google-sans-code text-xs"
            style={{ color: 'var(--background)' }}
          >
            <span className="flex-shrink-0">{icon}</span>
            <span>{caption}</span>
          </div>
        )}

        {/* MORE. CTA */}
        <div
          className="mt-auto flex items-center gap-2 font-google-sans-code text-sm font-medium"
          style={{ color: 'var(--background)' }}
        >
          <span>MORE.</span>
          <svg
            className="size-4 transition-transform group-hover:translate-x-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </button>
  )
}
