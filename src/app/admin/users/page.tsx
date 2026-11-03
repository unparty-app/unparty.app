import UsersAdminContent from './UsersAdminContent'

export default function UsersPage(params: {
  searchParams: Promise<{ search?: string }>
}) {
  return <UsersAdminContent searchParams={params.searchParams} />
}
