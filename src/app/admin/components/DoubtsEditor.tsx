'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useTheme } from '../../contexts/ThemeContext'
import { X } from '@/app/components/icons'
import type { DoubtReferences } from '@/lib/doubt-references'

const LABEL = 'font-google-sans-code text-[10px] uppercase tracking-wide text-[var(--text-muted)]'

/**
 * The founder's doubts in /admin (your site.): each with how often it turns
 * up in their writing, a × to let it go, and a field to add one. The same
 * private list Delete Your Doubts keeps and /founders shows only to them
 * (/api/admin/doubts)
 */
export default function DoubtsEditor({ onCount }: { onCount?: (count: number) => void }) {
  const { colorValue } = useTheme()
  const [doubts, setDoubts] = useState<DoubtReferences[] | null>(null)
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)

  const apply = (list: DoubtReferences[]) => {
    setDoubts(list)
    onCount?.(list.length)
  }

  useEffect(() => {
    fetch('/api/admin/doubts')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => apply(data?.doubts ?? []))
      .catch(() => apply([]))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const send = async (body: Record<string, string[]>) => {
    setBusy(true)
    try {
      const res = await fetch('/api/admin/doubts', { method: 'POST', body: JSON.stringify(body) })
      const data = await res.json().catch(() => null)
      if (res.ok && data?.doubts) apply(data.doubts)
    } finally {
      setBusy(false)
    }
  }

  const add = () => {
    const text = draft.trim()
    if (!text) return
    setDraft('')
    send({ add: [text] })
  }

  return (
    <div className="max-w-2xl space-y-4">
      <p className="font-space-grotesk text-xs text-[var(--text-muted)]">
        words and phrases you flag in your writing. only you see them, on{' '}
        <Link href="/founders#words" className="underline decoration-dotted underline-offset-4 hover:text-[var(--foreground)]">your resume</Link>
        , with every place each one turns up. add them here or in{' '}
        <Link href="/theunpartyunppp" className="underline decoration-dotted underline-offset-4 hover:text-[var(--foreground)]">delete your doubts</Link>
        .
      </p>

      {doubts && doubts.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {doubts.map((d) => (
            <li
              key={d.doubt}
              className="inline-flex items-center gap-2 rounded-full border py-1 pl-3 pr-1.5"
              style={{ borderColor: `${colorValue}55` }}
            >
              <span className="font-space-grotesk text-sm text-[var(--foreground)] line-through" style={{ textDecorationColor: colorValue }}>{d.doubt}</span>
              <span className={LABEL}>{d.count}×</span>
              <button
                type="button"
                onClick={() => send({ remove: [d.doubt] })}
                disabled={busy}
                aria-label={`Let go of ${d.doubt}`}
                className="flex size-6 items-center justify-center rounded-full text-[var(--text-muted)] transition-colors hover:bg-[var(--background-highlight)] hover:text-[var(--foreground)] disabled:opacity-50"
              >
                <X size={12} strokeWidth={1.5} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          maxLength={80}
          placeholder="a doubt to flag"
          aria-label="A doubt to flag"
          className="w-64 rounded-full border bg-transparent px-4 py-2 font-space-grotesk text-sm text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus:outline-none"
          style={{ borderColor: colorValue }}
        />
        <button type="button" onClick={add} disabled={busy || !draft.trim()} className={`${LABEL} transition-colors hover:text-[var(--foreground)] disabled:opacity-50`}>
          {busy ? 'saving…' : 'add'}
        </button>
      </div>
    </div>
  )
}
