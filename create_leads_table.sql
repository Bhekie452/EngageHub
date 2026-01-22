-- Create leads table for EngageHub CRM
-- This table stores leads from various sources: web forms, manual entry, social media, email

CREATE TABLE IF NOT EXISTS public.leads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  source TEXT NOT NULL CHECK (source IN ('web_form', 'manual', 'facebook', 'whatsapp', 'instagram', 'email', 'referral', 'other')),
  message TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'unqualified', 'converted', 'lost')),
  estimated_value DECIMAL(15, 2) DEFAULT 0,
  
  -- Additional metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_leads_workspace_id ON public.leads(workspace_id);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view leads in their workspace" ON public.leads;
DROP POLICY IF EXISTS "Users can create leads in their workspace" ON public.leads;
DROP POLICY IF EXISTS "Users can update leads in their workspace" ON public.leads;
DROP POLICY IF EXISTS "Users can delete leads in their workspace" ON public.leads;

-- RLS Policy: Users can view leads in their workspace
CREATE POLICY "Users can view leads in their workspace" ON public.leads
    FOR SELECT
    USING (
        workspace_id IN (
            SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
        )
    );

-- RLS Policy: Users can create leads in their workspace
CREATE POLICY "Users can create leads in their workspace" ON public.leads
    FOR INSERT
    WITH CHECK (
        auth.uid() = created_by
        AND
        workspace_id IN (
            SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
        )
    );

-- RLS Policy: Users can update leads in their workspace
CREATE POLICY "Users can update leads in their workspace" ON public.leads
    FOR UPDATE
    USING (
        workspace_id IN (
            SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
        )
    )
    WITH CHECK (
        workspace_id IN (
            SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
        )
    );

-- RLS Policy: Users can delete leads in their workspace
CREATE POLICY "Users can delete leads in their workspace" ON public.leads
    FOR DELETE
    USING (
        workspace_id IN (
            SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
        )
    );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_leads_updated_at ON public.leads;
CREATE TRIGGER trigger_update_leads_updated_at
    BEFORE UPDATE ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION update_leads_updated_at();
