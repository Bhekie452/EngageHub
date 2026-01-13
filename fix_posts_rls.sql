-- Enable RLS on posts table
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can create posts" ON public.posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON public.posts;

-- Allow users to view posts they created
CREATE POLICY "Users can view their own posts" ON public.posts
    FOR SELECT
    USING (created_by = auth.uid());

-- Allow users to create posts (must match created_by)
CREATE POLICY "Users can create posts" ON public.posts
    FOR INSERT
    WITH CHECK (created_by = auth.uid());

-- Allow users to update their own posts
CREATE POLICY "Users can update their own posts" ON public.posts
    FOR UPDATE
    USING (created_by = auth.uid());

-- Allow users to delete their own posts
CREATE POLICY "Users can delete their own posts" ON public.posts
    FOR DELETE
    USING (created_by = auth.uid());
