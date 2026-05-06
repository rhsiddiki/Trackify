'use client'

import { useEffect, useOptimistic } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Task, Profile } from '@/lib/types'
import { toast } from 'sonner'

type TaskWithAssignee = Task & { assignee?: Profile | null }

/**
 * useRealtimeTasks
 * Subscribes to Supabase Realtime changes on the `tasks` table
 * for a given workflow. Returns optimistically updated task list.
 */
export function useRealtimeTasks(
  workflowId: string,
  initialTasks: TaskWithAssignee[]
) {
  const [tasks, setTasks] = useOptimistic(initialTasks) as [
    TaskWithAssignee[],
    (action: TaskWithAssignee[]) => void
  ]

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`workflow-tasks-${workflowId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `workflow_id=eq.${workflowId}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            // Fetch the full task with assignee join
            const { data } = await supabase
              .from('tasks')
              .select('*, assignee:profiles!tasks_assignee_id_fkey(id, full_name, avatar_url, created_at)')
              .eq('id', payload.new.id)
              .single()
            if (data) {
              setTasks([...initialTasks, data as TaskWithAssignee])
              toast.info(`New task: "${data.title}"`)
            }
          } else if (payload.eventType === 'UPDATE') {
            const { data } = await supabase
              .from('tasks')
              .select('*, assignee:profiles!tasks_assignee_id_fkey(id, full_name, avatar_url, created_at)')
              .eq('id', payload.new.id)
              .single()
            if (data) {
              setTasks(initialTasks.map(t => t.id === data.id ? data as TaskWithAssignee : t))
              if (payload.old.step_id !== payload.new.step_id) {
                toast.success(`Task moved: "${data.title}"`)
              }
            }
          } else if (payload.eventType === 'DELETE') {
            setTasks(initialTasks.filter(t => t.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [workflowId, initialTasks, setTasks])

  return tasks
}
