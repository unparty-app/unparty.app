import { Suspense } from 'react'
import ArticleWriterContent from './ArticleWriter'

// The article writer reads which article to open from the query string
export default function ArticlesPage() {
  return (
    <Suspense fallback={null}>
      <ArticleWriterContent />
    </Suspense>
  )
}
