-- Analytics Events & Daily Aggregates (EngageHub)
-- Run in Supabase SQL Editor

-- 1) Events (append-only)
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT,
  event_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  platform TEXT,
  content_type TEXT,
  value_numeric DOUBLE PRECISION,
  metadata JSONB DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS analytics_events_workspace_time_idx
  ON public.analytics_events (workspace_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS analytics_events_type_time_idx
  ON public.analytics_events (event_type, occurred_at DESC);

-- 2) Daily aggregates (rollup target)
CREATE TABLE IF NOT EXISTS public.analytics_daily (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  day DATE NOT NULL,

  dau INTEGER DEFAULT 0,
  sessions INTEGER DEFAULT 0,
  avg_session_seconds INTEGER DEFAULT 0,

  posts_created INTEGER DEFAULT 0,
  post_views INTEGER DEFAULT 0,
  interactions INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,

  notifications_sent INTEGER DEFAULT 0,
  notifications_opened INTEGER DEFAULT 0,
  notifications_clicked INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(workspace_id, day)
);

-- 3) Rollup function (idempotent per-day)
CREATE OR REPLACE FUNCTION public.rollup_analytics_day(p_workspace_id UUID, p_day DATE)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  start_ts TIMESTAMPTZ := (p_day::timestamptz);
  end_ts   TIMESTAMPTZ := ((p_day + 1)::timestamptz);
  v_dau INTEGER;
  v_sessions INTEGER;
  v_avg_session_seconds INTEGER;
  v_posts_created INTEGER;
  v_post_views INTEGER;
  v_likes INTEGER;
  v_comments INTEGER;
  v_shares INTEGER;
  v_interactions INTEGER;
  v_notif_sent INTEGER;
  v_notif_opened INTEGER;
  v_notif_clicked INTEGER;
BEGIN
  SELECT COUNT(DISTINCT user_id)
    INTO v_dau
    FROM public.analytics_events
   WHERE workspace_id = p_workspace_id
     AND occurred_at >= start_ts AND occurred_at < end_ts
     AND user_id IS NOT NULL;

  SELECT COUNT(DISTINCT session_id)
    INTO v_sessions
    FROM public.analytics_events
   WHERE workspace_id = p_workspace_id
     AND occurred_at >= start_ts AND occurred_at < end_ts
     AND session_id IS NOT NULL;

  -- avg session duration: session_end events with value_numeric = duration_seconds
  SELECT COALESCE(AVG(value_numeric)::INT, 0)
    INTO v_avg_session_seconds
    FROM public.analytics_events
   WHERE workspace_id = p_workspace_id
     AND occurred_at >= start_ts AND occurred_at < end_ts
     AND event_type = 'session_end'
     AND value_numeric IS NOT NULL;

  SELECT COUNT(*) INTO v_posts_created
    FROM public.analytics_events
   WHERE workspace_id = p_workspace_id
     AND occurred_at >= start_ts AND occurred_at < end_ts
     AND event_type = 'post_created';

  SELECT COUNT(*) INTO v_post_views
    FROM public.analytics_events
   WHERE workspace_id = p_workspace_id
     AND occurred_at >= start_ts AND occurred_at < end_ts
     AND event_type = 'post_view';

  SELECT COUNT(*) INTO v_likes
    FROM public.analytics_events
   WHERE workspace_id = p_workspace_id
     AND occurred_at >= start_ts AND occurred_at < end_ts
     AND event_type = 'post_like';

  SELECT COUNT(*) INTO v_comments
    FROM public.analytics_events
   WHERE workspace_id = p_workspace_id
     AND occurred_at >= start_ts AND occurred_at < end_ts
     AND event_type = 'post_comment';

  SELECT COUNT(*) INTO v_shares
    FROM public.analytics_events
   WHERE workspace_id = p_workspace_id
     AND occurred_at >= start_ts AND occurred_at < end_ts
     AND event_type = 'post_share';

  v_interactions := COALESCE(v_likes,0) + COALESCE(v_comments,0) + COALESCE(v_shares,0);

  SELECT COUNT(*) INTO v_notif_sent
    FROM public.analytics_events
   WHERE workspace_id = p_workspace_id
     AND occurred_at >= start_ts AND occurred_at < end_ts
     AND event_type = 'notification_sent';

  SELECT COUNT(*) INTO v_notif_opened
    FROM public.analytics_events
   WHERE workspace_id = p_workspace_id
     AND occurred_at >= start_ts AND occurred_at < end_ts
     AND event_type = 'notification_open';

  SELECT COUNT(*) INTO v_notif_clicked
    FROM public.analytics_events
   WHERE workspace_id = p_workspace_id
     AND occurred_at >= start_ts AND occurred_at < end_ts
     AND event_type = 'notification_click';

  INSERT INTO public.analytics_daily (
    workspace_id, day,
    dau, sessions, avg_session_seconds,
    posts_created, post_views,
    interactions, likes, comments, shares,
    notifications_sent, notifications_opened, notifications_clicked
  ) VALUES (
    p_workspace_id, p_day,
    COALESCE(v_dau,0), COALESCE(v_sessions,0), COALESCE(v_avg_session_seconds,0),
    COALESCE(v_posts_created,0), COALESCE(v_post_views,0),
    COALESCE(v_interactions,0), COALESCE(v_likes,0), COALESCE(v_comments,0), COALESCE(v_shares,0),
    COALESCE(v_notif_sent,0), COALESCE(v_notif_opened,0), COALESCE(v_notif_clicked,0)
  )
  ON CONFLICT (workspace_id, day) DO UPDATE SET
    dau = EXCLUDED.dau,
    sessions = EXCLUDED.sessions,
    avg_session_seconds = EXCLUDED.avg_session_seconds,
    posts_created = EXCLUDED.posts_created,
    post_views = EXCLUDED.post_views,
    interactions = EXCLUDED.interactions,
    likes = EXCLUDED.likes,
    comments = EXCLUDED.comments,
    shares = EXCLUDED.shares,
    notifications_sent = EXCLUDED.notifications_sent,
    notifications_opened = EXCLUDED.notifications_opened,
    notifications_clicked = EXCLUDED.notifications_clicked,
    updated_at = NOW();
END;
$$;

