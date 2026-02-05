-- Migration: create youtube_sync_logs table for idempotent YouTube sync actions

CREATE TABLE IF NOT EXISTS youtube_sync_logs (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  workspace_id uuid NOT NULL,
  user_id uuid NOT NULL,
  video_id text NOT NULL,
  action text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Prevent duplicate syncs for the same user/workspace/video/action
CREATE UNIQUE INDEX IF NOT EXISTS youtube_sync_unique_idx ON youtube_sync_logs (workspace_id, user_id, video_id, action);
