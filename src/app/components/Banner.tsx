'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from '../contexts/ThemeContext'
import { useArticleHeader } from '../contexts/ArticleHeaderContext'
import { useMusicTrackMetadata } from '@/hooks/useMusicTrackMetadata'
import { parseMarkdownText } from '../utils/textParsing'
import AuthorAvatar from './editorial/AuthorAvatar'
import { authorImageOf } from '@/lib/author-image'
import MusicBanner from './MusicBanner'
import ThemeColorPicker from './ThemeColorPicker'
import ArticleMetadataModal from './editorial/ArticleMetadataModal'
import coverColorsJson from '../covers/cover-colors.json'
import { getCoverIdFromFilename } from '../covers/covers-data'
import { ICON_DEFAULTS } from '../constants/organization'
import NamedIcon, { hasNamedIcon } from './icons/NamedIcon'

/**
 * The article byline dock, floating at the bottom of the screen. When an
 * article page is active (EditorialArticle publishes itself via
 * ArticleHeaderContext), it renders avatar · title · category · subtitle ·
 * spacer · theme song · mood button. When no article is active it renders
 * nothing — the unppp nav pills that used to live here are in the header's
 * UnpppNavTray.
 *
 * It used to sit under the Header inside #site-chrome; at the bottom the top
 * chrome is just the slim header, so covers start higher and get more of the
 * screen. The dock runs the full width at the Fab's height and bottom offset,
 * and leaves a pocket at its right end exactly as wide as the Fab (--fab-width,
 * published by Fab.tsx), so the Fab sits inside the bar instead of on top of
 * its content. The Fab stays its own component, in the same spot on every page.
 */
export default function Banner() {
  const { colorValue } = useTheme()
  const { article, dockAction } = useArticleHeader()
  const pathname = usePathname()
  const [isMetadataModalOpen, setIsMetadataModalOpen] = useState(false)

  // Fetch the article's theme song (inputs are undefined when no article)
  const { track: musicTrack, loading: isMusicLoading } = useMusicTrackMetadata({
    trackId: article?.musicTrackId,
    appleUrl: article?.appleMusicUrl,
    enhanced: true,
  })

  if (!article) return null

  // Category pill toggles between the visual article and its reader version.
  // Stories are rendered through this same shared Banner (converted to
  // EditorialArticle shape), so the base path must follow sourceRoute —
  // hardcoding '/article' here 404'd the reader toggle for every story.
  // Its own author's picture, else the owner's avatar (FoundersConfig founder.image)
  const authorImage = authorImageOf(article.authorImage)
  const basePath = article.sourceRoute === 'story' ? '/story' : '/article'
  const visualHref = `${basePath}/${article.slug}`
  const isReaderView = pathname === `${visualHref}/read`
  const pillHref = isReaderView ? visualHref : `${visualHref}/read`
  // An unppp page can embed its story article while it's still unpublished;
  // its /article/<slug> and /read routes 404, so the pill doesn't link there
  const hasReader = article.published !== false
  const pillClass = 'inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 font-vt323 text-xs font-bold uppercase tracking-wide'
  const pillStyle = { backgroundColor: `${colorValue}20`, borderColor: `${colorValue}40`, color: colorValue }
  // The category as a hand-drawn icon (#589): the article's own, or for an
  // emoji category the owner's default; a word category stays a word
  const emojiCategory = !/[\p{L}\p{N}]/u.test(article.category)
  const categoryFallback = emojiCategory ? ICON_DEFAULTS.category : undefined
  const category = hasNamedIcon(article.categoryIcon, categoryFallback) ? (
    <>
      <NamedIcon name={article.categoryIcon} fallback={categoryFallback} size={14} strokeWidth={1.8} />
      {!emojiCategory && <span className="ml-1">{article.category}</span>}
      <span className="sr-only">{emojiCategory ? 'category' : ''}</span>
    </>
  ) : (
    article.category
  )

  // ISO 8601 byline dates — same derivation the in-page header used
  const createdLabel = article.startedAt
    ? `started ${new Date(article.startedAt).toISOString().slice(0, 7)}`
    : article.date
      ? new Date(article.date).toISOString().slice(0, 10)
      : null

  const updatedLabel = article.updated
    ? new Date(article.updated).toISOString().slice(0, 10)
    : null

  // Cover-derived mood palette for the color picker; a color cover's own
  // color when it's a hex ('theme' is already the picker's color)
  const coverPalette = article.coverImage
    ? (coverColorsJson as Record<string, string[]>)[
        getCoverIdFromFilename(article.coverImage.split('/').pop() ?? '')
      ]
    : article.coverColor && /^#[0-9a-f]{3,6}$/i.test(article.coverColor)
      ? [article.coverColor]
      : undefined

  return (
    <>
      {/* inset-x-4 / bottom-4 and h-14 / sm:h-16 match the Fab, whose right
          edge lands on the dock's; the pocket is the Fab's width + a 12px gap */}
      <div className="fixed inset-x-4 bottom-4 z-40">
        <div
          className="relative flex h-14 items-center gap-2 rounded-full border bg-background/85 shadow-lg backdrop-blur-md sm:h-16 sm:gap-3"
          style={{ borderColor: `${colorValue}40`, paddingRight: 'calc(var(--fab-width, 64px) + 12px)' }}
        >
          <ReadingProgress color={colorValue} />
          {/* Author — the dock's left end cap: the same ring, gap and size as
              the Fab at its right end (-m-px lays it over the dock's border,
              flush with the edge like the Fab) */}
          <div
            className="-m-px flex size-14 shrink-0 items-center justify-center rounded-full border-2 p-1 sm:size-16"
            style={{ backgroundColor: 'var(--background)', borderColor: colorValue }}
          >
            {authorImage ? (
              <div className="size-full overflow-hidden rounded-full transition-transform duration-200 hover:scale-105">
                <AuthorAvatar src={authorImage} alt={article.author} link={article.authorPage} />
              </div>
            ) : (
              <div className="flex size-full items-center justify-center rounded-full" style={{ backgroundColor: colorValue }}>
                <div className="size-3 rounded-full" style={{ backgroundColor: 'var(--background)' }} />
              </div>
            )}
          </div>

          {/* Title — tappable for the full-metadata modal */}
          <h1
            onClick={() => setIsMetadataModalOpen(true)}
            className="min-w-0 shrink cursor-pointer truncate font-vt323 text-base font-bold leading-none tracking-tight transition-opacity hover:opacity-80 sm:text-lg"
            style={{ color: colorValue }}
          >
            {article.title}
          </h1>

          {/* Category pill — toggles the reader version of the article */}
          {hasReader ? (
            <Link
              href={pillHref}
              title={isReaderView ? 'Back to visual article' : 'Read the article'}
              aria-label={isReaderView ? 'Back to visual article' : 'Read the article'}
              className={`${pillClass} gap-1 transition-transform duration-200 hover:scale-105`}
              style={pillStyle}
            >
              {category}
              <span aria-hidden>{isReaderView ? '↩' : '¶'}</span>
            </Link>
          ) : (
            <span className={pillClass} style={pillStyle}>
              {category}
            </span>
          )}

          {/* Subtitle — from lg up (below that the dock gives the title the room), tappable for the modal */}
          {dockAction}

          {article.subtitle && (
            <p
              onClick={() => setIsMetadataModalOpen(true)}
              className="hidden min-w-0 shrink cursor-pointer truncate font-google-sans-code text-xs transition-opacity hover:opacity-80 lg:block"
              style={{ color: 'var(--text-muted)' }}
              dangerouslySetInnerHTML={{ __html: parseMarkdownText(article.subtitle) }}
            />
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Theme song — from lg up; narrower docks (minus the Fab's pocket)
              only fit the byline and mood, or the title gets squeezed out */}
          {(isMusicLoading || musicTrack) && (
            <div className="hidden min-w-0 shrink-0 lg:block">
              {isMusicLoading && (
                <div className="h-8 w-24 animate-pulse rounded-lg bg-background-highlight" />
              )}
              {!isMusicLoading && musicTrack && (
                <MusicBanner tracks={[musicTrack]} compact />
              )}
            </div>
          )}

          {/* Mood button — cover-aware color picker (draws its own ring) */}
          <div className="shrink-0">
            <ThemeColorPicker colors={coverPalette} placement="above" />
          </div>
        </div>
      </div>

      <ArticleMetadataModal
        article={article}
        createdLabel={createdLabel}
        updatedLabel={updatedLabel}
        colorValue={colorValue}
        isOpen={isMetadataModalOpen}
        onClose={() => setIsMetadataModalOpen(false)}
      />
    </>
  )
}

// How far down the page the reader is, as a line along the dock's bottom edge
// (up to the Fab's pocket).
// Its own component so per-scroll updates don't re-render the theme song.
function ReadingProgress({ color }: { color: string }) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let raf = 0
    const measure = () => {
      raf = 0
      const scrollable = document.documentElement.scrollHeight - window.innerHeight
      setProgress(scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0)
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure)
    }
    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute bottom-0 left-8 h-0.5 overflow-hidden rounded-full"
      style={{ right: 'calc(var(--fab-width, 64px) + 24px)' }}
    >
      <div className="h-full rounded-full transition-[width] duration-200 ease-out" style={{ width: `${progress * 100}%`, backgroundColor: color }} />
    </div>
  )
}
