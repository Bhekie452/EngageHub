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
