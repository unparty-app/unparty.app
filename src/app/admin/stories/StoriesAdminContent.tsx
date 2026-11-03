'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useFetch } from '@/hooks/useFetch'
import { useTheme } from '../../contexts/ThemeContext'
import { BookOpen, Lightbulb, Plus } from '@/app/components/icons'
import { InkUnderline } from '../../components/depend/ink'
import EditorialSection from '../../components/editorial/EditorialSection'
import { parseMarkdownToSections } from '../../utils/storyToEditorialConverter'
import { FOUNDER, FOUNDER_WHY, SITE_NAME } from '../../constants/organization'
import { newStory, nextStoryId, splitStory, withBody, withField } from '@/lib/story-file'
import type { Story } from '@/utils/StorySchema'
import { SettingsGroup, LinkRow, ToggleRow } from '../components/Settings'

const LABEL = 'font-google-sans-code text-[10px] uppercase tracking-wide text-[var(--text-muted)]'
// The founder as stories name their author
const AUTHOR = FOUNDER.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const WHY_QUESTION = `why build your own ${SITE_NAME}?`
// What the why story's blank page asks, until its author starts writing
const WHY_PROMPT = [
  `what were you building before you built your own?`,
  `what did you want to own: your work, your words, your data?`,
  `what would you tell someone starting today?`,
  '',
  'lines that start with # show big: they become your story’s highlights.',
].join('\n')

type Saved = { applied: 'now' } | { applied: 'after-deploy'; prUrl: string }

/**
 * The story writer (#229): the owner's stories, and a writer for one, the web
 * twin of the iOS app's StoryEditorView. A title, a subtitle, live or draft,
 * and the Markdown, with the story as it will read beside it (the same
 * parser and sections a story page uses). Saving writes story-NNN.md (locally
 * at once; deployed, a pull request through the owner's GitHub App).
 *
 * `?why=1` opens the story answering "why build your own?" (#589): new, with
 * its prompt, until the owner writes it, and saving points founder.why at it,
 * which /build opens with
 */
export default function StoriesAdminContent() {
  const params = useSearchParams()
  const storyParam = params.get('story')
  const why = params.get('why') === '1'
  const { data } = useFetch<Story[]>('/api/stories/all')
  const stories = useMemo(() => [...(data ?? [])].sort((a, b) => b.id.localeCompare(a.id)), [data])
  // The why story founder.why points at, or a new one before there is any
  // (npm run check:identity warns while a copy still points at unparty's)
  const whyId = FOUNDER_WHY

  if (storyParam && data) {
    const storyId = storyParam === 'new' ? nextStoryId(stories.map((s) => s.id)) : storyParam
    const isNew = storyParam === 'new' || !stories.some((s) => s.id === storyId)
    return <StoryWriter key={storyId} storyId={storyId} isNew={isNew} why={why} />
  }

  return (
    <div>
      <h1 className="font-vt323 text-4xl uppercase leading-none text-[var(--foreground)]">stories.</h1>
      <p className={`${LABEL} mt-2`}>write them here; they publish to your site.</p>
      <SettingsGroup id="stories-write" label="write.">
        <LinkRow
          href={`/admin/stories?story=${whyId ?? 'new'}&why=1`}
          icon={Lightbulb}
          title={WHY_QUESTION}
          detail="the first story people read on /build"
          value={whyId ?? 'not yet'}
        />
        <LinkRow href="/admin/stories?story=new" icon={Plus} title="a new story" detail="it starts as a draft" />
      </SettingsGroup>
      <SettingsGroup id="stories-yours" label="your stories." wide>
        {stories.map((s) => (
          <LinkRow
            key={s.id}
            href={`/admin/stories?story=${s.id}`}
            icon={BookOpen}
            title={s.metadata.title || s.id}
            detail={s.metadata.subtitle || s.id}
            value={s.metadata.published ? 'live' : 'draft'}
          />
        ))}
      </SettingsGroup>
    </div>
  )
}

function StoryWriter({ storyId, isNew, why }: { storyId: string; isNew: boolean; why: boolean }) {
  const { colorValue } = useTheme()
  const router = useRouter()
  const [raw, setRaw] = useState<string | null>(
    isNew ? newStory({ title: why ? 'WHY.' : '', subtitle: why ? WHY_QUESTION : undefined, author: AUTHOR, cover: FOUNDER.cover, body: '' }) : null
  )
  const [tab, setTab] = useState<'write' | 'read'>('write')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState<Saved | null>(null)
  const [error, setError] = useState<string | null>(null)

  // An existing story: its file as it is on the site
  useEffect(() => {
    if (isNew) return
    let cancelled = false
    fetch(`/api/stories/${storyId}`)
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error('Could not open this story'))))
      .then((text) => !cancelled && setRaw(text))
      .catch((e: Error) => !cancelled && setError(e.message))
    return () => {
      cancelled = true
    }
  }, [isNew, storyId])

  const { fields, body } = splitStory(raw ?? '')
  const published = fields.published === 'true'
  const sections = useMemo(() => parseMarkdownToSections(body), [body])
  const change = (next: string) => {
    setRaw(next)
    setSaved(null)
  }

  const save = async () => {
    if (!raw) return
    setSaving(true)
    setError(null)
    try {
      const r = await fetch(`/api/admin/stories/${storyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: raw, why, localDate: new Date().toLocaleDateString('en-CA') }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      setSaved(d.story)
      // A new story has its number now: keep writing it, not another new one
      if (isNew) router.replace(`/admin/stories?story=${storyId}${why ? '&why=1' : ''}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the story')
    } finally {
      setSaving(false)
    }
  }

  const input = 'w-full bg-transparent outline-none placeholder:text-[var(--text-muted)] placeholder:opacity-60'
  const tabButton = (id: 'write' | 'read', label: string) => (
    <button
      type="button"
      onClick={() => setTab(id)}
      aria-pressed={tab === id}
      className={`font-google-sans-code text-[10px] uppercase tracking-wide lg:hidden ${tab === id ? 'text-[var(--foreground)]' : 'text-[var(--text-muted)]'}`}
    >
      {label}
    </button>
  )

  return (
    <div>
      <Link href="/admin/stories" className={`${LABEL} transition-colors hover:text-[var(--foreground)]`}>
        ← stories
      </Link>

      {why && (
        <div className="mt-6">
          <p className={LABEL}>your first story.</p>
          <h1 className="mt-2 font-vt323 text-4xl leading-none text-[var(--foreground)] sm:text-5xl">{WHY_QUESTION}</h1>
          <InkUnderline color={colorValue} className="mt-2 h-2 w-40" />
          <p className="mt-4 max-w-2xl font-space-grotesk text-sm leading-relaxed text-[var(--foreground)] opacity-80">
            answer it in your own words. it opens your /build page, the first thing someone reads about what you&apos;re building, and why they might build their own.
          </p>
        </div>
      )}

      {raw === null ? (
        <p className={`${LABEL} mt-8`}>{error ?? 'opening…'}</p>
      ) : (
        <>
          <div className="mt-6 flex items-center gap-4 border-b pb-3" style={{ borderColor: `${colorValue}30` }}>
            <span className={LABEL}>{storyId}</span>
            {tabButton('write', 'write')}
            {tabButton('read', 'read')}
          </div>

          <div className="mt-6 grid gap-10 lg:grid-cols-2">
            <div className={tab === 'write' ? '' : 'hidden lg:block'}>
              <input
                aria-label="Title"
                value={fields.title ?? ''}
                onChange={(e) => change(withField(raw, 'title', e.target.value))}
                placeholder="TITLE."
                className={`${input} font-vt323 text-4xl uppercase leading-none text-[var(--foreground)]`}
              />
              <input
                aria-label="Subtitle"
                value={fields.subtitle ?? ''}
                onChange={(e) => change(withField(raw, 'subtitle', e.target.value))}
                placeholder="a line under the title"
                className={`${input} mt-3 font-space-grotesk text-base text-[var(--foreground)]`}
              />
              <div className="mt-4">
                <ToggleRow title={published ? 'live' : 'draft'} detail={published ? 'on your site once saved' : 'only here until you turn it on'} on={published} onToggle={() => change(withField(raw, 'published', !published))} />
              </div>
              <textarea
                aria-label="The story, in Markdown"
                value={body}
                onChange={(e) => change(withBody(raw, e.target.value))}
                placeholder={why ? WHY_PROMPT : 'write your story. lines that start with # show big.'}
                rows={18}
                className="mt-4 w-full resize-y rounded-xl border bg-transparent p-4 font-google-sans-code text-sm leading-relaxed text-[var(--foreground)] outline-none placeholder:text-[var(--text-muted)] focus-visible:outline focus-visible:outline-2"
                style={{ borderColor: `${colorValue}40`, outlineColor: colorValue }}
              />
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={save}
                  disabled={saving || !fields.title}
                  className="rounded-full px-5 py-2.5 font-google-sans-code text-sm uppercase tracking-wider transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: colorValue, color: 'var(--background)' }}
                >
                  {saving ? 'saving…' : 'save'}
                </button>
                <p className="font-space-grotesk text-sm text-[var(--foreground)]" aria-live="polite">
                  {error ? (
                    <span style={{ color: colorValue }}>{error}</span>
                  ) : saved?.applied === 'now' ? (
                    'saved. it’s in your copy now; commit it to publish.'
                  ) : saved?.applied === 'after-deploy' ? (
                    <>
                      saved. live once{' '}
                      <a href={saved.prUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4" style={{ color: colorValue }}>
                        the change
                      </a>{' '}
                      deploys.
                    </>
                  ) : null}
                </p>
              </div>
            </div>

            {/* The story as it will read: the parser and sections a story page uses */}
            {/* contain: big lines and bands that span the page stay inside the preview */}
            <div className={`editorial-preview relative overflow-hidden [contain:paint] ${tab === 'read' ? '' : 'hidden lg:block'}`} aria-label="How the story reads">
              <p className={`${LABEL} mb-4 hidden lg:block`}>how it reads.</p>
              {fields.title && <h2 className="font-vt323 text-5xl uppercase leading-none text-[var(--foreground)]">{fields.title}</h2>}
              {fields.subtitle && <p className="mt-2 font-space-grotesk text-base text-[var(--foreground)] opacity-80">{fields.subtitle}</p>}
              <div className="mt-6">
                {sections.length === 0 ? (
                  <p className={LABEL}>your words show here as you write.</p>
                ) : (
                  sections.map((section) => <EditorialSection key={section.id} section={section} isVisible articleSlug={`story-${storyId}`} />)
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
