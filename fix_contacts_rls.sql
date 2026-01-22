-- Fix RLS policies for contacts table

-- 1. Ensure RLS is enabled
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- 2. Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view contacts in their workspace" ON public.contacts;
DROP POLICY IF EXISTS "Users can create contacts in their workspace" ON public.contacts;
DROP POLICY IF EXISTS "Users can update contacts in their workspace" ON public.contacts;
DROP POLICY IF EXISTS "Users can delete contacts in their workspace" ON public.contacts;
DROP POLICY IF EXISTS "Users can manage their own contacts" ON public.contacts;

-- 3. Create policies for SELECT (view)
CREATE POLICY "Users can view contacts in their workspace" ON public.contacts
    FOR SELECT
    USING (
        workspace_id IN (
            SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
        )
    );

-- 4. Create policy for INSERT (create)
CREATE POLICY "Users can create contacts in their workspace" ON public.contacts
    FOR INSERT
    WITH CHECK (
        auth.uid() = created_by
        AND
        workspace_id IN (
            SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
        )
    );

-- 5. Create policy for UPDATE
CREATE POLICY "Users can update contacts in their workspace" ON public.contacts
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

-- 6. Create policy for DELETE
CREATE POLICY "Users can delete contacts in their workspace" ON public.contacts
    FOR DELETE
    USING (
        workspace_id IN (
            SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
        )
    );
