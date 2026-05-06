import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { KanbanBoard } from '@/components/kanban/KanbanBoard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TaskTable } from '@/components/list/TaskTable'
import { LayoutGrid, List } from 'lucide-react'

export default async function WorkflowPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const currentUserId = user?.id ?? ''

  const { data: workflow } = await supabase
    .from('workflows')
    .select('*')
    .eq('id', id)
    .single()

  if (!workflow) notFound()

  const { data: steps } = await supabase
    .from('workflow_steps')
    .select('*')
    .eq('workflow_id', id)
    .order('position', { ascending: true })

  const { data: tasks } = await supabase
    .from('tasks')
    .select(`
      *,
      assignee:profiles!tasks_assignee_id_fkey(id, full_name, avatar_url, created_at)
    `)
    .eq('workflow_id', id)
    .order('created_at', { ascending: true })

  const { data: members } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, is_superadmin, created_at')
    .order('full_name', { ascending: true })

  return (
    <div className="p-6 space-y-5 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: workflow.color }}
        />
        <div>
          <h1 className="text-2xl font-bold text-white">{workflow.name}</h1>
          {workflow.description && (
            <p className="text-slate-400 text-sm mt-0.5">{workflow.description}</p>
          )}
        </div>
      </div>

      {/* View Toggle */}
      <Tabs defaultValue="kanban" className="flex-1 flex flex-col">
        <TabsList className="bg-card border border-border w-fit">
          <TabsTrigger value="kanban" className="data-[state=active]:bg-[#2979FF] data-[state=active]:text-white text-slate-400 gap-1.5 text-xs">
            <LayoutGrid className="w-3.5 h-3.5" /> Kanban
          </TabsTrigger>
          <TabsTrigger value="list" className="data-[state=active]:bg-[#2979FF] data-[state=active]:text-white text-slate-400 gap-1.5 text-xs">
            <List className="w-3.5 h-3.5" /> List
          </TabsTrigger>
        </TabsList>

        <TabsContent value="kanban" className="flex-1 mt-4">
          <KanbanBoard
            workflow={workflow}
            steps={steps ?? []}
            tasks={tasks ?? []}
            members={members ?? []}
            currentUserId={currentUserId}
          />
        </TabsContent>

        <TabsContent value="list" className="mt-4">
          <TaskTable
            tasks={tasks ?? []}
            steps={steps ?? []}
            workflowId={id}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
