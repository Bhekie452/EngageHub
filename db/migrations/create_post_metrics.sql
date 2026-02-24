-- Migration: Create post_metrics table for tracking Facebook/YouTube engagement metrics
-- This table stores aggregated metrics for posts to avoid hitting the platform API every time

CREATE TABLE IF NOT EXISTS post_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id)
);

-- Index for fast lookups by post_id
CREATE INDEX IF NOT EXISTS idx_post_metrics_post_id ON post_metrics(post_id);

-- Add last_synced_at column to posts table if it doesn't exist
ALTER TABLE posts ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;

-- Create index for last_synced_at queries
CREATE INDEX IF NOT EXISTS idx_posts_last_synced_at ON posts(last_synced_at) WHERE last_synced_at IS NULL;

-- Add platform_post_id column to posts table if it doesn't exist  
ALTER TABLE posts ADD COLUMN IF NOT EXISTS platform_post_id TEXT;

-- Create index for platform post lookups
CREATE INDEX IF NOT EXISTS idx_posts_platform_post_id ON posts(platform_post_id) WHERE platform_post_id IS NOT NULL;

COMMENT ON TABLE post_metrics IS 'Stores aggregated engagement metrics (likes, comments, shares, views) for posts from various platforms like Facebook and YouTube';
