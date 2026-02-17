-- Add TikTok to the platform CHECK constraint
ALTER TABLE social_accounts DROP CONSTRAINT social_accounts_platform_check;
ALTER TABLE social_accounts ADD CONSTRAINT social_accounts_platform_check 
  CHECK (platform IN ('facebook', 'instagram', 'twitter', 'linkedin', 'youtube', 'whatsapp', 'tiktok'));
