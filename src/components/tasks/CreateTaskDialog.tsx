'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Profile } from '@/lib/types'
import { createTask } from '@/app/actions/tasks'
import { toast } from 'sonner'

interface CreateTaskDialogProps {
  workflowId: string
  stepId: string
  members: Profile[]
  trigger?: React.ReactNode
}

export function CreateTaskDialog({ workflowId, stepId, members, trigger }: CreateTaskDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [urgency, setUrgency] = useState('medium')
  const [assigneeId, setAssigneeId] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    formData.set('urgency', urgency)
    if (assigneeId) formData.set('assignee_id', assigneeId)
    const result = await createTask(workflowId, stepId, formData)
    setLoading(false)
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success('Task created!')
      setOpen(false)
    }
  }

  return (
    <>
      <div onClick={() => setOpen(true)}>
        {trigger ?? <Button size="sm">Add Task</Button>}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="bg-card border-border text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Create Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">Title</label>
            <Input name="title" placeholder="Task title…" required
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">Description</label>
            <Textarea name="description" placeholder="Markdown supported…" rows={3}
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Urgency</label>
              <Select value={urgency} onValueChange={(v) => v && setUrgency(v)}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {['critical', 'high', 'medium', 'low'].map(u => (
                    <SelectItem key={u} value={u} className="text-white capitalize">{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Due Date</label>
              <Input name="due_date" type="date"
                className="bg-slate-800 border-slate-700 text-white [color-scheme:dark]" />
            </div>
          </div>
          {members.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Assignee</label>
              <Select value={assigneeId} onValueChange={(v) => v && setAssigneeId(v)}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {members.map(m => (
                    <SelectItem key={m.id} value={m.id} className="text-white">{m.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="text-slate-400">Cancel</Button>
            <Button type="submit" disabled={loading} className="bg-[#2979FF] hover:bg-[#5c9bff] text-white">
              {loading ? 'Creating…' : 'Create Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
    </>
  )
}
