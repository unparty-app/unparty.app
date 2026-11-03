import AdminNavModal from '../../components/AdminNavModal'
import UsersAdminContent from '../../users/UsersAdminContent'

export default function UsersModal(params: {
  searchParams: Promise<{ search?: string }>
}) {
  return (
    <AdminNavModal>
      <UsersAdminContent searchParams={params.searchParams} />
    </AdminNavModal>
  )
}
