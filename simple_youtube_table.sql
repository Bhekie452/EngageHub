-- Simple version - just create the basic table without constraints
CREATE TABLE IF NOT EXISTS public.youtube_accounts (
  id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()::text),
  workspace_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  channel_id TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS temporarily for testing
ALTER TABLE public.youtube_accounts DISABLE ROW LEVEL SECURITY;

-- Grant all permissions to service role
GRANT ALL ON public.youtube_accounts TO service_role;
GRANT ALL ON public.youtube_accounts TO authenticated;

-- Test insert with proper UUID format
INSERT INTO public.youtube_accounts (workspace_id, access_token) 
VALUES ('00000000-0000-0000-0000-000000000000', 'test-token') 
ON CONFLICT DO NOTHING;
