'use client'

import { Fragment, useState } from 'react'
import { useFetch } from '@/hooks/useFetch'
import { UserType } from '@prisma/client'
import { useTheme } from '../../contexts/ThemeContext'

interface UserMilestone {
  id: string
  milestone: string
  achievedAt: string
  metadata?: unknown
}

interface IdeaProgression {
  id: string
  ideaTitle: string
  currentStage: string
  pillarProgress: unknown
  stepsCompleted: number
  totalSteps: number
  completionRate: number
  startedAt: string
  completedAt?: string
  status: string
  metadata?: unknown
}

interface UserSession {
  id: string
  startedAt: string
  endedAt?: string
  duration?: number
  pillarsUsed: string[]
  pageViews: number
  actions?: unknown
}

interface UserProfile {
  id: string
  userId: string
  userType: UserType
  onboardingCompleted: boolean
  aboutPillarProgress?: unknown
  buildPillarProgress?: unknown
  connectPillarProgress?: unknown
  firstIdeaStartedAt?: string
  firstIdeaCompletedAt?: string
  lastActiveAt: string
  retentionScore?: number
  totalIdeasStarted: number
  totalIdeasCompleted: number
  createdAt: string
  updatedAt: string
  milestones: UserMilestone[]
  ideaProgression: IdeaProgression[]
  sessions: UserSession[]
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  pages: number
}

function JsonBlock({ value }: { value: unknown }) {
  if (value === null || value === undefined) {
    return <span style={{ color: 'var(--text-muted)' }}>—</span>
  }
  return (
    <pre
      className="overflow-x-auto rounded-lg p-3 font-google-sans-code text-xs"
      style={{ backgroundColor: 'var(--background-highlight)', color: 'var(--foreground)' }}
    >
      {JSON.stringify(value, null, 2)}
    </pre>
  )
}

const PAGE_SIZE = 10

export default function ProgressAdminContent() {
  const { colorValue } = useTheme()
  const [currentPage, setCurrentPage] = useState(1)
  const [userFilter, setUserFilter] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const params = new URLSearchParams({
    page: currentPage.toString(),
    limit: PAGE_SIZE.toString(),
    ...(userFilter && { userId: userFilter })
  })
  const { data, loading } = useFetch<{ userProfiles: UserProfile[]; pagination: PaginationInfo }>(
    `/api/admin/user-progress?${params}`
  )
  const userProfiles = data?.userProfiles ?? []
  const pagination = data?.pagination ?? { page: currentPage, limit: PAGE_SIZE, total: 0, pages: 0 }

  const selectClass = 'rounded-lg border px-3 py-2 font-google-sans-code text-sm'
  const selectStyle = { borderColor: `${colorValue}20`, backgroundColor: 'var(--background)', color: 'var(--foreground)' }

  const pillarDot = (used: boolean) => (
    <span
      className="inline-block size-2 rounded-full"
      style={{ backgroundColor: used ? colorValue : 'var(--text-muted)', opacity: used ? 1 : 0.3 }}
    />
  )

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-google-sans-code text-2xl font-bold uppercase" style={{ color: 'var(--foreground)' }}>
          PROGRESS.
        </h1>
      </div>

      <div className="mb-6 rounded-xl border p-6" style={{ backgroundColor: 'var(--background)', borderColor: `${colorValue}20` }}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <input
            type="text"
            placeholder="Filter by User ID..."
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            className={selectClass}
            style={selectStyle}
          />
          <button
            onClick={() => setUserFilter('')}
            className="rounded-lg px-4 py-2 font-google-sans-code text-sm transition-opacity hover:opacity-80"
            style={{ backgroundColor: 'var(--background-highlight)', color: 'var(--text-muted)' }}
          >
            Clear Filters
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border" style={{ backgroundColor: 'var(--background)', borderColor: `${colorValue}20` }}>
        {loading ? (
          <div className="p-8 text-center">
            <div
              className="mx-auto size-8 animate-spin rounded-full border-4 border-solid align-[-0.125em]"
              style={{ borderTopColor: colorValue, borderLeftColor: colorValue, borderBottomColor: colorValue, borderRightColor: 'transparent' }}
            />
            <p className="mt-2 font-google-sans-code text-sm" style={{ color: 'var(--text-muted)' }}>Loading progress...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${colorValue}20` }}>
                    {['User', 'Type', 'Pillars', 'Ideas', 'Retention', 'Milestones', 'Last Active', 'Actions'].map(h => (
                      <th key={h} className="px-6 py-3 text-left font-google-sans-code text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {userProfiles.map((p, i) => (
                    <Fragment key={p.id}>
                      <tr
                        style={{ borderBottom: expandedId === p.id || i < userProfiles.length - 1 ? `1px solid ${colorValue}10` : undefined }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--background-highlight)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <td className="px-6 py-4">
                          <span
                            className="rounded px-2 py-1 font-vt323 text-sm"
                            style={{ backgroundColor: `${colorValue}10`, color: colorValue }}
                          >
                            {p.userId.substring(0, 8)}…
                          </span>
                        </td>
                        <td className="px-6 py-4 font-google-sans-code text-sm" style={{ color: 'var(--foreground)' }}>
                          {p.userType}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5" title="about / build / connect">
                            {pillarDot(p.aboutPillarProgress !== null && p.aboutPillarProgress !== undefined)}
                            {pillarDot(p.buildPillarProgress !== null && p.buildPillarProgress !== undefined)}
                            {pillarDot(p.connectPillarProgress !== null && p.connectPillarProgress !== undefined)}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-vt323 text-sm" style={{ color: 'var(--foreground)' }}>
                          {p.totalIdeasCompleted} / {p.totalIdeasStarted}
                        </td>
                        <td className="px-6 py-4 font-vt323 text-sm" style={{ color: 'var(--foreground)' }}>
                          {p.retentionScore ?? '—'}
                        </td>
                        <td className="px-6 py-4 font-vt323 text-sm" style={{ color: 'var(--foreground)' }}>
                          {p.milestones.length}
                        </td>
                        <td className="px-6 py-4 font-vt323 text-sm" style={{ color: 'var(--text-muted)' }}>
                          {new Date(p.lastActiveAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 font-google-sans-code text-sm font-medium">
                          <button
                            onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
                            className="transition-colors"
                            style={{ color: colorValue }}
                          >
                            {expandedId === p.id ? 'Hide' : 'View'}
                          </button>
                        </td>
                      </tr>
                      {expandedId === p.id && (
                        <tr style={{ borderBottom: i < userProfiles.length - 1 ? `1px solid ${colorValue}10` : undefined }}>
                          <td colSpan={8} className="space-y-4 px-6 py-4" style={{ backgroundColor: 'var(--background-highlight)' }}>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                              <div>
                                <p className="mb-1 font-google-sans-code text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>About Pillar</p>
                                <JsonBlock value={p.aboutPillarProgress} />
                              </div>
                              <div>
                                <p className="mb-1 font-google-sans-code text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Build Pillar</p>
                                <JsonBlock value={p.buildPillarProgress} />
                              </div>
                              <div>
                                <p className="mb-1 font-google-sans-code text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Connect Pillar</p>
                                <JsonBlock value={p.connectPillarProgress} />
                              </div>
                            </div>

                            <div>
                              <p className="mb-1 font-google-sans-code text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                                Milestones ({p.milestones.length})
                              </p>
                              {p.milestones.length === 0 ? (
                                <p className="font-google-sans-code text-sm" style={{ color: 'var(--text-muted)' }}>None yet.</p>
                              ) : (
                                <div className="space-y-2">
                                  {p.milestones.map(m => (
                                    <div key={m.id} className="flex items-start justify-between gap-4 rounded-lg border p-2" style={{ borderColor: `${colorValue}20` }}>
                                      <div>
                                        <span className="font-google-sans-code text-sm font-medium" style={{ color: 'var(--foreground)' }}>{m.milestone}</span>
                                        <span className="ml-2 font-vt323 text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(m.achievedAt).toLocaleString()}</span>
                                        {m.metadata != null && <JsonBlock value={m.metadata} />}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div>
                              <p className="mb-1 font-google-sans-code text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                                Idea Progression ({p.ideaProgression.length})
                              </p>
                              {p.ideaProgression.length === 0 ? (
                                <p className="font-google-sans-code text-sm" style={{ color: 'var(--text-muted)' }}>None yet.</p>
                              ) : (
                                <div className="space-y-2">
                                  {p.ideaProgression.map(idea => (
                                    <div key={idea.id} className="rounded-lg border p-2" style={{ borderColor: `${colorValue}20` }}>
                                      <div className="font-google-sans-code text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                                        {idea.ideaTitle} — {idea.currentStage} / {idea.status} ({idea.stepsCompleted}/{idea.totalSteps}, {Math.round(idea.completionRate * 100) / 100}%)
                                      </div>
                                      <JsonBlock value={idea.pillarProgress} />
                                      {idea.metadata != null && <JsonBlock value={idea.metadata} />}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div>
                              <p className="mb-1 font-google-sans-code text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                                Recent Sessions ({p.sessions.length})
                              </p>
                              {p.sessions.length === 0 ? (
                                <p className="font-google-sans-code text-sm" style={{ color: 'var(--text-muted)' }}>None yet.</p>
                              ) : (
                                <div className="space-y-2">
                                  {p.sessions.map(s => (
                                    <div key={s.id} className="rounded-lg border p-2" style={{ borderColor: `${colorValue}20` }}>
                                      <div className="font-google-sans-code text-sm" style={{ color: 'var(--foreground)' }}>
                                        {new Date(s.startedAt).toLocaleString()} — {s.pageViews} page views — pillars: {s.pillarsUsed.join(', ') || 'none'}
                                      </div>
                                      {s.actions != null && <JsonBlock value={s.actions} />}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {userProfiles.length === 0 && (
              <div className="p-8 text-center font-google-sans-code text-sm" style={{ color: 'var(--text-muted)' }}>
                No user profiles found.
              </div>
            )}

            {pagination.pages > 1 && (
              <div className="border-t px-4 py-3 sm:px-6" style={{ borderColor: `${colorValue}20` }}>
                <div className="flex items-center justify-between">
                  <p className="font-google-sans-code text-sm" style={{ color: 'var(--text-muted)' }}>
                    Showing{' '}
                    <span className="font-vt323 text-base">{(pagination.page - 1) * pagination.limit + 1}</span>
                    {' '}–{' '}
                    <span className="font-vt323 text-base">{Math.min(pagination.page * pagination.limit, pagination.total)}</span>
                    {' '}of{' '}
                    <span className="font-vt323 text-base">{pagination.total}</span>
                  </p>
                  <nav className="inline-flex gap-1">
                    <button
                      onClick={() => setCurrentPage(p => p - 1)}
                      disabled={pagination.page === 1}
                      className="rounded-lg border px-3 py-1 font-google-sans-code text-sm disabled:opacity-40"
                      style={{ borderColor: `${colorValue}20`, color: 'var(--text-muted)' }}
                    >←</button>
                    {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className="rounded-lg border px-3 py-1 font-vt323 text-sm"
                        style={page === pagination.page
                          ? { backgroundColor: colorValue, borderColor: colorValue, color: 'black' }
                          : { borderColor: `${colorValue}20`, color: 'var(--text-muted)' }
                        }
                      >{page}</button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(p => p + 1)}
                      disabled={pagination.page === pagination.pages}
                      className="rounded-lg border px-3 py-1 font-google-sans-code text-sm disabled:opacity-40"
                      style={{ borderColor: `${colorValue}20`, color: 'var(--text-muted)' }}
                    >→</button>
                  </nav>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
