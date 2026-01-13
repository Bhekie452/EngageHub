-- FORCE FIX RLS on posts table

-- 1. Ensure RLS is enabled
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- 2. Drop ALL existing policies to clean up any conflicts or bad states
DROP POLICY IF EXISTS "Users can view their own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can create posts" ON public.posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON public.posts;
DROP POLICY IF EXISTS "Enable all access for authenticated users based on ID" ON public.posts;
DROP POLICY IF EXISTS "Policy for posts" ON public.posts;

-- 3. Create a single, comprehensive policy for ALL operations (SELECT, INSERT, UPDATE, DELETE)
-- This allows any authenticated user to do anything with rows where they are the creator.
CREATE POLICY "Users can manage their own posts" ON public.posts
    FOR ALL
    USING (auth.uid() = created_by)
    WITH CHECK (auth.uid() = created_by);

-- 4. Create a secondary policy allowing workspace owners to see posts in their workspace
-- (Useful if you have team members, though currently you are a solo op)
CREATE POLICY "Workspace owners can view workspace posts" ON public.posts
    FOR SELECT
    USING (
        workspace_id IN (
            SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
        )
    );
