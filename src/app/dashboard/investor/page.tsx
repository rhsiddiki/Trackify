import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { InvestorCharts } from '@/components/investor/InvestorCharts'
import { RunwayModeler } from '@/components/investor/RunwayModeler'
import { TrendingDown, DollarSign, Clock, Flame } from 'lucide-react'

export default async function InvestorPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: ledger } = await supabase
    .from('budget_ledger')
    .select('*, period:budget_periods(label, account:budget_accounts(name, category))')
    .order('created_at', { ascending: true })

  const { data: entries } = await supabase
    .from('budget_entries')
    .select('*, period:budget_periods(label, account:budget_accounts(name, category))')
    .order('created_at', { ascending: true })

  const totalPlanned = (entries ?? []).filter(e => e.type === 'planned').reduce((s, e) => s + Number(e.amount), 0)
  const totalActual = (entries ?? []).filter(e => e.type === 'actual').reduce((s, e) => s + Number(e.amount), 0)
  const currentBalance = totalPlanned - totalActual

  // Estimate monthly burn from last 3 months of actual entries
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
  const recentActual = (entries ?? []).filter(e =>
    e.type === 'actual' && new Date(e.created_at) >= threeMonthsAgo
  ).reduce((s, e) => s + Number(e.amount), 0)
  const monthlyBurn = recentActual / 3

  const basicRunway = monthlyBurn > 0 ? currentBalance / monthlyBurn : 0

  const stats = [
    { label: 'Total Budget', value: `$${totalPlanned.toLocaleString()}`, icon: DollarSign, color: 'text-blue-400' },
    { label: 'Spent to Date', value: `$${totalActual.toLocaleString()}`, icon: Flame, color: 'text-amber-400' },
    { label: 'Remaining', value: `$${currentBalance.toLocaleString()}`, icon: TrendingDown, color: currentBalance >= 0 ? 'text-emerald-400' : 'text-red-400' },
    { label: 'Runway', value: monthlyBurn > 0 ? `${basicRunway.toFixed(1)} mo` : '∞', icon: Clock, color: 'text-violet-400' },
  ]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Investor Portal</h1>
        <p className="text-slate-400 text-sm mt-1">Read-only financial metrics and runway analytics.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="bg-card border-border">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-slate-400">{label}</p>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <InvestorCharts entries={entries ?? []} ledger={ledger ?? []} />

      {/* Runway Modeler */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white">Runway Modeler</CardTitle>
          <p className="text-xs text-slate-400">Simulate revenue scenarios to project financial runway.</p>
        </CardHeader>
        <CardContent>
          <RunwayModeler currentBalance={currentBalance} monthlyBurn={monthlyBurn} />
        </CardContent>
      </Card>
    </div>
  )
}
