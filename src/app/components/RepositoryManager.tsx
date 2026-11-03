'use client'

import { useState } from 'react'
import { useAsyncData, useFetch } from '@/hooks/useFetch'
import { getRepoMetadata } from '@/utils/repoMetadataClient'
import { useTheme } from '../contexts/ThemeContext'
import { SettingsGroup, DisclosureRow } from '../admin/components/Settings'
import ProjectBelt from './ProjectBelt'
import { SITE_GITHUB } from '@/app/constants/organization'
import type { ProjectBelt as ProjectBeltData } from '@/lib/project-belt'

interface Repository {
  id: string
  name: string
  url: string
  description: string | null
  isActive: boolean
  addedBy: string
  createdAt: string
  updatedAt: string
}

interface RepoFields {
  name: string
  url: string
  description: string
}

// A row: a repo you've added, one that has released here without being
// added, or both
interface RepoRow {
  key: string
  saved: Repository | null
  name: string
  url: string
  belt: ProjectBeltData | null
}

const LABEL = 'font-google-sans-code text-[10px] uppercase tracking-wide text-[var(--text-muted)]'
const INPUT =
  'w-full border-b border-theme-line bg-transparent py-2 font-space-grotesk text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--text-muted)] focus:border-theme'

// A repo's name from its URL: the last part, without .git
const repoName = (url: string) => url.replace(/\.git$/, '').split('/').filter(Boolean).pop()?.toLowerCase() ?? ''

const released = (belt: ProjectBeltData | null) => belt?.releases?.length ?? 0

/** A quiet text action under a row, the way /admin acts: words, not buttons */
function Action({ onClick, href, children }: { onClick?: () => void; href?: string; children: React.ReactNode }) {
  const className = `${LABEL} underline-offset-4 transition-colors hover:text-[var(--foreground)] hover:underline`
  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>{children}</a>
  ) : (
    <button type="button" onClick={onClick} className={className}>{children}</button>
  )
}

/** Name, URL and a line about it: adding a repo, or changing one */
function RepoForm({ initial, submit, onSave, onCancel, suggestions }: {
  initial: RepoFields
  submit: string
  onSave: (fields: RepoFields) => Promise<boolean>
  onCancel?: () => void
  suggestions?: { name: string; url: string; description?: string | null }[]
}) {
  const [fields, setFields] = useState(initial)
  const [saving, setSaving] = useState(false)
  const set = (key: keyof RepoFields) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Picking a known repo by name fills in the rest
    const known = key === 'name' ? suggestions?.find((s) => s.name === value) : undefined
    setFields(known ? { name: known.name, url: known.url, description: known.description ?? '' } : { ...fields, [key]: value })
  }
  return (
    <form
      className="max-w-xl space-y-3 pt-1"
      onSubmit={async (e) => {
        e.preventDefault()
        setSaving(true)
        if (await onSave(fields) && !onCancel) setFields(initial)
        setSaving(false)
      }}
    >
      <label className="block">
        <span className="sr-only">Name</span>
        <input required value={fields.name} onChange={set('name')} placeholder="name" list={suggestions?.length ? 'known-repos' : undefined} className={INPUT} />
      </label>
      {suggestions?.length ? (
        <datalist id="known-repos">
          {suggestions.map((s) => <option key={s.name} value={s.name} />)}
        </datalist>
      ) : null}
      <label className="block">
        <span className="sr-only">URL</span>
        <input required type="url" value={fields.url} onChange={set('url')} placeholder={`https://github.com/${SITE_GITHUB}/your-repo`} className={INPUT} />
      </label>
      <label className="block">
        <span className="sr-only">What it is</span>
        <input value={fields.description} onChange={set('description')} placeholder="what it is, in a line" className={INPUT} />
      </label>
      <div className="flex items-center gap-5 pt-2">
        <button type="submit" disabled={saving} className={`${LABEL} !text-[var(--foreground)] underline-offset-4 hover:underline disabled:opacity-50`}>
          {saving ? 'saving…' : submit}
        </button>
        {onCancel && <Action onClick={onCancel}>cancel</Action>}
      </div>
    </form>
  )
}

/**
 * RepositoryManager - your repos and what each has released, as /admin's
 * settings rows (manage. → Repositories). A row opens in place: its releases
 * (the same written pill a visitor taps on a project's belt, to try each one
 * live and take it), then what you can do with the repo, in words. Repos that
 * have released here but aren't added yet are listed too, ready to add.
 *
 * `releases`: each repo's releases by repo name (repoReleaseBelts), read on
 * the server so the release notes never reach the browser.
 */
const RepositoryManager = ({ releases = {} }: { releases?: Record<string, ProjectBeltData> }) => {
  const { colorValue } = useTheme()
  const { data: repositories = [], loading, refetch } = useFetch<Repository[]>('/api/admin/repositories')
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  // Names to pick from while adding; if they can't load, adding just types them
  const { data: known } = useAsyncData('raw-repo-metadata', () => getRepoMetadata())

  const send = async (method: 'POST' | 'PUT' | 'DELETE', body?: object, query = '') => {
    setError(null)
    const response = await fetch(`/api/admin/repositories${query}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      setError(data.details || data.error || "that didn't save")
      return false
    }
    refetch()
    return true
  }

  // Added repos first, in the order they were added, then what has released
  // here but isn't added yet
  const savedNames = new Set(repositories.map((r) => repoName(r.url)))
  const rows: RepoRow[] = [
    ...repositories.map((r) => ({ key: r.id, saved: r, name: r.name, url: r.url, belt: releases[repoName(r.url)] ?? null })),
    ...Object.entries(releases)
      .filter(([name]) => !savedNames.has(name))
      .map(([name, belt]) => ({ key: name, saved: null, name, url: `https://github.com/${SITE_GITHUB}/${name}`, belt })),
  ]
  const releasedCount = rows.filter((r) => released(r.belt)).length

  return (
    <div className="text-left">
      <h1 className="font-vt323 text-4xl uppercase leading-none text-[var(--foreground)]">repositories.</h1>
      <p className={`mt-2 ${LABEL}`}>
        {loading ? '…' : `${repositories.length} added · ${releasedCount} with releases to try and take`}
      </p>

      {error && (
        <p role="alert" className="mt-4 font-space-grotesk text-sm text-[var(--foreground)]">
          {error} <Action onClick={() => setError(null)}>dismiss</Action>
        </p>
      )}

      <div className="mt-8">
        <SettingsGroup id="repositories" label="your repos.">
          {rows.map((row) => {
            const count = released(row.belt)
            const saved = row.saved
            return (
              <DisclosureRow
                key={row.key}
                title={row.name}
                detail={saved ? saved.description || row.url : 'has released here · not added yet'}
                value={count ? `${count} release${count === 1 ? '' : 's'}` : saved && !saved.isActive ? 'off' : undefined}
                dot={saved?.isActive ? colorValue : 'empty'}
              >
                {row.belt && <ProjectBelt belt={row.belt} fill className="mb-4" label={`what ${row.name} has released`} />}

                {saved && editing === saved.id ? (
                  <RepoForm
                    initial={{ name: saved.name, url: saved.url, description: saved.description ?? '' }}
                    submit="save"
                    onCancel={() => setEditing(null)}
                    onSave={async (fields) => {
                      const ok = await send('PUT', { id: saved.id, ...fields })
                      if (ok) setEditing(null)
                      return ok
                    }}
                  />
                ) : (
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                    {saved ? (
                      <>
                        <Action onClick={() => setEditing(saved.id)}>edit</Action>
                        <Action onClick={() => send('PUT', { id: saved.id, isActive: !saved.isActive })}>{saved.isActive ? 'turn off' : 'turn on'}</Action>
                        <Action href={saved.url}>open on github</Action>
                        <Action
                          onClick={() => {
                            if (confirm(`Remove ${saved.name}? Its releases stay; only this row goes.`)) send('DELETE', undefined, `?id=${saved.id}`)
                          }}
                        >
                          remove
                        </Action>
                      </>
                    ) : (
                      <>
                        <Action onClick={() => send('POST', { name: row.name, url: row.url, description: '' })}>add it</Action>
                        <Action href={row.url}>open on github</Action>
                      </>
                    )}
                  </div>
                )}
              </DisclosureRow>
            )
          })}

          <DisclosureRow title="add a repo" detail="name, address, a line about it" dot="empty">
            <RepoForm
              initial={{ name: '', url: '', description: '' }}
              submit="add it"
              suggestions={(known ?? []).filter((k) => !savedNames.has(repoName(k.url)))}
              onSave={(fields) => send('POST', fields)}
            />
          </DisclosureRow>
        </SettingsGroup>
      </div>
    </div>
  )
}

export default RepositoryManager
