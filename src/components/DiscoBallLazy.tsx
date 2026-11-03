'use client'
import React from 'react';
import dynamic from 'next/dynamic'
import type { ComponentProps } from 'react'

const DiscoBallScene = dynamic(() => import('./DiscoBall'), { ssr: false })

class DiscoBallErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() { return { hasError: true } }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[DiscoBall] render failed:', error, info)
  }
  render() {
    if (this.state.hasError) return null
    return this.props.children
  }
}

export default function DiscoBallLazy(
  props: ComponentProps<typeof DiscoBallScene>
) {
  return (
    <DiscoBallErrorBoundary>
      <DiscoBallScene {...props} />
    </DiscoBallErrorBoundary>
  )
}
