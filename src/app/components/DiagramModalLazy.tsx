'use client'
import dynamic from 'next/dynamic'
import type { ComponentProps } from 'react'

const DiagramModal = dynamic(() => import('./DiagramModal'), { ssr: false })

export default function DiagramModalLazy(
  props: ComponentProps<typeof DiagramModal>
) {
  return <DiagramModal {...props} />
}
