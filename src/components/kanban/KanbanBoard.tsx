'use client'

import { useState, useOptimistic } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { Workflow, WorkflowStep, Task, Profile } from '@/lib/types'
import { KanbanColumn } from './KanbanColumn'
import { KanbanCard } from './KanbanCard'
import { moveTask } from '@/app/actions/tasks'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { CreateStepDialog } from '../workflows/CreateStepDialog'

interface KanbanBoardProps {
  workflow: Workflow
  steps: WorkflowStep[]
  tasks: (Task & { assignee?: Profile | null })[]
  members: Profile[]
  currentUserId: string
}

export function KanbanBoard({ workflow, steps, tasks, members, currentUserId }: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<(Task & { assignee?: Profile | null }) | null>(null)
  const [optimisticTasks, addOptimisticTask] = useOptimistic(
    tasks,
    (state, { taskId, newStepId }: { taskId: string; newStepId: string }) =>
      state.map(t => t.id === taskId ? { ...t, step_id: newStepId } : t)
  )

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  function onDragStart(event: DragStartEvent) {
    const task = tasks.find(t => t.id === event.active.id)
    if (task) setActiveTask(task)
  }

  async function onDragEnd(event: DragEndEvent) {
    setActiveTask(null)
    const { active, over } = event
    if (!over || active.id === over.id) return

    const task = tasks.find(t => t.id === active.id)
    if (!task) return

    // The 'over' can be a column id or another task id
    let targetStepId = over.id as string

    // If dropped on a task, get that task's step
    const targetTask = tasks.find(t => t.id === over.id)
    if (targetTask) targetStepId = targetTask.step_id

    if (task.step_id === targetStepId) return

    addOptimisticTask({ taskId: task.id, newStepId: targetStepId })
    const result = await moveTask(task.id, targetStepId, workflow.id)
    if (result?.error) {
      toast.error(`Failed to move task: ${result.error}`)
    } else {
      toast.success('Task moved')
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 h-full">
        {steps.map(step => {
          const stepTasks = optimisticTasks.filter(t => t.step_id === step.id)
          return (
            <SortableContext
              key={step.id}
              items={stepTasks.map(t => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <KanbanColumn
                step={step}
                tasks={stepTasks}
                workflow={workflow}
                steps={steps}
                members={members}
                currentUserId={currentUserId}
              />
            </SortableContext>
          )
        })}

        {/* Add Step button */}
        <div className="flex-shrink-0 w-72">
          <CreateStepDialog
            workflowId={workflow.id}
            trigger={
              <button className="w-full h-10 rounded-lg border border-dashed border-[#2979FF]/25 text-slate-500 hover:text-[#2979FF] hover:border-[#2979FF]/50 flex items-center justify-center gap-2 text-sm transition-all duration-200">
                <Plus className="w-4 h-4" /> Add Step
              </button>
            }
          />
        </div>
      </div>

      <DragOverlay>
        {activeTask && <KanbanCard task={activeTask} steps={steps} workflowId={workflow.id} currentUserId={currentUserId} isDragging />}
      </DragOverlay>
    </DndContext>
  )
}
