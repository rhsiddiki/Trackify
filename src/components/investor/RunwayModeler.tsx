'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { TrendingUp } from 'lucide-react'

export function RunwayModeler({
  currentBalance,
  monthlyBurn,
}: {
  currentBalance: number
  monthlyBurn: number
}) {
  const [projectedRevenue, setProjectedRevenue] = useState('')
  const [result, setResult] = useState<number | null>(null)

  function calculate() {
    const rev = parseFloat(projectedRevenue) || 0
    const netBurn = monthlyBurn - rev
    if (netBurn <= 0) {
      setResult(Infinity)
    } else {
      setResult(Math.max(0, currentBalance / netBurn))
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
        <div className="bg-[rgba(14,31,61,0.6)] rounded-lg p-3">
          <p className="text-xs text-slate-400 mb-1">Current Balance</p>
          <p className="font-semibold text-white">${currentBalance.toLocaleString()}</p>
        </div>
        <div className="bg-[rgba(14,31,61,0.6)] rounded-lg p-3">
          <p className="text-xs text-slate-400 mb-1">Monthly Burn (avg 3mo)</p>
          <p className="font-semibold text-amber-400">${monthlyBurn.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
        </div>
        <div className="bg-[rgba(14,31,61,0.6)] rounded-lg p-3">
          <p className="text-xs text-slate-400 mb-1">Baseline Runway</p>
          <p className="font-semibold text-[#2979FF]">
            {monthlyBurn > 0 ? `${(currentBalance / monthlyBurn).toFixed(1)} months` : '∞'}
          </p>
        </div>
      </div>

      <div className="flex gap-3 items-end flex-wrap">
        <div className="space-y-1.5 flex-1 min-w-48">
          <label className="text-xs font-medium text-slate-300">Projected Monthly Revenue ($)</label>
          <Input
            type="number"
            min="0"
            placeholder="e.g. 50000"
            value={projectedRevenue}
            onChange={e => setProjectedRevenue(e.target.value)}
            className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
          />
        </div>
        <Button onClick={calculate} className="bg-[#2979FF] hover:bg-[#5c9bff] text-white gap-1.5">
          <TrendingUp className="w-4 h-4" /> Model Runway
        </Button>
      </div>

      {result !== null && (
        <div className={`rounded-xl p-5 border ${result === Infinity || result > 24
          ? 'bg-emerald-500/10 border-emerald-500/25'
          : result > 12
          ? 'bg-blue-500/10 border-blue-500/25'
          : 'bg-amber-500/10 border-amber-500/25'
        }`}>
          <p className="text-xs text-slate-400 mb-1">Projected Runway with ${parseFloat(projectedRevenue || '0').toLocaleString()}/mo revenue</p>
          <p className={`text-3xl font-bold ${result === Infinity || result > 24
            ? 'text-emerald-400'
            : result > 12
            ? 'text-blue-400'
            : 'text-amber-400'
          }`}>
            {result === Infinity ? 'Profitable ∞' : `${result.toFixed(1)} months`}
          </p>
          {result !== Infinity && (
            <p className="text-xs text-slate-500 mt-1.5">
              Net monthly burn: ${Math.max(0, monthlyBurn - parseFloat(projectedRevenue || '0')).toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo
            </p>
          )}
        </div>
      )}
    </div>
  )
}
