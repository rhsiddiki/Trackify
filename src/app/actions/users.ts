'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

/** Guard: only superadmin can call user-management actions */
async function guardSuperAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data } = await supabase
    .from('profiles')
    .select('is_superadmin')
    .eq('id', user.id)
    .single()
  return data?.is_superadmin === true
}

export async function createUser(formData: FormData) {
  if (!await guardSuperAdmin()) return { error: 'Unauthorized' }

  const email     = (formData.get('email')     as string)?.trim()
  const password  = (formData.get('password')  as string)?.trim()
  const full_name = (formData.get('full_name') as string)?.trim()

  if (!email || !password || !full_name) return { error: 'All fields are required.' }
  if (password.length < 4) return { error: 'Password must be at least 4 characters.' }

  const admin = createAdminClient()
  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    user_metadata: { full_name },
    email_confirm: true, // skip email verification
  })

  if (error) return { error: error.message }
  revalidatePath('/dashboard/users')
  return { success: true }
}

export async function deleteUser(userId: string) {
  if (!await guardSuperAdmin()) return { error: 'Unauthorized' }

  // Prevent deleting self
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user?.id === userId) return { error: 'You cannot delete your own account.' }

  const admin = createAdminClient()
  const { error } = await admin.auth.admin.deleteUser(userId)
  if (error) return { error: error.message }

  revalidatePath('/dashboard/users')
  return { success: true }
}

export async function listUsers() {
  if (!await guardSuperAdmin()) return { error: 'Unauthorized', users: [] }

  const admin = createAdminClient()
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 200 })
  if (error) return { error: error.message, users: [] }

  return { users: data.users, error: null }
}
