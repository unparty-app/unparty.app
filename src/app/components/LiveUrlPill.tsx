'use client'

import { Smartphone, Globe } from '@/app/components/icons'
import { useTheme } from '../contexts/ThemeContext'
import { getUrlPoints } from '@/utils/unppp-priority-count'

/**
 * Distribution link pill (Banner pill recipe): Smartphone for TestFlight,
 * Globe for a live unparty.app deployment. Renders nothing for lower-tier
 * or missing URLs — only shipped distributions are visitor-facing.
 */
export default function LiveUrlPill({ url }: { url?: string | null }) {
  const { colorValue } = useTheme()

  if (!url) return null
  const points = getUrlPoints(url)
  if (points < 3) return null

  // UnpppsConfig.json entries are hand-maintained and occasionally miss the
  // scheme (see #613) — a scheme-less href resolves as a relative path
  // against the current origin instead of navigating externally.
  const normalizedUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`

  const isTestFlight = points === 3
  const label = isTestFlight ? 'TESTFLIGHT.' : 'LIVE.'

  return (
    <a
      href={normalizedUrl}
      target="_blank"
      rel="noopener noreferrer"
      title={normalizedUrl}
      aria-label={`Open ${label.toLowerCase()} ${normalizedUrl}`}
      className="inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 font-vt323 text-xs font-bold uppercase tracking-wide transition-transform duration-200 hover:scale-105"
      style={{
        backgroundColor: `${colorValue}20`,
        borderColor: `${colorValue}40`,
        color: colorValue,
      }}
    >
      {isTestFlight ? <Smartphone size={12} /> : <Globe size={12} />}
      {label}
    </a>
  )
}
