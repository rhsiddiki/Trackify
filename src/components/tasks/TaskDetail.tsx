'use client'

import { useState, useTransition } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { UrgencyBadge } from './UrgencyBadge'
import { deleteTask, addComment } from '@/app/actions/tasks'
import type { Task, WorkflowStep, Profile, TaskComment, TaskAuditLog } from '@/lib/types'
import { format, formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  Calendar, User, ArrowRight, MessageSquare, Clock,
  Trash2, ChevronRight, CornerDownRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface TaskDetailProps {
  task: Task & {
    assignee?: Profile | null
    creator?: Profile | null
    step?: WorkflowStep
  }
  workflowId: string
  steps: WorkflowStep[]
  comments: (TaskComment & { user?: Profile | null; replies?: (TaskComment & { user?: Profile | null })[] })[]
  auditLog: (TaskAuditLog & {
    user?: Profile | null
    from_step?: WorkflowStep | null
    to_step?: WorkflowStep | null
  })[]
  currentUserId: string
  open: boolean
  onClose: () => void
}

export function TaskDetail({
  task, workflowId, steps, comments, auditLog, currentUserId, open, onClose
}: TaskDetailProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'history'>('details')
  const [commentBody, setCommentBody] = useState('')
  const [replyToId, setReplyToId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const stepName = steps.find(s => s.id === task.step_id)?.name ?? '—'
  const stepColor = steps.find(s => s.id === task.step_id)?.color ?? '#2979FF'

  function handleDelete() {
    if (!confirm('Delete this task? This cannot be undone.')) return
    startTransition(async () => {
      const result = await deleteTask(task.id, workflowId)
      if (result?.error) toast.error(result.error)
      else { toast.success('Task deleted'); onClose() }
    })
  }

  function handleAddComment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!commentBody.trim()) return
    startTransition(async () => {
      const formData = new FormData()
      formData.set('body', commentBody)
      if (replyToId) formData.set('parent_id', replyToId)
      const result = await addComment(task.id, formData)
      if (result?.error) toast.error(result.error)
      else {
        setCommentBody('')
        setReplyToId(null)
        toast.success('Comment added')
      }
    })
  }

  const urgencyColor: Record<string, string> = {
    critical: 'border-red-500/30',
    high: 'border-amber-500/30',
    medium: 'border-blue-500/30',
    low: 'border-slate-500/30',
  }

  const tabs = [
    { id: 'details' as const, label: 'Details', icon: ChevronRight },
    { id: 'comments' as const, label: `Comments (${comments.length})`, icon: MessageSquare },
    { id: 'history' as const, label: `History (${auditLog.length})`, icon: Clock },
  ]

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className={cn(
          'w-full sm:max-w-xl bg-card border-l border-border flex flex-col p-0 gap-0',
          `border-l-2 ${urgencyColor[task.urgency]}`
        )}
      >
        {/* Header */}
        <SheetHeader className="px-5 pt-5 pb-4 border-b border-border">
          <div className="flex items-start justify-between gap-3">
            <SheetTitle className="text-white text-base font-semibold leading-snug flex-1 text-left">
              {task.title}
            </SheetTitle>
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-600 hover:text-red-400 hover:bg-red-500/10 h-7 w-7 flex-shrink-0"
              onClick={handleDelete}
              disabled={isPending}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
          <div className="flex items-center gap-2 flex-wrap mt-1">
            <UrgencyBadge urgency={task.urgency} />
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-border text-xs text-slate-400">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stepColor }} />
              {stepName}
            </div>
          </div>
        </SheetHeader>

        {/* Tab Bar */}
        <div className="flex border-b border-border px-5">
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                'text-xs font-medium py-2.5 px-3 border-b-2 -mb-px transition-colors',
                activeTab === id
                  ? 'border-[#2979FF] text-[#2979FF]'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">

          {/* ── Details Tab ─────────────────────────────────────────── */}
          {activeTab === 'details' && (
            <div className="px-5 py-4 space-y-5">
              {/* Meta */}
              <div className="grid grid-cols-2 gap-3">
                <MetaItem icon={<User className="w-3.5 h-3.5" />} label="Assignee">
                  {task.assignee ? (
                    <div className="flex items-center gap-1.5">
                      <Avatar className="w-4 h-4">
                        <AvatarFallback className="text-[8px] bg-[#1E3A5F] text-[#2979FF]">
                          {task.assignee.full_name?.charAt(0)?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-slate-200">{task.assignee.full_name}</span>
                    </div>
                  ) : <span className="text-xs text-slate-500">Unassigned</span>}
                </MetaItem>
                <MetaItem icon={<Calendar className="w-3.5 h-3.5" />} label="Due Date">
                  <span className="text-xs text-slate-200">
                    {task.due_date ? format(new Date(task.due_date), 'MMM d, yyyy') : '—'}
                  </span>
                </MetaItem>
                <MetaItem icon={<User className="w-3.5 h-3.5" />} label="Created by">
                  <span className="text-xs text-slate-200">{task.creator?.full_name ?? '—'}</span>
                </MetaItem>
                <MetaItem icon={<Clock className="w-3.5 h-3.5" />} label="Created">
                  <span className="text-xs text-slate-200">
                    {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
                  </span>
                </MetaItem>
              </div>

              <Separator className="bg-border" />

              {/* Description */}
              <div>
                <p className="text-xs font-medium text-slate-400 mb-2">Description</p>
                {task.description ? (
                  <div className="prose prose-invert prose-sm max-w-none text-slate-300
                    prose-headings:text-white prose-a:text-[#2979FF] prose-code:bg-slate-800
                    prose-code:text-blue-300 prose-code:px-1 prose-code:rounded prose-code:text-xs
                    prose-blockquote:border-[#2979FF] prose-blockquote:text-slate-400">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {task.description}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm text-slate-600 italic">No description provided.</p>
                )}
              </div>
            </div>
          )}

          {/* ── Comments Tab ─────────────────────────────────────────── */}
          {activeTab === 'comments' && (
            <div className="px-5 py-4 space-y-4">
              {/* Comment list */}
              {comments.length === 0 ? (
                <p className="text-sm text-slate-600 text-center py-6">No comments yet. Be the first!</p>
              ) : (
                <div className="space-y-4">
                  {comments.filter(c => !c.parent_id).map(comment => (
                    <div key={comment.id} className="space-y-2">
                      <CommentBubble
                        comment={comment}
                        onReply={() => setReplyToId(comment.id)}
                        isOwn={comment.user_id === currentUserId}
                      />
                      {/* Replies */}
                      {comment.replies?.map(reply => (
                        <div key={reply.id} className="ml-6 flex gap-2">
                          <CornerDownRight className="w-3.5 h-3.5 text-slate-700 mt-1.5 flex-shrink-0" />
                          <CommentBubble
                            comment={reply}
                            isOwn={reply.user_id === currentUserId}
                          />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              <Separator className="bg-border" />

              {/* Add Comment Form */}
              <form onSubmit={handleAddComment} className="space-y-2">
                {replyToId && (
                  <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-800/50 rounded px-2 py-1">
                    <span>Replying to comment</span>
                    <button type="button" onClick={() => setReplyToId(null)} className="hover:text-white">✕</button>
                  </div>
                )}
                <Textarea
                  value={commentBody}
                  onChange={e => setCommentBody(e.target.value)}
                  placeholder="Write a comment… (Markdown supported)"
                  rows={3}
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 text-sm resize-none"
                />
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isPending || !commentBody.trim()}
                    className="bg-[#2979FF] hover:bg-[#5c9bff] text-white text-xs"
                  >
                    {isPending ? 'Posting…' : 'Post Comment'}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* ── History Tab ─────────────────────────────────────────── */}
          {activeTab === 'history' && (
            <div className="px-5 py-4">
              {auditLog.length === 0 ? (
                <p className="text-sm text-slate-600 text-center py-6">No history yet.</p>
              ) : (
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-3.5 top-2 bottom-2 w-px bg-border" />
                  <div className="space-y-4">
                    {auditLog.map((log) => (
                      <div key={log.id} className="flex gap-3 relative">
                        <div className="w-7 h-7 rounded-full bg-[#1E3A5F] border border-[#2979FF]/30 flex items-center justify-center flex-shrink-0 z-10">
                          <ArrowRight className="w-3 h-3 text-[#2979FF]" />
                        </div>
                        <div className="flex-1 min-w-0 pb-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-medium text-slate-200">
                              {log.user?.full_name ?? 'Someone'}
                            </span>
                            <span className="text-xs text-slate-500">moved task</span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1">
                            {log.from_step && (
                              <StepChip name={log.from_step.name} color={log.from_step.color} />
                            )}
                            <ArrowRight className="w-3 h-3 text-slate-600" />
                            {log.to_step && (
                              <StepChip name={log.to_step.name} color={log.to_step.color} />
                            )}
                          </div>
                          <p className="text-[10px] text-slate-600 mt-1">
                            {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ── Sub-components ────────────────────────────────────────────

function MetaItem({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1 text-[10px] text-slate-500">
        {icon} {label}
      </div>
      {children}
    </div>
  )
}

function CommentBubble({
  comment,
  onReply,
  isOwn,
}: {
  comment: TaskComment & { user?: Profile | null }
  onReply?: () => void
  isOwn: boolean
}) {
  return (
    <div className="flex gap-2.5 group">
      <Avatar className="w-6 h-6 flex-shrink-0 mt-0.5">
        <AvatarFallback className="text-[9px] bg-[#1E3A5F] text-[#2979FF]">
          {comment.user?.full_name?.charAt(0)?.toUpperCase() ?? '?'}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-slate-300">{comment.user?.full_name ?? 'User'}</span>
          <span className="text-[10px] text-slate-600">
            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
          </span>
          {onReply && (
            <button
              onClick={onReply}
              className="text-[10px] text-slate-600 hover:text-[#2979FF] opacity-0 group-hover:opacity-100 transition-opacity"
            >
              Reply
            </button>
          )}
        </div>
        <div className={cn(
          'rounded-lg px-3 py-2 text-sm text-slate-200',
          isOwn ? 'bg-[rgba(41,121,255,0.12)] border border-[#2979FF]/20' : 'bg-slate-800 border border-slate-700'
        )}>
          <div className="prose prose-invert prose-sm max-w-none prose-p:my-0">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{comment.body}</ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  )
}

function StepChip({ name, color }: { name: string; color: string }) {
  return (
    <span className="flex items-center gap-1 text-[10px] text-slate-300 bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded">
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
      {name}
    </span>
  )
}
