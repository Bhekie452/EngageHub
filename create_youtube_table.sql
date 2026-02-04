-- Create youtube_accounts table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.youtube_accounts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  channel_id TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on the table
ALTER TABLE public.youtube_accounts ENABLE ROW LEVEL SECURITY;

-- Create policy for service role (bypasses RLS)
CREATE POLICY "Service role can manage youtube accounts" ON public.youtube_accounts
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Create policy for authenticated users (can only access their own workspace accounts)
CREATE POLICY "Users can view own workspace youtube accounts" ON public.youtube_accounts
  FOR SELECT USING (
    auth.uid() IN (
      SELECT owner_id FROM public.workspaces WHERE id = workspace_id
      UNION
      SELECT user_id FROM public.workspace_members WHERE workspace_id = public.youtube_accounts.workspace_id
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_youtube_accounts_workspace_id ON public.youtube_accounts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_youtube_accounts_channel_id ON public.youtube_accounts(channel_id);

-- Grant permissions
GRANT ALL ON public.youtube_accounts TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.youtube_accounts TO authenticated;
