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

export interface PostEngagementSummary {
  metrics: { likes: number; comments: number; shares: number; views: number };
  recentActivity: { type: 'like' | 'comment' | 'share' | 'view'; user: string; text?: string; time: string }[];
  metricsSource: 'youtube' | 'engagehub';
}

function timeAgo(iso: string): string {
  const ts = new Date(iso).getTime();
  const now = Date.now();
  const diffSec = Math.max(0, Math.floor((now - ts) / 1000));

  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
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

  async getPostEngagementSummary(postId: string, platform?: string | null, externalUrl?: string | null): Promise<PostEngagementSummary> {
    const workspace_id = await getWorkspaceIdForCurrentUser();

    let query = supabase
      .from('analytics_events')
      .select('event_type, occurred_at, user_id, metadata, platform')
      .eq('workspace_id', workspace_id)
      .eq('entity_type', 'post')
      .eq('entity_id', postId)
      .in('event_type', ['post_like', 'post_comment', 'post_share', 'post_view'])
      .order('occurred_at', { ascending: false })
      .limit(25);

    if (platform) query = query.eq('platform', platform);

    const { data, error } = await query;
    if (error) throw error;

    const rows = data || [];
    const metrics = {
      likes: rows.filter((r: any) => r.event_type === 'post_like').length,
      comments: rows.filter((r: any) => r.event_type === 'post_comment').length,
      shares: rows.filter((r: any) => r.event_type === 'post_share').length,
      views: rows.filter((r: any) => r.event_type === 'post_view').length,
    };
    let metricsSource: 'youtube' | 'engagehub' = 'engagehub';

    // Attempt to enrich with native YouTube statistics when possible
    try {
      if ((platform || '').toLowerCase() === 'youtube') {
        // Read API key from supported env sources (Vite or Next.js public env)
        const YT_KEY =
          ((typeof process !== 'undefined' && (process as any)?.env?.NEXT_PUBLIC_YOUTUBE_API_KEY) as string) ||
          (((import.meta as any)?.env?.VITE_YOUTUBE_API_KEY) as string) ||
          '';

        // Extract videoId from the external URL if present
        const url = externalUrl || '';
        let videoId: string | null = null;
        if (url) {
          try {
            const u = new URL(url);
            if (u.hostname.includes('youtu.be')) {
              // https://youtu.be/<id>
              videoId = u.pathname.replace('/', '') || null;
            } else if (u.hostname.includes('youtube.com')) {
              // https://www.youtube.com/watch?v=<id>
              videoId = u.searchParams.get('v');
              // shorts URL form: /shorts/<id>
              if (!videoId && u.pathname.startsWith('/shorts/')) {
                videoId = u.pathname.split('/')[2] || null;
              }
            }
          } catch {
            // ignore URL parse errors
          }
        }

        if (YT_KEY && videoId) {
          const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${encodeURIComponent(
            videoId
          )}&key=${encodeURIComponent(YT_KEY)}`;
          const resp = await fetch(apiUrl);
          if (resp.ok) {
            const json = await resp.json();
            const stats = json?.items?.[0]?.statistics;
            if (stats) {
              // Override with native values when available
              if (typeof stats.viewCount !== 'undefined') metrics.views = Number(stats.viewCount) || 0;
              if (typeof stats.likeCount !== 'undefined') metrics.likes = Number(stats.likeCount) || 0;
              if (typeof stats.commentCount !== 'undefined') metrics.comments = Number(stats.commentCount) || 0;
              metricsSource = 'youtube';
            }
          }
        }
      }
    } catch {
      // On any failure, silently fall back to EngageHub-tracked metrics
    }

    const recentActivity = rows
      .filter((r: any) => ['post_like', 'post_comment', 'post_share'].includes(r.event_type))
      .slice(0, 15)
      .map((r: any) => {
        const type: 'like' | 'comment' | 'share' =
          r.event_type === 'post_comment'
            ? 'comment'
            : r.event_type === 'post_share'
              ? 'share'
              : 'like';

        const actor = (r?.metadata && (r.metadata.actor || r.metadata.user)) || (r.user_id ? `@${String(r.user_id).slice(0, 8)}` : '@unknown');
        const text = r?.metadata?.text || r?.metadata?.commentText || r?.metadata?.comment || undefined;

        return {
          type,
          user: String(actor),
          text: text ? String(text) : undefined,
          time: r.occurred_at ? timeAgo(String(r.occurred_at)) : '',
        };
      });

    return { metrics, recentActivity, metricsSource };
  },
};

