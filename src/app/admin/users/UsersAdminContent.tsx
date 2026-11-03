import { redirect } from 'next/navigation'
import { checkRole } from '@/utils/roles'
import { SearchUsers } from '../SearchUsers'
import { clerkClient } from '@/lib/auth-stub.server'
import { removeRole, setRole } from '../_actions'
import Image from 'next/image'

export default async function UsersAdminContent(params: {
  searchParams: Promise<{ search?: string }>
}) {
  if (!(await checkRole('admin'))) {
    redirect('/')
  }

  const query = (await params.searchParams).search
  const client = await clerkClient()
  const users = query ? (await client.users.getUserList({ query })).data : []

  const getRoleBadgeClass = (role?: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500/15 text-red-500'
      case 'moderator': return 'bg-blue-500/15 text-blue-700 dark:text-blue-400'
      default: return 'bg-theme-wash text-[var(--text-muted)]'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-google-sans-code text-2xl font-bold uppercase" style={{ color: 'var(--foreground)' }}>
          USERS.
        </h1>
        <button
          className="rounded-xl border px-4 py-2 font-google-sans-code text-sm transition-opacity hover:opacity-80"
          style={{ borderColor: 'rgba(255,255,255,0.1)', color: 'var(--text-muted)', backgroundColor: 'var(--background)' }}
        >
          Export Users
        </button>
      </div>

      <SearchUsers />

      {query && (
        <div className="font-google-sans-code text-sm" style={{ color: 'var(--text-muted)' }}>
          Search results for: <span style={{ color: 'var(--foreground)' }}>{`"${query}"`}</span>
          {users.length > 0 && (
            <span className="ml-2">
              (<span className="font-vt323 text-base">{users.length}</span> users found)
            </span>
          )}
        </div>
      )}

      {users.length > 0 ? (
        <div className="overflow-hidden rounded-xl border" style={{ backgroundColor: 'var(--background)', borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                  {['User', 'Email', 'Role', 'Created', 'Actions'].map(h => (
                    <th key={h} className="px-6 py-3 text-left font-google-sans-code text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((user, i) => (
                  <tr
                    key={user.id}
                    style={{ borderBottom: i < users.length - 1 ? '1px solid rgba(255,255,255,0.05)' : undefined }}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="size-10 shrink-0">
                          <Image
                            width={40}
                            height={40}
                            className="size-10 rounded-full border"
                            style={{ borderColor: 'rgba(255,255,255,0.1)' }}
                            src={user.imageUrl || 'https://images.clerk.dev/default-avatar'}
                            alt=""
                          />
                        </div>
                        <div className="ml-4">
                          <div className="font-google-sans-code text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="font-vt323 text-sm" style={{ color: 'var(--text-muted)' }}>
                            {user.id.substring(0, 12)}…
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-google-sans-code text-sm" style={{ color: 'var(--foreground)' }}>
                      {user.emailAddresses.find((email) => email.id === user.primaryEmailAddressId)?.emailAddress}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2 py-1 font-google-sans-code text-xs font-semibold ${getRoleBadgeClass(user.publicMetadata.role as string)}`}>
                        {(user.publicMetadata.role as string) || 'No role'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-vt323 text-sm" style={{ color: 'var(--text-muted)' }}>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <div className="flex flex-wrap gap-2">
                        <form action={setRole} className="inline">
                          <input type="hidden" value={user.id} name="id" />
                          <input type="hidden" value="admin" name="role" />
                          <button
                            type="submit"
                            className="rounded border px-3 py-1 font-google-sans-code text-xs transition-opacity hover:opacity-80 disabled:opacity-40"
                            style={{ borderColor: 'rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.1)', color: '#f87171' }}
                            disabled={user.publicMetadata.role === 'admin'}
                          >
                            Make Admin
                          </button>
                        </form>

                        <form action={setRole} className="inline">
                          <input type="hidden" value={user.id} name="id" />
                          <input type="hidden" value="moderator" name="role" />
                          <button
                            type="submit"
                            className="rounded border px-3 py-1 font-google-sans-code text-xs transition-opacity hover:opacity-80 disabled:opacity-40"
                            style={{ borderColor: 'rgba(59,130,246,0.3)', backgroundColor: 'rgba(59,130,246,0.1)', color: '#60a5fa' }}
                            disabled={user.publicMetadata.role === 'moderator'}
                          >
                            Make Moderator
                          </button>
                        </form>

                        {(user.publicMetadata.role as string) && (
                          <form action={removeRole} className="inline">
                            <input type="hidden" value={user.id} name="id" />
                            <button
                              type="submit"
                              className="rounded border px-3 py-1 font-google-sans-code text-xs transition-opacity hover:opacity-80"
                              style={{ borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}
                            >
                              Remove Role
                            </button>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : query ? (
        <div className="rounded-xl border p-8 text-center" style={{ backgroundColor: 'var(--background)', borderColor: 'rgba(255,255,255,0.08)' }}>
          <svg className="mx-auto mb-4 size-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--text-muted)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <h3 className="mb-2 font-google-sans-code text-lg font-medium" style={{ color: 'var(--foreground)' }}>No users found</h3>
          <p className="font-google-sans-code" style={{ color: 'var(--text-muted)' }}>Try adjusting your search terms.</p>
        </div>
      ) : (
        <div className="rounded-xl border p-8 text-center" style={{ backgroundColor: 'var(--background)', borderColor: 'rgba(255,255,255,0.08)' }}>
          <svg className="mx-auto mb-4 size-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--text-muted)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <h3 className="mb-2 font-google-sans-code text-lg font-medium" style={{ color: 'var(--foreground)' }}>Search for users</h3>
          <p className="font-google-sans-code" style={{ color: 'var(--text-muted)' }}>Use the search box above to find and manage users.</p>
        </div>
      )}

      <div className="rounded-xl border p-6" style={{ backgroundColor: 'var(--background)', borderColor: 'rgba(255,255,255,0.08)' }}>
        <h3 className="mb-2 font-google-sans-code font-bold" style={{ color: 'var(--foreground)' }}>
          User Role Management
        </h3>
        <div className="space-y-1 font-google-sans-code text-sm" style={{ color: 'var(--text-muted)' }}>
          <p>→ <span style={{ color: 'var(--foreground)' }}>Admin:</span> Full access to all admin features</p>
          <p>→ <span style={{ color: 'var(--foreground)' }}>Moderator:</span> Limited access to content moderation</p>
          <p>→ Search by name or email to find users and assign roles</p>
          <p>→ Role changes take effect immediately</p>
        </div>
      </div>
    </div>
  )
}
