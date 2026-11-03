import RepositoryManager from '../../components/RepositoryManager'
import { repoReleaseBelts } from '@/lib/project-belt'

export default function AdminRepositoriesPage() {
  return <RepositoryManager releases={repoReleaseBelts()} />
}
