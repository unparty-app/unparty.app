import { Suspense } from 'react'
import StoriesAdminContent from './StoriesAdminContent'

// The story writer reads which story to open from the query string
export default function StoriesPage() {
  return (
    <Suspense fallback={null}>
      <StoriesAdminContent />
    </Suspense>
  )
}
