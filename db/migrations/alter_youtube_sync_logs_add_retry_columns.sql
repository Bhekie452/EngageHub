-- Migration: add retry/status columns to youtube_sync_logs for retry logic

ALTER TABLE IF EXISTS youtube_sync_logs
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending' NOT NULL,
  ADD COLUMN IF NOT EXISTS attempt_count integer DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS last_attempt_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS last_error text NULL;

-- Index by status for efficient retry queries
CREATE INDEX IF NOT EXISTS idx_youtube_sync_logs_status ON youtube_sync_logs (status);
