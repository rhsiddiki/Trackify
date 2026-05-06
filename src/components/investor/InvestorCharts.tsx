'use client'

import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const COLORS = ['#2979FF', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4']
const CATEGORY_LABELS: Record<string, string> = {
  rd: 'R&D', operations: 'Operations', marketing: 'Marketing', hr: 'HR', other: 'Other'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function InvestorCharts({ entries, ledger }: { entries: any[]; ledger: any[] }) {
  // Pie: spend by category
  const categoryMap: Record<string, number> = {}
  for (const entry of entries) {
    if (entry.type === 'actual') {
      const cat = CATEGORY_LABELS[entry.period?.account?.category] ?? 'Other'
      categoryMap[cat] = (categoryMap[cat] ?? 0) + Number(entry.amount)
    }
  }
  const pieData = Object.entries(categoryMap).map(([name, value]) => ({ name, value }))

  // Bar: planned vs actual by period
  const periodMap: Record<string, { name: string; planned: number; actual: number }> = {}
  for (const entry of entries) {
    const label = entry.period?.label ?? 'Unknown'
    if (!periodMap[label]) periodMap[label] = { name: label.slice(0, 10), planned: 0, actual: 0 }
    periodMap[label][entry.type as 'planned' | 'actual'] += Number(entry.amount)
  }
  const barData = Object.values(periodMap)

  // Line: running balance over time
  const lineData = ledger.map(l => ({
    date: new Date(l.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    balance: Number(l.running_balance),
  }))

  const tooltipStyle = {
    backgroundColor: '#0e1f3d',
    border: '1px solid rgba(41,121,255,0.2)',
    borderRadius: '8px',
    color: '#e2e8f0',
    fontSize: 12,
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-white">Allocation by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`$${Number(v ?? 0).toLocaleString()}`, '']} />
              <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 10 }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-white">Planned vs. Actual</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} barSize={8} barGap={2}>
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`$${Number(v ?? 0).toLocaleString()}`, '']} />
              <Bar dataKey="planned" fill="#2979FF" radius={[3, 3, 0, 0]} name="Planned" />
              <Bar dataKey="actual" fill="#f59e0b" radius={[3, 3, 0, 0]} name="Actual" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-white">Balance Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(41,121,255,0.08)" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`$${Number(v ?? 0).toLocaleString()}`, 'Balance']} />
              <Line type="monotone" dataKey="balance" stroke="#2979FF" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
