'use client'

import Link from 'next/link'
import { ChevronRight, ChevronDown } from '@/app/components/icons'
import type { HandDrawnIconComponent } from '@/app/components/icons'
import { InkRing, InkUnderline } from '../../components/depend/ink'
import { useTheme } from '../../contexts/ThemeContext'

// The building blocks of /admin as a settings page: labeled groups of plain
// rows, divided by thin theme-color lines. A row is a link, a toggle, a value,
// or a disclosure that opens in place (native <details>, so it works with no JS)

const LABEL = 'font-google-sans-code text-[10px] uppercase tracking-wide text-[var(--text-muted)]'
const ROW = 'flex min-h-14 w-full items-center gap-3 py-3 text-left'

/**
 * A labeled group of rows. `active` is for the wide two-pane layout: from lg up
 * only the chosen group shows (phones list every group). `wide` lays the rows in
 * two columns from xl up (three from 2xl), each row keeping its own divider
 */
export function SettingsGroup({ id, label, note, active = true, wide = false, children }: {
  id: string
  label: string
  note?: string
  active?: boolean
  wide?: boolean
  children: React.ReactNode
}) {
  const { colorValue } = useTheme()
  return (
    <section
      aria-labelledby={`${id}-label`}
      id={id}
      className={`mb-12 scroll-mt-28 text-left lg:mb-0 ${active ? 'lg:animate-[fade-slide-in_300ms_ease-out] motion-reduce:animate-none' : 'lg:hidden'}`}
    >
      <h2 id={`${id}-label`} className={`mb-1 ${LABEL} lg:font-vt323 lg:text-3xl lg:normal-case lg:tracking-normal lg:text-[var(--foreground)]`}>{label}</h2>
      {note && <p className="mb-2 max-w-2xl font-space-grotesk text-xs text-[var(--text-muted)] lg:mb-6 lg:text-sm">{note}</p>}
      <div
        className={`border-t border-[var(--row-line)] [&>*]:border-b [&>*]:border-[var(--row-line)] ${wide ? 'xl:grid xl:grid-cols-2 xl:gap-x-12 2xl:grid-cols-3' : ''}`}
        style={{ ['--row-line' as string]: `${colorValue}20` }}
      >
        {children}
      </div>
    </section>
  )
}

/** The wide layout's sidebar: every group, the chosen one circled in ink */
export function SettingsNav({ groups, active, onChoose, label = 'Settings' }: {
  groups: Array<{ id: string; label: string; icon: HandDrawnIconComponent; value?: string }>
  active: string
  onChoose: (id: string) => void
  label?: string
}) {
  const { colorValue } = useTheme()
  return (
    <nav aria-label={label} className="sticky top-28 hidden self-start lg:block">
      <ul className="space-y-1">
        {groups.map(({ id, label, icon: Icon, value }) => {
          const on = id === active
          return (
            <li key={id}>
              <a
                href={`#${id}`}
                onClick={(e) => { e.preventDefault(); onChoose(id) }}
                aria-current={on ? 'page' : undefined}
                className="relative flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-[var(--background-highlight)]"
                style={{ color: on ? 'var(--foreground)' : 'var(--text-muted)' }}
              >
                <Icon size={18} strokeWidth={1.3} color={on ? colorValue : undefined} />
                <span className="flex-1 font-space-grotesk text-sm">{label}</span>
                {value && <span className={LABEL}>{value}</span>}
                {on && <InkUnderline key={id} color={colorValue} className="absolute bottom-1 left-10 h-1.5 w-16" />}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

function RowText({ title, detail }: { title: string; detail?: string }) {
  return (
    <span className="min-w-0 flex-1">
      <span className="block font-space-grotesk text-sm text-[var(--foreground)]">{title}</span>
      {detail && <span className="block truncate font-space-grotesk text-xs text-[var(--text-muted)]">{detail}</span>}
    </span>
  )
}

/** A row that goes somewhere: icon (or `leading`, like a cover circle), name, an optional count or value, then a chevron */
export function LinkRow({ href, icon: Icon, leading, title, detail, value }: { href: string; icon?: HandDrawnIconComponent; leading?: React.ReactNode; title: string; detail?: string; value?: string }) {
  return (
    <Link href={href} className={`${ROW} group transition-colors hover:bg-[var(--background-highlight)]`}>
      {leading ?? (Icon && <Icon size={18} strokeWidth={1.3} themed className="shrink-0" />)}
      <RowText title={title} detail={detail} />
      {value && <span className={LABEL}>{value}</span>}
      <ChevronRight size={16} strokeWidth={1.3} className="shrink-0 text-[var(--text-muted)] transition-transform group-hover:translate-x-0.5" />
    </Link>
  )
}

/** A row that shows a fact: name on the left, its value on the right */
export function ValueRow({ title, detail, value }: { title: string; detail?: string; value: React.ReactNode }) {
  return (
    <div className={ROW}>
      <RowText title={title} detail={detail} />
      <span className={`${LABEL} max-w-[50%] truncate text-right`}>{value}</span>
    </div>
  )
}

/** An on/off row, the hand-drawn ring /build uses for the stack: a tick when on */
export function ToggleRow({ title, detail, on, onToggle, disabled }: { title: string; detail?: string; on: boolean | null; onToggle: () => void; disabled?: boolean }) {
  const { colorValue } = useTheme()
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on ?? false}
      onClick={onToggle}
      disabled={disabled || on === null}
      className={`${ROW} transition-colors hover:bg-[var(--background-highlight)] disabled:cursor-wait`}
    >
      <RowText title={title} detail={detail} />
      <span className={LABEL}>{on === null ? '…' : on ? 'on' : 'off'}</span>
      <InkRing key={String(on)} color={colorValue} on={Boolean(on)} />
    </button>
  )
}

/** A row that opens in place to show more (the chevron turns) */
export function DisclosureRow({ title, detail, value, dot, defaultOpen, children }: {
  title: string
  detail?: string
  value?: string
  /** A status dot before the title: a color, or 'empty' for an outlined one */
  dot?: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  return (
    <details className="group/d" open={defaultOpen}>
      <summary className={`${ROW} cursor-pointer list-none transition-colors hover:bg-[var(--background-highlight)] [&::-webkit-details-marker]:hidden`}>
        {dot && (
          <span
            aria-hidden="true"
            className="size-2.5 shrink-0 rounded-full"
            style={dot === 'empty' ? { boxShadow: 'inset 0 0 0 1.5px var(--text-muted)' } : { backgroundColor: dot }}
          />
        )}
        <RowText title={title} detail={detail} />
        {value && <span className={LABEL}>{value}</span>}
        <ChevronDown size={16} strokeWidth={1.3} className="shrink-0 text-[var(--text-muted)] transition-transform duration-300 group-open/d:rotate-180" />
      </summary>
      <div className="pb-4 pl-0">{children}</div>
    </details>
  )
}
