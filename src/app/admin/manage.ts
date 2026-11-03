import { FileText, Users, MessageSquare, BookOpen, Lightbulb, Activity, TrendingUp, HelpCircle, List, Send, Eraser, GitBranch } from '@/app/components/icons'
import type { HandDrawnIconComponent } from '@/app/components/icons'
import { UNPARTY_BUTTON } from '@/lib/unparty-refs'

// Everything the owner manages, in the order they reach for it. Each opens in
// the admin modal from here (the @modal intercepting routes)
export const MANAGE: Array<{ href: string; label: string; detail: string; icon: HandDrawnIconComponent }> = [
  { href: '/admin/problems', label: 'Problems', detail: 'every worksheet, newest first', icon: Lightbulb },
  { href: '/admin/submissions', label: 'Submissions', detail: 'review and approve', icon: Send },
  { href: '/admin/steps', label: 'Steps', detail: 'the curriculum and its order', icon: List },
  { href: '/admin/questions', label: 'Questions', detail: 'what steps ask', icon: HelpCircle },
  { href: '/admin/responses', label: 'Responses', detail: 'what people answered', icon: MessageSquare },
  { href: '/admin/stories', label: 'Stories', detail: 'write them here, starting with why', icon: BookOpen },
  { href: '/admin/articles', label: 'Articles', detail: 'write them here, section by section', icon: FileText },
  { href: '/admin/repositories', label: 'Repositories', detail: "your repos and what they've released", icon: GitBranch },
  { href: '/admin/users', label: 'Users', detail: 'who signed up', icon: Users },
  { href: '/admin/progress', label: 'Progress', detail: 'how far each person got', icon: TrendingUp },
  { href: '/admin/books', label: 'Books', detail: 'inventory and claims', icon: BookOpen },
  { href: '/admin/observability', label: 'Observability', detail: 'pageviews and traces', icon: Activity },
  { href: UNPARTY_BUTTON.href, label: 'Make it yours', detail: 'unparty references left to replace', icon: Eraser },
]
