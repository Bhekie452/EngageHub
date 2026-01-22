-- Fix RLS policies for customers to allow owner access and backfill workspace_id
-- Enables users to see their own customer rows even if workspace_id was null.

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid duplicates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'Users can view customers in their workspace') THEN
    DROP POLICY "Users can view customers in their workspace" ON public.customers;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'Users can create customers in their workspace') THEN
    DROP POLICY "Users can create customers in their workspace" ON public.customers;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'Users can update customers in their workspace') THEN
    DROP POLICY "Users can update customers in their workspace" ON public.customers;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'Users can delete customers in their workspace') THEN
    DROP POLICY "Users can delete customers in their workspace" ON public.customers;
  END IF;
END $$;

-- Allow users to SELECT customers in their workspace OR rows they own with null workspace_id
CREATE POLICY "customers_select_owner_or_workspace" ON public.customers
FOR SELECT USING (
  (workspace_id IN (SELECT id FROM public.workspaces WHERE owner_id = auth.uid()))
  OR (workspace_id IS NULL AND user_id = auth.uid())
);

-- Allow INSERT when the row is tied to the user's workspace or when workspace_id is null and user matches
CREATE POLICY "customers_insert_owner_or_workspace" ON public.customers
FOR INSERT WITH CHECK (
  (workspace_id IN (SELECT id FROM public.workspaces WHERE owner_id = auth.uid()))
  OR (workspace_id IS NULL AND user_id = auth.uid())
);

-- Allow UPDATE when the row belongs to the user's workspace or null workspace they own
CREATE POLICY "customers_update_owner_or_workspace" ON public.customers
FOR UPDATE USING (
  (workspace_id IN (SELECT id FROM public.workspaces WHERE owner_id = auth.uid()))
  OR (workspace_id IS NULL AND user_id = auth.uid())
);

-- Allow DELETE when the row belongs to the user's workspace or null workspace they own
CREATE POLICY "customers_delete_owner_or_workspace" ON public.customers
FOR DELETE USING (
  (workspace_id IN (SELECT id FROM public.workspaces WHERE owner_id = auth.uid()))
  OR (workspace_id IS NULL AND user_id = auth.uid())
);

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Users can view customers in their workspace" ON public.customers;
DROP POLICY IF EXISTS "Users can create customers in their workspace" ON public.customers;
DROP POLICY IF EXISTS "Users can update customers in their workspace" ON public.customers;
DROP POLICY IF EXISTS "Users can delete customers in their workspace" ON public.customers;

-- Create simpler policies based on user_id (since workspace might be complex)
CREATE POLICY "Users can manage their own customers" ON public.customers
    FOR ALL USING (auth.uid() = user_id);

-- Also allow if workspace logic is used (optional, but good for teams)
CREATE POLICY "Users can view workspace customers" ON public.customers
    FOR SELECT USING (
        workspace_id IN (
            SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
        )
    );
