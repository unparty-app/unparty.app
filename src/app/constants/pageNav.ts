import { Activity, BookOpen, Boxes, Camera, FileText, HelpCircle, Info, MessageSquare, PartyPopper, Palette, Settings, Shield, User } from '@/app/components/icons'
import type { HandDrawnIconComponent } from '@/app/components/icons'
import UnpppTypesConfig from '@/data/UnpppTypesConfig.json'
import { UNPPP_NAV_ITEMS, type NavCategory } from './unpppNav'

// Where the visitor is, for the Header: the section a page belongs to, drawn
// as its hand-drawn icon in a circle beside the peace circle, linking to the
// section's front. Home and the unppp project pages (/theunparty…) have none:
// their name already says where you are.

export interface PageNav {
  label: string
  href: string
  icon: HandDrawnIconComponent
  // The section's own color (a type hub's), else the theme color
  color?: string
  // A type hub's type: the header's circle opens its effort there
  type?: NavCategory
}

// The owner's spaces, kept in the unppp nav tray for every page
export const SPACES: PageNav[] = [
  { label: 'party', href: '/party', icon: PartyPopper },
  { label: 'admin', href: '/admin', icon: Settings },
]

// Where a builder prices their stack and picks components: the third space
// the widget tray opens, beside party and admin (widgetRegistry)
export const BUILD_SPACE: PageNav = { label: 'build', href: '/build', icon: Boxes }

const FOUNDERS: PageNav = { label: 'founders', href: '/founders', icon: User }
const ABOUT: PageNav = { label: 'about', href: '/about', icon: Info }
const CONNECT: PageNav = { label: 'connect', href: '/connect', icon: MessageSquare }

// What the unppp nav tray leads with until the owner has a project
// (`projects` in FoundersConfig): who they are, then about, build, connect
export const SITE_PAGES: PageNav[] = [FOUNDERS, ABOUT, BUILD_SPACE, CONNECT]

// Sections by their first path segment
const SECTIONS: Record<string, PageNav> = {
  party: SPACES[0],
  admin: SPACES[1],
  article: { label: 'articles', href: '/article', icon: FileText },
  story: { label: 'stories', href: '/covers', icon: BookOpen },
  covers: { label: 'covers', href: '/covers', icon: Camera },
  build: BUILD_SPACE,
  about: ABOUT,
  connect: CONNECT,
  founders: FOUNDERS,
  faq: { label: 'faq', href: '/faq', icon: HelpCircle },
  status: { label: 'status', href: '/status', icon: Activity },
  color: { label: 'color', href: '/color', icon: Palette },
  privacy: { label: 'privacy', href: '/privacy', icon: Shield },
  terms: { label: 'terms', href: '/terms', icon: Shield },
}

export function pageNavFor(pathname: string): PageNav | null {
  const [first, second] = pathname.split('/').filter(Boolean)
  if (!first || first.startsWith('theunparty')) return null

  // A type hub: its own icon, in its own color
  if (first === 'unppp' && second) {
    const item = UNPPP_NAV_ITEMS.find((i) => i.category === second)
    const type = UnpppTypesConfig.types.find((t) => t.id === second)
    if (item) return { label: item.label.replace(/\.$/, '').toLowerCase(), href: `/unppp/${second}`, icon: item.icon, color: type?.color, type: item.category }
  }

  return SECTIONS[first] ?? null
}
