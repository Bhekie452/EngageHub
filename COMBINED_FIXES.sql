-- COMBINED DATABASE FIXES
-- This script ensures all necessary tables exist and applies the latest RLS policies.

-- 1. Ensure core tables exist (if not already created by supabase-schema.sql)
CREATE TABLE IF NOT EXISTS public.pipelines (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  type TEXT DEFAULT 'sales' CHECK (type IN ('sales', 'partnership', 'investment', 'custom')),
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pipeline_stages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  pipeline_id UUID REFERENCES pipelines(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  probability INTEGER DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
  position INTEGER DEFAULT 0,
  is_closed_won BOOLEAN DEFAULT FALSE,
  is_closed_lost BOOLEAN DEFAULT FALSE,
  automation_actions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.deals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  pipeline_id UUID REFERENCES pipelines(id) ON DELETE RESTRICT NOT NULL,
  stage_id UUID REFERENCES pipeline_stages(id) ON DELETE RESTRICT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(15, 2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'USD', 
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  owner_id UUID REFERENCES auth.users(id) NOT NULL,
  lead_source TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'won', 'lost', 'abandoned')),
  probability INTEGER DEFAULT 50 CHECK (probability >= 0 AND probability <= 100),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Apply Posts RLS Fixes
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own posts" ON public.posts;
DROP POLICY IF EXISTS "Workspace owners can view workspace posts" ON public.posts;

CREATE POLICY "Users can manage their own posts" ON public.posts
    FOR ALL
    USING (auth.uid() = created_by)
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Workspace owners can view workspace posts" ON public.posts
    FOR SELECT
    USING (
        workspace_id IN (
            SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
        )
    );

-- 3. Apply Campaigns RLS Fixes
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view campaigns from their workspaces" ON public.campaigns;
DROP POLICY IF EXISTS "Users can insert their own campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Users can update campaigns from their workspaces" ON public.campaigns;
DROP POLICY IF EXISTS "Users can delete campaigns from their workspaces" ON public.campaigns;

CREATE POLICY "Users can view campaigns from their workspaces" ON public.campaigns
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
    OR created_by = auth.uid()
  );

CREATE POLICY "Users can insert their own campaigns" ON public.campaigns
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update campaigns from their workspaces" ON public.campaigns
  FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
    OR created_by = auth.uid()
  );

CREATE POLICY "Users can delete campaigns from their workspaces" ON public.campaigns
  FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
    OR created_by = auth.uid()
  );
