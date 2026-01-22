import { supabase } from '../../lib/supabase';

export type AnalyticsEventType =
  | 'session_start'
  | 'session_end'
  | 'login'
  | 'signup'
  | 'post_created'
  | 'post_view'
  | 'post_like'
  | 'post_comment'
  | 'post_share'
  | 'notification_sent'
  | 'notification_open'
  | 'notification_click';

export interface AnalyticsEventInput {
  workspace_id: string;
  user_id?: string | null;
  session_id?: string | null;
  event_type: AnalyticsEventType;
  entity_type?: string | null;
  entity_id?: string | null;
  platform?: string | null;
  content_type?: string | null;
  value_numeric?: number | null;
  metadata?: Record<string, any>;
  occurred_at?: string; // ISO
}

export interface AnalyticsDailyRow {
  workspace_id: string;
  day: string; // YYYY-MM-DD
  dau: number;
  sessions: number;
  avg_session_seconds: number;
  posts_created: number;
  post_views: number;
  interactions: number;
  likes: number;
  comments: number;
  shares: number;
  notifications_sent: number;
  notifications_opened: number;
  notifications_clicked: number;
}

async function getWorkspaceIdForCurrentUser(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('workspaces')
    .select('id')
    .eq('owner_id', user.id)
    .single();

  if (error) throw error;
  if (!data?.id) throw new Error('Workspace not found');
  return data.id;
}

export const analyticsService = {
  async track(event: Omit<AnalyticsEventInput, 'workspace_id'> & { workspace_id?: string }): Promise<void> {
    const workspace_id = event.workspace_id ?? await getWorkspaceIdForCurrentUser();
    const { data: { user } } = await supabase.auth.getUser();

    const payload: AnalyticsEventInput = {
      workspace_id,
      user_id: event.user_id ?? user?.id ?? null,
      session_id: event.session_id ?? null,
      event_type: event.event_type,
      entity_type: event.entity_type ?? null,
      entity_id: event.entity_id ?? null,
      platform: event.platform ?? null,
      content_type: event.content_type ?? null,
      value_numeric: event.value_numeric ?? null,
      metadata: event.metadata ?? {},
      occurred_at: event.occurred_at ?? new Date().toISOString(),
    };

    const { error } = await supabase.from('analytics_events').insert(payload);
    if (error) throw error;
  },

  async rollupDay(day: string, workspaceId?: string): Promise<void> {
    const workspace_id = workspaceId ?? await getWorkspaceIdForCurrentUser();
    const { error } = await supabase.rpc('rollup_analytics_day', {
      p_workspace_id: workspace_id,
      p_day: day,
    });
    if (error) throw error;
  },

  async getDaily(fromDay: string, toDay: string, workspaceId?: string): Promise<AnalyticsDailyRow[]> {
    const workspace_id = workspaceId ?? await getWorkspaceIdForCurrentUser();
    const { data, error } = await supabase
      .from('analytics_daily')
      .select('*')
      .eq('workspace_id', workspace_id)
      .gte('day', fromDay)
      .lte('day', toDay)
      .order('day', { ascending: true });

    if (error) throw error;
    return (data || []) as AnalyticsDailyRow[];
  },
};

