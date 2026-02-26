-- Fix engagement_actions full_name constraint issue
-- This migration resolves the "cannot insert a non-DEFAULT value into column full_name" error

-- Check if full_name column exists and fix it
DO $$ 
BEGIN
  -- If full_name column exists, drop it first
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'engagement_actions' AND column_name = 'full_name'
  ) THEN
    -- Drop the problematic column
    ALTER TABLE engagement_actions DROP COLUMN IF EXISTS full_name CASCADE;
  END IF;
END $$;

-- Ensure engagement_actions has the correct schema
-- Add full_name as a computed field from action_data if needed
ALTER TABLE engagement_actions ADD COLUMN IF NOT EXISTS full_name TEXT GENERATED ALWAYS AS (
  COALESCE(
    action_data->>'user_name',
    action_data->>'author',
    action_data->>'name',
    'Anonymous'
  )
) STORED;

-- Verify all required columns exist
ALTER TABLE engagement_actions ADD COLUMN IF NOT EXISTS platform_action_id TEXT;
ALTER TABLE engagement_actions ADD COLUMN IF NOT EXISTS platform_user_id TEXT;
ALTER TABLE engagement_actions ADD COLUMN IF NOT EXISTS synced BOOLEAN DEFAULT false;
ALTER TABLE engagement_actions ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'native';

-- Create or replace the unique constraint
ALTER TABLE engagement_actions DROP CONSTRAINT IF EXISTS unique_platform_action CASCADE;
ALTER TABLE engagement_actions ADD CONSTRAINT unique_platform_action 
  UNIQUE(workspace_id, platform, platform_post_id, platform_action_id, action_type);

-- Ensure proper indexes
CREATE INDEX IF NOT EXISTS idx_engagement_workspace ON engagement_actions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_engagement_post ON engagement_actions(post_id);
CREATE INDEX IF NOT EXISTS idx_engagement_platform ON engagement_actions(platform, platform_post_id);
CREATE INDEX IF NOT EXISTS idx_engagement_user ON engagement_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_engagement_source ON engagement_actions(source);
CREATE INDEX IF NOT EXISTS idx_engagement_type ON engagement_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_engagement_synced ON engagement_actions(synced) WHERE synced = false;
