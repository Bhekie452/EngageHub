-- Enable RLS on campaigns table
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to SELECT their own workspace campaigns
-- (Checking if they belong to the workspace would be ideal, but for now we check if they are the creator or if we trust auth users in the workspace context)
-- A simple permissive policy for now: users can do anything to campaigns where they are the creator OR if it belongs to a workspace they are part of.
-- For simplicity in this "solo-entrepreneur" app context, we'll allow access based on being authenticated and matching workspace/creator.

CREATE POLICY "Users can view campaigns from their workspaces" ON public.campaigns
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
    OR
    owner_id = auth.uid() -- fallback if owner logic is used
    OR
    created_by = auth.uid()
  );

CREATE POLICY "Users can insert their own campaigns" ON public.campaigns
  FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
  );

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
