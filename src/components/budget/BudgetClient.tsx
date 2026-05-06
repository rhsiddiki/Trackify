'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Lock, Plus, ChevronDown, ChevronUp, FolderPlus, Calendar } from 'lucide-react'
import { createBudgetAccount, createBudgetPeriod, createBudgetEntry, lockBudgetPeriod } from '@/app/actions/budget'
import { toast } from 'sonner'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const CATEGORY_LABELS: Record<string, string> = {
  rd: 'R&D', operations: 'Operations', marketing: 'Marketing', hr: 'HR', other: 'Other'
}
const CHART_COLORS = ['#2979FF', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444']
const CATEGORIES = ['rd', 'operations', 'marketing', 'hr', 'other']

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function BudgetClient({ accounts }: { accounts: any[] }) {
  const [expandedPeriod, setExpandedPeriod] = useState<string | null>(null)
  const [showNewAccount, setShowNewAccount] = useState(false)
  const [showNewPeriod, setShowNewPeriod] = useState<string | null>(null) // accountId
  const [entryType, setEntryType] = useState('planned')
  const [category, setCategory] = useState('other')
  const [loadingEntry, setLoadingEntry] = useState<string | null>(null)
  const [loadingLock, setLoadingLock] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isCustomCategory, setIsCustomCategory] = useState(false)
  const [customCategory, setCustomCategory] = useState('')

  const dynamicCategories = new Set(CATEGORIES)
  accounts.forEach(a => {
    if (a.category && !dynamicCategories.has(a.category)) {
      dynamicCategories.add(a.category)
    }
  })
  const allCategories = Array.from(dynamicCategories)

  // Build chart data
  const categorySpend: Record<string, number> = {}
  const barData: { name: string; planned: number; actual: number }[] = []

  for (const account of accounts) {
    let planned = 0, actual = 0
    for (const period of account.budget_periods ?? []) {
      for (const entry of period.budget_entries ?? []) {
        if (entry.type === 'planned') planned += Number(entry.amount)
        else actual += Number(entry.amount)
      }
    }
    categorySpend[CATEGORY_LABELS[account.category] ?? account.category] =
      (categorySpend[CATEGORY_LABELS[account.category] ?? account.category] ?? 0) + actual
    barData.push({ name: account.name.slice(0, 12), planned, actual })
  }

  const pieData = Object.entries(categorySpend).map(([name, value]) => ({ name, value }))

  async function handleAddEntry(periodId: string, e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoadingEntry(periodId)
    const formData = new FormData(e.currentTarget)
    formData.set('type', entryType)
    const result = await createBudgetEntry(periodId, formData)
    setLoadingEntry(null)
    if (result?.error) toast.error(result.error)
    else { toast.success('Entry added!'); (e.target as HTMLFormElement).reset() }
  }

  async function handleLock(periodId: string) {
    setLoadingLock(periodId)
    const result = await lockBudgetPeriod(periodId)
    setLoadingLock(null)
    if (result?.error) toast.error(result.error)
    else toast.success('Period locked')
  }

  function handleCreateAccount(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set('category', isCustomCategory ? customCategory : category)
    startTransition(async () => {
      const result = await createBudgetAccount(formData)
      if (result?.error) toast.error(result.error)
      else { 
        toast.success('Account created!'); 
        setShowNewAccount(false); 
        setCategory('other');
        setIsCustomCategory(false);
        setCustomCategory('');
      }
    })
  }

  function handleCreatePeriod(accountId: string, e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    startTransition(async () => {
      const result = await createBudgetPeriod(accountId, new FormData(e.currentTarget))
      if (result?.error) toast.error(result.error)
      else { toast.success('Period added!'); setShowNewPeriod(null) }
    })
  }

  return (
    <div className="space-y-6">
      {/* Charts */}
      {accounts.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-white">Spend by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
                    paddingAngle={4} dataKey="value">
                    {pieData.map((_, index) => (
                      <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0e1f3d', border: '1px solid rgba(41,121,255,0.2)', borderRadius: '8px', color: '#e2e8f0' }}
                    formatter={(v) => [`$${Number(v ?? 0).toLocaleString()}`, '']} />
                  <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 11 }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-white">Planned vs. Actual</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barData} barSize={10} barGap={4}>
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ backgroundColor: '#0e1f3d', border: '1px solid rgba(41,121,255,0.2)', borderRadius: '8px', color: '#e2e8f0' }}
                    formatter={(v) => [`$${Number(v ?? 0).toLocaleString()}`, '']} />
                  <Bar dataKey="planned" fill="#2979FF" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="actual" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create Account */}
      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={() => setShowNewAccount(v => !v)}
          className="bg-[#2979FF] hover:bg-[#5c9bff] text-white gap-1.5"
        >
          <FolderPlus className="w-4 h-4" />
          New Account
        </Button>
      </div>

      {showNewAccount && (
        <Card className="bg-card border-[#2979FF]/30 border-dashed">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-white flex items-center gap-2">
              <FolderPlus className="w-4 h-4 text-[#2979FF]" /> Create Budget Account
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateAccount} className="flex flex-wrap gap-3 items-end">
              <div className="space-y-1.5 flex-1 min-w-40">
                <label className="text-xs text-slate-400">Account Name</label>
                <Input name="name" placeholder="e.g. Engineering" required
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 h-8 text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400">Category</label>
                {!isCustomCategory ? (
                  <Select value={category} onValueChange={(v) => {
                    if (v === 'custom') {
                      setIsCustomCategory(true)
                      setCategory('custom')
                    } else if (v) {
                      setCategory(v)
                    }
                  }}>
                    <SelectTrigger className="w-36 h-8 bg-slate-800 border-slate-700 text-white text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {allCategories.map(c => (
                        <SelectItem key={c} value={c} className="text-white text-sm capitalize">
                          {CATEGORY_LABELS[c] ?? c}
                        </SelectItem>
                      ))}
                      <SelectItem value="custom" className="text-[#2979FF] text-sm italic font-medium">
                        + Add Custom
                      </SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex items-center gap-1">
                    <Input
                      autoFocus
                      placeholder="Custom category"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      className="w-36 h-8 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 text-sm"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsCustomCategory(false)
                        setCategory('other')
                        setCustomCategory('')
                      }}
                      className="text-slate-400 hover:text-white px-2 h-8"
                    >
                      ✕
                    </Button>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowNewAccount(false)}
                  className="text-slate-400 h-8">Cancel</Button>
                <Button type="submit" size="sm" disabled={isPending}
                  className="bg-[#2979FF] hover:bg-[#5c9bff] text-white h-8">
                  {isPending ? 'Creating…' : 'Create'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Accounts + Periods */}
      {accounts.length === 0 ? (
        <Card className="bg-card border-border border-dashed">
          <CardContent className="py-12 text-center space-y-3">
            <FolderPlus className="w-10 h-10 text-slate-700 mx-auto" />
            <p className="text-slate-500 text-sm">No budget accounts yet.</p>
            <p className="text-slate-600 text-xs">Click <strong className="text-slate-400">New Account</strong> above to get started.</p>
          </CardContent>
        </Card>
      ) : (
        accounts.map(account => (
          <Card key={account.id} className="bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base text-white">{account.name}</CardTitle>
                  <Badge variant="outline" className="text-[10px] mt-1 text-slate-400 border-slate-700">
                    {CATEGORY_LABELS[account.category] ?? account.category}
                  </Badge>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowNewPeriod(showNewPeriod === account.id ? null : account.id)}
                  className="border-[#2979FF]/30 text-[#2979FF] hover:bg-[rgba(41,121,255,0.1)] text-xs h-7 gap-1"
                >
                  <Calendar className="w-3 h-3" /> Add Period
                </Button>
              </div>

              {/* Inline new period form */}
              {showNewPeriod === account.id && (
                <form onSubmit={(e) => handleCreatePeriod(account.id, e)}
                  className="mt-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700 flex flex-wrap gap-3 items-end">
                  <div className="space-y-1 flex-1 min-w-32">
                    <label className="text-[10px] text-slate-400">Label</label>
                    <Input name="label" placeholder="e.g. Q2 2025" required
                      className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-600 h-7 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400">Start</label>
                    <Input name="starts_at" type="date" required
                      className="bg-slate-900 border-slate-700 text-white h-7 text-xs [color-scheme:dark]" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400">End</label>
                    <Input name="ends_at" type="date" required
                      className="bg-slate-900 border-slate-700 text-white h-7 text-xs [color-scheme:dark]" />
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="ghost" size="sm" onClick={() => setShowNewPeriod(null)}
                      className="text-slate-500 h-7 text-xs px-2">Cancel</Button>
                    <Button type="submit" size="sm" disabled={isPending}
                      className="bg-[#2979FF] hover:bg-[#5c9bff] text-white h-7 text-xs px-3">
                      {isPending ? 'Adding…' : 'Add'}
                    </Button>
                  </div>
                </form>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {(account.budget_periods ?? []).map((period: {
                id: string; label: string; starts_at: string; ends_at: string; locked: boolean;
                budget_entries: { type: string; amount: number; description: string }[];
                budget_ledger: { running_balance: number; created_at: string }[];
              }) => {
                const lastLedger = period.budget_ledger?.sort((a: {created_at: string}, b: {created_at: string}) =>
                  b.created_at.localeCompare(a.created_at))[0]
                const isExpanded = expandedPeriod === period.id

                return (
                  <div key={period.id} className="rounded-lg border border-border overflow-hidden">
                    <button
                      onClick={() => setExpandedPeriod(isExpanded ? null : period.id)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-[rgba(14,31,61,0.5)] hover:bg-[rgba(41,121,255,0.05)] transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-white">{period.label}</span>
                        {period.locked && (
                          <span className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                            <Lock className="w-2.5 h-2.5" /> Locked
                          </span>
                        )}
                        <span className="text-xs text-slate-500">{period.starts_at} → {period.ends_at}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        {lastLedger && (
                          <span className={`text-sm font-semibold ${lastLedger.running_balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            ${Number(lastLedger.running_balance).toLocaleString()}
                          </span>
                        )}
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-4 py-4 space-y-4 bg-[rgba(10,22,40,0.4)]">
                        {/* Entries */}
                        {period.budget_entries?.length > 0 && (
                          <div className="space-y-1.5">
                            {period.budget_entries.map((entry: {type: string; amount: number; description: string}, i: number) => (
                              <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-border last:border-0">
                                <div className="flex items-center gap-2">
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${entry.type === 'planned' ? 'bg-blue-500/10 text-blue-400' : 'bg-amber-500/10 text-amber-400'}`}>
                                    {entry.type}
                                  </span>
                                  <span className="text-slate-300">{entry.description || '—'}</span>
                                </div>
                                <span className="font-semibold text-white">${Number(entry.amount).toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Add Entry Form */}
                        {!period.locked && (
                          <form onSubmit={(e) => handleAddEntry(period.id, e)} className="flex gap-2 flex-wrap">
                            <Select value={entryType} onValueChange={(v) => v && setEntryType(v)}>
                              <SelectTrigger className="w-28 h-8 bg-slate-800 border-slate-700 text-white text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-800 border-slate-700">
                                <SelectItem value="planned" className="text-white text-xs">Planned</SelectItem>
                                <SelectItem value="actual" className="text-white text-xs">Actual</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input name="amount" type="number" min="0" step="0.01" placeholder="Amount" required
                              className="w-28 h-8 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 text-xs" />
                            <Input name="description" placeholder="Description"
                              className="flex-1 min-w-32 h-8 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 text-xs" />
                            <Button type="submit" size="sm" disabled={loadingEntry === period.id}
                              className="h-8 bg-[#2979FF] hover:bg-[#5c9bff] text-white text-xs px-3">
                              <Plus className="w-3 h-3 mr-1" /> Add
                            </Button>
                          </form>
                        )}

                        {/* Lock Button */}
                        {!period.locked && (
                          <Button variant="outline" size="sm"
                            onClick={() => handleLock(period.id)}
                            disabled={loadingLock === period.id}
                            className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/50 text-xs h-7">
                            <Lock className="w-3 h-3 mr-1.5" />
                            {loadingLock === period.id ? 'Locking…' : 'Lock Period'}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}

              {account.budget_periods?.length === 0 && (
                <p className="text-xs text-slate-600 py-2">No periods yet — click <strong className="text-slate-500">Add Period</strong> above.</p>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
