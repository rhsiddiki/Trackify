-- ============================================================
-- Trackify — Complete Supabase Schema Migration (No Roles)
-- All authenticated users have equal access.
-- Run this in: Supabase Dashboard > SQL Editor
-- Safe to re-run: drops existing objects before recreating.
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Drop existing tables (cascade removes dependent objects) ──
DROP TABLE IF EXISTS runway_models      CASCADE;
DROP TABLE IF EXISTS budget_ledger      CASCADE;
DROP TABLE IF EXISTS budget_entries     CASCADE;
DROP TABLE IF EXISTS budget_periods     CASCADE;
DROP TABLE IF EXISTS budget_accounts    CASCADE;
DROP TABLE IF EXISTS task_audit_log     CASCADE;
DROP TABLE IF EXISTS task_comments      CASCADE;
DROP TABLE IF EXISTS tasks              CASCADE;
DROP TABLE IF EXISTS workflow_steps     CASCADE;
DROP TABLE IF EXISTS workflows          CASCADE;
DROP TABLE IF EXISTS profiles           CASCADE;

-- ── Drop existing functions ───────────────────────────────────
DROP FUNCTION IF EXISTS public.handle_new_user()         CASCADE;
DROP FUNCTION IF EXISTS public.fn_log_task_step_change() CASCADE;
DROP FUNCTION IF EXISTS public.fn_lock_budget_period()   CASCADE;
DROP FUNCTION IF EXISTS public.fn_record_ledger_entry()  CASCADE;
DROP FUNCTION IF EXISTS public.get_my_role()             CASCADE; -- old role helper

-- ── Drop existing types ───────────────────────────────────────
DROP TYPE IF EXISTS urgency_level   CASCADE;
DROP TYPE IF EXISTS entry_type      CASCADE;
DROP TYPE IF EXISTS budget_category CASCADE;
DROP TYPE IF EXISTS user_role       CASCADE; -- from any previous migration

-- ── Enums ────────────────────────────────────────────────────
CREATE TYPE urgency_level   AS ENUM ('critical', 'high', 'medium', 'low');
CREATE TYPE entry_type      AS ENUM ('planned', 'actual');
-- budget_category is plain TEXT to allow custom category names


-- ── Profiles ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  is_superadmin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── Workflows ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL DEFAULT '#2979FF',
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Workflow Steps ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workflow_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  color TEXT NOT NULL DEFAULT '#1E3A5F',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Tasks ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  step_id UUID NOT NULL REFERENCES workflow_steps(id),
  title TEXT NOT NULL,
  description TEXT,
  urgency urgency_level NOT NULL DEFAULT 'medium',
  assignee_id UUID REFERENCES profiles(id),
  created_by UUID NOT NULL REFERENCES profiles(id),
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Task Comments ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS task_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  parent_id UUID REFERENCES task_comments(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Task Audit Log ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS task_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  from_step_id UUID REFERENCES workflow_steps(id),
  to_step_id UUID REFERENCES workflow_steps(id),
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger: auto-log task step changes + update updated_at
CREATE OR REPLACE FUNCTION public.fn_log_task_step_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.step_id IS DISTINCT FROM NEW.step_id THEN
    INSERT INTO task_audit_log (task_id, user_id, from_step_id, to_step_id, action)
    VALUES (NEW.id, auth.uid(), OLD.step_id, NEW.step_id, 'step_changed');
  END IF;
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_task_step_change ON tasks;
CREATE TRIGGER on_task_step_change
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION public.fn_log_task_step_change();

-- ── Budget Accounts ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS budget_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Budget Periods ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS budget_periods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES budget_accounts(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  starts_at DATE NOT NULL,
  ends_at DATE NOT NULL,
  locked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Budget Entries ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS budget_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  period_id UUID NOT NULL REFERENCES budget_periods(id) ON DELETE CASCADE,
  type entry_type NOT NULL,
  amount NUMERIC(14, 2) NOT NULL CHECK (amount >= 0),
  description TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Guard: prevent inserts/updates on locked periods
CREATE OR REPLACE FUNCTION public.fn_lock_budget_period()
RETURNS TRIGGER AS $$
DECLARE
  is_locked BOOLEAN;
BEGIN
  SELECT locked INTO is_locked FROM budget_periods WHERE id = NEW.period_id;
  IF is_locked THEN
    RAISE EXCEPTION 'Cannot modify a locked budget period.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS guard_locked_period ON budget_entries;
CREATE TRIGGER guard_locked_period
  BEFORE INSERT OR UPDATE ON budget_entries
  FOR EACH ROW EXECUTE FUNCTION public.fn_lock_budget_period();

-- ── Budget Ledger ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS budget_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  period_id UUID NOT NULL REFERENCES budget_periods(id) ON DELETE CASCADE,
  entry_id UUID NOT NULL REFERENCES budget_entries(id) ON DELETE CASCADE,
  debit NUMERIC(14, 2) NOT NULL DEFAULT 0,
  credit NUMERIC(14, 2) NOT NULL DEFAULT 0,
  running_balance NUMERIC(14, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger: double-entry ledger on budget_entries insert
CREATE OR REPLACE FUNCTION public.fn_record_ledger_entry()
RETURNS TRIGGER AS $$
DECLARE
  prev_balance NUMERIC(14, 2);
  debit_val NUMERIC(14, 2) := 0;
  credit_val NUMERIC(14, 2) := 0;
  new_balance NUMERIC(14, 2);
BEGIN
  SELECT running_balance INTO prev_balance
  FROM budget_ledger
  WHERE period_id = NEW.period_id
  ORDER BY created_at DESC
  LIMIT 1;

  prev_balance := COALESCE(prev_balance, 0);

  IF NEW.type = 'actual' THEN
    debit_val := NEW.amount;
    new_balance := prev_balance - NEW.amount;
  ELSE
    credit_val := NEW.amount;
    new_balance := prev_balance + NEW.amount;
  END IF;

  INSERT INTO budget_ledger (period_id, entry_id, debit, credit, running_balance)
  VALUES (NEW.period_id, NEW.id, debit_val, credit_val, new_balance);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_budget_entry_insert ON budget_entries;
CREATE TRIGGER on_budget_entry_insert
  AFTER INSERT ON budget_entries
  FOR EACH ROW EXECUTE FUNCTION public.fn_record_ledger_entry();

-- ── Runway Models ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS runway_models (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  period_id UUID NOT NULL REFERENCES budget_periods(id) ON DELETE CASCADE,
  projected_monthly_revenue NUMERIC(14, 2) NOT NULL DEFAULT 0,
  computed_runway_months NUMERIC(8, 2) NOT NULL DEFAULT 0,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY POLICIES
-- All authenticated users have equal access.
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE runway_models ENABLE ROW LEVEL SECURITY;

-- Profiles: any authenticated user can read all; update only own
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Workflows: any authenticated user has full access
CREATE POLICY "workflows_select" ON workflows FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "workflows_insert" ON workflows FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "workflows_update" ON workflows FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "workflows_delete" ON workflows FOR DELETE USING (auth.uid() IS NOT NULL);

-- Workflow Steps: any authenticated user has full access
CREATE POLICY "steps_select" ON workflow_steps FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "steps_insert" ON workflow_steps FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "steps_update" ON workflow_steps FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "steps_delete" ON workflow_steps FOR DELETE USING (auth.uid() IS NOT NULL);

-- Tasks: any authenticated user has full access
CREATE POLICY "tasks_select" ON tasks FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "tasks_insert" ON tasks FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "tasks_update" ON tasks FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "tasks_delete" ON tasks FOR DELETE USING (auth.uid() IS NOT NULL);

-- Task Comments: any authenticated user has full access; delete own or all
CREATE POLICY "comments_select" ON task_comments FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "comments_insert" ON task_comments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "comments_update" ON task_comments FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "comments_delete" ON task_comments FOR DELETE USING (user_id = auth.uid());

-- Audit Log: any authenticated user can read; system-written only
CREATE POLICY "audit_select" ON task_audit_log FOR SELECT USING (auth.uid() IS NOT NULL);

-- Budget: any authenticated user has full access
CREATE POLICY "budget_accounts_select" ON budget_accounts FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "budget_accounts_insert" ON budget_accounts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "budget_accounts_update" ON budget_accounts FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "budget_periods_select" ON budget_periods FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "budget_periods_insert" ON budget_periods FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "budget_periods_update" ON budget_periods FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "budget_entries_select" ON budget_entries FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "budget_entries_insert" ON budget_entries FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "budget_entries_update" ON budget_entries FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "ledger_select" ON budget_ledger FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "runway_select" ON runway_models FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "runway_insert" ON runway_models FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "runway_update" ON runway_models FOR UPDATE USING (auth.uid() IS NOT NULL);

-- ============================================================
-- ENABLE REALTIME
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE task_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE budget_ledger;

-- ============================================================
-- SEED: Superadmin User
-- Creates Aneek Siddiki with password "1234" if not existing.
-- pgcrypto is available by default on Supabase.
-- ============================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  v_id UUID;
BEGIN
  -- Check if user already exists in auth
  SELECT id INTO v_id FROM auth.users WHERE email = 'aneeksiddiki@gmail.com';

  IF v_id IS NULL THEN
    v_id := uuid_generate_v4();

    INSERT INTO auth.users (
      instance_id, id, aud, role, email,
      encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at,
      confirmation_token, email_change,
      email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_id,
      'authenticated', 'authenticated',
      'aneeksiddiki@gmail.com',
      crypt('1234', gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Aneek Siddiki"}',
      NOW(), NOW(),
      '', '', '', ''
    );
    -- Trigger handle_new_user fires here and creates the profile row
  END IF;

  -- Upsert profile row (handles re-runs where profile was dropped)
  INSERT INTO public.profiles (id, full_name, is_superadmin)
  VALUES (v_id, 'Aneek Siddiki', TRUE)
  ON CONFLICT (id) DO UPDATE
    SET is_superadmin = TRUE, full_name = 'Aneek Siddiki';

END $$;
