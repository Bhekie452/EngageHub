import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

/** Compute next occurrence from recurrence_rule (FREQ=DAILY|WEEKLY|MONTHLY;UNTIL=YYYY-MM-DD) and current scheduled_for. */
function getNextScheduledDate(scheduledFor: string, recurrenceRule: string | null): string | null {
  if (!recurrenceRule) return null;
  const untilMatch = recurrenceRule.match(/UNTIL=(\d{4}-\d{2}-\d{2})/);
  const until = untilMatch ? new Date(untilMatch[1]) : null;
  const freqMatch = recurrenceRule.match(/FREQ=(\w+)/);
  const freq = freqMatch ? freqMatch[1].toUpperCase() : 'WEEKLY';
  const current = new Date(scheduledFor);
  let next = new Date(current);
  if (freq === 'DAILY') next.setDate(next.getDate() + 1);
  else if (freq === 'WEEKLY') next.setDate(next.getDate() + 7);
  else if (freq === 'MONTHLY') next.setMonth(next.getMonth() + 1);
  else next.setDate(next.getDate() + 7);
  if (until && next > until) return null;
  return next.toISOString();
}

/** Publish content to one platform (server-side). */
async function publishToPlatform(
  platform: string,
  account: { account_id: string; access_token: string },
  content: string,
  mediaUrls: string[]
): Promise<{ ok: boolean; error?: string }> {
  const p = (platform || '').toLowerCase();
  try {
    if (p === 'facebook') {
      if ((account.account_id || '').startsWith('profile_')) {
        return { ok: false, error: "Facebook no longer lets apps post to personal timelines. Connect a Facebook Page to publish (create one at facebook.com/pages/create)." };
      }
      const body: Record<string, string> = { message: content, access_token: account.access_token };
      if (mediaUrls[0]) body.link = mediaUrls[0];
      const res = await fetch(`https://graph.facebook.com/v21.0/${account.account_id}/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data?.error) return { ok: false, error: data.error.message };
      return { ok: true };
    }
    if (p === 'twitter') {
      const res = await fetch('https://api.twitter.com/2/tweets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${account.access_token}` },
        body: JSON.stringify({ text: content.slice(0, 280) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return { ok: false, error: (data as any)?.detail || res.statusText };
      return { ok: true };
    }
    if (p === 'linkedin') {
      const authorUrn = (account.account_id || '').startsWith('urn:') ? account.account_id : `urn:li:person:${account.account_id}`;
      const res = await fetch('https://api.linkedin.com/v2/ugcPosts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
          Authorization: `Bearer ${account.access_token}`,
        },
        body: JSON.stringify({
          author: authorUrn,
          lifecycleState: 'PUBLISHED',
          specificContent: {
            'com.linkedin.ugc.ShareContent': { shareCommentary: { text: content }, shareMediaCategory: 'NONE' },
          },
          visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return { ok: false, error: (data as any)?.message || res.statusText };
      return { ok: true };
    }
    if (p === 'instagram') {
      const publicUrl = (mediaUrls || []).find((u) => typeof u === 'string' && (u.startsWith('http://') || u.startsWith('https://')));
      if (!publicUrl) return { ok: false, error: 'Instagram requires a public image/video URL' };
      const isVideo = /\.(mp4|webm|mov)$/i.test(publicUrl) || publicUrl.includes('video');
      const params: Record<string, string> = isVideo
        ? { media_type: 'REELS', video_url: publicUrl, caption: content, access_token: account.access_token }
        : { image_url: publicUrl, caption: content, access_token: account.access_token };
      const containerRes = await fetch(`https://graph.facebook.com/v21.0/${account.account_id}/media?${new URLSearchParams(params)}`, { method: 'POST' });
      const containerData = await containerRes.json().catch(() => ({}));
      if (containerData?.error) return { ok: false, error: containerData.error.message };
      const creationId = containerData?.id;
      if (!creationId) return { ok: false, error: 'No container id' };
      const publishRes = await fetch(
        `https://graph.facebook.com/v21.0/${account.account_id}/media_publish?creation_id=${creationId}&access_token=${account.access_token}`,
        { method: 'POST' }
      );
      const publishData = await publishRes.json().catch(() => ({}));
      if (publishData?.error) return { ok: false, error: publishData.error.message };
      return { ok: true };
    }
    if (p === 'youtube') {
      const videoUrl = (mediaUrls || []).find((u) => typeof u === 'string' && (u.startsWith('http://') || u.startsWith('https://')));
      if (!videoUrl) return { ok: false, error: 'YouTube requires a public video URL in the post.' };
      if (/youtube\.com\/(shorts|watch)/i.test(videoUrl)) return { ok: false, error: "That's a YouTube page link, not a video file. Use a direct link to the video file (e.g. from Storage or a CDN)." };
      const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
      let videoBuffer: ArrayBuffer;
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 90000);
        const vidRes = await fetch(videoUrl, { signal: controller.signal, redirect: 'follow' });
        clearTimeout(timeout);
        if (!vidRes.ok) return { ok: false, error: `Could not fetch video: ${vidRes.status}` };
        const contentLength = Number(vidRes.headers.get('content-length') || 0);
        if (contentLength > MAX_VIDEO_BYTES) return { ok: false, error: `Video too large (max ${Math.round(MAX_VIDEO_BYTES / 1024 / 1024)}MB).` };
        videoBuffer = await vidRes.arrayBuffer();
        if (videoBuffer.byteLength > MAX_VIDEO_BYTES) return { ok: false, error: `Video too large.` };
      } catch (e: any) {
        return { ok: false, error: e?.name === 'AbortError' ? 'Video fetch timed out.' : (e?.message || 'Could not fetch video.') };
      }
      const title = content.split(/\n/)[0]?.trim().slice(0, 100) || 'Upload from EngageHub';
      const description = content.slice(0, 5000);
      const initRes = await fetch(
        `https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${account.access_token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ snippet: { title, description }, status: { privacyStatus: 'public' } }),
        }
      );
      if (!initRes.ok) {
        const errData = await initRes.json().catch(() => ({}));
        return { ok: false, error: (errData as any)?.error?.message || 'Failed to start YouTube upload.' };
      }
      const uploadUrl = initRes.headers.get('location');
      if (!uploadUrl) return { ok: false, error: 'No upload URL from YouTube.' };
      const len = videoBuffer.byteLength;
      const putRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Length': String(len), 'Content-Range': `bytes 0-${len - 1}/${len}`, 'Content-Type': 'application/octet-stream' },
        body: videoBuffer,
      });
      if (!putRes.ok) {
        const errData = await putRes.json().catch(() => ({}));
        return { ok: false, error: (errData as any)?.error?.message || 'YouTube upload failed.' };
      }
      return { ok: true };
    }
    return { ok: false, error: 'Unsupported platform' };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Request failed' };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Supabase not configured (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or VITE_* env)' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const now = new Date().toISOString();

  const { data: posts, error: fetchError } = await supabase
    .from('posts')
    .select('*')
    .eq('status', 'scheduled')
    .lte('scheduled_for', now);

  if (fetchError) return res.status(500).json({ error: fetchError.message });
  if (!posts?.length) return res.status(200).json({ processed: 0, message: 'No due scheduled posts' });

  let processed = 0;
  for (const post of posts) {
    const workspaceId = post.workspace_id;
    const content = post.content || '';
    const platforms: string[] = post.platforms || [];
    const mediaUrls: string[] = post.media_urls || [];

    const { data: accounts } = await supabase
      .from('social_accounts')
      .select('platform, account_id, access_token')
      .eq('workspace_id', workspaceId)
      .eq('is_active', true)
      .in('platform', platforms);

    for (const platform of platforms) {
      const plat = (platform || '').toLowerCase();
      let account = (accounts || []).find((a: any) => (a.platform || '').toLowerCase() === plat);
      if (plat === 'facebook' && (accounts || []).length > 0) {
        const pageAccount = (accounts || []).find((a: any) => (a.platform || '').toLowerCase() === 'facebook' && !(a.account_id || '').startsWith('profile_'));
        if (pageAccount) account = pageAccount;
      }
      if (account?.access_token) await publishToPlatform(platform, account, content, mediaUrls);
    }

    await supabase
      .from('posts')
      .update({ status: 'published', published_at: now })
      .eq('id', post.id);

    processed++;

    if (post.is_recurring && post.recurrence_rule) {
      const nextFor = getNextScheduledDate(post.scheduled_for, post.recurrence_rule);
      if (nextFor) {
        await supabase.from('posts').insert({
          workspace_id: post.workspace_id,
          created_by: post.created_by,
          content: post.content,
          platforms: post.platforms,
          media_urls: post.media_urls,
          status: 'scheduled',
          scheduled_for: nextFor,
          is_recurring: true,
          recurrence_rule: post.recurrence_rule,
          content_type: post.content_type,
          link_url: post.link_url,
          location: post.location,
        });
      }
    }
  }

  return res.status(200).json({ processed, message: `Processed ${processed} scheduled post(s)` });
}
