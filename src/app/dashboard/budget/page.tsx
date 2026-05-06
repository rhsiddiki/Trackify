import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, Lock } from 'lucide-react'
import { BudgetClient } from '@/components/budget/BudgetClient'

export default async function BudgetPage() {
  const supabase = await createClient()

  const { data: accounts } = await supabase
    .from('budget_accounts')
    .select(`
      *,
      budget_periods(
        *,
        budget_entries(*),
        budget_ledger(running_balance, created_at)
      )
    `)
    .order('created_at', { ascending: false })

  const totalPlanned = accounts?.flatMap(a => a.budget_periods).flatMap(p => p?.budget_entries ?? [])
    .filter(e => e.type === 'planned')
    .reduce((sum, e) => sum + Number(e.amount), 0) ?? 0

  const totalActual = accounts?.flatMap(a => a.budget_periods).flatMap(p => p?.budget_entries ?? [])
    .filter(e => e.type === 'actual')
    .reduce((sum, e) => sum + Number(e.amount), 0) ?? 0

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Budget Center</h1>
          <p className="text-slate-400 text-sm mt-1">Track planned vs. actual expenditure across accounts.</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <p className="text-xs text-slate-400 mb-1">Total Planned</p>
            <p className="text-2xl font-bold text-white">${totalPlanned.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <p className="text-xs text-slate-400 mb-1">Total Spent</p>
            <p className="text-2xl font-bold text-amber-400">${totalActual.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <p className="text-xs text-slate-400 mb-1">Remaining</p>
            <p className={`text-2xl font-bold ${totalPlanned - totalActual >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              ${(totalPlanned - totalActual).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Budget Client (interactive) */}
      <BudgetClient accounts={accounts ?? []} />
    </div>
  )
}
