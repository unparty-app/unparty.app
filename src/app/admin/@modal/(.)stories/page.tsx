import { Suspense } from 'react'
import AdminNavModal from '../../components/AdminNavModal'
import StoriesAdminContent from '../../stories/StoriesAdminContent'

export default function StoriesModal() {
  return (
    <AdminNavModal>
      <Suspense fallback={null}>
        <StoriesAdminContent />
      </Suspense>
    </AdminNavModal>
  )
}
