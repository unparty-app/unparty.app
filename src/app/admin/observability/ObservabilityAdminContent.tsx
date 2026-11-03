'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useFetch } from '@/hooks/useFetch'
import { useTheme } from '@/app/contexts/ThemeContext'
import { BookOpen, Eye, Globe, Search, Zap } from '@/app/components/icons'
import type { HandDrawnIconComponent } from '@/app/components/icons'
import { InkUnderline } from '@/app/components/depend/ink'
import InkStage from '@/app/components/ink/InkStage'
import { InkSweep, InkWord } from '@/app/components/ink/primitives'
import InkTimeline from '@/app/components/resume/InkTimeline'
import ViewsChart from '@/app/components/resume/ViewsChart'
import UnpppCircle from '@/app/components/UnpppCircle'
import { DisclosureRow } from '../components/Settings'
import type { Observability, Range, Share, ShownPage } from '@/lib/observability'
import type { SearchData } from '@/app/api/admin/observability/search/route'
import type { ConnectSnapshot } from '@/lib/connect-snapshot'

const LABEL = 'font-google-sans-code text-[10px] uppercase tracking-wide text-[var(--text-muted)]'

// Each next part of a line a little lighter, as InkTimeline does its series
const SHADES = [1, 0.62, 0.42, 0.28, 0.2]

const RANGES: { id: Range; word: string; phrase: string }[] = [
  { id: '24h', word: 'a day', phrase: 'in the last day' },
  { id: '7d', word: 'a week', phrase: 'this week' },
  { id: '30d', word: 'a month', phrase: 'this month' },
]

const plural = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString()} ${n === 1 ? one : many}`
const percent = (part: number, whole: number) => (whole ? `${Math.max(1, Math.round((part / whole) * 100))}%` : '0%')

const regions = typeof Intl !== 'undefined' && 'DisplayNames' in Intl ? new Intl.DisplayNames(['en'], { type: 'region' }) : null
const country = (code: string) => (code === 'other' ? 'elsewhere' : regions?.of(code) ?? code)

// Where a search reader went next, said plainly
const nextPlace = (to: string) =>
  ({ left: 'left the site', '/article': 'another article', '/story': 'a story', '/': 'home' })[to] ?? to

const startLabel = (data: Observability) =>
  new Date(data.start)
    .toLocaleString('en-US', data.unit === 'hour' ? { hour: 'numeric' } : { month: 'short', day: 'numeric' })
    .toUpperCase()

/** A chapter, the way the resume opens one: its hand-drawn icon drawing in, then its name */
function Chapter({ icon: Icon, label, children }: { icon: HandDrawnIconComponent; label: string; children: React.ReactNode }) {
  return (
    <section className="mt-16 first:mt-10" aria-label={label}>
      <h2 data-hero-display className="visible article-title flex items-center gap-3 font-vt323 text-3xl leading-none text-[var(--foreground)] sm:text-4xl">
        <Icon className="hero-icon size-[1em] shrink-0" strokeWidth={1.6} themed />
        {label}
      </h2>
      {children}
    </section>
  )
}

/** The chapter's one sentence, its numbers in the theme color; "…" until they land */
function Said({ children }: { children: React.ReactNode }) {
  return <p className="mb-6 mt-4 max-w-3xl font-vt323 text-2xl leading-tight text-[var(--foreground)] sm:text-3xl">{children}</p>
}

function N({ children }: { children: React.ReactNode }) {
  const { colorValue } = useTheme()
  return <span style={{ color: colorValue }}>{children}</span>
}

/** The quiet line under a chapter: what to know about its numbers */
function Aside({ children }: { children: React.ReactNode }) {
  return <p className="mt-4 max-w-2xl font-space-grotesk text-xs text-[var(--text-muted)]">{children}</p>
}

/**
 * A whole split into its parts, as one line (TypeStatline's way): a segment
 * per part, as long as its share, drawn left to right, the biggest first and
 * each next one lighter; roomy parts carry their share and name on the line,
 * and every part reads in the legend under it
 */
function ShareLine({ parts, name, label }: { parts: Share[]; name: (key: string) => string; label: string }) {
  const { colorValue } = useTheme()
  const total = parts.reduce((n, p) => n + p.count, 0)
  if (!total) return null
  return (
    <InkStage className="mt-2">
      <InkSweep>
        <span className="flex w-full items-end gap-1">
        {parts.map((part, i) => (
          <span key={part.name} className="flex min-w-0 flex-col gap-2" style={{ flexGrow: part.count, flexBasis: 0 }} aria-hidden="true">
            {part.count / total >= 0.12 && (
              <span className="flex min-w-0 flex-col">
                <span className="font-vt323 text-xl leading-none text-[var(--foreground)]">{percent(part.count, total)}</span>
                <span className={`${LABEL} truncate`}>{name(part.name)}</span>
              </span>
            )}
            <span className="block h-1.5 w-full rounded-full" style={{ backgroundColor: colorValue, opacity: SHADES[i] ?? 0.2 }} />
          </span>
        ))}
        </span>
      </InkSweep>
      <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2" aria-label={label}>
        {parts.map((part, i) => (
          <li key={part.name}>
            <InkWord beat={8 + i} className="!flex items-center gap-2">
              <span className="size-2 rounded-full" style={{ backgroundColor: colorValue, opacity: SHADES[i] ?? 0.2 }} aria-hidden="true" />
              <span className="font-space-grotesk text-sm text-[var(--foreground)]">{name(part.name)}</span>
              <span className={LABEL}>{plural(part.count, 'visit')}</span>
            </InkWord>
          </li>
        ))}
      </ul>
    </InkStage>
  )
}

/**
 * Pages ranked as they were read: each one's cover and title, then a bar as
 * long as its reads against the most-read, drawn in one pass, and the count
 */
function Ranked({ pages, unit, note, covers = true }: { pages: ShownPage[]; unit: string; note?: (page: ShownPage) => string | null; covers?: boolean }) {
  const { colorValue } = useTheme()
  const max = Math.max(1, ...pages.map((p) => p.views))
  return (
    <InkStage>
      <ol className="space-y-4">
        {pages.map((page, i) => (
          <li key={page.path}>
            <InkWord beat={i} className="!flex items-center gap-3">
              {covers && <UnpppCircle src={page.cover ?? undefined} color={colorValue} size={28} />}
              {page.path.startsWith('/') ? (
                <Link href={page.path} className="min-w-0 flex-1 truncate font-space-grotesk text-sm text-[var(--foreground)] underline-offset-4 hover:underline">
                  {page.title}
                </Link>
              ) : (
                <span className="min-w-0 flex-1 truncate font-space-grotesk text-sm text-[var(--foreground)]">{page.title}</span>
              )}
              {note?.(page) && <span className={`${LABEL} hidden sm:inline`}>{note(page)}</span>}
              <span className="w-12 shrink-0 text-right font-vt323 text-xl leading-none" style={{ color: colorValue }} aria-label={plural(page.views, unit)}>
                {page.views.toLocaleString()}
              </span>
            </InkWord>
            <InkSweep beat={i + 2} className={`${covers ? 'ml-10' : ''} mr-14 mt-1.5`}>
              <span className="block h-1 rounded-full" style={{ width: `${(page.views / max) * 100}%`, backgroundColor: colorValue, opacity: 0.55 }} />
            </InkSweep>
          </li>
        ))}
      </ol>
    </InkStage>
  )
}

/** The range, as three words; the chosen one underlined in ink */
function RangeWords({ range, onChoose }: { range: Range; onChoose: (range: Range) => void }) {
  const { colorValue } = useTheme()
  return (
    <div role="radiogroup" aria-label="How far back" className="mt-3 flex items-center gap-6">
      {RANGES.map(({ id, word }) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={id === range}
          onClick={() => onChoose(id)}
          className="relative font-space-grotesk text-sm transition-colors"
          style={{ color: id === range ? 'var(--foreground)' : 'var(--text-muted)' }}
        >
          {word}
          {id === range && <InkUnderline key={id} color={colorValue} className="absolute -bottom-1.5 left-0 h-1.5 w-full" />}
        </button>
      ))}
    </div>
  )
}

/** Where a chart lands, until its numbers do: a faint line the chart's height */
function Waiting() {
  return <div className="h-32 border-b border-dashed border-[var(--text-muted)] opacity-30" aria-hidden="true" />
}

/**
 * ObservabilityAdminContent - who's reading the site, as the resume shows its
 * VIEWS.: each chapter opens on one sentence that carries its numbers, then
 * draws them in ink. Views (a line per hour or day, the pages read most), how
 * articles and stories are read and month by month (#664), search (Google's
 * count from GA4, and where a search reader went next), where readers are and
 * on what, and the events the site sent.
 *
 * The chapters stand as soon as it opens, their sentences waiting on one
 * answer from the drain (/api/admin/observability); Google's comes on its own
 * (./search), so a slow Google never holds the rest.
 */
export default function ObservabilityAdminContent() {
  const [range, setRange] = useState<Range>('30d')
  const { data, error } = useFetch<Observability>(`/api/admin/observability?range=${range}`)
  const { data: search, error: searchError } = useFetch<SearchData>(`/api/admin/observability/search?range=${range}`)
  // The month-by-month history, committed daily by the connect snapshot
  const { data: snapshot } = useFetch<ConnectSnapshot>('/data/connect-current.json')
  const months = snapshot?.months ?? []
  const phrase = RANGES.find((r) => r.id === range)!.phrase
  const wait = !data && !error
  const n = (value: number | undefined) => (value === undefined ? '…' : value.toLocaleString())

  const read = data ? data.content.views.article + data.content.views.story : undefined
  const fromSearch = data ? data.content.search.article + data.content.search.story : 0
  const landings = data?.content.next.reduce((sum, r) => sum + r.count, 0) ?? 0

  return (
    <div className="text-left">
      <h1 className="font-vt323 text-4xl uppercase leading-none text-[var(--foreground)]">observability.</h1>
      <RangeWords range={range} onChoose={setRange} />
      {error && <Said>couldn&apos;t read the analytics drain.</Said>}

      <Chapter icon={Eye} label="VIEWS.">
        {data && data.pageviews === 0 ? (
          <Said>nobody&apos;s read anything {phrase}.</Said>
        ) : (
          <Said>
            <N>{n(data?.visitors)}</N> {data?.visitors === 1 ? 'person' : 'people'} read <N>{n(data?.pageviews)}</N> pages {phrase}.
          </Said>
        )}
        {wait && <Waiting />}
        {data && data.pageviews > 0 && <ViewsChart key={range} days={data.buckets} top={data.top} labels={[startLabel(data), 'NOW']} />}
      </Chapter>

      <Chapter icon={BookOpen} label="READ.">
        {data && read === 0 ? (
          <Said>no articles or stories read {phrase}.</Said>
        ) : (
          <Said>
            articles were read <N>{n(data?.content.views.article)}</N> times, stories <N>{n(data?.content.views.story)}</N>.
          </Said>
        )}
        {wait && <Waiting />}
        {data && data.content.top.length > 0 && (
          <Ranked key={range} pages={data.content.top} unit="read" note={(p) => (p.search ? `${p.search} from search` : null)} />
        )}
        {months.length > 1 ? (
          <div className="mt-10">
            <p className={`${LABEL} mb-2`}>month by month, kept past the drain&apos;s 30 days</p>
            <InkTimeline
              label="Articles and stories read, a running total by month"
              series={[
                { name: 'articles', months: months.map((m) => ({ month: m.month, count: m.views.article, total: 0 })) },
                { name: 'stories', months: months.map((m) => ({ month: m.month, count: m.views.story, total: 0 })) },
              ]}
            />
          </div>
        ) : (
          months.length === 1 && <Aside>Month by month starts with {months[0].month}: the line draws once a second month is kept.</Aside>
        )}
      </Chapter>

      <Chapter icon={Search} label="SEARCH.">
        {search && !search.connected ? (
          <Said>google search isn&apos;t connected.</Said>
        ) : searchError ? (
          <Said>google analytics didn&apos;t answer.</Said>
        ) : (
          <Said>
            google sent <N>{n(search?.sessions)}</N> {search?.sessions === 1 ? 'reader' : 'readers'} to articles and stories {phrase}.
          </Said>
        )}
        {!search && !searchError && <Waiting />}
        {search?.connected && search.top.length > 0 && <Ranked key={range} pages={search.top} unit="session" />}
        {search && !search.connected && (
          <div className="border-y border-[var(--text-muted)]/20">
            <DisclosureRow title="connect it" detail="Google Analytics, read through a service account">
              <p className="max-w-2xl font-space-grotesk text-sm text-[var(--text-muted)]">
                Set GA4_PROPERTY_ID (the numeric property ID), GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY, then add that service account as a Viewer in GA4 (Admin → Property access).
              </p>
            </DisclosureRow>
          </div>
        )}

        {landings > 0 && (
          <div className="mt-10">
            <p className="mb-4 font-space-grotesk text-sm text-[var(--foreground)]">
              After a search visit the site saw, {plural(landings, 'reader')}:
            </p>
            <ShareLine key={range} parts={data!.content.next.map((r) => ({ name: r.to, count: r.count }))} name={nextPlace} label="Where search readers went next" />
          </div>
        )}
        {data && (
          <Aside>
            {`The site's own analytics saw ${plural(fromSearch, 'visit')} arrive from a search engine. Most visits come with no referrer, and analytics run only for visitors who accept cookies, so Google's count is the truer one.`}
          </Aside>
        )}
      </Chapter>

      <Chapter icon={Globe} label="WHERE.">
        {data && data.countries.length > 0 ? (
          <Said>
            mostly from <N>{country(data.countries[0].name)}</N>
            {data.devices[0] && <>, on <N>{data.devices[0].name}</N></>}.
          </Said>
        ) : (
          <Said>{data ? `nowhere to show ${phrase}.` : '…'}</Said>
        )}
        {wait && <Waiting />}
        {data && (
          <div className="space-y-10">
            <ShareLine key={`c-${range}`} parts={data.countries} name={country} label="Visits by country" />
            <ShareLine key={`d-${range}`} parts={data.devices} name={(d) => d} label="Visits by device" />
          </div>
        )}
      </Chapter>

      {data && data.events.length > 0 && (
        <Chapter icon={Zap} label="EVENTS.">
          <Said>
            the site sent <N>{plural(data.events.reduce((sum, e) => sum + e.count, 0), 'event')}</N> {phrase}.
          </Said>
          <Ranked key={range} pages={data.events.map((e) => ({ path: e.name, title: e.name.replace(/_/g, ' '), cover: null, views: e.count }))} unit="time" covers={false} />
        </Chapter>
      )}
    </div>
  )
}
