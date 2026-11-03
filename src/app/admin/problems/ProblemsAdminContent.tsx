'use client'

import { useState } from 'react'
import { useFetch } from '@/hooks/useFetch'
import { useDebounce } from '@/hooks/useDebounce'
import { Search } from '@/app/components/icons'
import { useTheme } from '../../contexts/ThemeContext'
import { formatShortDate } from '@/lib/worksheet'

// One UserSubmission row per submit (/api/admin/problem-worksheets)
interface ProblemWorksheetEntry {
  id: string
  userId: string
  email: string
  name: string
  ideaName: string
  deadline: string
  color?: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  submittedAt: string
}

const LABEL = 'font-google-sans-code text-[10px] uppercase tracking-wide text-[var(--text-muted)]'

/**
 * Every worksheet anyone has sent, newest first, in the same table as /party's
 * problems: the problem's color, its name, who sent it, when it's due, where it
 * stands. Phones stack the person and due date under the name
 */
export default function ProblemsAdminContent() {
  const { colorValue } = useTheme()
  const [search, setSearch] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const updateSearchTerm = useDebounce(setSearchTerm, 300)

  // Server-side filtering: the query is keyed on the debounced search term
  const query = searchTerm ? `?${new URLSearchParams({ search: searchTerm })}` : ''
  const { data, loading } = useFetch<{ entries: ProblemWorksheetEntry[]; total: number }>(
    `/api/admin/problem-worksheets${query}`
  )
  const entries = data?.entries ?? []
  const total = data?.total ?? 0

  return (
    <div className="text-left">
      <h1 className="font-vt323 text-4xl uppercase leading-none text-[var(--foreground)]">problems.</h1>
      <p className={`mt-2 ${LABEL}`}>{loading ? '…' : `${total} worksheet${total === 1 ? '' : 's'}, newest first`}</p>

      <label className="mt-6 flex max-w-md items-center gap-2 border-b border-theme-line py-2 focus-within:border-theme">
        <Search size={16} strokeWidth={1.3} className="shrink-0 text-[var(--text-muted)]" />
        <span className="sr-only">Search worksheets</span>
        <input
          type="search"
          placeholder="name, email, idea or user id"
          value={search}
          onChange={e => {
            setSearch(e.target.value)
            updateSearchTerm(e.target.value)
          }}
          className="w-full bg-transparent font-space-grotesk text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--text-muted)]"
        />
      </label>

      <div className="mt-8">
        {loading ? (
          <p className="font-vt323 text-lg text-[var(--text-muted)]">thinking...</p>
        ) : entries.length === 0 ? (
          <p className="font-vt323 text-lg text-[var(--text-muted)]">
            {searchTerm ? 'nothing matches that.' : 'no worksheets yet.'}
          </p>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-theme-line">
                <th scope="col" className={`py-2 text-left font-normal ${LABEL}`}>problem.</th>
                <th scope="col" className={`hidden py-2 text-left font-normal md:table-cell ${LABEL}`}>from.</th>
                <th scope="col" className={`hidden py-2 text-left font-normal sm:table-cell ${LABEL}`}>due.</th>
                <th scope="col" className={`py-2 text-right font-normal ${LABEL}`}>status.</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(entry => (
                <tr key={entry.id} className="border-b border-theme-line last:border-b-0">
                  <td className="py-3 pr-3">
                    <div className="flex items-center gap-3">
                      <span aria-hidden="true" className="size-6 shrink-0 rounded-full" style={{ backgroundColor: entry.color ?? colorValue }} />
                      <div className="min-w-0">
                        <span className="block truncate font-vt323 text-xl leading-tight text-[var(--foreground)]">{entry.ideaName.toLowerCase()}.</span>
                        {/* On phones, who and when ride under the name */}
                        <span className={`block md:hidden ${LABEL}`}>
                          {entry.name} · <span className="sm:hidden">{entry.deadline ? `by ${formatShortDate(entry.deadline)}` : 'no date'}</span>
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="hidden py-3 pr-3 md:table-cell">
                    <span className="block font-space-grotesk text-sm text-[var(--foreground)]">{entry.name}</span>
                    <span className="block truncate font-space-grotesk text-xs text-[var(--text-muted)]">{entry.email}</span>
                  </td>
                  <td className={`hidden py-3 pr-3 sm:table-cell ${LABEL}`}>{entry.deadline ? formatShortDate(entry.deadline) : '—'}</td>
                  <td className="py-3 text-right">
                    <span className={`block ${LABEL}`} style={entry.status === 'PENDING' ? { color: colorValue } : undefined}>{entry.status.toLowerCase()}.</span>
                    <span className={`block ${LABEL}`}>{formatShortDate(entry.submittedAt)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
