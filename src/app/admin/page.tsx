'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useFetch } from '@/hooks/useFetch'
import { useTheme } from '../contexts/ThemeContext'
import { Activity, Globe, Settings, Cloud, Wrench } from '@/app/components/icons'
import { InkCheck, InkUnderline } from '../components/depend/ink'
import StepPhotoScrollRow from '../components/StepPhotoScrollRow'
import { SITE_TITLE, SITE_URL, FOUNDER, BRAND_COLORS } from '../constants/organization'
import { BRAND_COLOR } from '../constants/colors'
import BrandColorsSetup from '../components/brand-colors/BrandColorsSetup'
import IconDrawPad from '../components/icons/IconDrawPad'
import IconDefaults from '../components/icons/IconDefaults'
import WordTags from '../components/WordTags'
import YourAnswers from '../components/YourAnswers'
import TellUnparty from '../components/TellUnparty'
import DoubtsEditor from './components/DoubtsEditor'
import { UNPARTY_BUTTON } from '@/lib/unparty-refs'
import { MANAGE } from './manage'
import type { ServiceStatus } from '../api/admin/services/route'
import { SettingsGroup, SettingsNav, LinkRow, ValueRow, ToggleRow, DisclosureRow } from './components/Settings'
import ActivityFeed from './ActivityFeed'



// The groups, in sidebar order (wide screens) and page order (phones)
const GROUPS = [
  { id: 'site', label: 'Your site', icon: Globe },
  { id: 'features', label: 'Switches', icon: Settings },
  { id: 'services', label: 'Services', icon: Cloud },
  { id: 'manage', label: 'Manage', icon: Wrench },
  { id: 'activity', label: 'Activity', icon: Activity },
] as const
type GroupId = (typeof GROUPS)[number]['id']

function ServiceRow({ service }: { service: ServiceStatus }) {
  const { colorValue } = useTheme()
  const set = service.env.filter((e) => e.set).length
  const state = set === service.env.length ? 'connected' : set === 0 ? (service.optional ? 'off' : 'missing') : 'partly set'
  return (
    <DisclosureRow
      title={service.title}
      value={state}
      dot={set === service.env.length ? colorValue : set === 0 ? 'empty' : `${colorValue}80`}
    >
      <p className="mb-3 max-w-2xl font-space-grotesk text-xs text-[var(--text-muted)]">{service.description}</p>
      <ul className="mb-3 space-y-1">
        {service.env.map((e) => (
          <li key={e.name} className="flex items-center gap-2 font-google-sans-code text-[11px] text-[var(--foreground)]">
            {e.set ? <InkCheck color={colorValue} /> : <span aria-hidden="true" className="size-4 text-center text-[var(--text-muted)]">·</span>}
            <span className={e.set ? '' : 'text-[var(--text-muted)]'}>{e.name}</span>
            <span className="sr-only">{e.set ? 'set' : 'not set'}</span>
          </li>
        ))}
      </ul>
      {service.link && (
        <Link href={service.link} className="font-google-sans-code text-[10px] uppercase tracking-wide text-[var(--text-muted)] transition-colors hover:text-[var(--theme-color,_#f9c22e)]">
          how to set it up →
        </Link>
      )}
    </DisclosureRow>
  )
}

/**
 * /admin as one settings page: your site, the switches, the services it runs
 * on, the things you manage, and your activity
 */
export default function AdminSettings() {
  const { colorValue } = useTheme()
  const { data: servicesData } = useFetch<{ services: ServiceStatus[] }>('/api/admin/services')
  // The one number worth showing: brand references left in this copy (/admin/unparty)
  const { data: refs } = useFetch<{ measured: boolean; done: boolean; remaining: number }>('/api/admin/unparty-refs?summary=1')
  const refsValue = !refs ? undefined : !refs.measured ? 'not counted' : refs.done ? 'done' : refs.remaining.toLocaleString()
  const services = servicesData?.services ?? []

  // Keyword highlighting, an AppSetting (/api/admin/settings)
  const [keywords, setKeywords] = useState<boolean | null>(null)
  const [saving, setSaving] = useState(false)
  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((d) => setKeywords(d.keywordHighlightingEnabled ?? true))
      .catch(() => setKeywords(true))
  }, [])
  const toggleKeywords = async () => {
    if (keywords === null || saving) return
    const next = !keywords
    setSaving(true)
    setKeywords(next)
    try {
      const r = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywordHighlightingEnabled: next }),
      })
      if (!r.ok) setKeywords(!next)
    } catch {
      setKeywords(!next)
    } finally {
      setSaving(false)
    }
  }

  // FoundersConfig.json switches: instant on a local copy, a pull request on a deployed one
  const [waitlist, toggleWaitlist] = useConfigSwitch('/api/admin/waitlist')
  const [privateRepos, togglePrivateRepos] = useConfigSwitch('/api/admin/private-repos')
  const waitlistDetail = waitlist.error
    ?? (waitlist.prUrl
      ? `turning ${waitlist.on ? 'on' : 'off'} once the change deploys`
      : waitlist.on
        ? 'new sign-ups wait for your approval before /party'
        : 'anyone signed in can open /party')
  const privateReposDetail = privateRepos.error
    ?? (privateRepos.prUrl
      ? `${privateRepos.on ? 'showing' : 'hiding'} them from the build after the change deploys`
      : privateRepos.on
        ? "Repo Focus shows your private repos' names and hours"
        : 'Repo Focus shows public repos only')

  // Wide screens show one group at a time, chosen in the sidebar and kept in the URL hash
  const [active, setActive] = useState<GroupId>('site')
  useEffect(() => {
    const fromHash = () => {
      const id = window.location.hash.slice(1)
      if (GROUPS.some((g) => g.id === id)) setActive(id as GroupId)
    }
    fromHash()
    window.addEventListener('hashchange', fromHash)
    return () => window.removeEventListener('hashchange', fromHash)
  }, [])
  const choose = (id: string) => {
    setActive(id as GroupId)
    history.replaceState(null, '', `#${id}`)
  }
  const connected = services.filter((s) => s.env.every((e) => e.set)).length

  const required = services.filter((s) => !s.optional)
  const optional = services.filter((s) => s.optional)

  return (
    <div>
      <div className="mb-10 lg:mb-14">
        {/* A plain heading, not the article hero: the hero breaks out to the screen edge,
            and settings line up with their own column on every width */}
        <h1 className="font-vt323 text-5xl uppercase leading-none text-[var(--foreground)] sm:text-6xl">admin.</h1>
        <InkUnderline color={colorValue} className="mt-2 h-2 w-28" />
        <p className="mt-4 font-google-sans-code text-sm uppercase text-[var(--foreground)] opacity-70">settings for {SITE_TITLE}.</p>
      </div>

      <div className="lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-16">
      <SettingsNav
        groups={GROUPS.map((g) => ({
          ...g,
          value: g.id === 'services' && services.length ? `${connected}/${services.length}` : undefined,
        }))}
        active={active}
        onChoose={choose}
      />
      <div>
      <SettingsGroup id="site" active={active === 'site'} wide label="your site." note="Who the site is. It lives in src/data/FoundersConfig.json.">
        <ValueRow title="Name" value={SITE_TITLE} />
        <ValueRow title="Address" value={SITE_URL.replace(/^https?:\/\//, '')} />
        <ValueRow title="Founder" value={FOUNDER.name} />
        {/* The rings open in place: change one color or all five (FoundersConfig
            brandColors). Full width, so opening it doesn't stretch its neighbours */}
        <div className="xl:col-span-full">
          <DisclosureRow title="Brand colors" detail="your site's color, and the ones your visitors pick from" dot={BRAND_COLOR} value={`${BRAND_COLORS.length} of 5`}>
            <div className="pt-4">
              <BrandColorsSetup placement="admin" />
            </div>
          </DisclosureRow>
        </div>
        {/* Every icon, redrawn in the owner's hand (FoundersConfig icons) */}
        <div className="xl:col-span-full">
          <DisclosureRow title="Your icons" detail="draw the site's icons in your own hand">
            <div className="pt-4">
              <IconDrawPad mode="owner" />
            </div>
          </DisclosureRow>
        </div>
        {/* The icon each role uses by default, picked from those (#589) */}
        <div className="xl:col-span-full">
          <DisclosureRow title="Your defaults" detail="the icons your poems and categories use">
            <div className="pt-4">
              <IconDefaults />
            </div>
          </DisclosureRow>
        </div>
        {/* The tag step: the site's words, each tagged with the kind of build it points to (#389) */}
        <div className="xl:col-span-full">
          <DisclosureRow title="Your words" detail="tag the words your site keeps using with the kind of build they point to">
            <div className="pt-4">
              <WordTags />
            </div>
          </DisclosureRow>
        </div>
        {/* The challenge's questions, answered by the owner: public, and counted with their writing (#265) */}
        <div className="xl:col-span-full">
          <DisclosureRow title="Your answers" detail="your problem, your solution and what you need, in your own words">
            <div className="pt-4">
              <YourAnswers />
            </div>
          </DisclosureRow>
        </div>
        {/* The onboarding's ending: tell unparty you built yours (#589) */}
        <div className="xl:col-span-full">
          <DisclosureRow title="Tell unparty you built yours" detail="your card on unparty.app/builds, once, if you want">
            <div className="pt-4">
              <TellUnparty />
            </div>
          </DisclosureRow>
        </div>
        {/* Words the founder flags in their own writing: private, shown only
            to them on /founders with where each one turns up */}
        <div className="xl:col-span-full">
          <DisclosureRow title="Your doubts" detail="what you flag in your writing; only you see them">
            <div className="pt-2">
              <DoubtsEditor />
            </div>
          </DisclosureRow>
        </div>
        <ToggleRow
          title="Waitlist"
          detail={waitlistDetail}
          on={waitlist.on}
          onToggle={toggleWaitlist}
          disabled={waitlist.saving || !waitlist.canChange}
        />
        {waitlist.prUrl && (
          <LinkRow href={waitlist.prUrl} title="See the change" detail="the pull request that flips it, on once it deploys" />
        )}
        <LinkRow href="/article/setup-identity" title="Change who the site is" detail="name, address, founder" />
      </SettingsGroup>

      <SettingsGroup id="features" active={active === 'features'} label="switches.">
        <ToggleRow
          title="Keyword highlighting"
          detail="highlight tracked keywords in articles and stories"
          on={keywords}
          onToggle={toggleKeywords}
          disabled={saving}
        />
        <ToggleRow
          title="Private repos"
          detail={privateReposDetail}
          on={privateRepos.on}
          onToggle={togglePrivateRepos}
          disabled={privateRepos.saving || !privateRepos.canChange}
        />
        {privateRepos.prUrl && (
          <LinkRow href={privateRepos.prUrl} title="See the change" detail="the pull request that flips it, on once it deploys" />
        )}
      </SettingsGroup>

      <SettingsGroup id="services" active={active === 'services'} wide label="services." note="What this deployment is connected to. Only whether each key is set, never its value.">
        {services.length === 0 && <ValueRow title="Checking…" value="" />}
        {required.map((s) => <ServiceRow key={s.key} service={s} />)}
        {optional.map((s) => <ServiceRow key={s.key} service={s} />)}
      </SettingsGroup>

      <SettingsGroup id="manage" active={active === 'manage'} wide label="manage.">
        {MANAGE.map((m) => <LinkRow key={m.href} href={m.href} icon={m.icon} title={m.label} detail={m.detail} value={m.href === UNPARTY_BUTTON.href ? refsValue : undefined} />)}
      </SettingsGroup>

      <SettingsGroup id="activity" active={active === 'activity'} label="activity.">
        <DisclosureRow title="What you've been doing" detail="pages visited, milestones, ideas" defaultOpen>
          <ActivityFeed />
        </DisclosureRow>
        <DisclosureRow title="Uploaded photos" detail="every photo from photo steps">
          <StepPhotoScrollRow scope="everyone" />
        </DisclosureRow>
      </SettingsGroup>
      </div>
      </div>
    </div>
  )
}

interface ConfigSwitch {
  on: boolean | null
  canChange: boolean
  saving: boolean
  prUrl?: string
  error?: string
}

/** A FoundersConfig.json switch behind an admin route (GET { on, canChange }, POST { on }) */
function useConfigSwitch(url: string): [ConfigSwitch, () => Promise<void>] {
  const [state, setState] = useState<ConfigSwitch>({ on: null, canChange: false, saving: false })
  useEffect(() => {
    fetch(url)
      .then((r) => r.json())
      .then((d) => setState((s) => ({ ...s, on: d.on, canChange: d.canChange })))
      .catch(() => {})
  }, [url])
  const toggle = async () => {
    if (state.on === null || state.saving) return
    const next = !state.on
    setState((s) => ({ ...s, saving: true, error: undefined }))
    try {
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ on: next }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      setState((s) => ({ ...s, on: next, saving: false, prUrl: d.prUrl }))
    } catch (e) {
      setState((s) => ({ ...s, saving: false, error: e instanceof Error ? e.message : 'Could not change it' }))
    }
  }
  return [state, toggle]
}
