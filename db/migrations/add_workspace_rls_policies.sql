-- Add RLS policies for workspace_members table
-- This fixes the 406 error when querying workspace_members

-- Enable RLS on workspace_members if not already enabled
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own workspace memberships" ON workspace_members;
DROP POLICY IF EXISTS "Users can insert their own workspace memberships" ON workspace_members;
DROP POLICY IF EXISTS "Users can update their own workspace memberships" ON workspace_members;
DROP POLICY IF EXISTS "Users can delete their own workspace memberships" ON workspace_members;

-- Allow users to read their own workspace memberships
CREATE POLICY "Users can view their own workspace memberships"
ON workspace_members
FOR SELECT
USING (user_id = auth.uid());

-- Allow users to insert their own workspace memberships
CREATE POLICY "Users can insert their own workspace memberships"
ON workspace_members
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Allow users to update their own workspace memberships
CREATE POLICY "Users can update their own workspace memberships"
ON workspace_members
FOR UPDATE
USING (user_id = auth.uid());

-- Allow users to delete their own workspace memberships
CREATE POLICY "Users can delete their own workspace memberships"
ON workspace_members
FOR DELETE
USING (user_id = auth.uid());

-- Also ensure workspaces table has proper RLS
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for workspaces
DROP POLICY IF EXISTS "Users can view their workspaces" ON workspaces;
DROP POLICY IF EXISTS "Users can insert workspaces" ON workspaces;
DROP POLICY IF EXISTS "Users can update their workspaces" ON workspaces;
DROP POLICY IF EXISTS "Users can delete their workspaces" ON workspaces;

-- Allow users to read workspaces they own or are members of
CREATE POLICY "Users can view their workspaces"
ON workspaces
FOR SELECT
USING (
  owner_id = auth.uid() 
  OR id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
);

-- Allow users to insert their own workspaces
CREATE POLICY "Users can insert workspaces"
ON workspaces
FOR INSERT
WITH CHECK (owner_id = auth.uid());

-- Allow users to update their own workspaces
CREATE POLICY "Users can update their workspaces"
ON workspaces
FOR UPDATE
USING (owner_id = auth.uid());

-- Allow users to delete their own workspaces
CREATE POLICY "Users can delete their workspaces"
ON workspaces
FOR DELETE
USING (owner_id = auth.uid());
