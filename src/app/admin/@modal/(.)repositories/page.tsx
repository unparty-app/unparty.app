import AdminNavModal from '../../components/AdminNavModal'
import RepositoryManager from '../../../components/RepositoryManager'
import { repoReleaseBelts } from '@/lib/project-belt'

export default function RepositoriesModal() {
  return (
    <AdminNavModal>
      <RepositoryManager releases={repoReleaseBelts()} />
    </AdminNavModal>
  )
}
