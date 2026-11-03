
import { Smartphone, Layers, MessageSquare, BookOpen, Cpu, Code2, Hammer, Bot } from '@/app/components/icons'
import type { HandDrawnIconComponent } from '@/app/components/icons'
export type NavCategory = 'app' | 'agent' | 'service' | 'assistant' | 'library' | 'framework' | 'tool' | 'bot'

export interface UnpppNavItem {
  category: NavCategory
  label: string
  icon: HandDrawnIconComponent
  href: string | null // null = intentionally not ready yet
}

// Order: APP. first (confirmed), then by ref classification % descending
// agent 22.6%, service 22.6%, assistant 16.1%, library 16.1%, framework 12.9%, tool 0%, bot 0%
// To activate a category: set href to the route string — nothing else changes.
export const UNPPP_NAV_ITEMS: UnpppNavItem[] = [
  { category: 'app',       label: 'APP.',       icon: Smartphone,    href: '/theunpartyunppp' },
  { category: 'agent',     label: 'AGENT.',     icon: Cpu,           href: null },
  { category: 'service',   label: 'SERVICE.',   icon: Layers,        href: null },
  { category: 'assistant', label: 'ASSISTANT.', icon: MessageSquare, href: null },
  { category: 'library',   label: 'LIBRARY.',   icon: BookOpen,      href: null },
  { category: 'framework', label: 'FRAMEWORK.', icon: Code2,         href: null },
  { category: 'tool',      label: 'TOOL.',      icon: Hammer,        href: null },
  { category: 'bot',       label: 'BOT.',       icon: Bot,           href: null },
]
