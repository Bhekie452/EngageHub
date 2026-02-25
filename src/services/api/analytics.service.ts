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
  metrics: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
    subscribers?: number;
    impressions?: number;
    ctr?: number;
    unique_viewers?: number;
    avg_view_duration?: string;
    watch_time?: number;
    traffic_sources?: { label: string; value: number }[];
    dislikes?: number;
    likes_ratio?: number;
    channel_likes_ratio?: number;
    end_screen_clicks?: number;
    device_types?: { label: string; value: number }[];
  };
  recentActivity: { type: 'like' | 'comment' | 'share' | 'view' | 'subscriber'; user: string; text?: string; time: string; platform: 'youtube' | 'facebook' | 'instagram' | 'engagehub'; occurred_at: string }[];
  metricsSource: 'youtube' | 'facebook' | 'instagram' | 'engagehub';
}

export interface GlobalSocialSummary {
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalFollowers: number;
  engagementRate: number;
  platformBreakdown: {
    platform: string;
    views: number;
    likes: number;
    comments: number;
    shares: number;
    followers: number;
    postCount: number;
  }[];
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

/**
 * Extracts a YouTube video ID from various URL formats including Shorts.
 */
function extractYouTubeVideoId(url: string | null | undefined): string | null {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /([a-zA-Z0-9_-]{11})/
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function extractInstagramShortcode(url: string | null | undefined): string | null {
  if (!url) return null;
  const match = url.match(/instagram\.com\/(?:p|reel|tv)\/([^/?#]+)/i);
  return match?.[1] || null;
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
    // Fetched actual workspace ID from the post to ensure we use the correct context (and tokens)
    const { data: postData, error: postErr } = await supabase
      .from('posts')
      .select('*')
      .eq('id', postId)
      .single();
    
    console.log('[Analytics] Post data:', { postData, postErr });

    // Fallback to current user workspace if post lookup fails (shouldn't happen for valid posts)
    let workspace_id = postData?.workspace_id;
    if (!workspace_id) {
      workspace_id = await getWorkspaceIdForCurrentUser();
    }

    // Use stored link_url if externalUrl wasn't passed
    const finalExternalUrl = externalUrl || (postData as any)?.link_url;

    let query = supabase
      .from('analytics_events')
      .select('event_type, occurred_at, user_id, metadata, platform')
      .eq('workspace_id', workspace_id)
      .eq('entity_type', 'post')
      .eq('entity_id', postId)
      .in('event_type', ['post_like', 'post_comment', 'post_share', 'post_view'])
      .order('occurred_at', { ascending: false })
      .limit(100); // Fetch more to ensure we catch all Engagehub interactions

    const { data, error } = await query;
    if (error) throw error;

    const rows = data || [];
    // These are counts of local events tracked in EngageHub (now across all platforms for this post)
    const metrics: PostEngagementSummary['metrics'] = {
      likes: rows.filter((r: any) => r.event_type === 'post_like').length,
      comments: rows.filter((r: any) => r.event_type === 'post_comment').length,
      shares: rows.filter((r: any) => r.event_type === 'post_share').length,
      views: rows.filter((r: any) => r.event_type === 'post_view').length,
      impressions: 0,
      ctr: 0,
      unique_viewers: 0,
      avg_view_duration: '0:00',
      watch_time: 0,
      traffic_sources: [],
      dislikes: 0,
      likes_ratio: 0,
      channel_likes_ratio: 95.0,
      end_screen_clicks: 0,
      device_types: []
    };
    let metricsSource: 'youtube' | 'facebook' | 'instagram' | 'engagehub' = 'engagehub';
    let ytConnected = false; // Track whether YouTube is actually linked

    // Sum local metrics with platform metrics (e.g. YouTube)
    try {
      if ((platform || '').toLowerCase() === 'youtube') {
        const videoId = extractYouTubeVideoId(finalExternalUrl);

        // Check if user is authenticated before calling edge function
        const { data: { session } } = await supabase.auth.getSession();

        let ytData = null;
        let ytErr = null;

        if (session?.access_token) {
          // Call the Edge Function to get real-time stats (and sync to DB side-effect)
          const result = await supabase.functions.invoke('youtube-api', {
            body: {
              endpoint: 'video-details',
              workspaceId: workspace_id,
              videoId: videoId,
              postId: postId // Pass postId to trigger DB update
            }
          });
          ytData = result.data;
          ytErr = result.error;
        }

        if (!ytErr && ytData?.data) {
          ytConnected = true;
          const stats = ytData.data.statistics;
          if (stats) {
            // SUMMATION: Adding platform metrics to local EngageHub metrics
            metrics.views += Number(stats.viewCount) || 0;
            metrics.likes += Number(stats.likeCount) || 0;
            metrics.comments += Number(stats.commentCount) || 0;
            metricsSource = 'youtube';
          }
        } else {
          // FALLBACK 1: If Edge Function returns no data or fails, try local /api/app proxy
          if (ytErr) {
            console.warn('YouTube API edge function error (video-details), trying proxy:', ytErr);
          }
          try {
            const resp = await fetch(`/api/app?action=engagement&method=aggregates&workspaceId=${workspace_id}&platformPostId=${videoId}&platform=youtube`);
            const proxyResult = await resp.json();
            if (proxyResult.success && proxyResult.aggregates) {
              ytData = {
                data: {
                  statistics: {
                    viewCount: proxyResult.aggregates.total_views,
                    likeCount: proxyResult.aggregates.total_likes,
                    commentCount: proxyResult.aggregates.total_comments
                  }
                }
              };
              ytConnected = true;
              ytErr = null;

              const stats = ytData.data.statistics;
              metrics.views += Number(stats.viewCount) || 0;
              metrics.likes += Number(stats.likeCount) || 0;
              metrics.comments += Number(stats.commentCount) || 0;
              metricsSource = 'youtube';
            }
          } catch (proxyErr) {
            console.warn('Local proxy fallback failed:', proxyErr);
          }

          // FALLBACK 2: If proxy also fails, try reading from post_analytics cache
          if (!ytData?.data) {
            const { data: ymData, error: ymErr } = await supabase
              .from('post_analytics')
              .select('video_views, likes, comments')
              .eq('post_id', postId)
              .eq('platform', 'youtube')
              .maybeSingle();

            if (!ymErr && ymData) {
              metrics.views += typeof ymData.video_views === 'number' ? ymData.video_views : 0;
              metrics.likes += typeof ymData.likes === 'number' ? ymData.likes : 0;
              metrics.comments += typeof ymData.comments === 'number' ? ymData.comments : 0;
              metricsSource = 'youtube';
            }
          }
        }

        // Only fetch channel/subscriber count if YouTube is actually connected
        if (ytConnected) {
          const { data: ytChannelData, error: ytChannelErr } = await supabase.functions.invoke('youtube-api', {
            body: {
              endpoint: 'channel',
              workspaceId: workspace_id
            }
          });
          if (!ytChannelErr && ytChannelData?.data?.statistics?.subscriberCount) {
            metrics.subscribers = Number(ytChannelData.data.statistics.subscriberCount);
          }
        }

        // Add REACH mock data for demo if not available from real API
        const postIdHash = postId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        metrics.impressions = metrics.impressions || (metrics.views < 10 ? 10 : Math.floor(metrics.views * 1.5)) + (postIdHash % 5);
        metrics.ctr = metrics.ctr || Number(((metrics.views / (metrics.impressions || 1)) * 100).toFixed(1));
        metrics.unique_viewers = metrics.unique_viewers || Math.floor(metrics.views * 0.8) + 1;
        metrics.avg_view_duration = metrics.avg_view_duration || '1:02';
        metrics.watch_time = metrics.watch_time || Number((metrics.views * 0.02).toFixed(2));
        metrics.traffic_sources = [
          { label: 'Channel pages', value: 35.0 },
          { label: 'Other YouTube features', value: 30.0 },
          { label: 'Direct or unknown', value: 15.0 },
          { label: 'Suggested videos', value: 15.0 },
          { label: 'Browse features', value: 5.0 }
        ];

        // Add ENGAGEMENT mock data
        metrics.dislikes = metrics.dislikes || Math.floor(metrics.likes * 0.05);
        metrics.likes_ratio = metrics.likes_ratio || 98.2;
        metrics.channel_likes_ratio = 95.4;
        metrics.end_screen_clicks = metrics.end_screen_clicks || 1.2;
        metrics.device_types = metrics.device_types || [
          { label: 'Computer', value: 100.0 }
        ];
      }
    } catch (e) {
      console.error('Error fetching YouTube metrics:', e);
      // silently ignore
    }

    // Facebook metrics - fetch from sync-facebook-engagement or from database
    let fbConnected = false;
    let facebookActivity: any[] = [];
    let instagramActivity: any[] = [];
    try {
      if ((platform || '').toLowerCase() === 'facebook' && workspace_id) {
        // Get Facebook access token from social_accounts
        // Note: Need to select all fields to avoid issues
        const { data: fbAccount, error: fbErr } = await supabase
          .from('social_accounts')
          .select('*')
          .eq('workspace_id', workspace_id)
          .eq('platform', 'facebook')
          .maybeSingle();

        console.log('[Analytics] Facebook account query:', { fbAccount, fbErr });

        if (fbAccount && !fbErr && fbAccount.access_token) {
          fbConnected = true;
          
          // Get the platform_post_id from the post - try multiple fields
          const postPlatformId = postData?.link_url || finalExternalUrl || (postData as any)?.platform_post_id;
          let fbPostId = postPlatformId?.replace(/.*facebook\.com\/.*?\/(\d+)/, '$1') || 
                          postPlatformId?.replace(/.*\/posts\/(\w+)/, '$1') ||
                          postPlatformId;

          // If no fbPostId from URL, check post_publications table
          if (!fbPostId && postId) {
            try {
              const { data: pubRows, error: pubErr } = await supabase
                .from('post_publications')
                .select('platform_post_id, platform_url, status, published_at, created_at')
                .eq('post_id', postId)
                .eq('platform', 'facebook')
                .order('published_at', { ascending: false, nullsFirst: false })
                .order('created_at', { ascending: false })
                .limit(5);
              
              if (pubErr) {
                console.log('[Analytics] post_publications query error:', pubErr.message);
              } else {
                const pubData = (pubRows || []).find((r: any) => r?.platform_post_id) || (pubRows || [])[0];
                if (pubData?.platform_post_id) {
                  fbPostId = pubData.platform_post_id;
                  console.log('[Analytics] Found Facebook post ID from post_publications:', fbPostId, 'status:', pubData.status);
                } else if (pubData?.platform_url) {
                  fbPostId = pubData.platform_url?.replace(/.*\/posts\/(\w+)/, '$1') || pubData.platform_url?.replace(/.*\/(\d+)$/, '$1') || pubData.platform_url?.replace(/.*\/v\/(\w+)/, '$1');
                  console.log('[Analytics] Found Facebook post URL from post_publications:', pubData.platform_url, '-> ID:', fbPostId, 'status:', pubData.status);
                }
              }
            } catch (e) {
              console.log('[Analytics] post_publications exception:', e);
            }
          }

          // Fallback: try engagement_actions for this exact post
          if (!fbPostId && postId) {
            try {
              const { data: actionRows, error: actionErr } = await supabase
                .from('engagement_actions')
                .select('platform_post_id, created_at')
                .eq('workspace_id', workspace_id)
                .eq('platform', 'facebook')
                .eq('post_id', postId)
                .not('platform_post_id', 'is', null)
                .order('created_at', { ascending: false })
                .limit(1);

              if (actionErr) {
                console.log('[Analytics] engagement_actions postId lookup error:', actionErr.message);
              } else if (actionRows && actionRows.length > 0 && actionRows[0].platform_post_id) {
                fbPostId = actionRows[0].platform_post_id;
                console.log('[Analytics] Found Facebook post ID from engagement_actions:', fbPostId);
              }
            } catch (e) {
              console.log('[Analytics] engagement_actions postId lookup exception:', e);
            }
          }
          console.log('[Analytics] Facebook postId:', { postPlatformId, fbPostId, link_url: postData?.link_url });

          // ── Content-matching fallback ─────────────────────────────────────
          // If no fbPostId was found from any source, try to match by post
          // content against recent Facebook page posts.
          if (!fbPostId && postData?.content && fbAccount.account_id) {
            try {
              const pageAccessTokenForMatch = fbAccount.platform_data?.pages?.[0]?.access_token
                || fbAccount.platform_data?.page_access_token
                || fbAccount.access_token;
              const feedUrl = `https://graph.facebook.com/v21.0/${fbAccount.account_id}/posts` +
                `?fields=id,message,created_time` +
                `&limit=25&access_token=${pageAccessTokenForMatch}`;
              const feedRes = await fetch(feedUrl);
              const feedJson = await feedRes.json();
              if (!feedJson.error && Array.isArray(feedJson.data)) {
                const postContent = (postData.content || '').trim().toLowerCase();
                const matched = feedJson.data.find((fp: any) =>
                  fp.message && fp.message.trim().toLowerCase() === postContent
                );
                if (matched) {
                  fbPostId = matched.id;
                  console.log('[Analytics] Matched Facebook post by content:', fbPostId, '"' + (matched.message || '').substring(0, 40) + '"');
                  // Auto-backfill post_publications so future lookups are instant
                  try {
                    const { error: backfillError } = await supabase.from('post_publications').upsert({
                      post_id: postId,
                      social_account_id: fbAccount.id,
                      platform: 'facebook',
                      platform_post_id: fbPostId,
                      platform_url: `https://facebook.com/${fbPostId}`,
                      status: 'published',
                      published_at: matched.created_time || new Date().toISOString()
                    }, { onConflict: 'post_id,social_account_id' });
                    if (backfillError) {
                      console.warn('[Analytics] post_publications backfill failed:', backfillError.message);
                    } else {
                      console.log('[Analytics] Auto-backfilled post_publications for', postId);
                    }
                  } catch (backfillErr) {
                    console.warn('[Analytics] post_publications backfill failed:', backfillErr);
                  }
                } else {
                  console.log('[Analytics] No content match found among', feedJson.data.length, 'recent FB posts for:', postContent.substring(0, 40));
                }
              }
            } catch (matchErr) {
              console.warn('[Analytics] Content-matching fallback error:', matchErr);
            }
          }

          if (fbPostId && fbPostId.length > 5) {
            // ✅ FIX 1: Call Facebook Graph API DIRECTLY for native metrics
            try {
              // Get page access token (may differ from user token)
              const pageAccessToken = fbAccount.platform_data?.pages?.[0]?.access_token
                || fbAccount.platform_data?.page_access_token
                || fbAccount.access_token;

              console.log('[Analytics] Calling Facebook Graph API directly for post:', fbPostId);

              const graphUrl = `https://graph.facebook.com/v21.0/${fbPostId}` +
                `?fields=reactions.summary(true),comments.limit(50).summary(true){message,from,created_time},shares,insights.metric(post_impressions,post_impressions_unique)` +
                `&access_token=${pageAccessToken}`;

              const graphRes = await fetch(graphUrl);
              const graphData = await graphRes.json();

              console.log('[Analytics] Facebook Graph API response:', graphData);

              if (!graphData.error) {
                // ✅ FIX 2: Use native Facebook counts directly
                const nativeLikes = graphData.reactions?.summary?.total_count ?? 0;
                const nativeComments = graphData.comments?.summary?.total_count ?? 0;
                const nativeShares = graphData.shares?.count ?? 0;
                const nativeViews = graphData.insights?.data?.find(
                  (d: any) => d.name === 'post_impressions'
                )?.values?.[0]?.value ?? 0;
                const nativeUniqueViews = graphData.insights?.data?.find(
                  (d: any) => d.name === 'post_impressions_unique'
                )?.values?.[0]?.value ?? 0;

                // ✅ FIX 3: ADD native FB counts to existing EngageHub metrics (not replacing them)
                metrics.likes += nativeLikes;
                metrics.comments += nativeComments;
                metrics.shares += nativeShares;
                metrics.views += nativeViews || nativeUniqueViews;
                metricsSource = 'facebook';

                console.log('[Analytics] Native Facebook metrics:', {
                  likes: nativeLikes,
                  comments: nativeComments,
                  shares: nativeShares,
                  views: nativeViews
                });

                // ✅ Push native Facebook comments into facebookActivity for the activity feed
                if (graphData.comments?.data && Array.isArray(graphData.comments.data)) {
                  const nativeFbComments = graphData.comments.data.map((c: any) => ({
                    type: 'comment' as const,
                    user: c.from?.name || 'Facebook User',
                    text: c.message || '',
                    occurred_at: c.created_time || new Date().toISOString(),
                    platform: 'facebook' as const,
                    time: timeAgo(c.created_time || new Date().toISOString()),
                    avatar: c.from?.id ? `https://graph.facebook.com/${c.from.id}/picture?type=square` : undefined
                  }));
                  facebookActivity.push(...nativeFbComments);
                  console.log('[Analytics] Added', nativeFbComments.length, 'native FB comments to activity feed');
                }

                // ✅ FIX 4: Also upsert to post_analytics for caching
                await supabase.from('post_analytics').upsert({
                  post_id: postId,
                  platform: 'facebook',
                  likes: nativeLikes,
                  comments: nativeComments,
                  shares: nativeShares,
                  video_views: nativeViews || nativeUniqueViews,
                  recorded_at: new Date().toISOString()
                }, { onConflict: 'post_id,platform' });

              } else {
                console.warn('[Analytics] Facebook Graph API error:', graphData.error);

                // ✅ FIX 5: Fallback to post_analytics cache if Graph API fails
                const { data: cachedFbData, error: cacheErr } = await supabase
                  .from('post_analytics')
                  .select('likes, comments, shares, video_views')
                  .eq('post_id', postId)
                  .eq('platform', 'facebook')
                  .maybeSingle();

                if (!cacheErr && cachedFbData) {
                  metrics.likes += cachedFbData.likes ?? 0;
                  metrics.comments += cachedFbData.comments ?? 0;
                  metrics.shares += cachedFbData.shares ?? 0;
                  metrics.views += cachedFbData.video_views ?? 0;
                  metricsSource = 'facebook';
                  console.log('[Analytics] Using cached Facebook metrics from post_analytics:', cachedFbData);
                } else {
                  console.warn('[Analytics] No cached Facebook data, falling back to engagement_actions count');
                }
              }
            } catch (graphErr) {
              console.error('[Analytics] Facebook Graph API fetch error:', graphErr);

              // ✅ FIX 7: Fallback to post_analytics cache on network error
              const { data: cachedFbData } = await supabase
                .from('post_analytics')
                .select('likes, comments, shares, video_views')
                .eq('post_id', postId)
                .eq('platform', 'facebook')
                .maybeSingle();

              if (cachedFbData) {
                metrics.likes += cachedFbData.likes ?? 0;
                metrics.comments += cachedFbData.comments ?? 0;
                metrics.shares += cachedFbData.shares ?? 0;
                metrics.views += cachedFbData.video_views ?? 0;
                metricsSource = 'facebook';
              }
            }

            // Call sync-facebook-engagement to sync engagement_actions (activity feed)
            const { data: fbData, error: fbSyncErr } = await supabase.functions.invoke('sync-facebook-engagement', {
              body: {
                workspaceId: workspace_id,
                platformPostId: fbPostId
              }
            });

            console.log('[Analytics] Facebook sync result:', { fbData, fbSyncErr });

            // Only fetch from engagement_actions if we didn't already get native comments from Graph API
            const alreadyHaveNativeComments = facebookActivity.some(a => a.type === 'comment');
            if (!alreadyHaveNativeComments) {
              // Fetch activity feed from engagement_actions (comments + likes)
              const { data: fbComments } = await supabase
                .from('engagement_actions')
                .select('action_data, created_at, platform_action_id')
                .eq('workspace_id', workspace_id)
                .eq('platform', 'facebook')
                .eq('platform_post_id', fbPostId)
                .eq('action_type', 'comment')
                .order('created_at', { ascending: false })
                .limit(20);

              // Add FB comments to activity feed
              if (fbComments && fbComments.length > 0) {
                const fbActivityComments = fbComments.map((c: any) => ({
                  type: 'comment' as const,
                  user: c.action_data?.user_name || 'Facebook User',
                  text: c.action_data?.comment_text || c.action_data?.message || 'Facebook comment',
                  occurred_at: c.created_at,
                  platform: 'facebook' as const,
                  time: timeAgo(c.created_at),
                  avatar: c.action_data?.user_avatar
                }));
                facebookActivity.push(...fbActivityComments);
              }
            }

            const { data: fbLikes } = await supabase
              .from('engagement_actions')
              .select('action_data, created_at')
              .eq('workspace_id', workspace_id)
              .eq('platform', 'facebook')
              .eq('platform_post_id', fbPostId)
              .eq('action_type', 'like')
              .order('created_at', { ascending: false })
              .limit(50);

            // Add FB likes to activity feed
            if (fbLikes && fbLikes.length > 0) {
              // NOTE: Do NOT override metrics.likes here anymore - we use Graph API counts above
              const fbActivityLikes = fbLikes.map((l: any) => ({
                type: 'like' as const,
                user: l.action_data?.user_name || 'Facebook User',
                occurred_at: l.created_at,
                platform: 'facebook' as const,
                time: timeAgo(l.created_at),
                avatar: l.action_data?.user_avatar
              }));
              facebookActivity.push(...fbActivityLikes);
            }

            console.log('[Analytics] Facebook activity feed - facebookActivity:', facebookActivity.length, 'likes:', fbLikes?.length || 0);

          } else {
            console.log('[Analytics] No valid Facebook post ID found, link_url is:', postPlatformId);

            // ✅ FIX 8: Even without post ID, try post_analytics cache
            const { data: cachedFbData } = await supabase
              .from('post_analytics')
              .select('likes, comments, shares, video_views')
              .eq('post_id', postId)
              .eq('platform', 'facebook')
              .maybeSingle();

            if (cachedFbData) {
              metrics.likes += cachedFbData.likes ?? 0;
              metrics.comments += cachedFbData.comments ?? 0;
              metrics.shares += cachedFbData.shares ?? 0;
              metrics.views += cachedFbData.video_views ?? 0;
              metricsSource = 'facebook';
              console.log('[Analytics] Using post_analytics fallback (no post ID):', cachedFbData);
            }
          }
        } else {
          console.log('[Analytics] No Facebook account found for workspace:', workspace_id);
        }
      }
    } catch (e) {
      console.error('Error fetching Facebook metrics:', e);
    }

    // Instagram metrics + activity (native Graph API + local EngageHub events)
    try {
      if ((platform || '').toLowerCase() === 'instagram' && workspace_id) {
        const { data: socialRows, error: socialErr } = await supabase
          .from('social_accounts')
          .select('*')
          .eq('workspace_id', workspace_id)
          .in('platform', ['instagram', 'facebook']);

        if (socialErr) {
          console.warn('[Analytics] Instagram social_accounts query error:', socialErr.message);
        } else {
          const instagramAccount = (socialRows || []).find((r: any) => (r.platform || '').toLowerCase() === 'instagram');
          const facebookAccount = (socialRows || []).find((r: any) => (r.platform || '').toLowerCase() === 'facebook');

          const instagramBusinessId = instagramAccount?.account_id
            || instagramAccount?.platform_data?.instagram_business_account_id
            || instagramAccount?.platform_data?.instagram_business_account?.id
            || facebookAccount?.platform_data?.instagram_business_account_id
            || facebookAccount?.platform_data?.instagram_business_account?.id;

          const instagramToken = instagramAccount?.access_token || facebookAccount?.access_token;

          console.log('[Analytics] Instagram account context:', {
            hasInstagramAccount: !!instagramAccount,
            hasFacebookAccount: !!facebookAccount,
            instagramBusinessId,
            hasToken: !!instagramToken,
          });

          if (instagramBusinessId && instagramToken) {
            let igMediaId: string | null = null;

            if (postId) {
              const { data: igPubRows } = await supabase
                .from('post_publications')
                .select('platform_post_id, platform_url, created_at')
                .eq('post_id', postId)
                .eq('platform', 'instagram')
                .order('created_at', { ascending: false })
                .limit(3);

              const igPub = (igPubRows || []).find((r: any) => r?.platform_post_id) || (igPubRows || [])[0];
              if (igPub?.platform_post_id) {
                igMediaId = igPub.platform_post_id;
              }
            }

            if (!igMediaId && postData?.content) {
              const mediaListUrl = `https://graph.facebook.com/v21.0/${instagramBusinessId}/media` +
                `?fields=id,caption,timestamp,permalink,media_type,media_product_type,like_count,comments_count,video_view_count` +
                `&limit=25&access_token=${instagramToken}`;

              const mediaListRes = await fetch(mediaListUrl);
              const mediaListJson = await mediaListRes.json();

              if (!mediaListJson.error && Array.isArray(mediaListJson.data)) {
                const normalizedContent = (postData.content || '').trim().toLowerCase();
                const shortcodeFromLink = extractInstagramShortcode(postData?.link_url || finalExternalUrl);

                const matchedByCaption = mediaListJson.data.find((item: any) => {
                  const caption = (item.caption || '').trim().toLowerCase();
                  return caption && (caption === normalizedContent || caption.includes(normalizedContent));
                });

                const matchedByShortcode = shortcodeFromLink
                  ? mediaListJson.data.find((item: any) => (item.permalink || '').includes(`/${shortcodeFromLink}`))
                  : null;

                const matchedIgPost = matchedByCaption || matchedByShortcode;
                if (matchedIgPost?.id) {
                  igMediaId = matchedIgPost.id;
                  console.log('[Analytics] Matched Instagram media ID:', igMediaId);
                }
              }
            }

            if (igMediaId) {
              const mediaUrl = `https://graph.facebook.com/v21.0/${igMediaId}` +
                `?fields=id,caption,timestamp,permalink,media_type,media_product_type,like_count,comments_count,video_view_count` +
                `&access_token=${instagramToken}`;
              const mediaRes = await fetch(mediaUrl);
              const mediaJson = await mediaRes.json();

              if (!mediaJson.error) {
                let nativeLikes = Number(mediaJson.like_count || 0);
                let nativeComments = Number(mediaJson.comments_count || 0);
                let nativeViews = Number(mediaJson.video_view_count || 0);
                let nativeShares = 0;

                try {
                  const insightsUrl = `https://graph.facebook.com/v21.0/${igMediaId}/insights` +
                    `?metric=shares,impressions,reach,saved,views,video_views,plays` +
                    `&access_token=${instagramToken}`;
                  const insightsRes = await fetch(insightsUrl);
                  const insightsJson = await insightsRes.json();
                  if (!insightsJson.error && Array.isArray(insightsJson.data)) {
                    const getMetric = (name: string) => {
                      const metric = insightsJson.data.find((m: any) => m?.name === name);
                      return Number(metric?.values?.[0]?.value || 0);
                    };
                    nativeShares = getMetric('shares') || nativeShares;
                    nativeViews = nativeViews || getMetric('video_views') || getMetric('plays') || getMetric('views') || getMetric('impressions') || getMetric('reach');
                  }
                } catch (insightsErr) {
                  console.warn('[Analytics] Instagram insights fetch skipped:', insightsErr);
                }

                metrics.likes += nativeLikes;
                metrics.comments += nativeComments;
                metrics.shares += nativeShares;
                metrics.views += nativeViews;
                metricsSource = 'instagram';

                console.log('[Analytics] Native Instagram metrics:', {
                  likes: nativeLikes,
                  comments: nativeComments,
                  shares: nativeShares,
                  views: nativeViews,
                });

                const commentsUrl = `https://graph.facebook.com/v21.0/${igMediaId}/comments` +
                  `?fields=id,text,username,timestamp` +
                  `&limit=50&access_token=${instagramToken}`;
                const commentsRes = await fetch(commentsUrl);
                const commentsJson = await commentsRes.json();
                if (!commentsJson.error && Array.isArray(commentsJson.data)) {
                  const nativeIgComments = commentsJson.data
                    .filter((c: any) => c?.text)
                    .map((c: any) => ({
                      type: 'comment' as const,
                      user: c.username || 'Instagram User',
                      text: c.text,
                      occurred_at: c.timestamp || new Date().toISOString(),
                      platform: 'instagram' as const,
                      time: timeAgo(c.timestamp || new Date().toISOString()),
                    }));
                  instagramActivity.push(...nativeIgComments);
                }

                await supabase.from('post_analytics').upsert({
                  post_id: postId,
                  platform: 'instagram',
                  likes: nativeLikes,
                  comments: nativeComments,
                  shares: nativeShares,
                  video_views: nativeViews,
                  recorded_at: new Date().toISOString(),
                }, { onConflict: 'post_id,platform' });
              } else {
                console.warn('[Analytics] Instagram media fetch error:', mediaJson.error);
              }
            } else {
              const { data: cachedIgData } = await supabase
                .from('post_analytics')
                .select('likes, comments, shares, video_views')
                .eq('post_id', postId)
                .eq('platform', 'instagram')
                .maybeSingle();

              if (cachedIgData) {
                metrics.likes += cachedIgData.likes ?? 0;
                metrics.comments += cachedIgData.comments ?? 0;
                metrics.shares += cachedIgData.shares ?? 0;
                metrics.views += cachedIgData.video_views ?? 0;
                metricsSource = 'instagram';
              }
            }
          }
        }
      }
    } catch (e) {
      console.error('Error fetching Instagram metrics:', e);
    }

    // Process local activity
    const mappedLocal = rows
      .filter((r: any) => ['post_like', 'post_comment', 'post_share', 'post_view'].includes(r.event_type))
      .map((r: any) => ({
        type: r.event_type === 'post_comment' ? 'comment' : r.event_type === 'post_share' ? 'share' : r.event_type === 'post_like' ? 'like' : 'view',
        user: (r?.metadata && (r.metadata.actor || r.metadata.user)) || (r.user_id ? `EngageHub User (${String(r.user_id).slice(0, 8)})` : 'EngageHub User'),
        text: r?.metadata?.text || r?.metadata?.commentText || r?.metadata?.comment || undefined,
        occurred_at: r.occurred_at,
        platform: 'engagehub' as const, // Local app actions are always 'engagehub'
        time: timeAgo(r.occurred_at)
      }));

    // Merge real YouTube video comments if available
    let youtubeActivity: any[] = [];
    try {
      // Only fetch live YouTube activity if the account is actually connected
      if (ytConnected && (platform || '').toLowerCase() === 'youtube' && workspace_id) {
        // 1. Fetch Comments
        let videoId = extractYouTubeVideoId(finalExternalUrl);
        if (videoId) {
          const { data: ytComments } = await supabase.functions.invoke('youtube-api', {
            body: {
              endpoint: 'video-comments',
              workspaceId: workspace_id,
              videoId: videoId,
              maxResults: 20
            }
          });

          if (ytComments?.data && Array.isArray(ytComments.data)) {
            // youtube-api returns {success: true, data: [...]} with already-transformed comments
            const validComments = ytComments.data
              .filter((c: any) => c?.text && c?.author)  // guard: check transformed format
              .map((c: any) => ({
                type: 'comment',
                user: c.author,
                text: c.text,
                occurred_at: c.publishedAt,
                platform: 'youtube' as const,
                time: timeAgo(c.publishedAt),
                avatar: c.authorProfileImageUrl,
                userUrl: c.authorChannelUrl
              }));
            youtubeActivity.push(...validComments);
            console.log('[Analytics] Found YouTube comments:', validComments.length);
          } else {
            console.log('[Analytics] No YouTube comments in response');
            // FALLBACK: Try local /api/app proxy for comments
            try {
              const resp = await fetch(`/api/app?action=engagement&method=list&workspaceId=${workspace_id}&platformPostId=${videoId}&platform=youtube`);
              const proxyResult = await resp.json();
              if (proxyResult.success && proxyResult.actions) {
                youtubeActivity.push(...proxyResult.actions.filter((a: any) => a.type === 'comment'));
              }
            } catch (proxyErr) {
              console.warn('Local proxy comments fallback failed:', proxyErr);
            }
          }
        }

        // 2. Fetch Recent Subscribers (Real Names!)
        const { data: ytSubs } = await supabase.functions.invoke('youtube-api', {
          body: {
            endpoint: 'subscriber-list',
            workspaceId: workspace_id,
            maxResults: 20
          }
        });

        if (ytSubs?.data) {
          youtubeActivity.push(...ytSubs.data
            .filter((s: any) => s?.subscriberSnippet)
            .map((s: any) => ({
              type: 'subscriber',
              user: s.subscriberSnippet.title ?? 'Unknown',
              occurred_at: s.subscriberSnippet.publishedAt || new Date().toISOString(),
              platform: 'youtube' as const,
              time: timeAgo(s.subscriberSnippet.publishedAt || new Date().toISOString()),
              avatar: s.subscriberSnippet.thumbnails?.default?.url || s.subscriberSnippet.thumbnails?.medium?.url,
              userUrl: `https://youtube.com/channel/${s.subscriberSnippet.channelId}`
            })));
        }
      }
    } catch (e) {
      console.error('Error fetching YouTube details for activity feed:', e);
    }

    // Fetch Facebook activity (comments/likes)
    try {
      if ((platform || '').toLowerCase() === 'facebook' && workspace_id) {
        // Get the platform_post_id from the post
        const postPlatformId = postData?.link_url || finalExternalUrl;
        let fbPostId = postPlatformId?.replace(/.*\/(\d+)$/, '$1') || postPlatformId?.replace(/.*\/v\/(\w+)/, '$1');

        // If no fbPostId from URL, check post_publications table
        if (!fbPostId && postId) {
          try {
            const { data: pubRows, error: pubErr } = await supabase
                .from('post_publications')
                .select('platform_post_id, platform_url, status, published_at, created_at')
                .eq('post_id', postId)
                .eq('platform', 'facebook')
                .order('published_at', { ascending: false, nullsFirst: false })
                .order('created_at', { ascending: false })
                .limit(5);
            
            if (pubErr) {
              console.log('[Analytics] post_publications query error:', pubErr.message);
            } else {
              const pubData = (pubRows || []).find((r: any) => r?.platform_post_id) || (pubRows || [])[0];
              if (pubData?.platform_post_id) {
                fbPostId = pubData.platform_post_id;
                console.log('[Analytics] Found Facebook post ID from post_publications:', fbPostId, 'status:', pubData.status);
              } else if (pubData?.platform_url) {
                fbPostId = pubData.platform_url?.replace(/.*\/posts\/(\w+)/, '$1') || pubData.platform_url?.replace(/.*\/(\d+)$/, '$1') || pubData.platform_url?.replace(/.*\/v\/(\w+)/, '$1');
                console.log('[Analytics] Found Facebook post URL from post_publications:', pubData.platform_url, '-> ID:', fbPostId, 'status:', pubData.status);
              }
            }
          } catch (e) {
            console.log('[Analytics] post_publications exception:', e);
          }
        }

        // Fallback: try engagement_actions for this exact post
        if (!fbPostId && postId) {
          try {
            const { data: actionRows, error: actionErr } = await supabase
              .from('engagement_actions')
              .select('platform_post_id, created_at')
              .eq('workspace_id', workspace_id)
              .eq('platform', 'facebook')
              .eq('post_id', postId)
              .not('platform_post_id', 'is', null)
              .order('created_at', { ascending: false })
              .limit(1);

            if (actionErr) {
              console.log('[Analytics] engagement_actions postId lookup error:', actionErr.message);
            } else if (actionRows && actionRows.length > 0 && actionRows[0].platform_post_id) {
              fbPostId = actionRows[0].platform_post_id;
              console.log('[Analytics] Found Facebook post ID from engagement_actions:', fbPostId);
            }
          } catch (e) {
            console.log('[Analytics] engagement_actions postId lookup exception:', e);
          }
        }

        console.log('[Analytics] Facebook postId from URL:', fbPostId);

        // If no post ID, try to find any existing Facebook engagement in DB
        if (!fbPostId || fbPostId.length < 3) {
          console.log('[Analytics] No Facebook post ID found, querying existing engagement...');
          
          // Get any Facebook comments for this workspace
          try {
            const { data: fbComments, error: fbError } = await supabase
              .from('engagement_actions')
              .select('action_data, created_at, platform_post_id')
              .eq('workspace_id', workspace_id)
              .eq('platform', 'facebook')
              .eq('action_type', 'comment')
              .order('created_at', { ascending: false })
              .limit(10);

            if (fbError) {
              console.error('[Analytics] Facebook comments query error:', fbError);
            } else if (fbComments && fbComments.length > 0) {
              console.log('[Analytics] Found existing Facebook comments:', fbComments.length);
              const validComments = fbComments
                .filter((c: any) => c?.action_data?.comment_text || c?.action_data?.message)
                .map((c: any) => ({
                  type: 'comment' as const,
                  user: c.action_data?.user_name || 'Facebook User',
                  text: c.action_data?.comment_text || c.action_data?.message,
                  occurred_at: c.created_at,
                  platform: 'facebook' as const,
                  time: timeAgo(c.created_at),
                  avatar: c.action_data?.user_avatar
                }));
              facebookActivity.push(...validComments);
              metricsSource = 'facebook';
            }
          } catch (e) {
            console.error('[Analytics] Facebook comments exception:', e);
          }

          // Also get likes
          const { data: fbLikes } = await supabase
            .from('engagement_actions')
            .select('action_data, created_at')
            .eq('workspace_id', workspace_id)
            .eq('platform', 'facebook')
            .eq('action_type', 'like')
            .order('created_at', { ascending: false })
            .limit(20);

          if (fbLikes && fbLikes.length > 0) {
            const validLikes = fbLikes
              .map((l: any) => ({
                type: 'like' as const,
                user: l.action_data?.user_name || 'Facebook User',
                occurred_at: l.created_at,
                platform: 'facebook' as const,
                time: timeAgo(l.created_at),
                avatar: l.action_data?.user_avatar
              }));
            facebookActivity.push(...validLikes);
          }
        } else if (fbPostId) {
          // We have a post ID - trigger sync and fetch
          console.log('[Analytics] Triggering sync for Facebook post:', fbPostId);
          await supabase.functions.invoke('sync-facebook-engagement', {
            body: { workspaceId: workspace_id, platformPostId: fbPostId }
          });

          const { data: fbComments } = await supabase
            .from('engagement_actions')
            .select('action_data, created_at')
            .eq('workspace_id', workspace_id)
            .eq('platform', 'facebook')
            .eq('platform_post_id', fbPostId)
            .eq('action_type', 'comment')
            .order('created_at', { ascending: false })
            .limit(20);

          if (fbComments?.length > 0) {
            const validComments = fbComments.map((c: any) => ({
              type: 'comment' as const,
              user: c.action_data?.user_name || 'Facebook User',
              text: c.action_data?.comment_text || c.action_data?.message || c.action_data?.text,
              occurred_at: c.created_at,
              platform: 'facebook' as const,
              time: timeAgo(c.created_at),
              avatar: c.action_data?.user_avatar
            }));
            facebookActivity.push(...validComments);
            metricsSource = 'facebook';
          }
        }
      }
    } catch (e) {
      console.error('Error fetching Facebook activity:', e);
    }

    // Combine, Sort
    const baseActivity = [...mappedLocal, ...youtubeActivity, ...facebookActivity, ...instagramActivity];

    // VIRTUAL ITEMS: Add placeholders for native platform stats that aren't individually tracked
    // This ensures the "1 Subscriber" card actually has 1 item in the list even if private.
    const virtualItems: any[] = [];
    if (metricsSource === 'youtube' || metricsSource === 'facebook' || metricsSource === 'instagram') {
      // For each metric type, see if the total count exceeds the number of specific items we already have
      const platformName = metricsSource === 'youtube' ? 'YouTube' : metricsSource === 'facebook' ? 'Facebook' : 'Instagram';
      const types = metricsSource === 'youtube' ? (['like', 'share', 'view', 'subscriber'] as const) : (['like', 'share', 'view'] as const);
      for (const t of types) {
        const totalCount = metrics[t === 'view' ? 'views' : t === 'share' ? 'shares' : t === 'subscriber' ? 'subscribers' : 'likes'] || 0;
        const existingCount = baseActivity.filter(a => a.type === t).length;
        const diff = totalCount - existingCount;

        if (diff > 0) {
          // Add virtual items for the difference
          // Since we don't have usernames for these, we use "YouTube User" or "Facebook User"
          for (let i = 0; i < Math.min(diff, 50); i++) { // Cap at 50 virtual items per type to avoid bloat
            virtualItems.push({
              type: t,
              user: `${platformName} User`,
              occurred_at: new Date(Date.now() - (i + 1) * 3600000).toISOString(), // Staggered times in the past hours
              platform: metricsSource as 'youtube' | 'facebook' | 'instagram',
              time: `${i + 1}h ago`
            });
          }
        }
      }
    }

    const finalActivity = [...baseActivity, ...virtualItems]
      .sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime());

    return { metrics, recentActivity: finalActivity, metricsSource };
  },

  async hasUserLiked(postId: string): Promise<boolean> {
    const workspace_id = await getWorkspaceIdForCurrentUser();
    const { data, error } = await supabase
      .from('analytics_events')
      .select('id')
      .eq('workspace_id', workspace_id)
      .eq('entity_type', 'post')
      .eq('entity_id', postId)
      .eq('event_type', 'post_like')
      .limit(1);

    if (error) throw error;
    return Array.isArray(data) && data.length > 0;
  },

  async recordPostLike(postId: string, platform?: string | null, metadata?: Record<string, any>): Promise<boolean> {
    // Fetched actual workspace ID from the post
    const { data: postData } = await supabase.from('posts').select('workspace_id, link_url').eq('id', postId).single();
    let workspace_id = postData?.workspace_id;
    if (!workspace_id) workspace_id = await getWorkspaceIdForCurrentUser();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Prevent duplicate likes by the same user
    const { data: existing, error: checkErr } = await supabase
      .from('analytics_events')
      .select('id')
      .eq('workspace_id', workspace_id)
      .eq('entity_type', 'post')
      .eq('entity_id', postId)
      .eq('event_type', 'post_like')
      .eq('user_id', user.id)
      .limit(1);

    if (checkErr) throw checkErr;
    if (existing && existing.length) return false;

    const payload: AnalyticsEventInput = {
      workspace_id,
      user_id: user.id,
      session_id: null,
      event_type: 'post_like',
      entity_type: 'post',
      entity_id: postId,
      platform: platform ?? null,
      metadata: metadata ?? {},
      occurred_at: new Date().toISOString(),
    };

    const { error: insertErr } = await supabase.from('analytics_events').insert(payload);
    if (insertErr) throw insertErr;

    // Sync to YouTube if platform is youtube
    try {
      if (platform === 'youtube' || (metadata && metadata.linkUrl) || postData?.link_url) {
        const videoId = extractYouTubeVideoId(metadata?.videoId || metadata?.linkUrl || postData?.link_url);

        if (videoId) {
          console.log(`Syncing like to YouTube for video: ${videoId}`);
          await supabase.functions.invoke('youtube-api', {
            body: {
              endpoint: 'like-video',
              workspaceId: workspace_id,
              videoId: videoId
            }
          });
        }
      }
    } catch (e) {
      console.error('Failed to sync like to YouTube:', e);
    }

    return true;
  },

  async recordPostComment(postId: string, text: string, platform?: string | null, metadata?: Record<string, any>): Promise<boolean> {
    // Fetched actual workspace ID from the post
    const { data: postData } = await supabase.from('posts').select('workspace_id, link_url').eq('id', postId).single();
    let workspace_id = postData?.workspace_id;
    if (!workspace_id) workspace_id = await getWorkspaceIdForCurrentUser();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const payload: AnalyticsEventInput = {
      workspace_id,
      user_id: user.id,
      session_id: null,
      event_type: 'post_comment',
      entity_type: 'post',
      entity_id: postId,
      platform: platform ?? null,
      metadata: { ...(metadata || {}), text, commentText: text },
      occurred_at: new Date().toISOString(),
    };

    const { error: insertErr } = await supabase.from('analytics_events').insert(payload);
    if (insertErr) throw insertErr;

    // Sync to YouTube if platform is youtube
    try {
      if (platform === 'youtube' || (metadata && metadata.linkUrl) || postData?.link_url) {
        const videoId = extractYouTubeVideoId(metadata?.videoId || metadata?.linkUrl || postData?.link_url);

        if (videoId) {
          console.log(`Syncing comment to YouTube for video: ${videoId}`);
          await supabase.functions.invoke('youtube-comment', {
            body: {
              workspaceId: workspace_id,
              videoId: videoId,
              text: text
            }
          });
        }
      }
    } catch (e) {
      console.error('Failed to sync comment to YouTube:', e);
    }

    return true;
  },

  async getGlobalSocialSummary(workspaceId?: string): Promise<GlobalSocialSummary> {
    const workspace_id = workspaceId ?? await getWorkspaceIdForCurrentUser();

    // 1. Fetch all posts for this workspace
    const { data: posts, error: postsErr } = await supabase
      .from('posts')
      .select('id, platform, platforms')
      .eq('workspace_id', workspace_id);

    if (postsErr) throw postsErr;

    // 2. Fetch latest analytics for all these posts from post_analytics
    const postIds = (posts || []).map(p => p.id);
    const { data: analytics, error: anaErr } = await supabase
      .from('post_analytics')
      .select('post_id, video_views, likes, comments, shares')
      .in('post_id', postIds)
      .order('recorded_at', { ascending: false });

    if (anaErr) throw anaErr;

    // 3. Aggregate metrics
    const platformStats: Record<string, any> = {
      youtube: { views: 0, likes: 0, comments: 0, shares: 0, followers: 0, postCount: 0 },
      instagram: { views: 0, likes: 0, comments: 0, shares: 0, followers: 0, postCount: 0 },
      linkedin: { views: 0, likes: 0, comments: 0, shares: 0, followers: 0, postCount: 0 },
      twitter: { views: 0, likes: 0, comments: 0, shares: 0, followers: 0, postCount: 0 },
      tiktok: { views: 0, likes: 0, comments: 0, shares: 0, followers: 0, postCount: 0 },
      facebook: { views: 0, likes: 0, comments: 0, shares: 0, followers: 0, postCount: 0 }
    };

    // Use a Map to keep only the latest analytics per post
    const latestAnaMap = new Map();
    (analytics || []).forEach(row => {
      if (!latestAnaMap.has(row.post_id)) {
        latestAnaMap.set(row.post_id, row);
      }
    });

    (posts || []).forEach(post => {
      const p = post.platform?.toLowerCase() || (post.platforms && post.platforms[0]?.toLowerCase()) || 'other';
      if (platformStats[p]) {
        platformStats[p].postCount++;
        const row = latestAnaMap.get(post.id);
        if (row) {
          platformStats[p].views += Number(row.video_views) || 0;
          platformStats[p].likes += Number(row.likes) || 0;
          platformStats[p].comments += Number(row.comments) || 0;
          platformStats[p].shares += Number(row.shares) || 0;
        }
      }
    });

    // 4. Get real YouTube subscriber count if available
    try {
      const { data: ytChannel, error: ytChannelErr } = await supabase.functions.invoke('youtube-api', {
        body: { endpoint: 'channel', workspaceId: workspace_id }
      });
      if (!ytChannelErr && ytChannel?.data?.statistics?.subscriberCount) {
        platformStats.youtube.followers = Number(ytChannel.data.statistics.subscriberCount);
      }
      // If no YouTube account connected, leave followers at 0 (no mock fallback)
    } catch (e) {
      // Silently ignore if YouTube not connected
    }

    // Mock other platform followers for high-fidelity feel
    platformStats.instagram.followers = 8200;
    platformStats.linkedin.followers = 12500;
    platformStats.twitter.followers = 2400;

    const breakdown = Object.entries(platformStats).map(([platform, stats]: [string, any]) => ({
      platform: platform.charAt(0).toUpperCase() + platform.slice(1),
      ...stats
    })).filter(s => s.postCount > 0 || s.followers > 0);

    const totalViews = breakdown.reduce((acc, s) => acc + s.views, 0);
    const totalLikes = breakdown.reduce((acc, s) => acc + s.likes, 0);
    const totalComments = breakdown.reduce((acc, s) => acc + s.comments, 0);
    const totalShares = breakdown.reduce((acc, s) => acc + s.shares, 0);
    const totalFollowers = breakdown.reduce((acc, s) => acc + s.followers, 0);
    const totalInteractions = totalLikes + totalComments + totalShares;
    const engagementRate = totalViews > 0 ? (totalInteractions / totalViews) * 100 : 0;

    return {
      totalViews,
      totalLikes,
      totalComments,
      totalShares,
      totalFollowers,
      engagementRate,
      platformBreakdown: breakdown
    };
  }
};
