'use client'

import { useState, useCallback } from 'react'
import { TaskDetail } from './TaskDetail'
import { getTaskDetail } from '@/app/actions/getTaskDetail'
import type { Task, WorkflowStep, Profile, TaskComment, TaskAuditLog } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'

interface TaskDetailWrapperProps {
  taskId: string
  workflowId: string
  steps: WorkflowStep[]
  currentUserId: string
  trigger: React.ReactNode
}

type DetailData = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  task: any
  comments: (TaskComment & { user?: Profile | null; replies?: (TaskComment & { user?: Profile | null })[] })[]
  auditLog: (TaskAuditLog & { user?: Profile | null; from_step?: WorkflowStep | null; to_step?: WorkflowStep | null })[]
}

export function TaskDetailWrapper({
  taskId, workflowId, steps, currentUserId, trigger
}: TaskDetailWrapperProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<DetailData | null>(null)

  const handleOpen = useCallback(async () => {
    setOpen(true)
    if (data) return // already loaded
    setLoading(true)
    const result = await getTaskDetail(taskId)
    setData(result as DetailData)
    setLoading(false)
  }, [taskId, data])

  return (
    <>
      <div onClick={handleOpen} className="cursor-pointer">
        {trigger}
      </div>

      {open && (
        loading || !data?.task ? (
          // Loading state — minimal skeleton sheet
          <div className="fixed inset-y-0 right-0 w-full sm:max-w-xl bg-card border-l border-border z-50 p-5 space-y-4">
            <Skeleton className="h-6 w-3/4 bg-slate-800" />
            <Skeleton className="h-4 w-1/2 bg-slate-800" />
            <Skeleton className="h-32 bg-slate-800" />
            <Skeleton className="h-4 w-full bg-slate-800" />
            <Skeleton className="h-4 w-5/6 bg-slate-800" />
          </div>
        ) : (
          <TaskDetail
            task={data.task}
            workflowId={workflowId}
            steps={steps}
            comments={data.comments}
            auditLog={data.auditLog}
            currentUserId={currentUserId}
            open={open}
            onClose={() => {
              setOpen(false)
              setData(null) // refresh on next open
            }}
          />
        )
      )}
    </>
  )
}
