-- Create customers table
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    company TEXT,
    status TEXT DEFAULT 'lead',
    notes TEXT,
    tags TEXT[],
    user_id UUID REFERENCES auth.users(id),
    workspace_id UUID REFERENCES public.workspaces(id)
);

-- Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view customers in their workspace" ON public.customers
    FOR SELECT USING (
        workspace_id IN (
            SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can create customers in their workspace" ON public.customers
    FOR INSERT WITH CHECK (
        workspace_id IN (
            SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can update customers in their workspace" ON public.customers
    FOR UPDATE USING (
        workspace_id IN (
            SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete customers in their workspace" ON public.customers
    FOR DELETE USING (
        workspace_id IN (
            SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
        )
    );
