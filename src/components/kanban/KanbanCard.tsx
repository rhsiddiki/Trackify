'use client'

import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Task, Profile, WorkflowStep } from '@/lib/types'
import { UrgencyBadge } from '../tasks/UrgencyBadge'
import { TaskDetailWrapper } from '../tasks/TaskDetailWrapper'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Calendar, GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

interface KanbanCardProps {
  task: Task & { assignee?: Profile | null }
  steps: WorkflowStep[]
  workflowId: string
  currentUserId: string
  isDragging?: boolean
}

export function KanbanCard({
  task, steps, workflowId, currentUserId, isDragging = false
}: KanbanCardProps) {
  const {
    attributes, listeners, setNodeRef, transform, transition,
    isDragging: isSortDragging
  } = useSortable({ id: task.id })

  const [wasDragged, setWasDragged] = useState(false)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        `kanban-card urgency-${task.urgency}`,
        'bg-card border border-border rounded-lg select-none relative',
        (isDragging || isSortDragging) && 'dragging opacity-50'
      )}
    >
      {/* Drag handle — only this area triggers drag */}
      <div
        className="absolute top-2 left-2 cursor-grab active:cursor-grabbing p-1"
        {...attributes}
        {...listeners}
        onPointerDown={() => setWasDragged(false)}
        onPointerMove={() => setWasDragged(true)}
      >
        <GripVertical className="w-3.5 h-3.5 text-slate-600" />
      </div>

      {/* Clickable body (opens detail) */}
      <TaskDetailWrapper
        taskId={task.id}
        workflowId={workflowId}
        steps={steps}
        currentUserId={currentUserId}
        trigger={
          <div
            className="p-3 pl-8 cursor-pointer"
            onClick={(e) => {
              if (wasDragged) { e.preventDefault(); e.stopPropagation() }
            }}
          >
            {/* Title */}
            <p className="text-sm text-slate-100 font-medium leading-tight line-clamp-2 mb-2.5">
              {task.title}
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between">
              <UrgencyBadge urgency={task.urgency} size="xs" />
              <div className="flex items-center gap-2">
                {task.due_date && (
                  <div className="flex items-center gap-1 text-[10px] text-slate-500">
                    <Calendar className="w-3 h-3" />
                    <span>{format(new Date(task.due_date), 'MMM d')}</span>
                  </div>
                )}
                {task.assignee && (
                  <Avatar className="w-5 h-5">
                    <AvatarFallback className="text-[9px] bg-[#1E3A5F] text-[#2979FF]">
                      {task.assignee.full_name?.charAt(0)?.toUpperCase() ?? '?'}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            </div>
          </div>
        }
      />
    </div>
  )
}
