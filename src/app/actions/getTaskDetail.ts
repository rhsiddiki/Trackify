'use server'

import { createClient } from '@/lib/supabase/server'

export async function getTaskDetail(taskId: string) {
  const supabase = await createClient()

  const [{ data: task }, { data: comments }, { data: auditLog }] = await Promise.all([
    supabase
      .from('tasks')
      .select(`
        *,
        assignee:profiles!tasks_assignee_id_fkey(id, full_name, avatar_url, created_at),
        creator:profiles!tasks_created_by_fkey(id, full_name, avatar_url, created_at)
      `)
      .eq('id', taskId)
      .single(),

    supabase
      .from('task_comments')
      .select(`
        *,
        user:profiles(id, full_name, avatar_url, created_at)
      `)
      .eq('task_id', taskId)
      .order('created_at', { ascending: true }),

    supabase
      .from('task_audit_log')
      .select(`
        *,
        user:profiles(id, full_name, avatar_url, created_at),
        from_step:workflow_steps!task_audit_log_from_step_id_fkey(id, name, color, position, workflow_id, created_at),
        to_step:workflow_steps!task_audit_log_to_step_id_fkey(id, name, color, position, workflow_id, created_at)
      `)
      .eq('task_id', taskId)
      .order('created_at', { ascending: false }),
  ])

  // Nest replies under parent comments
  const topLevel = (comments ?? []).filter(c => !c.parent_id)
  const nested = topLevel.map(comment => ({
    ...comment,
    replies: (comments ?? []).filter(c => c.parent_id === comment.id),
  }))

  return { task, comments: nested, auditLog: auditLog ?? [] }
}
