import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, is_superadmin')
    .eq('id', user.id)
    .single()

  const userName     = profile?.full_name ?? user.email ?? 'User'
  const isSuperAdmin = profile?.is_superadmin ?? false

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar userName={userName} isSuperAdmin={isSuperAdmin} />
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
