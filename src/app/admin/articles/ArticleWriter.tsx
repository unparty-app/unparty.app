'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTheme } from '../../contexts/ThemeContext'
import { FileText, Plus } from '@/app/components/icons'
import EditorialSection from '../../components/editorial/EditorialSection'
import { EDITORIAL_ARTICLES } from '../../constants/editorial-articles/registry'
import type { EditorialArticle, EditorialSection as Section } from '../../constants/editorial-articles/types'
import { FOUNDER } from '../../constants/organization'
import { SettingsGroup, LinkRow, ToggleRow, DisclosureRow } from '../components/Settings'
import ArticlesAdminContent from './ArticlesAdminContent'

const LABEL = 'font-google-sans-code text-[10px] uppercase tracking-wide text-[var(--text-muted)]'
const AUTHOR = FOUNDER.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

// Section types by kind, as the iOS editor groups them (ArticleSectionCatalog)
const CATALOG: Array<[string, Section['type'][]]> = [
  ['Text', ['hero', 'heading', 'paragraph', 'quote', 'list', 'personal', 'strikeBlock', 'code']],
  ['Media', ['image', 'video', 'gif', 'music']],
  ['Layout', ['divider', 'sectionBreak', 'columns', 'table', 'scrollRow']],
  ['Interactive', ['component', 'challenge', 'ranking', 'text', 'foundersQuestion']],
]
// What each starts as when added
const STARTER: Partial<Record<Section['type'], Partial<Section>>> = {
  list: { content: 'one|two|three' },
  image: { content: '/covers/cover-001.png', metadata: { alt: '' } },
  component: { metadata: { componentName: 'BuildYours' } },
  challenge: { setup: 'OWN' },
  scrollRow: { metadata: { scrollRowType: 'stories', coverIds: [] } },
  columns: { leftSections: [], rightSections: [] },
  table: { metadata: { headers: ['', ''], rows: [['', '']] } },
}
// Sections whose words are their `content`: edited as text; the rest as JSON
const TEXT_TYPES = new Set<Section['type']>(['hero', 'heading', 'paragraph', 'quote', 'list', 'personal', 'strikeBlock', 'code', 'image', 'video', 'gif'])

const summary = (s: Section) =>
  s.content?.replace(/<[^>]+>/g, '').slice(0, 80) ||
  (s.type === 'component' ? s.metadata?.componentName : s.type === 'challenge' ? (s.setup ? `${s.setup}. chapter` : s.userPrompt) : s.type === 'scrollRow' ? s.metadata?.scrollRowType : '') ||
  s.type

type Saved = { applied: 'now' } | { applied: 'after-deploy'; prUrl: string }

/**
 * The article writer (#229): the site's articles, and a writer for one, the
 * web twin of the iOS app's ArticleEditorView. Its details, then its sections
 * (add by type, move, edit, remove), with the article as it reads beside it.
 * Saving writes content/articles/<slug>.json (/api/admin/article-writer),
 * which the site serves over the TS or MD article of the same slug
 */
export default function ArticleWriterContent() {
  const params = useSearchParams()
  const slug = params.get('article')
  const articles = useMemo(() => [...EDITORIAL_ARTICLES].sort((a, b) => (b.updated || b.date).localeCompare(a.updated || a.date)), [])

  if (slug) return <ArticleWriter key={slug} slug={slug} />

  return (
    <div>
      <h1 className="font-vt323 text-4xl uppercase leading-none text-[var(--foreground)]">articles.</h1>
      <p className={`${LABEL} mt-2`}>write them here; they publish to your site.</p>
      <SettingsGroup id="articles-write" label="write.">
        <LinkRow href="/admin/articles?article=new" icon={Plus} title="a new article" detail="it starts as a draft" />
      </SettingsGroup>
      <SettingsGroup id="articles-yours" label="your articles." wide>
        {articles.map((a) => (
          <LinkRow key={a.slug} href={`/admin/articles?article=${a.slug}`} icon={FileText} title={a.title} detail={a.subtitle || a.slug} value={a.published ? 'live' : 'draft'} />
        ))}
      </SettingsGroup>
      <div className="mt-8">
        <DisclosureRow title="Database articles" detail="rows in the Article table; the site doesn’t show these">
          <div className="pt-4">
            <ArticlesAdminContent />
          </div>
        </DisclosureRow>
      </div>
    </div>
  )
}

function ArticleWriter({ slug: param }: { slug: string }) {
  const { colorValue } = useTheme()
  const router = useRouter()
  const isNew = param === 'new'
  const [article, setArticle] = useState<EditorialArticle | null>(
    isNew ? { slug: '', title: '', description: '', category: '', date: new Date().toISOString().slice(0, 10), published: false, author: AUTHOR, sections: [] } : null
  )
  const [editing, setEditing] = useState<number | null>(null)
  const [jsonDraft, setJsonDraft] = useState('')
  const [tab, setTab] = useState<'write' | 'read'>('write')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState<Saved | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isNew) return
    fetch(`/api/admin/article-writer/${param}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Could not open this article'))))
      .then((d) => setArticle(d.article))
      .catch((e: Error) => setError(e.message))
  }, [isNew, param])

  if (!article) return <p className={`${LABEL} mt-8`}>{error ?? 'opening…'}</p>

  const set = (patch: Partial<EditorialArticle>) => {
    setArticle({ ...article, ...patch })
    setSaved(null)
  }
  const setSections = (sections: Section[]) => set({ sections })
  const updateSection = (i: number, patch: Partial<Section>) => setSections(article.sections.map((s, j) => (j === i ? { ...s, ...patch } : s)))
  const move = (i: number, by: number) => {
    const next = [...article.sections]
    const [s] = next.splice(i, 1)
    next.splice(Math.max(0, Math.min(next.length, i + by)), 0, s)
    setSections(next)
    setEditing(null)
  }
  const add = (type: Section['type']) => {
    const used = new Set(article.sections.map((s) => s.id))
    let n = article.sections.length + 1
    while (used.has(`${type}-${n}`)) n++
    setSections([...article.sections, { id: `${type}-${n}`, type, ...(TEXT_TYPES.has(type) ? { content: '' } : {}), ...STARTER[type] } as Section])
    setEditing(article.sections.length)
    setJsonDraft('')
  }
  const openEdit = (i: number) => {
    setEditing(editing === i ? null : i)
    const { id: _id, type: _type, ...rest } = article.sections[i]
    setJsonDraft(JSON.stringify(rest, null, 2))
  }

  const save = async () => {
    const slug = isNew ? slugify(article.slug || article.title) : article.slug
    if (!slug) return setError('Give it a title or an address')
    setSaving(true)
    setError(null)
    try {
      const r = await fetch(`/api/admin/article-writer/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ article: { ...article, slug }, localDate: new Date().toLocaleDateString('en-CA') }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      setSaved(d.saved)
      if (isNew) router.replace(`/admin/articles?article=${slug}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the article')
    } finally {
      setSaving(false)
    }
  }

  const input = 'w-full bg-transparent outline-none placeholder:text-[var(--text-muted)] placeholder:opacity-60'
  const box = 'w-full rounded-lg border bg-transparent px-3 py-2 font-space-grotesk text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--text-muted)]'
  const boxStyle = { borderColor: `${colorValue}40` }
  const tabButton = (id: 'write' | 'read', label: string) => (
    <button type="button" onClick={() => setTab(id)} aria-pressed={tab === id} className={`${LABEL} lg:hidden ${tab === id ? '!text-[var(--foreground)]' : ''}`}>
      {label}
    </button>
  )

  return (
    <div>
      <Link href="/admin/articles" className={`${LABEL} transition-colors hover:text-[var(--foreground)]`}>
        ← articles
      </Link>
      <div className="mt-6 flex items-center gap-4 border-b pb-3" style={{ borderColor: `${colorValue}30` }}>
        <span className={LABEL}>{isNew ? 'new article' : `/article/${article.slug}`}</span>
        {tabButton('write', 'write')}
        {tabButton('read', 'read')}
      </div>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <div className={tab === 'write' ? 'space-y-4' : 'hidden space-y-4 lg:block'}>
          <input aria-label="Title" value={article.title} onChange={(e) => set({ title: e.target.value })} placeholder="TITLE." className={`${input} font-vt323 text-4xl uppercase leading-none text-[var(--foreground)]`} />
          <input aria-label="Subtitle" value={article.subtitle ?? ''} onChange={(e) => set({ subtitle: e.target.value })} placeholder="a line under the title" className={`${input} font-space-grotesk text-base text-[var(--foreground)]`} />
          {isNew && (
            <label className="block">
              <span className={LABEL}>address (/article/…)</span>
              <input value={article.slug} onChange={(e) => set({ slug: slugify(e.target.value) })} placeholder={slugify(article.title) || 'from the title'} className={`${box} mt-1`} style={boxStyle} />
            </label>
          )}
          <label className="block">
            <span className={LABEL}>description: what search engines show</span>
            <textarea value={article.description} onChange={(e) => set({ description: e.target.value })} rows={2} className={`${box} mt-1`} style={boxStyle} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className={LABEL}>category</span>
              <input value={article.category} onChange={(e) => set({ category: e.target.value })} placeholder="SETUP." className={`${box} mt-1`} style={boxStyle} />
            </label>
            <label className="block">
              <span className={LABEL}>cover</span>
              <input value={article.coverImage ?? ''} onChange={(e) => set({ coverImage: e.target.value || undefined })} placeholder="/covers/cover-001.png" className={`${box} mt-1`} style={boxStyle} />
            </label>
          </div>
          <label className="block">
            <span className={LABEL}>tags, comma separated</span>
            <input value={(article.tags ?? []).join(', ')} onChange={(e) => set({ tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) })} className={`${box} mt-1`} style={boxStyle} />
          </label>
          <ToggleRow title={article.published ? 'live' : 'draft'} detail={article.published ? 'on your site once saved' : 'only here until you turn it on'} on={article.published} onToggle={() => set({ published: !article.published })} />

          {/* The sections */}
          <p className={`${LABEL} pt-2`}>sections.</p>
          <ol className="space-y-2">
            {article.sections.map((s, i) => (
              <li key={`${s.id}-${i}`} className="rounded-lg border" style={{ borderColor: `${colorValue}30` }}>
                <div className="flex items-center gap-2 px-3 py-2">
                  <button type="button" onClick={() => openEdit(i)} className="min-w-0 flex-1 text-left" aria-expanded={editing === i}>
                    <span className={LABEL}>{s.type}</span>
                    <span className="block truncate font-space-grotesk text-sm text-[var(--foreground)]">{summary(s)}</span>
                  </button>
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up" className={`${LABEL} px-1 disabled:opacity-30`}>↑</button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === article.sections.length - 1} aria-label="Move down" className={`${LABEL} px-1 disabled:opacity-30`}>↓</button>
                  <button type="button" onClick={() => { setSections(article.sections.filter((_, j) => j !== i)); setEditing(null) }} aria-label="Remove" className={`${LABEL} px-1`}>✕</button>
                </div>
                {editing === i && (
                  <div className="border-t px-3 py-3" style={{ borderColor: `${colorValue}20` }}>
                    {TEXT_TYPES.has(s.type) ? (
                      <textarea
                        aria-label={`${s.type} words`}
                        value={s.content ?? ''}
                        onChange={(e) => updateSection(i, { content: e.target.value })}
                        rows={s.type === 'paragraph' || s.type === 'code' ? 6 : 2}
                        placeholder={s.type === 'list' ? 'one|two|three' : s.type === 'image' ? '/covers/cover-001.png' : 'words. **bold** and [links](/somewhere) work'}
                        className={`${box} font-google-sans-code`}
                        style={boxStyle}
                      />
                    ) : (
                      <>
                        <textarea
                          aria-label={`${s.type} settings, as JSON`}
                          value={jsonDraft}
                          onChange={(e) => {
                            setJsonDraft(e.target.value)
                            try {
                              updateSection(i, { ...JSON.parse(e.target.value), id: s.id, type: s.type })
                            } catch {
                              // Keeps the last JSON that parsed until this one does
                            }
                          }}
                          rows={8}
                          className={`${box} font-google-sans-code text-xs`}
                          style={boxStyle}
                        />
                        <p className={`${LABEL} mt-1`}>its settings as JSON: the editorial section guide lists each type’s fields.</p>
                      </>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ol>
          <label className="block">
            <span className={LABEL}>add a section</span>
            <select value="" onChange={(e) => e.target.value && add(e.target.value as Section['type'])} className={`${box} mt-1`} style={boxStyle}>
              <option value="">choose a type…</option>
              {CATALOG.map(([group, types]) => (
                <optgroup key={group} label={group}>
                  {types.map((t) => <option key={t} value={t}>{t}</option>)}
                </optgroup>
              ))}
            </select>
          </label>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button type="button" onClick={save} disabled={saving || !article.title} className="rounded-full px-5 py-2.5 font-google-sans-code text-sm uppercase tracking-wider transition-opacity hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: colorValue, color: 'var(--background)' }}>
              {saving ? 'saving…' : 'save'}
            </button>
            <p className="font-space-grotesk text-sm text-[var(--foreground)]" aria-live="polite">
              {error ? (
                <span style={{ color: colorValue }}>{error}</span>
              ) : saved?.applied === 'now' ? (
                'saved. it’s in your copy now; commit it to publish.'
              ) : saved?.applied === 'after-deploy' ? (
                <>
                  saved. live once <a href={saved.prUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4" style={{ color: colorValue }}>the change</a> deploys.
                </>
              ) : null}
            </p>
          </div>
        </div>

        {/* The article as it reads: the sections an article page renders */}
        {/* contain: a hero spans the page and a band breaks out to the screen's
            edges; here they stay inside the preview */}
        <div className={`editorial-preview relative overflow-hidden [contain:paint] ${tab === 'read' ? '' : 'hidden lg:block'}`} aria-label="How the article reads">
          <p className={`${LABEL} mb-4 hidden lg:block`}>how it reads.</p>
          {article.title && <h2 className="font-vt323 text-5xl uppercase leading-none text-[var(--foreground)]">{article.title}</h2>}
          {article.subtitle && <p className="mt-2 font-space-grotesk text-base text-[var(--foreground)] opacity-80">{article.subtitle}</p>}
          <div className="mt-6">
            {article.sections.length === 0 ? (
              <p className={LABEL}>add a section; it shows here as you write.</p>
            ) : (
              article.sections.map((s, i) => <EditorialSection key={`${s.id}-${i}`} section={s} isVisible articleSlug={article.slug || 'draft'} />)
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
