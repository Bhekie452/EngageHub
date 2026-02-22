-- Add source tracking to comments table to distinguish EngageHub vs YouTube/Instagram/Twitter comments
ALTER TABLE comments 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'engagehub' 
  CHECK (source IN ('engagehub', 'youtube', 'instagram', 'twitter', 'tiktok', 'linkedin', 'facebook')),
ADD COLUMN IF NOT EXISTS external_id TEXT,
ADD COLUMN IF NOT EXISTS author_name TEXT,
ADD COLUMN IF NOT EXISTS author_avatar TEXT,
ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS synced_at TIMESTAMPTZ;

-- Prevent duplicate synced comments
CREATE UNIQUE INDEX IF NOT EXISTS comments_external_id_idx 
ON comments(external_id) 
WHERE external_id IS NOT NULL;

-- Add external_video_id to posts table for YouTube integration
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS external_video_id TEXT;
