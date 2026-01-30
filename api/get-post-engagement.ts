import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const postId = (req.query.postId as string)?.trim();
  if (!postId) return res.status(400).json({ error: 'Missing postId' });

  if (!supabaseUrl || !supabaseServiceKey) return res.status(500).json({ error: 'Supabase not configured' });

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data: post, error: postErr } = await supabase
    .from('posts')
    .select('id, workspace_id')
    .eq('id', postId)
    .single();
  if (postErr || !post) return res.status(404).json({ error: 'Post not found' });

  const { data: publications } = await supabase
    .from('post_publications')
    .select('platform, platform_post_id, social_account_id')
    .eq('post_id', postId)
    .eq('status', 'published')
    .not('platform_post_id', 'is', null);

  const metrics = { likes: 0, comments: 0, views: 0, shares: 0 };
  const recentActivity: { type: string; user: string; text?: string; time: string }[] = [];

  for (const pub of publications || []) {
    if ((pub.platform || '').toLowerCase() === 'youtube' && pub.platform_post_id) {
      const { data: account } = await supabase
        .from('social_accounts')
        .select('access_token')
        .eq('id', pub.social_account_id)
        .eq('is_active', true)
        .single();
      if (!account?.access_token) continue;

      const videoId = pub.platform_post_id;
      const token = account.access_token;

      try {
        const statsRes = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&access_token=${token}`
        );
        const statsData = await statsRes.json().catch(() => ({}));
        const items = (statsData as any)?.items || [];
        if (items[0]?.statistics) {
          const s = items[0].statistics;
          metrics.likes += parseInt(s.likeCount || '0', 10);
          metrics.comments += parseInt(s.commentCount || '0', 10);
          metrics.views += parseInt(s.viewCount || '0', 10);
        }

        const commentsRes = await fetch(
          `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&maxResults=20&order=time&textFormat=plainText&access_token=${token}`
        );
        const commentsData = await commentsRes.json().catch(() => ({}));
        const commentItems = (commentsData as any)?.items || [];
        for (const item of commentItems) {
          const top = item?.snippet?.topLevelComment?.snippet;
          if (!top) continue;
          const author = top.authorDisplayName || top.authorChannelId?.value || 'Unknown';
          const text = (top.textDisplay || top.textPlain || '').slice(0, 200);
          const published = top.publishedAt;
          const timeAgo = published ? formatTimeAgo(new Date(published)) : '';
          recentActivity.push({
            type: 'comment',
            user: author.startsWith('@') ? author : `@${author}`,
            text,
            time: timeAgo,
          });
        }
      } catch (_) {
        // skip this platform on error
      }
    }
  }

  recentActivity.sort((a, b) => {
    const t = (x: string) => (x.includes('hour') ? 1 : x.includes('min') ? 2 : 3);
    return t(a.time) - t(b.time);
  });

  return res.status(200).json({ metrics, recentActivity: recentActivity.slice(0, 15) });
}

function formatTimeAgo(date: Date): string {
  const sec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (sec < 60) return 'Just now';
  if (sec < 3600) return `${Math.floor(sec / 60)} min ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} hour(s) ago`;
  if (sec < 604800) return `${Math.floor(sec / 86400)} day(s) ago`;
  return date.toLocaleDateString();
}
