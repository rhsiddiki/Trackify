'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { createUser, deleteUser } from '@/app/actions/users'
import { toast } from 'sonner'
import { UserPlus, Trash2, Mail, User, Lock, Shield, Users } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { User as SupabaseUser } from '@supabase/supabase-js'

export function UserManagement({
  users,
  currentUserId,
}: {
  users: SupabaseUser[]
  currentUserId: string
}) {
  const [isPending, startTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    startTransition(async () => {
      const result = await createUser(new FormData(e.currentTarget))
      if (result?.error) toast.error(result.error)
      else {
        toast.success('User created successfully!')
        ;(e.target as HTMLFormElement).reset()
      }
    })
  }

  function handleDelete(userId: string, email: string) {
    if (!confirm(`Delete user "${email}"? This cannot be undone.`)) return
    setDeletingId(userId)
    startTransition(async () => {
      const result = await deleteUser(userId)
      setDeletingId(null)
      if (result?.error) toast.error(result.error)
      else toast.success('User deleted')
    })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Create User Form */}
      <Card className="bg-card border-border lg:col-span-2">
        <CardHeader className="pb-4">
          <CardTitle className="text-base text-white flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-[#2979FF]" />
            Create New User
          </CardTitle>
          <p className="text-xs text-slate-500">
            User will receive access immediately — no email verification required.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <User className="w-3 h-3" /> Full Name
              </label>
              <Input
                name="full_name"
                placeholder="e.g. John Smith"
                required
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <Mail className="w-3 h-3" /> Email Address
              </label>
              <Input
                name="email"
                type="email"
                placeholder="user@example.com"
                required
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <Lock className="w-3 h-3" /> Password
              </label>
              <Input
                name="password"
                type="password"
                placeholder="Min. 4 characters"
                required
                minLength={4}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 h-9 text-sm"
              />
            </div>
            <Button
              type="submit"
              disabled={isPending}
              className="w-full bg-[#2979FF] hover:bg-[#5c9bff] text-white h-9 text-sm gap-2 mt-1"
            >
              <UserPlus className="w-3.5 h-3.5" />
              {isPending ? 'Creating…' : 'Create User'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* User List */}
      <Card className="bg-card border-border lg:col-span-3">
        <CardHeader className="pb-4">
          <CardTitle className="text-base text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-[#2979FF]" />
            All Users
            <span className="ml-auto text-xs font-normal text-slate-500">{users.length} total</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {users.length === 0 && (
            <p className="text-sm text-slate-600 text-center py-6">No users found.</p>
          )}
          {users.map(u => {
            const name = (u.user_metadata?.full_name as string) || u.email || 'Unknown'
            const initials = name.charAt(0).toUpperCase()
            const isSelf = u.id === currentUserId
            const createdAt = u.created_at ? formatDistanceToNow(new Date(u.created_at), { addSuffix: true }) : '—'

            return (
              <div
                key={u.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border hover:bg-[rgba(41,121,255,0.04)] transition-colors group"
              >
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarFallback className="text-xs bg-[#1E3A5F] text-[#2979FF]">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-200 truncate">{name}</p>
                    {isSelf && (
                      <span className="flex items-center gap-0.5 text-[9px] font-semibold text-[#2979FF] bg-[rgba(41,121,255,0.12)] px-1.5 py-0.5 rounded border border-[#2979FF]/20">
                        <Shield className="w-2.5 h-2.5" /> SUPERADMIN
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 truncate">{u.email}</p>
                </div>
                <div className="text-right flex-shrink-0 mr-2">
                  <p className="text-[10px] text-slate-600">{createdAt}</p>
                </div>
                {!isSelf && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-7 h-7 text-slate-700 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                    onClick={() => handleDelete(u.id, u.email ?? '')}
                    disabled={deletingId === u.id || isPending}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
