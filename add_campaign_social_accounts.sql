-- Add campaign_social_accounts junction table
-- This links campaigns to specific connected social media accounts

CREATE TABLE IF NOT EXISTS campaign_social_accounts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
  social_account_id UUID REFERENCES social_accounts(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(campaign_id, social_account_id)
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_campaign_social_accounts_campaign_id ON campaign_social_accounts(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_social_accounts_social_account_id ON campaign_social_accounts(social_account_id);

-- Add RLS policies
ALTER TABLE campaign_social_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view campaign social accounts in their workspace"
  ON campaign_social_accounts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM campaigns c
      JOIN workspaces w ON c.workspace_id = w.id
      WHERE c.id = campaign_social_accounts.campaign_id
      AND w.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert campaign social accounts in their workspace"
  ON campaign_social_accounts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM campaigns c
      JOIN workspaces w ON c.workspace_id = w.id
      WHERE c.id = campaign_social_accounts.campaign_id
      AND w.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete campaign social accounts in their workspace"
  ON campaign_social_accounts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM campaigns c
      JOIN workspaces w ON c.workspace_id = w.id
      WHERE c.id = campaign_social_accounts.campaign_id
      AND w.owner_id = auth.uid()
    )
  );
