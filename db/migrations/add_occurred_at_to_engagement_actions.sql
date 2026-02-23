-- Add occurred_at column to engagement_actions table
-- This column tracks when the engagement action actually occurred on the platform
-- (as opposed to created_at which tracks when it was synced to EngageHub)

ALTER TABLE engagement_actions 
ADD COLUMN IF NOT EXISTS occurred_at TIMESTAMPTZ;

-- Backfill with created_at for existing records
UPDATE engagement_actions 
SET occurred_at = created_at 
WHERE occurred_at IS NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_engagement_occurred_at 
ON engagement_actions(occurred_at DESC);
