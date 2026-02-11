-- Create table to track used OAuth codes across all Vercel instances
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS fb_used_codes (
  code_hash TEXT PRIMARY KEY,
  used_at TIMESTAMPTZ DEFAULT NOW()
);

-- Optional: Add cleanup for old codes (run as cron job)
-- DELETE FROM fb_used_codes WHERE used_at < NOW() - INTERVAL '24 hours';
