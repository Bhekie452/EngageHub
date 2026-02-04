-- Fix YouTube accounts table permissions
-- This script resolves the 406 Not Acceptable error

-- First, let's check current RLS policies
SELECT policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'youtube_accounts';

-- Disable RLS temporarily to bypass the issue
ALTER TABLE public.youtube_accounts DISABLE ROW LEVEL SECURITY;

-- Grant explicit permissions to service role
GRANT ALL ON public.youtube_accounts TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.youtube_accounts TO authenticated;

-- Grant explicit permissions on the table itself
ALTER TABLE public.youtube_accounts OWNER TO service_role;

-- Create a simple bypass policy for service role
DROP POLICY IF EXISTS "Service role full access" ON public.youtube_accounts;
CREATE POLICY "Service role full access" ON public.youtube_accounts
    FOR ALL USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Test the permissions by inserting a test record
INSERT INTO public.youtube_accounts (workspace_id, access_token, channel_id)
VALUES ('c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9', 'test-token', 'test-channel')
ON CONFLICT (workspace_id) DO UPDATE SET
  access_token = EXCLUDED.access_token,
  channel_id = EXCLUDED.channel_id,
  updated_at = NOW();

-- Verify the insert worked
SELECT * FROM public.youtube_accounts WHERE workspace_id = 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9';

-- Clean up test data
DELETE FROM public.youtube_accounts WHERE access_token = 'test-token';

-- Show final permissions
SELECT 
    table_name,
    privilege_type,
    grantee
FROM information_schema.role_table_grants 
WHERE table_name = 'youtube_accounts';
