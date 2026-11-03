import { Suspense } from 'react'
import AdminNavModal from '../../components/AdminNavModal'
import ArticleWriterContent from '../../articles/ArticleWriter'

export default function ArticlesModal() {
  return (
    <AdminNavModal>
      <Suspense fallback={null}>
        <ArticleWriterContent />
      </Suspense>
    </AdminNavModal>
  )
}
