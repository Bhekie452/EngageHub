-- Run this in Supabase SQL Editor
-- Creates the table for OAuth code tracking

CREATE TABLE IF NOT EXISTS fb_used_codes (
  code_hash TEXT PRIMARY KEY,
  used_at TIMESTAMPTZ DEFAULT NOW()
);

-- Optional: Add index for performance
CREATE INDEX IF NOT EXISTS idx_fb_used_codes_used_at ON fb_used_codes(used_at);

-- Test the table
SELECT 'fb_used_codes table created successfully' as status;
