-- Create social_accounts table to store OAuth connections
CREATE TABLE IF NOT EXISTS social_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'twitter', 'linkedin', 'whatsapp')),
  platform_account_id TEXT NOT NULL,
  account_name TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Ensure one connection per platform per workspace for now
  UNIQUE(workspace_id, platform, platform_account_id)
);

-- Enable RLS
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;

-- Add RLS policy for workspace owners (similar to other tables)
CREATE POLICY "Users can manage social accounts in their workspaces"
ON social_accounts FOR ALL
USING (
  workspace_id IN (
    SELECT id FROM workspaces WHERE owner_id = auth.uid()
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_social_accounts_updated_at
    BEFORE UPDATE ON social_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
