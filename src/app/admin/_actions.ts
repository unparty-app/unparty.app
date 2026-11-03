'use server'

import { checkRole } from '@/utils/roles'
import { clerkClient } from '@/lib/auth-stub.server'
import { revalidatePath } from 'next/cache'

export async function setRole(formData: FormData) {
  const client = await clerkClient()

  // Check that the user trying to set the role is an admin
  if (!(await checkRole('admin'))) {
    console.error('Unauthorized attempt to set role')
    return
  }

  try {
    await client.users.updateUserMetadata(formData.get('id') as string, {
      publicMetadata: { role: formData.get('role') },
    })
    revalidatePath('/admin/users')
  } catch (err) {
    console.error('Error updating role:', err)
  }
}

export async function removeRole(formData: FormData) {
  const client = await clerkClient()

  // Check that the user trying to remove the role is an admin
  if (!(await checkRole('admin'))) {
    console.error('Unauthorized attempt to remove role')
    return
  }

  try {
    await client.users.updateUserMetadata(formData.get('id') as string, {
      publicMetadata: { role: null },
    })
    revalidatePath('/admin/users')
  } catch (err) {
    console.error('Error removing role:', err)
  }
}