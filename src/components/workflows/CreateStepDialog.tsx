'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createStep } from '@/app/actions/tasks'
import { toast } from 'sonner'

const STEP_COLORS = ['#1E3A5F', '#2979FF', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444']

export function CreateStepDialog({ workflowId, trigger }: { workflowId: string; trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedColor, setSelectedColor] = useState('#2979FF')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    formData.set('color', selectedColor)
    const result = await createStep(workflowId, formData)
    setLoading(false)
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success('Step added!')
      setOpen(false)
    }
  }

  return (
    <>
      <div onClick={() => setOpen(true)}>
        {trigger ?? <Button size="sm">Add Step</Button>}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="bg-card border-border text-white sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-white">Add Step</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">Name</label>
            <Input name="name" placeholder="e.g. In Review" required
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">Color</label>
            <div className="flex gap-2">
              {STEP_COLORS.map(color => (
                <button key={color} type="button" onClick={() => setSelectedColor(color)}
                  className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                  style={{ backgroundColor: color, boxShadow: selectedColor === color ? `0 0 0 2px #0a1628, 0 0 0 4px ${color}` : undefined }} />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="text-slate-400">Cancel</Button>
            <Button type="submit" disabled={loading} className="bg-[#2979FF] hover:bg-[#5c9bff] text-white">
              {loading ? 'Adding…' : 'Add Step'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
    </>
  )
}
