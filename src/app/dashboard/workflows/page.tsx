import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { GitBranch, Plus, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { CreateWorkflowDialog } from '@/components/workflows/CreateWorkflowDialog'

export default async function WorkflowsPage() {
  const supabase = await createClient()

  const { data: workflows } = await supabase
    .from('workflows')
    .select(`
      *,
      workflow_steps(id),
      tasks(id)
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Workflows</h1>
          <p className="text-slate-400 text-sm mt-1">Manage your project workflows and task boards.</p>
        </div>
        <CreateWorkflowDialog />
      </div>

      {/* Workflows Grid */}
      {!workflows || workflows.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-[#2979FF]/20 rounded-xl">
          <GitBranch className="w-12 h-12 text-[#2979FF]/30 mx-auto mb-3" />
          <h3 className="text-white font-semibold mb-1">No workflows yet</h3>
          <p className="text-slate-500 text-sm mb-4">Create your first workflow to start tracking tasks.</p>
          <CreateWorkflowDialog trigger={<Button size="sm" className="bg-[#2979FF] hover:bg-[#5c9bff] text-white"><Plus className="w-4 h-4 mr-1.5" /> New Workflow</Button>} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {workflows.map((workflow) => (
            <Link key={workflow.id} href={`/dashboard/workflows/${workflow.id}`}>
              <Card className="bg-card border-border hover:border-[#2979FF]/40 transition-all duration-200 cursor-pointer group h-full">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3 mb-4">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${workflow.color}20` }}
                    >
                      <GitBranch className="w-5 h-5" style={{ color: workflow.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white text-sm truncate">{workflow.name}</h3>
                      {workflow.description && (
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{workflow.description}</p>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-[#2979FF] transition-colors flex-shrink-0" />
                  </div>
                  <div className="flex gap-4 text-xs text-slate-500">
                    <span>
                      <span className="text-slate-300 font-medium">{workflow.workflow_steps?.length ?? 0}</span> steps
                    </span>
                    <span>
                      <span className="text-slate-300 font-medium">{workflow.tasks?.length ?? 0}</span> tasks
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
