'use client'

import { useState, useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table'
import type { Task, WorkflowStep, Profile } from '@/lib/types'
import { UrgencyBadge } from '../tasks/UrgencyBadge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'

interface TaskTableProps {
  tasks: (Task & { assignee?: Profile | null })[]
  steps: WorkflowStep[]
  workflowId: string
}

export function TaskTable({ tasks, steps, workflowId }: TaskTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const stepMap = useMemo(() => Object.fromEntries(steps.map(s => [s.id, s])), [steps])

  const columns: ColumnDef<Task & { assignee?: Profile | null }>[] = [
    {
      accessorKey: 'title',
      header: ({ column }) => (
        <button className="flex items-center gap-1 text-slate-400 hover:text-white text-xs font-medium"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Title <ArrowUpDown className="w-3 h-3" />
        </button>
      ),
      cell: ({ row }) => (
        <span className="text-sm text-slate-100 font-medium">{row.original.title}</span>
      ),
    },
    {
      accessorKey: 'urgency',
      header: () => <span className="text-slate-400 text-xs font-medium">Urgency</span>,
      cell: ({ row }) => <UrgencyBadge urgency={row.original.urgency} size="xs" />,
      filterFn: (row, id, value) => value === 'all' || row.getValue(id) === value,
    },
    {
      accessorKey: 'step_id',
      header: () => <span className="text-slate-400 text-xs font-medium">Step</span>,
      cell: ({ row }) => {
        const step = stepMap[row.original.step_id]
        return step ? (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: step.color }} />
            <span className="text-xs text-slate-300">{step.name}</span>
          </div>
        ) : null
      },
    },
    {
      accessorKey: 'assignee',
      header: () => <span className="text-slate-400 text-xs font-medium">Assignee</span>,
      cell: ({ row }) => {
        const a = row.original.assignee
        if (!a) return <span className="text-xs text-slate-600">—</span>
        return (
          <div className="flex items-center gap-2">
            <Avatar className="w-5 h-5">
              <AvatarFallback className="text-[9px] bg-[#1E3A5F] text-[#2979FF]">
                {a.full_name?.charAt(0)?.toUpperCase() ?? '?'}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-slate-300">{a.full_name}</span>
          </div>
        )
      },
    },
    {
      accessorKey: 'due_date',
      header: ({ column }) => (
        <button className="flex items-center gap-1 text-slate-400 hover:text-white text-xs font-medium"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Due <ArrowUpDown className="w-3 h-3" />
        </button>
      ),
      cell: ({ row }) => (
        <span className="text-xs text-slate-400">
          {row.original.due_date ? format(new Date(row.original.due_date), 'MMM d, yyyy') : '—'}
        </span>
      ),
    },
    {
      accessorKey: 'created_at',
      header: ({ column }) => (
        <button className="flex items-center gap-1 text-slate-400 hover:text-white text-xs font-medium"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Created <ArrowUpDown className="w-3 h-3" />
        </button>
      ),
      cell: ({ row }) => (
        <span className="text-xs text-slate-500">
          {format(new Date(row.original.created_at), 'MMM d')}
        </span>
      ),
    },
  ]

  const table = useReactTable({
    data: tasks,
    columns,
    state: { sorting, columnFilters },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 20 } },
  })

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Input
          placeholder="Search tasks…"
          value={(table.getColumn('title')?.getFilterValue() as string) ?? ''}
          onChange={e => table.getColumn('title')?.setFilterValue(e.target.value)}
          className="max-w-xs bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 text-sm"
        />
        <Select
          value={(table.getColumn('urgency')?.getFilterValue() as string) ?? 'all'}
          onValueChange={v => table.getColumn('urgency')?.setFilterValue(v === 'all' ? '' : v)}
        >
          <SelectTrigger className="w-36 bg-slate-800 border-slate-700 text-white text-sm">
            <SelectValue placeholder="Urgency" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="all" className="text-white">All urgencies</SelectItem>
            {['critical', 'high', 'medium', 'low'].map(u => (
              <SelectItem key={u} value={u} className="text-white capitalize">{u}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(hg => (
              <TableRow key={hg.id} className="border-border hover:bg-transparent bg-[rgba(14,31,61,0.6)]">
                {hg.headers.map(header => (
                  <TableHead key={header.id} className="py-2.5 px-4">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-10 text-slate-500 text-sm">
                  No tasks found.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map(row => (
                <TableRow key={row.id} className="border-border hover:bg-[rgba(41,121,255,0.04)] transition-colors">
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id} className="py-2.5 px-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{table.getFilteredRowModel().rows.length} tasks</span>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="w-7 h-7"
              onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <span className="px-2">Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}</span>
            <Button variant="ghost" size="icon" className="w-7 h-7"
              onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
