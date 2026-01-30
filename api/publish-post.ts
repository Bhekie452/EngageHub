import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

/** Publish content to one platform (server-side, no CORS). Facebook: Pages only (Meta removed API posting to personal timelines). */
async function publishOne(
  platform: string,
  account: { account_id: string; access_token: string },
  content: string,
  mediaUrls: string[]
): Promise<{ ok: boolean; platform: string; error?: string }> {
  const p = (platform || '').toLowerCase();
  if (!account?.access_token) return { ok: false, platform: p, error: 'No token' };
  try {
    if (p === 'facebook') {
      if ((account.account_id || '').startsWith('profile_')) {
        return { ok: false, platform: p, error: "Facebook no longer lets apps post to personal timelines. Connect a Facebook Page to publish (create one at facebook.com/pages/create)." };
      }
      const body: Record<string, string> = { message: content, access_token: account.access_token };
      if (mediaUrls[0]) body.link = mediaUrls[0];
      const res = await fetch(`https://graph.facebook.com/v21.0/${account.account_id}/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data?.error) return { ok: false, platform: p, error: data.error.message };
      return { ok: true, platform: p };
    }
    if (p === 'twitter') {
      const res = await fetch('https://api.twitter.com/2/tweets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${account.access_token}` },
        body: JSON.stringify({ text: content.slice(0, 280) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const raw = (data as any)?.detail || (data as any)?.title || (data as any)?.error_description || res.statusText;
        const rawStr = String(raw || 'Unauthorized');
        let msg = rawStr;
        if (/credits|does not have any credits/i.test(rawStr)) {
          msg = 'Twitter API posting requires a paid plan or credits. Go to developer.twitter.com → your app → Products → add or upgrade to Basic/Pro for Tweet posting.';
        } else if (res.status === 401) {
          msg = rawStr + ' Token may have expired. Disconnect and reconnect Twitter in Social Media > Connected Accounts.';
        }
        return { ok: false, platform: p, error: msg };
      }
      return { ok: true, platform: p };
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
      if (!res.ok) {
        const raw = (data as any)?.message || (data as any)?.error || res.statusText;
        const rawStr = String(raw || '');
        let msg = rawStr;
        if (/member is restricted/i.test(rawStr)) {
          msg = 'LinkedIn is restricting this account or app. Add the "Share on LinkedIn" product to your app at developer.linkedin.com, request w_member_social when connecting, then disconnect and reconnect LinkedIn in Social Media > Connected Accounts.';
        }
        return { ok: false, platform: p, error: msg };
      }
      return { ok: true, platform: p };
    }
    if (p === 'youtube') {
      const videoUrl = (mediaUrls || []).find((u) => typeof u === 'string' && (u.startsWith('http://') || u.startsWith('https://')));
      if (!videoUrl) return { ok: false, platform: p, error: 'YouTube requires a public video URL. Paste a link to your video (e.g. from Storage or a CDN) in the link field, or upload the video to Storage first and paste its URL.' };
      if (videoUrl.startsWith('data:')) return { ok: false, platform: p, error: 'YouTube needs a public URL, not an in-browser file. Upload the video to Storage and paste the public URL, or use the Link field for a video URL.' };
      if (/youtube\.com\/(shorts|watch)/i.test(videoUrl)) return { ok: false, platform: p, error: "That's a YouTube page link, not a video file. We need a direct link to the video file (e.g. https://your-storage.com/video.mp4) so we can upload it to your channel. Upload your video to Supabase Storage or a CDN, then paste that URL." };
      const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
      let videoBuffer: ArrayBuffer;
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 90000);
        const vidRes = await fetch(videoUrl, { signal: controller.signal, redirect: 'follow' });
        clearTimeout(timeout);
        if (!vidRes.ok) return { ok: false, platform: p, error: `Could not fetch video: ${vidRes.status} ${vidRes.statusText}` };
        const contentLength = Number(vidRes.headers.get('content-length') || 0);
        if (contentLength > MAX_VIDEO_BYTES) return { ok: false, platform: p, error: `Video too large (max ${Math.round(MAX_VIDEO_BYTES / 1024 / 1024)}MB). Use a smaller file or shorter clip.` };
        videoBuffer = await vidRes.arrayBuffer();
        if (videoBuffer.byteLength > MAX_VIDEO_BYTES) return { ok: false, platform: p, error: `Video too large (max ${Math.round(MAX_VIDEO_BYTES / 1024 / 1024)}MB).` };
      } catch (e: any) {
        return { ok: false, platform: p, error: e?.name === 'AbortError' ? 'Video fetch timed out.' : (e?.message || 'Could not fetch video URL.') };
      }
      const title = content.split(/\n/)[0]?.trim().slice(0, 100) || 'Upload from EngageHub';
      const description = content.slice(0, 5000);
      const initRes = await fetch(
        `https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${account.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            snippet: { title, description },
            status: { privacyStatus: 'public' },
          }),
        }
      );
      if (!initRes.ok) {
        const errData = await initRes.json().catch(() => ({}));
        const msg = (errData as any)?.error?.message || initRes.statusText;
        return { ok: false, platform: p, error: msg || 'Failed to start YouTube upload.' };
      }
      const uploadUrl = initRes.headers.get('location');
      if (!uploadUrl) return { ok: false, platform: p, error: 'No upload URL from YouTube.' };
      const len = videoBuffer.byteLength;
      const putRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Length': String(len),
          'Content-Range': `bytes 0-${len - 1}/${len}`,
          'Content-Type': 'application/octet-stream',
        },
        body: videoBuffer,
      });
      if (!putRes.ok) {
        const errData = await putRes.json().catch(() => ({}));
        const msg = (errData as any)?.error?.message || putRes.statusText;
        return { ok: false, platform: p, error: msg || 'YouTube upload failed.' };
      }
      return { ok: true, platform: p };
    }
    if (p === 'instagram') {
      const publicUrl = (mediaUrls || []).find((u) => typeof u === 'string' && (u.startsWith('http://') || u.startsWith('https://')));
      if (!publicUrl) return { ok: false, platform: p, error: 'Instagram requires a publicly accessible image or video URL' };
      const isVideo = /\.(mp4|webm|mov)$/i.test(publicUrl) || publicUrl.includes('video');
      const params: Record<string, string> = isVideo
        ? { media_type: 'REELS', video_url: publicUrl, caption: content, access_token: account.access_token }
        : { image_url: publicUrl, caption: content, access_token: account.access_token };
      const containerRes = await fetch(`https://graph.facebook.com/v21.0/${account.account_id}/media?${new URLSearchParams(params)}`, { method: 'POST' });
      const containerData = await containerRes.json().catch(() => ({}));
      if (containerData?.error) return { ok: false, platform: p, error: containerData.error.message };
      const creationId = containerData?.id;
      if (!creationId) return { ok: false, platform: p, error: 'No container id' };
      const publishRes = await fetch(
        `https://graph.facebook.com/v21.0/${account.account_id}/media_publish?creation_id=${creationId}&access_token=${account.access_token}`,
        { method: 'POST' }
      );
      const publishData = await publishRes.json().catch(() => ({}));
      if (publishData?.error) return { ok: false, platform: p, error: publishData.error.message };
      return { ok: true, platform: p };
    }
    return { ok: false, platform: p, error: 'Unsupported platform' };
  } catch (e: any) {
    return { ok: false, platform: p, error: e?.message || 'Request failed' };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!supabaseUrl || !supabaseServiceKey) return res.status(500).json({ error: 'Supabase not configured' });

  const { content, platforms, mediaUrls, workspaceId, accountTokens } = (req.body || {}) as {
    content?: string;
    platforms?: string[];
    mediaUrls?: string[];
    workspaceId?: string;
    accountTokens?: Record<string, { account_id: string; access_token: string }>;
  };
  if (!content?.trim() || !Array.isArray(platforms) || !platforms.length || !workspaceId) {
    return res.status(400).json({ error: 'Missing content, platforms, or workspaceId' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const urls = Array.isArray(mediaUrls) ? mediaUrls : [];

  let accounts: { platform: string; account_id: string; access_token: string }[] = [];
  if (accountTokens && typeof accountTokens === 'object' && Object.keys(accountTokens).length > 0) {
    // Use tokens passed from client (works when server has no service-role key / RLS blocks server read)
    accounts = Object.entries(accountTokens).map(([platform, t]) => ({
      platform: platform.toLowerCase(),
      account_id: t?.account_id || '',
      access_token: t?.access_token || '',
    }));
  } else {
    const { data } = await supabase
      .from('social_accounts')
      .select('platform, account_id, access_token')
      .eq('workspace_id', workspaceId)
      .eq('is_active', true)
      .in('platform', platforms.map((x) => (x || '').toLowerCase()));
    accounts = data || [];
  }

  const results = await Promise.all(
    (platforms || []).map((platform) => {
      const plat = (platform || '').toLowerCase();
      let account = accounts.find((a: any) => (a.platform || '').toLowerCase() === plat);
      if (plat === 'facebook' && accounts.length > 0) {
        const pageAccount = accounts.find((a: any) => (a.platform || '').toLowerCase() === 'facebook' && !(a.account_id || '').startsWith('profile_'));
        if (pageAccount) account = pageAccount;
      }
      return publishOne(platform, account || { account_id: '', access_token: '' }, content, urls);
    })
  );

  const succeeded = results.filter((r) => r.ok).map((r) => r.platform);
  const failed = results.filter((r) => !r.ok).map((r) => ({ platform: r.platform, error: r.error }));

  return res.status(200).json({ succeeded, failed });
}
