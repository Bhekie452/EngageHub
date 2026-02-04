-- Drop and recreate with all required columns
DROP TABLE IF EXISTS public.youtube_accounts;

CREATE TABLE public.youtube_accounts (
  id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()::text),
  workspace_id TEXT NOT NULL UNIQUE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  channel_id TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- No RLS for now
ALTER TABLE public.youtube_accounts DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON public.youtube_accounts TO service_role;
GRANT ALL ON public.youtube_accounts TO authenticated;

-- Create index for performance (unique constraint already creates index)
CREATE INDEX IF NOT EXISTS idx_youtube_accounts_channel_id ON public.youtube_accounts(channel_id);

-- Verify table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'youtube_accounts'
ORDER BY ordinal_position;
