'use client'

import { useDroppable } from '@dnd-kit/core'
import type { Workflow, WorkflowStep, Task, Profile } from '@/lib/types'
import { KanbanCard } from './KanbanCard'
import { CreateTaskDialog } from '../tasks/CreateTaskDialog'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface KanbanColumnProps {
  step: WorkflowStep
  tasks: (Task & { assignee?: Profile | null })[]
  workflow: Workflow
  steps: WorkflowStep[]
  members: Profile[]
  currentUserId: string
}

export function KanbanColumn({ step, tasks, workflow, steps, members, currentUserId }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: step.id })

  return (
    <div className="flex-shrink-0 w-72 flex flex-col">
      {/* Column Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: step.color }}
          />
          <span className="text-sm font-semibold text-slate-200">{step.name}</span>
          <span className="text-xs text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded-full">
            {tasks.length}
          </span>
        </div>
        <CreateTaskDialog
          workflowId={workflow.id}
          stepId={step.id}
          members={members}
          trigger={
            <button className="text-slate-600 hover:text-[#2979FF] transition-colors p-1 rounded">
              <Plus className="w-3.5 h-3.5" />
            </button>
          }
        />
      </div>

      {/* Drop Zone */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 flex flex-col gap-2.5 min-h-[100px] p-2 rounded-xl border transition-all duration-200',
          isOver
            ? 'border-[#2979FF]/50 bg-[rgba(41,121,255,0.05)]'
            : 'border-[rgba(41,121,255,0.1)] bg-[rgba(14,31,61,0.4)]'
        )}
      >
        {tasks.map(task => (
          <KanbanCard
            key={task.id}
            task={task}
            steps={steps}
            workflowId={workflow.id}
            currentUserId={currentUserId}
          />
        ))}

        {tasks.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-xs text-slate-600 text-center">Drop tasks here</p>
          </div>
        )}
      </div>
    </div>
  )
}
