import { Roles } from '@/types/globals'
import { auth } from '@/lib/auth-stub.server'

export const checkRole = async (role: Roles) => {
  const { sessionClaims } = await auth()
  return sessionClaims?.metadata?.role === role
}