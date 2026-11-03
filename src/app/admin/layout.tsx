'use client'

import { useAuth } from '@/lib/auth-stub.client'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { CircleArrowLeft } from '@/app/components/icons'
import ScrollRow from '../../components/HorizontalRow'
import DiscoBallScene from '../../components/DiscoBall'

// The admin shell stays out of the way and uses the whole screen on wide ones:
// /admin is the settings page, and each page it opens gets the page itself plus
// a way back. The modal slot overlays a page opened from /admin (@modal routes)
export default function AdminLayout({
  children,
  modal,
}: {
  children: React.ReactNode
  modal: React.ReactNode
}) {
  const { isLoaded, userId } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (isLoaded && !userId) router.push('/sign-in')
  }, [isLoaded, userId, router])

  if (!isLoaded || !userId) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
        <div className="font-vt323 text-lg" style={{ color: 'var(--text-muted)' }}>thinking...</div>
      </div>
    )
  }

  return (
    // Full-bleed past the root layout's max-w-screen-lg (the article pattern), then
    // as wide as a settings window should get
    <div className="mx-[calc(50%-50vw)] w-screen py-12">
      <div className="mx-auto w-full max-w-[1920px] px-4 sm:px-6 lg:px-12">
      {pathname !== '/admin' && (
        <Link
          href="/admin"
          className="mb-8 inline-flex items-center gap-2 font-google-sans-code text-[10px] uppercase tracking-wide text-[var(--text-muted)] transition-colors hover:text-[var(--theme-color,_#f9c22e)]"
        >
          <CircleArrowLeft size={16} strokeWidth={1} themed /> settings.
        </Link>
      )}

      <div className="w-full">{children}</div>

      {modal}

      <ScrollRow
        items={[<DiscoBallScene key="disco-ball-scene" lightingMode="chill" color="#616266" />]}
        moreLink="/party"
        maxItems={2}
      />
      </div>
    </div>
  )
}
