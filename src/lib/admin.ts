import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth-stub.server'
import { checkRole } from '@/utils/roles'

export async function isAdmin(): Promise<boolean> {
  return await checkRole('admin')
}

/**
 * The check every /api/admin route starts with. Returns the response to send
 * when the caller may not continue (401 signed out, 403 signed in but not an
 * admin), or null when they are an admin:
 *
 *   const denied = await adminGuard()
 *   if (denied) return denied
 *
 * Signing in is not enough on its own: anyone can sign up.
 */
export async function adminGuard(): Promise<NextResponse | null> {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }
  return null
}
