import { NextResponse } from 'next/server'
import { adminGuard } from '@/lib/admin'
import { auth } from '@/lib/auth-stub.server'
import { verifySetupForUser } from '@/lib/setup-verify'

// POST /api/admin/setup/verify: checks off the SETUP. steps that check
// themselves (src/lib/setup-verify.ts) for the signed-in admin. The
// onboarding's challenges call it before reading progress (useSetupProgress)
export async function POST() {
  const denied = await adminGuard()
  if (denied) return denied
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Sign in' }, { status: 401 })
  try {
    return NextResponse.json({ verified: await verifySetupForUser(userId) })
  } catch (error) {
    console.error('SETUP. verify failed:', error)
    return NextResponse.json({ error: 'Could not check the steps' }, { status: 500 })
  }
}
