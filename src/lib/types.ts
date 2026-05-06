export type UrgencyLevel = 'critical' | 'high' | 'medium' | 'low'
export type EntryType = 'planned' | 'actual'
export type BudgetCategory = string  // allows preset or custom values


export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  is_superadmin: boolean
  created_at: string
}

export interface Workflow {
  id: string
  name: string
  description: string | null
  color: string
  created_by: string
  created_at: string
}

export interface WorkflowStep {
  id: string
  workflow_id: string
  name: string
  position: number
  color: string
  created_at: string
}

export interface Task {
  id: string
  workflow_id: string
  step_id: string
  title: string
  description: string | null
  urgency: UrgencyLevel
  assignee_id: string | null
  created_by: string
  due_date: string | null
  created_at: string
  updated_at: string
  // Joined
  workflow?: Workflow
  step?: WorkflowStep
  assignee?: Profile
  creator?: Profile
}

export interface TaskComment {
  id: string
  task_id: string
  user_id: string
  parent_id: string | null
  body: string
  created_at: string
  // Joined
  user?: Profile
  replies?: TaskComment[]
}

export interface TaskAuditLog {
  id: string
  task_id: string
  user_id: string
  from_step_id: string | null
  to_step_id: string | null
  action: string
  created_at: string
  // Joined
  user?: Profile
  from_step?: WorkflowStep
  to_step?: WorkflowStep
}

export interface BudgetAccount {
  id: string
  name: string
  category: BudgetCategory
  created_at: string
}

export interface BudgetPeriod {
  id: string
  account_id: string
  label: string
  starts_at: string
  ends_at: string
  locked: boolean
  created_at: string
  // Joined
  account?: BudgetAccount
}

export interface BudgetEntry {
  id: string
  period_id: string
  type: EntryType
  amount: number
  description: string | null
  created_by: string
  created_at: string
  // Joined
  period?: BudgetPeriod
  creator?: Profile
}

export interface BudgetLedger {
  id: string
  period_id: string
  entry_id: string
  debit: number
  credit: number
  running_balance: number
  created_at: string
}

export interface RunwayModel {
  id: string
  period_id: string
  projected_monthly_revenue: number
  computed_runway_months: number
  created_by: string
  created_at: string
}
