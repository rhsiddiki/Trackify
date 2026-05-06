'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ── Workflows ────────────────────────────────────────────────────

export async function createWorkflow(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase.from('workflows').insert({
    name: formData.get('name') as string,
    description: formData.get('description') as string || null,
    color: formData.get('color') as string || '#2979FF',
    created_by: user.id,
  })

  if (error) return { error: error.message }
  revalidatePath('/dashboard/workflows')
  return { success: true }
}

export async function updateWorkflow(id: string, formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('workflows')
    .update({
      name: formData.get('name') as string,
      description: formData.get('description') as string || null,
      color: formData.get('color') as string || '#2979FF',
    })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/workflows')
  return { success: true }
}

export async function deleteWorkflow(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('workflows').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/workflows')
  return { success: true }
}

// ── Workflow Steps ────────────────────────────────────────────────

export async function createStep(workflowId: string, formData: FormData) {
  const supabase = await createClient()

  // Get current max position
  const { data: steps } = await supabase
    .from('workflow_steps')
    .select('position')
    .eq('workflow_id', workflowId)
    .order('position', { ascending: false })
    .limit(1)

  const nextPosition = steps?.[0]?.position !== undefined ? steps[0].position + 1 : 0

  const { error } = await supabase.from('workflow_steps').insert({
    workflow_id: workflowId,
    name: formData.get('name') as string,
    color: formData.get('color') as string || '#1E3A5F',
    position: nextPosition,
  })

  if (error) return { error: error.message }
  revalidatePath(`/dashboard/workflows/${workflowId}`)
  return { success: true }
}

export async function deleteStep(id: string, workflowId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('workflow_steps').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath(`/dashboard/workflows/${workflowId}`)
  return { success: true }
}

// ── Tasks ─────────────────────────────────────────────────────────

export async function createTask(workflowId: string, stepId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase.from('tasks').insert({
    workflow_id: workflowId,
    step_id: stepId,
    title: formData.get('title') as string,
    description: formData.get('description') as string || null,
    urgency: formData.get('urgency') as string || 'medium',
    due_date: formData.get('due_date') as string || null,
    assignee_id: (formData.get('assignee_id') as string) || null,
    created_by: user.id,
  })

  if (error) return { error: error.message }
  revalidatePath(`/dashboard/workflows/${workflowId}`)
  return { success: true }
}

export async function moveTask(taskId: string, newStepId: string, workflowId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('tasks')
    .update({ step_id: newStepId })
    .eq('id', taskId)

  if (error) return { error: error.message }
  revalidatePath(`/dashboard/workflows/${workflowId}`)
  return { success: true }
}

export async function updateTask(taskId: string, workflowId: string, formData: FormData) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('tasks')
    .update({
      title: formData.get('title') as string,
      description: formData.get('description') as string || null,
      urgency: formData.get('urgency') as string || 'medium',
      due_date: formData.get('due_date') as string || null,
      assignee_id: (formData.get('assignee_id') as string) || null,
    })
    .eq('id', taskId)

  if (error) return { error: error.message }
  revalidatePath(`/dashboard/workflows/${workflowId}`)
  revalidatePath(`/dashboard/tasks/${taskId}`)
  return { success: true }
}

export async function deleteTask(taskId: string, workflowId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('tasks').delete().eq('id', taskId)
  if (error) return { error: error.message }
  revalidatePath(`/dashboard/workflows/${workflowId}`)
  return { success: true }
}

// ── Comments ──────────────────────────────────────────────────────

export async function addComment(taskId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase.from('task_comments').insert({
    task_id: taskId,
    user_id: user.id,
    parent_id: (formData.get('parent_id') as string) || null,
    body: formData.get('body') as string,
  })

  if (error) return { error: error.message }
  revalidatePath(`/dashboard/tasks/${taskId}`)
  return { success: true }
}
