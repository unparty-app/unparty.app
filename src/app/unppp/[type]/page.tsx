import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SITE_NAME } from '../../constants/organization'
import { generatePageMetadata } from '../../utils/ogMetadata'
import { HUB_TYPES, typeHub } from '@/lib/type-hub'
import type { UnpppType } from '@/app/constants/editorial-articles/types'
import TypeHub from './TypeHub'

interface PageProps {
  params: Promise<{ type: string }>
}

// A hub per kind of build (UnpppTypesConfig.json with a nav item): its
// projects, components, articles and stories (src/lib/type-hub.ts)

export function generateStaticParams() {
  return HUB_TYPES.map((type) => ({ type }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { type } = await params
  if (!HUB_TYPES.includes(type as UnpppType)) return {}
  const hub = await typeHub(type as UnpppType)
  return generatePageMetadata({
    title: `${type}. | ${SITE_NAME}`,
    description: `Every ${type} on ${SITE_NAME}: ${hub.definition}`,
    category: 'BUILD',
    path: `/unppp/${type}`,
  })
}

export default async function UnpppTypePage({ params }: PageProps) {
  const { type } = await params
  if (!HUB_TYPES.includes(type as UnpppType)) notFound()
  return <TypeHub hub={await typeHub(type as UnpppType)} />
}
