-- TikTok Database Schema for EngageHub
-- Run these SQL commands in your Supabase SQL editor

-- TikTok Accounts Table
CREATE TABLE IF NOT EXISTS tiktok_accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id VARCHAR(100) NOT NULL,
    username VARCHAR(100) NOT NULL,
    follower_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    video_count INTEGER DEFAULT 0,
    like_count_total INTEGER DEFAULT 0,
    change_type VARCHAR(20) CHECK (change_type IN ('increase', 'decrease', 'update')),
    updated_time TIMESTAMP WITH TIME ZONE,
    platform VARCHAR(20) DEFAULT 'tiktok',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(workspace_id, user_id)
);

-- TikTok Videos Table
CREATE TABLE IF NOT EXISTS tiktok_videos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    video_id VARCHAR(100) NOT NULL UNIQUE,
    title TEXT,
    description TEXT,
    duration INTEGER,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    thumbnail_url TEXT,
    video_url TEXT,
    hashtags JSONB DEFAULT '[]'::jsonb,
    privacy_level VARCHAR(20) CHECK (privacy_level IN ('public', 'friends', 'private')),
    is_duet BOOLEAN DEFAULT false,
    is_stitch BOOLEAN DEFAULT false,
    create_time TIMESTAMP WITH TIME ZONE,
    updated_time TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    status VARCHAR(20) DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'processing', 'published', 'failed', 'removed')),
    platform VARCHAR(20) DEFAULT 'tiktok',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(workspace_id, video_id)
);

-- TikTok Comments Table
CREATE TABLE IF NOT EXISTS tiktok_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    comment_id VARCHAR(100) NOT NULL UNIQUE,
    video_id VARCHAR(100) NOT NULL,
    user_id VARCHAR(100) NOT NULL,
    username VARCHAR(100) NOT NULL,
    profile_picture TEXT,
    comment_text TEXT,
    like_count INTEGER DEFAULT 0,
    create_time TIMESTAMP WITH TIME ZONE,
    platform VARCHAR(20) DEFAULT 'tiktok',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(workspace_id, comment_id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tiktok_accounts_workspace ON tiktok_accounts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_tiktok_accounts_user ON tiktok_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_tiktok_videos_workspace ON tiktok_videos(workspace_id);
CREATE INDEX IF NOT EXISTS idx_tiktok_videos_video ON tiktok_videos(video_id);
CREATE INDEX IF NOT EXISTS idx_tiktok_comments_workspace ON tiktok_comments(workspace_id);
CREATE INDEX IF NOT EXISTS idx_tiktok_comments_video ON tiktok_comments(video_id);

-- Row Level Security (RLS) Policies
-- Only allow users to access their own workspace data

ALTER TABLE tiktok_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own TikTok accounts" ON tiktok_accounts
    FOR ALL USING (workspace_id = auth.uid());

ALTER TABLE tiktok_videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own TikTok videos" ON tiktok_videos
    FOR ALL USING (workspace_id = auth.uid());

ALTER TABLE tiktok_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own TikTok comments" ON tiktok_comments
    FOR ALL USING (workspace_id = auth.uid());
