'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  GitBranch,
  DollarSign,
  BarChart3,
  Users,
  LogOut,
  ChevronRight,
  Shield,
} from 'lucide-react'
import { logoutAction } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'

const baseNavItems = [
  { href: '/dashboard',           label: 'Dashboard',     icon: LayoutDashboard },
  { href: '/dashboard/workflows', label: 'Workflows',     icon: GitBranch },
  { href: '/dashboard/budget',    label: 'Budget',        icon: DollarSign },
  { href: '/dashboard/investor',  label: 'Investor View', icon: BarChart3 },
]

const adminNavItems = [
  { href: '/dashboard/users',     label: 'Users',         icon: Users },
]

export function Sidebar({
  userName,
  isSuperAdmin = false,
}: {
  userName: string
  isSuperAdmin?: boolean
}) {
  const pathname = usePathname()
  const navItems = isSuperAdmin ? [...baseNavItems, ...adminNavItems] : baseNavItems

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-card border-r border-border">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-[#2979FF] flex items-center justify-center flex-shrink-0">
          <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <span className="text-lg font-bold text-white tracking-tight">Trackify</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'nav-link flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium group',
                isActive
                  ? 'active text-[#2979FF] bg-[rgba(41,121,255,0.12)]'
                  : 'text-slate-400'
              )}
            >
              <Icon className={cn('w-4.5 h-4.5 flex-shrink-0', isActive ? 'text-[#2979FF]' : 'text-slate-500 group-hover:text-slate-300')} />
              <span className="flex-1">{label}</span>
              {isActive && <ChevronRight className="w-3.5 h-3.5 text-[#2979FF]" />}
            </Link>
          )
        })}
      </nav>

      {/* User + Logout */}
      <div className="px-3 py-4 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-2 mb-2 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-[#1E3A5F] flex items-center justify-center flex-shrink-0 relative">
            <span className="text-xs font-semibold text-[#2979FF]">
              {userName?.charAt(0)?.toUpperCase() ?? 'U'}
            </span>
            {isSuperAdmin && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#2979FF] rounded-full flex items-center justify-center">
                <Shield className="w-2 h-2 text-white" />
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">{userName || 'User'}</p>
            {isSuperAdmin && (
              <p className="text-[10px] text-[#2979FF] font-medium">Superadmin</p>
            )}
          </div>
        </div>
        <form action={logoutAction}>
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-3 text-slate-500 hover:text-red-400 hover:bg-red-500/10 px-3"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </Button>
        </form>
      </div>
    </aside>
  )
}
