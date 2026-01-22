-- Fix RLS policies for companies table

-- 1. Ensure RLS is enabled
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- 2. Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view companies in their workspace" ON public.companies;
DROP POLICY IF EXISTS "Users can create companies in their workspace" ON public.companies;
DROP POLICY IF EXISTS "Users can update companies in their workspace" ON public.companies;
DROP POLICY IF EXISTS "Users can delete companies in their workspace" ON public.companies;
DROP POLICY IF EXISTS "Users can manage their own companies" ON public.companies;

-- 3. Create policies for SELECT (view)
CREATE POLICY "Users can view companies in their workspace" ON public.companies
    FOR SELECT
    USING (
        workspace_id IN (
            SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
        )
    );

-- 4. Create policy for INSERT (create)
CREATE POLICY "Users can create companies in their workspace" ON public.companies
    FOR INSERT
    WITH CHECK (
        auth.uid() = created_by
        AND
        workspace_id IN (
            SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
        )
    );

-- 5. Create policy for UPDATE
CREATE POLICY "Users can update companies in their workspace" ON public.companies
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
CREATE POLICY "Users can delete companies in their workspace" ON public.companies
    FOR DELETE
    USING (
        workspace_id IN (
            SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
        )
    );
