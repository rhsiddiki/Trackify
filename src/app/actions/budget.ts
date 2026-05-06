'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createBudgetAccount(formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.from('budget_accounts').insert({
    name: formData.get('name') as string,
    category: formData.get('category') as string || 'other',
  })
  if (error) return { error: error.message }
  revalidatePath('/dashboard/budget')
  return { success: true }
}

export async function createBudgetPeriod(accountId: string, formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.from('budget_periods').insert({
    account_id: accountId,
    label: formData.get('label') as string,
    starts_at: formData.get('starts_at') as string,
    ends_at: formData.get('ends_at') as string,
  })
  if (error) return { error: error.message }
  revalidatePath('/dashboard/budget')
  return { success: true }
}

export async function createBudgetEntry(periodId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase.from('budget_entries').insert({
    period_id: periodId,
    type: formData.get('type') as string,
    amount: parseFloat(formData.get('amount') as string),
    description: (formData.get('description') as string) || null,
    created_by: user.id,
  })
  if (error) return { error: error.message }
  revalidatePath('/dashboard/budget')
  revalidatePath('/dashboard/investor')
  return { success: true }
}

export async function lockBudgetPeriod(periodId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('budget_periods')
    .update({ locked: true })
    .eq('id', periodId)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/budget')
  revalidatePath('/dashboard/investor')
  return { success: true }
}

export async function createRunwayModel(periodId: string, projectedRevenue: number, currentBalance: number, monthlyBurn: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const netMonthlyBurn = monthlyBurn - projectedRevenue
  const runwayMonths = netMonthlyBurn > 0 ? currentBalance / netMonthlyBurn : 999

  const { error } = await supabase.from('runway_models').insert({
    period_id: periodId,
    projected_monthly_revenue: projectedRevenue,
    computed_runway_months: Math.max(0, Math.round(runwayMonths * 10) / 10),
    created_by: user.id,
  })
  if (error) return { error: error.message }
  revalidatePath('/dashboard/investor')
  return { success: true, runwayMonths: Math.max(0, runwayMonths) }
}
