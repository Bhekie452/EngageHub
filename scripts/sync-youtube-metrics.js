import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Usage: set env SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, YOUTUBE_API_KEY (optional)
// Run: node scripts/sync-youtube-metrics.js

// Attempt to load environment from .env.local in project root when not provided
function loadEnvFile() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  console.log('Loading env file from', envPath);
  const txt = fs.readFileSync(envPath, 'utf8');
  for (const rawLine of txt.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    // support lines starting with `export ` as well as plain KEY=VALUE
    const cleaned = line.startsWith('export ') ? line.replace(/^export\s+/, '') : line;
    const idx = cleaned.indexOf('=');
    if (idx === -1) continue;
    const key = cleaned.slice(0, idx).trim();
    let val = cleaned.slice(idx + 1).trim();
    // strip surrounding quotes
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    // Always set/override from the file so user edits are respected
    process.env[key] = val;
    console.log('Loaded env from file:', key);
  }
}

loadEnvFile();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || process.env.VITE_YOUTUBE_API_KEY || process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
  console.error('Read SUPABASE_URL=', SUPABASE_URL ? SUPABASE_URL : '<missing>');
  process.exit(1);
}

console.log('Using SUPABASE_URL=', SUPABASE_URL);
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

function extractYouTubeId(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) return u.pathname.replace('/', '') || null;
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v');
      if (v) return v;
      if (u.pathname.startsWith('/shorts/')) return u.pathname.split('/')[2] || null;
    }
  } catch {
    const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
    if (m) return m[1];
  }
  return null;
}

async function fetchStats(videoId) {
  if (!YOUTUBE_API_KEY) return null;
  try {
    const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${encodeURIComponent(videoId)}&key=${encodeURIComponent(
      YOUTUBE_API_KEY
    )}`;
    const r = await fetch(apiUrl);
    if (!r.ok) {
      console.warn('YouTube API returned', r.status, await r.text());
      return null;
    }
    const j = await r.json();
    const s = j?.items?.[0]?.statistics;
    if (!s) return null;
    return {
      viewCount: typeof s.viewCount !== 'undefined' ? Number(s.viewCount) : undefined,
      likeCount: typeof s.likeCount !== 'undefined' ? Number(s.likeCount) : undefined,
      commentCount: typeof s.commentCount !== 'undefined' ? Number(s.commentCount) : undefined,
    };
  } catch (e) {
    console.error('fetchStats error', e);
    return null;
  }
}

async function main() {
  console.log('Starting YouTube metrics sync...');
  // Fetch posts that have a `link_url` (we'll detect YouTube links client-side)
  const { data: posts, error } = await supabase
    .from('posts')
    .select('id, link_url, workspace_id')
    .not('link_url', 'is', null)
    .neq('link_url', '')
    .limit(1000);

  if (error) {
    console.error('Failed to query posts:', error);
    process.exit(1);
  }

  if (!posts || !posts.length) {
    console.log('No youtube posts found to sync');
    return;
  }

  for (const p of posts) {
    const postId = p.id;
    const url = p.link_url;
    const workspaceId = p.workspace_id || null;
    const videoId = extractYouTubeId(String(url));
    if (!videoId) {
      console.warn('Could not extract video id for post', postId, 'url=', String(url).slice(0, 160));
      continue;
    }
    let metrics = null;
    if (YOUTUBE_API_KEY) metrics = await fetchStats(videoId);

    const upsert = {
      post_id: postId,
      video_id: videoId,
      workspace_id: workspaceId,
      last_fetched_at: new Date().toISOString(),
    };
    if (metrics) {
      if (typeof metrics.viewCount !== 'undefined') upsert.views = metrics.viewCount;
      if (typeof metrics.likeCount !== 'undefined') upsert.likes = metrics.likeCount;
      if (typeof metrics.commentCount !== 'undefined') upsert.comments = metrics.commentCount;
    }

    const { error: upsertErr } = await supabase.from('youtube_metrics').upsert(upsert, { onConflict: 'post_id' });
    if (upsertErr) {
      console.error('Failed to upsert youtube_metrics for', postId, upsertErr);
    } else {
      console.log('Synced', postId, 'videoId=', videoId, metrics || 'no-metrics');
    }
  }

  console.log('YouTube metrics sync complete');
}

main().catch((e) => {
  console.error('fatal', e);
  process.exit(1);
});
