'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Plus } from 'lucide-react'
import { createWorkflow } from '@/app/actions/tasks'
import { toast } from 'sonner'

const WORKFLOW_COLORS = ['#2979FF', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4']

export function CreateWorkflowDialog({ trigger }: { trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedColor, setSelectedColor] = useState('#2979FF')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    formData.set('color', selectedColor)
    const result = await createWorkflow(formData)
    setLoading(false)
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success('Workflow created!')
      setOpen(false)
    }
  }

  return (
    <>
      <div onClick={() => setOpen(true)}>
        {trigger ?? (
          <Button size="sm" className="bg-[#2979FF] hover:bg-[#5c9bff] text-white">
            <Plus className="w-4 h-4 mr-1.5" /> New Workflow
          </Button>
        )}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="bg-card border-border text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Create Workflow</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">Name</label>
            <Input name="name" placeholder="e.g. Engineering Sprint" required
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">Description</label>
            <Textarea name="description" placeholder="Optional description…" rows={2}
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 resize-none" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">Color</label>
            <div className="flex gap-2">
              {WORKFLOW_COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className="w-7 h-7 rounded-full transition-transform hover:scale-110 focus:outline-none"
                  style={{
                    backgroundColor: color,
                    boxShadow: selectedColor === color ? `0 0 0 2px #0a1628, 0 0 0 4px ${color}` : undefined,
                  }}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}
              className="text-slate-400 hover:text-white">Cancel</Button>
            <Button type="submit" disabled={loading}
              className="bg-[#2979FF] hover:bg-[#5c9bff] text-white">
              {loading ? 'Creating…' : 'Create Workflow'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
    </>
  )
}
