'use client'

import { useState } from 'react'
import { useFetch } from '@/hooks/useFetch'
import { SubmissionStatus, SubmissionType } from '@prisma/client'
import { useTheme } from '../../contexts/ThemeContext'
import { WAITLIST_ON } from '../../constants/organization'

interface UserSubmission {
  id: string
  userId: string
  type: SubmissionType
  content?: string
  filePath?: string
  status: SubmissionStatus
  submittedAt: string
  adminResponse?: string
  processedAt?: string
  createdAt: string
  updatedAt: string
  /** Approved here, but Clerk's account lacks the label that opens /party (#752) */
  lockedOut?: boolean
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  pages: number
}

const PAGE_SIZE = 10

export default function SubmissionsAdminContent() {
  const { colorValue } = useTheme()
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<SubmissionStatus | ''>('')
  const [typeFilter, setTypeFilter] = useState<SubmissionType | ''>('')
  const [userFilter, setUserFilter] = useState('')

  const params = new URLSearchParams({
    page: currentPage.toString(),
    limit: PAGE_SIZE.toString(),
    ...(statusFilter && { status: statusFilter }),
    ...(typeFilter && { type: typeFilter }),
    ...(userFilter && { userId: userFilter })
  })
  const { data, loading, refetch } = useFetch<{ submissions: UserSubmission[]; pagination: PaginationInfo }>(
    `/api/admin/submissions?${params}`
  )
  const submissions = data?.submissions ?? []
  const pagination = data?.pagination ?? { page: currentPage, limit: PAGE_SIZE, total: 0, pages: 0 }

  // Approved rows whose Clerk label didn't take: still locked out of /party (#752)
  const [lockedOut, setLockedOut] = useState<Set<string>>(new Set())

  const updateSubmissionStatus = async (id: string, status: SubmissionStatus) => {
    try {
      const response = await fetch(`/api/admin/submissions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      if (response.ok) {
        const result = await response.json().catch(() => ({}))
        setLockedOut(prev => {
          const next = new Set(prev)
          if (result.labelSet === false) next.add(id)
          else next.delete(id)
          return next
        })
        refetch()
      }
    } catch (error) {
      console.error('Failed to update submission:', error)
    }
  }

  const getStatusBadge = (status: SubmissionStatus) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-500/15 text-yellow-500'
      case 'APPROVED': return 'bg-green-500/15 text-green-500'
      case 'REJECTED': return 'bg-red-500/15 text-red-500'
      default: return 'bg-theme-wash text-[var(--text-muted)]'
    }
  }

  const getTypeIcon = (type: SubmissionType) => {
    switch (type) {
      case 'FORM': return '📝'
      case 'UPLOAD': return '📎'
      default: return '📋'
    }
  }

  const selectClass = 'rounded-lg border px-3 py-2 font-google-sans-code text-sm'
  const selectStyle = { borderColor: `${colorValue}20`, backgroundColor: 'var(--background)', color: 'var(--foreground)' }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-google-sans-code text-2xl font-bold uppercase" style={{ color: 'var(--foreground)' }}>
          SUBMISSIONS.
        </h1>
        <div className="flex gap-2">
          <button
            className="rounded-lg px-4 py-2 font-google-sans-code text-sm font-medium text-black transition-opacity hover:opacity-90"
            style={{ backgroundColor: colorValue }}
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="mb-6 rounded-xl border p-6" style={{ backgroundColor: 'var(--background)', borderColor: `${colorValue}20` }}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as SubmissionStatus | '')} className={selectClass} style={selectStyle}>
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as SubmissionType | '')} className={selectClass} style={selectStyle}>
            <option value="">All Types</option>
            <option value="FORM">Form Submissions</option>
            <option value="UPLOAD">File Uploads</option>
          </select>
          <input
            type="text"
            placeholder="Filter by User ID..."
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            className={selectClass}
            style={selectStyle}
          />
          <button
            onClick={() => { setStatusFilter(''); setTypeFilter(''); setUserFilter('') }}
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
            <p className="mt-2 font-google-sans-code text-sm" style={{ color: 'var(--text-muted)' }}>Loading submissions...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${colorValue}20` }}>
                    {['Type', 'User', 'Content', 'Status', 'Submitted', 'Actions'].map(h => (
                      <th key={h} className="px-6 py-3 text-left font-google-sans-code text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((sub, i) => (
                    <tr
                      key={sub.id}
                      style={{ borderBottom: i < submissions.length - 1 ? `1px solid ${colorValue}10` : undefined }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--background-highlight)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getTypeIcon(sub.type)}</span>
                          <span className="font-google-sans-code text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                            {sub.type}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className="rounded px-2 py-1 font-vt323 text-sm"
                          style={{ backgroundColor: `${colorValue}10`, color: colorValue }}
                        >
                          {sub.userId.substring(0, 8)}…
                        </span>
                      </td>
                      <td className="px-6 py-4 font-google-sans-code text-sm" style={{ color: 'var(--foreground)' }}>
                        {sub.content ? (
                          sub.content.length > 100 ? `${sub.content.substring(0, 100)}…` : sub.content
                        ) : sub.filePath ? (
                          <span style={{ color: colorValue }}>📎 {sub.filePath}</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>No content</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full px-2 py-1 font-google-sans-code text-xs font-semibold ${getStatusBadge(sub.status)}`}>
                          {sub.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-vt323 text-sm" style={{ color: 'var(--text-muted)' }}>
                        {new Date(sub.submittedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 font-google-sans-code text-sm font-medium">
                        {sub.status === 'PENDING' && (
                          <div className="flex gap-2">
                            <button onClick={() => updateSubmissionStatus(sub.id, 'APPROVED')} className="text-green-500 hover:text-green-400 transition-colors">
                              Approve
                            </button>
                            <button onClick={() => updateSubmissionStatus(sub.id, 'REJECTED')} className="text-red-500 hover:text-red-400 transition-colors">
                              Reject
                            </button>
                          </div>
                        )}
                        {sub.status === 'APPROVED' && (WAITLIST_ON || sub.lockedOut) && (
                          <button
                            onClick={() => updateSubmissionStatus(sub.id, 'APPROVED')}
                            title="Sets their account label again, for when they were approved but still land on the waitlist"
                            className="block text-[var(--text-muted)] transition-colors hover:text-[var(--foreground)]"
                          >
                            Let in again
                          </button>
                        )}
                        {(lockedOut.has(sub.id) || sub.lockedOut) && (
                          <p role="alert" className="mt-1 max-w-[16rem] text-xs text-red-700 dark:text-red-400">
                            Approved, but their account is missing the label that opens /party{WAITLIST_ON ? '' : ' (it will matter once the waitlist is on)'}. Let in again sets it.
                          </p>
                        )}
                        <button className="mt-1 transition-colors" style={{ color: colorValue }}>View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

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
