-- Drop table if it exists to start fresh
DROP TABLE IF EXISTS public.youtube_accounts;

-- Create table with TEXT for workspace_id to avoid UUID issues
CREATE TABLE public.youtube_accounts (
  id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()::text),
  workspace_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  channel_id TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- No RLS for now - we'll add it later
ALTER TABLE public.youtube_accounts DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON public.youtube_accounts TO service_role;
GRANT ALL ON public.youtube_accounts TO authenticated;

-- Test with a proper UUID format
INSERT INTO public.youtube_accounts (workspace_id, access_token) 
VALUES ('00000000-0000-0000-0000-000000000000', 'test-token');
