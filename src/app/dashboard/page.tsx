import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { GitBranch, CheckSquare, DollarSign, TrendingUp, BarChart3 } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()

  const [
    { count: workflowCount },
    { count: taskCount },
    { count: periodCount },
  ] = await Promise.all([
    supabase.from('workflows').select('*', { count: 'exact', head: true }),
    supabase.from('tasks').select('*', { count: 'exact', head: true }),
    supabase.from('budget_periods').select('*', { count: 'exact', head: true }),
  ])

  const { data: recentTasks } = await supabase
    .from('tasks')
    .select('id, title, urgency, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  const stats = [
    { label: 'Workflows', value: workflowCount ?? 0, icon: GitBranch, href: '/dashboard/workflows', color: 'text-blue-400' },
    { label: 'Total Tasks', value: taskCount ?? 0, icon: CheckSquare, href: '/dashboard/workflows', color: 'text-emerald-400' },
    { label: 'Budget Periods', value: periodCount ?? 0, icon: DollarSign, href: '/dashboard/budget', color: 'text-amber-400' },
    { label: 'Active Projects', value: workflowCount ?? 0, icon: TrendingUp, href: '/dashboard/workflows', color: 'text-violet-400' },
  ]

  const urgencyColors: Record<string, string> = {
    critical: 'text-red-400 bg-red-500/10 border-red-500/20',
    high: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    medium: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    low: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Welcome back — here&apos;s what&apos;s happening.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, href, color }) => (
          <Link key={label} href={href}>
            <Card className="bg-card border-border hover:border-[#2979FF]/40 transition-all duration-200 cursor-pointer group">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-slate-400">{label}</p>
                  <div className="w-9 h-9 rounded-lg bg-[rgba(41,121,255,0.1)] flex items-center justify-center group-hover:bg-[rgba(41,121,255,0.18)] transition-colors">
                    <Icon className={`w-4.5 h-4.5 ${color}`} />
                  </div>
                </div>
                <p className="text-3xl font-bold text-white">{value}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent Tasks */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-white">Recent Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          {!recentTasks || recentTasks.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              No tasks yet. <Link href="/dashboard/workflows" className="text-[#2979FF] hover:underline">Create a workflow</Link> to get started.
            </div>
          ) : (
            <div className="space-y-2">
              {recentTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[rgba(41,121,255,0.05)] transition-colors">
                  <div className={`urgency-${task.urgency} pl-2`} />
                  <span className="flex-1 text-sm text-slate-200 truncate">{task.title}</span>
                  <span className={`text-xs px-2 py-0.5 rounded border font-medium ${urgencyColors[task.urgency]}`}>
                    {task.urgency}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/dashboard/workflows">
          <Card className="bg-gradient-to-br from-[#1E3A5F] to-[#0e1f3d] border-[#2979FF]/20 hover:border-[#2979FF]/50 transition-all duration-200 cursor-pointer">
            <CardContent className="p-5 flex items-center gap-4">
              <GitBranch className="w-8 h-8 text-[#2979FF]" />
              <div>
                <p className="font-semibold text-white text-sm">Task Engine</p>
                <p className="text-xs text-slate-400 mt-0.5">Kanban & List views</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/budget">
          <Card className="bg-gradient-to-br from-[#1E3A5F] to-[#0e1f3d] border-[#2979FF]/20 hover:border-[#2979FF]/50 transition-all duration-200 cursor-pointer">
            <CardContent className="p-5 flex items-center gap-4">
              <DollarSign className="w-8 h-8 text-emerald-400" />
              <div>
                <p className="font-semibold text-white text-sm">Budget Center</p>
                <p className="text-xs text-slate-400 mt-0.5">Ledger & forecasting</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/investor">
          <Card className="bg-gradient-to-br from-[#1E3A5F] to-[#0e1f3d] border-[#2979FF]/20 hover:border-[#2979FF]/50 transition-all duration-200 cursor-pointer">
            <CardContent className="p-5 flex items-center gap-4">
              <BarChart3 className="w-8 h-8 text-violet-400" />
              <div>
                <p className="font-semibold text-white text-sm">Investor Portal</p>
                <p className="text-xs text-slate-400 mt-0.5">Analytics & runway</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
