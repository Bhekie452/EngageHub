-- Create CRM activities table for tracking all customer interactions and notes
CREATE TABLE IF NOT EXISTS public.crm_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
    created_by UUID REFERENCES auth.users(id) NOT NULL,
    
    -- Activity type: note, call, email, meeting, deal, task, campaign, etc.
    activity_type TEXT NOT NULL CHECK (activity_type IN ('note', 'call', 'email', 'meeting', 'deal', 'task', 'campaign', 'message', 'social')),
    
    -- Linked entities (optional)
    contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    deal_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,
    
    -- Activity content
    title TEXT,
    content TEXT,
    subject TEXT,
    notes TEXT, -- For note-type activities
    
    -- Note-specific fields
    note_type TEXT CHECK (note_type IN ('general', 'objection', 'preference', 'insight', 'warning', 'manager')),
    visibility TEXT DEFAULT 'team' CHECK (visibility IN ('team', 'private', 'manager')),
    is_pinned BOOLEAN DEFAULT FALSE,
    is_important BOOLEAN DEFAULT FALSE,
    
    -- Additional linked entities
    activity_id UUID REFERENCES public.crm_activities(id) ON DELETE SET NULL,
    task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
    
    -- Additional metadata
    platform TEXT, -- For social interactions: instagram, facebook, etc.
    value DECIMAL(15, 2), -- For deals or financial activities
    status TEXT,
    tags TEXT[],
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Timestamps
    activity_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view activities in their workspace" ON public.crm_activities
    FOR SELECT USING (
        workspace_id IN (
            SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can create activities in their workspace" ON public.crm_activities
    FOR INSERT WITH CHECK (
        workspace_id IN (
            SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
        ) AND created_by = auth.uid()
    );

CREATE POLICY "Users can update activities in their workspace" ON public.crm_activities
    FOR UPDATE USING (
        workspace_id IN (
            SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete activities in their workspace" ON public.crm_activities
    FOR DELETE USING (
        workspace_id IN (
            SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
        )
    );

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_crm_activities_workspace ON public.crm_activities(workspace_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_contact ON public.crm_activities(contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_company ON public.crm_activities(company_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_date ON public.crm_activities(activity_date DESC);
