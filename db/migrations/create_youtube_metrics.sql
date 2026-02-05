-- Migration: create youtube_metrics table to store periodic YouTube statistics

CREATE TABLE IF NOT EXISTS youtube_metrics (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL,
  video_id text NOT NULL,
  likes bigint DEFAULT 0,
  comments bigint DEFAULT 0,
  views bigint DEFAULT 0,
  last_fetched_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_youtube_metrics_post ON youtube_metrics (post_id);
