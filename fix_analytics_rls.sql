-- RLS for analytics tables
-- Run in Supabase SQL Editor

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_daily ENABLE ROW LEVEL SECURITY;

-- Drop old policies (safe)
DROP POLICY IF EXISTS "Users can view analytics_events in their workspace" ON public.analytics_events;
DROP POLICY IF EXISTS "Users can insert analytics_events in their workspace" ON public.analytics_events;
DROP POLICY IF EXISTS "Users can view analytics_daily in their workspace" ON public.analytics_daily;

-- Events: allow select + insert for workspace owners
CREATE POLICY "Users can view analytics_events in their workspace" ON public.analytics_events
  FOR SELECT
  USING (
    workspace_id IN (SELECT id FROM public.workspaces WHERE owner_id = auth.uid())
  );

CREATE POLICY "Users can insert analytics_events in their workspace" ON public.analytics_events
  FOR INSERT
  WITH CHECK (
    workspace_id IN (SELECT id FROM public.workspaces WHERE owner_id = auth.uid())
  );

-- Daily: read-only for workspace owners (written via SECURITY DEFINER rollup)
CREATE POLICY "Users can view analytics_daily in their workspace" ON public.analytics_daily
  FOR SELECT
  USING (
    workspace_id IN (SELECT id FROM public.workspaces WHERE owner_id = auth.uid())
  );

