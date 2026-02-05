import { serve } from 'std/server.ts';
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

// Edge function to fetch YouTube video statistics for a given post/video URL
// Expects JSON body: { videoUrl: string, postId?: string, workspaceId?: string }

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || process.env.VITE_YOUTUBE_API_KEY || process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });

const extractYouTubeId = (url: string) => {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) return u.pathname.replace('/', '') || null;
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v');
      if (v) return v;
      if (u.pathname.startsWith('/shorts/')) return u.pathname.split('/')[2] || null;
    }
  } catch {
    // fallback to regex
    const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
    if (m) return m[1];
  }
  return null;
};

serve(async (req) => {
  try {
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
    const body = await req.json().catch(() => null);
    if (!body || !body.videoUrl) return new Response(JSON.stringify({ error: 'missing videoUrl' }), { status: 400 });

    const videoId = extractYouTubeId(String(body.videoUrl));
    if (!videoId) return new Response(JSON.stringify({ error: 'invalid videoUrl' }), { status: 400 });

    // Fetch stats from YouTube API if key present
    let metrics: { viewCount?: number; likeCount?: number; commentCount?: number } | null = null;
    if (YOUTUBE_API_KEY) {
      try {
        const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${encodeURIComponent(videoId)}&key=${encodeURIComponent(YOUTUBE_API_KEY)}`;
        const r = await fetch(apiUrl);
        if (r.ok) {
          const j = await r.json();
          const stats = j?.items?.[0]?.statistics;
          if (stats) {
            metrics = {
              viewCount: typeof stats.viewCount !== 'undefined' ? Number(stats.viewCount) : undefined,
              likeCount: typeof stats.likeCount !== 'undefined' ? Number(stats.likeCount) : undefined,
              commentCount: typeof stats.commentCount !== 'undefined' ? Number(stats.commentCount) : undefined,
            };
          }
        } else {
          console.warn('YouTube API returned non-ok', await r.text());
        }
      } catch (e) {
        console.error('YouTube fetch error', e);
      }
    }

    // Upsert into youtube_metrics table if postId provided
    if (body.postId) {
      const postId = String(body.postId);
      const workspaceId = body.workspaceId ? String(body.workspaceId) : null;
      const upsert: any = {
        post_id: postId,
        video_id: videoId,
        last_fetched_at: new Date().toISOString(),
      };
      if (workspaceId) upsert.workspace_id = workspaceId;
      if (metrics) {
        if (typeof metrics.likeCount !== 'undefined') upsert.likes = metrics.likeCount;
        if (typeof metrics.commentCount !== 'undefined') upsert.comments = metrics.commentCount;
        if (typeof metrics.viewCount !== 'undefined') upsert.views = metrics.viewCount;
      }

      const { error } = await supabase.from('youtube_metrics').upsert(upsert, { onConflict: 'post_id' });
      if (error) {
        console.error('youtube_metrics upsert error', error);
        return new Response(JSON.stringify({ ok: false, error: 'metrics_upsert_failed' }), { status: 500 });
      }

      return new Response(JSON.stringify({ ok: true, metrics }), { status: 200 });
    }

    return new Response(JSON.stringify({ ok: true, metrics }), { status: 200 });
  } catch (e) {
    console.error('unexpected', e);
    return new Response(JSON.stringify({ ok: false, error: 'unexpected', detail: String(e) }), { status: 500 });
  }
});
