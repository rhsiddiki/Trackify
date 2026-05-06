import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { listUsers } from '@/app/actions/users'
import { UserManagement } from '@/components/users/UserManagement'
import { Shield } from 'lucide-react'

export default async function UsersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Check superadmin
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_superadmin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_superadmin) redirect('/dashboard')

  const { users, error } = await listUsers()

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-[rgba(41,121,255,0.1)] flex items-center justify-center">
          <Shield className="w-4.5 h-4.5 text-[#2979FF]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <p className="text-slate-400 text-sm mt-0.5">Create and manage platform users. Only you can access this page.</p>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
          Failed to load users: {error}
        </div>
      )}

      <UserManagement users={users ?? []} currentUserId={user.id} />
    </div>
  )
}
