-- ============================================
-- BIDIRECTIONAL ENGAGEMENT SYNC SYSTEM
-- For EngageHub Social Media Platform
-- ============================================

-- 1. ENGAGEMENT ACTIONS TABLE
-- Stores all engagement actions (likes, comments, shares, etc.)
CREATE TABLE IF NOT EXISTS engagement_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Post/Content Reference
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  platform_post_id TEXT NOT NULL, -- Native platform's post ID
  platform TEXT NOT NULL, -- facebook, instagram, twitter, linkedin, youtube, tiktok, whatsapp
  
  -- Action Details
  action_type TEXT NOT NULL, -- like, comment, share, view, save, repost
  action_data JSONB, -- Stores action-specific data (comment text, share caption, etc.)
  
  -- Source Tracking (CRITICAL for bidirectional sync)
  source TEXT NOT NULL, -- 'native' or 'engagehub'
  synced BOOLEAN DEFAULT false,
  sync_error TEXT,
  last_sync_attempt TIMESTAMPTZ,
  
  -- Platform-specific IDs
  platform_action_id TEXT, -- ID from the native platform (e.g., comment_id, like_id)
  platform_user_id TEXT, -- User ID on the platform
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes for performance
  CONSTRAINT unique_platform_action UNIQUE(platform, platform_post_id, platform_action_id, action_type)
);

CREATE INDEX idx_engagement_workspace ON engagement_actions(workspace_id);
CREATE INDEX idx_engagement_post ON engagement_actions(post_id);
CREATE INDEX idx_engagement_platform ON engagement_actions(platform, platform_post_id);
CREATE INDEX idx_engagement_user ON engagement_actions(user_id);
CREATE INDEX idx_engagement_source ON engagement_actions(source);
CREATE INDEX idx_engagement_type ON engagement_actions(action_type);
CREATE INDEX idx_engagement_synced ON engagement_actions(synced) WHERE synced = false;

-- 2. ENGAGEMENT AGGREGATES TABLE
-- Pre-computed totals for fast display
CREATE TABLE IF NOT EXISTS engagement_aggregates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  
  -- Post Reference
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  platform_post_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  
  -- Aggregated Counts
  total_likes INTEGER DEFAULT 0,
  native_likes INTEGER DEFAULT 0,
  engagehub_likes INTEGER DEFAULT 0,
  
  total_comments INTEGER DEFAULT 0,
  native_comments INTEGER DEFAULT 0,
  engagehub_comments INTEGER DEFAULT 0,
  
  total_shares INTEGER DEFAULT 0,
  native_shares INTEGER DEFAULT 0,
  engagehub_shares INTEGER DEFAULT 0,
  
  total_views INTEGER DEFAULT 0,
  native_views INTEGER DEFAULT 0,
  engagehub_views INTEGER DEFAULT 0,
  
  total_saves INTEGER DEFAULT 0,
  native_saves INTEGER DEFAULT 0,
  engagehub_saves INTEGER DEFAULT 0,
  
  -- TikTok specific
  total_reposts INTEGER DEFAULT 0,
  native_reposts INTEGER DEFAULT 0,
  engagehub_reposts INTEGER DEFAULT 0,
  
  -- Metadata
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_aggregate UNIQUE(workspace_id, platform, platform_post_id)
);

CREATE INDEX idx_aggregate_workspace ON engagement_aggregates(workspace_id);
CREATE INDEX idx_aggregate_post ON engagement_aggregates(post_id);
CREATE INDEX idx_aggregate_platform ON engagement_aggregates(platform, platform_post_id);

-- 3. WEBHOOK EVENTS TABLE
-- Store raw webhook events from platforms for audit/debugging
CREATE TABLE IF NOT EXISTS platform_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  
  platform TEXT NOT NULL,
  event_type TEXT NOT NULL, -- like.create, comment.create, etc.
  raw_payload JSONB NOT NULL,
  
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  processing_error TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_webhook_platform ON platform_webhook_events(platform);
CREATE INDEX idx_webhook_workspace ON platform_webhook_events(workspace_id);
CREATE INDEX idx_webhook_processed ON platform_webhook_events(processed) WHERE processed = false;

-- 4. SYNC QUEUE TABLE
-- Queue for actions to sync to native platforms
CREATE TABLE IF NOT EXISTS engagement_sync_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  
 engagement_action_id UUID NOT NULL REFERENCES engagement_actions(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  action_type TEXT NOT NULL,
  
  -- Sync Status
  status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  last_attempt_at TIMESTAMPTZ,
  error_message TEXT,
  
  -- Scheduling
  scheduled_for TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sync_queue_status ON engagement_sync_queue(status, scheduled_for);
CREATE INDEX idx_sync_queue_platform ON engagement_sync_queue(platform);

-- 5. FUNCTION: Update engagement aggregates
CREATE OR REPLACE FUNCTION update_engagement_aggregates()
RETURNS TRIGGER AS $$
BEGIN
  -- Upsert aggregate row
  INSERT INTO engagement_aggregates (
    workspace_id,
    post_id,
    platform_post_id,
    platform,
    total_likes,
    native_likes,
    engagehub_likes,
    total_comments,
    native_comments,
    engagehub_comments,
    total_shares,
    native_shares,
    engagehub_shares,
    total_views,
    native_views,
    engagehub_views,
    total_saves,
    native_saves,
    engagehub_saves,
    total_reposts,
    native_reposts,
    engagehub_reposts,
    updated_at
  )
  SELECT
    NEW.workspace_id,
    NEW.post_id,
    NEW.platform_post_id,
    NEW.platform,
    
    -- Likes
    COUNT(*) FILTER (WHERE action_type = 'like'),
    COUNT(*) FILTER (WHERE action_type = 'like' AND source = 'native'),
    COUNT(*) FILTER (WHERE action_type = 'like' AND source = 'engagehub'),
    
    -- Comments
    COUNT(*) FILTER (WHERE action_type = 'comment'),
    COUNT(*) FILTER (WHERE action_type = 'comment' AND source = 'native'),
    COUNT(*) FILTER (WHERE action_type = 'comment' AND source = 'engagehub'),
    
    -- Shares
    COUNT(*) FILTER (WHERE action_type = 'share'),
    COUNT(*) FILTER (WHERE action_type = 'share' AND source = 'native'),
    COUNT(*) FILTER (WHERE action_type = 'share' AND source = 'engagehub'),
    
    -- Views
    COUNT(*) FILTER (WHERE action_type = 'view'),
    COUNT(*) FILTER (WHERE action_type = 'view' AND source = 'native'),
    COUNT(*) FILTER (WHERE action_type = 'view' AND source = 'engagehub'),
    
    -- Saves
    COUNT(*) FILTER (WHERE action_type = 'save'),
    COUNT(*) FILTER (WHERE action_type = 'save' AND source = 'native'),
    COUNT(*) FILTER (WHERE action_type = 'save' AND source = 'engagehub'),
    
    -- Reposts (TikTok)
    COUNT(*) FILTER (WHERE action_type = 'repost'),
    COUNT(*) FILTER (WHERE action_type = 'repost' AND source = 'native'),
    COUNT(*) FILTER (WHERE action_type = 'repost' AND source = 'engagehub'),
    
    NOW()
  FROM engagement_actions
  WHERE workspace_id = NEW.workspace_id
    AND platform = NEW.platform
    AND platform_post_id = NEW.platform_post_id
  GROUP BY workspace_id, post_id, platform_post_id, platform
  ON CONFLICT (workspace_id, platform, platform_post_id)
  DO UPDATE SET
    total_likes = EXCLUDED.total_likes,
    native_likes = EXCLUDED.native_likes,
    engagehub_likes = EXCLUDED.engagehub_likes,
    total_comments = EXCLUDED.total_comments,
    native_comments = EXCLUDED.native_comments,
    engagehub_comments = EXCLUDED.engagehub_comments,
    total_shares = EXCLUDED.total_shares,
    native_shares = EXCLUDED.native_shares,
    engagehub_shares = EXCLUDED.engagehub_shares,
    total_views = EXCLUDED.total_views,
    native_views = EXCLUDED.native_views,
    engagehub_views = EXCLUDED.engagehub_views,
    total_saves = EXCLUDED.total_saves,
    native_saves = EXCLUDED.native_saves,
    engagehub_saves = EXCLUDED.engagehub_saves,
    total_reposts = EXCLUDED.total_reposts,
    native_reposts = EXCLUDED.native_reposts,
    engagehub_reposts = EXCLUDED.engagehub_reposts,
    updated_at = NOW();
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. TRIGGER: Auto-update aggregates on new engagement
CREATE TRIGGER trigger_update_engagement_aggregates
  AFTER INSERT OR UPDATE OR DELETE ON engagement_actions
  FOR EACH ROW
  EXECUTE FUNCTION update_engagement_aggregates();

-- 7. ROW  LEVEL SECURITY (RLS)
ALTER TABLE engagement_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_aggregates ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_sync_queue ENABLE ROW LEVEL SECURITY;

-- Users can only see engagement for their workspaces
CREATE POLICY engagement_actions_policy ON engagement_actions
  FOR ALL USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY engagement_aggregates_policy ON engagement_aggregates
  FOR ALL USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY webhook_events_policy ON platform_webhook_events
  FOR ALL USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY sync_queue_policy ON engagement_sync_queue
  FOR ALL USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );

-- Grant necessary permissions
GRANT ALL ON engagement_actions TO authenticated;
GRANT ALL ON engagement_aggregates TO authenticated;
GRANT ALL ON platform_webhook_events TO authenticated;
GRANT ALL ON engagement_sync_queue TO authenticated;
