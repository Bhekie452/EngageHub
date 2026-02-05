import { serve } from 'std/server.ts';
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

// Retry job for failed YouTube syncs. It scans youtube_sync_logs for rows
// marked 'failed' or 'pending' with attempt_count < MAX_ATTEMPTS and last_attempt_at
// older than RETRY_INTERVAL and attempts to re-sync them.

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const INTERNAL_SECRET = process.env.INTERNAL_SECRET || '';

const MAX_ATTEMPTS = Number(process.env.RETRY_MAX_ATTEMPTS || '5');
const RETRY_INTERVAL_SECONDS = Number(process.env.RETRY_INTERVAL_SECONDS || String(60 * 5)); // 5 minutes default

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });

serve(async (req) => {
  try {
    // Simple guard: require internal secret header
    const secret = req.headers.get('x-internal-secret') || '';
    if (!INTERNAL_SECRET || secret !== INTERNAL_SECRET) return new Response('Unauthorized', { status: 401 });

    // Find candidate rows to retry
    const cutoff = new Date(Date.now() - RETRY_INTERVAL_SECONDS * 1000).toISOString();
    const { data: rows, error } = await supabase
      .from('youtube_sync_logs')
      .select('*')
      .in('status', ['failed', 'pending'])
      .lt('attempt_count', MAX_ATTEMPTS)
      .or(`last_attempt_at.is.null,last_attempt_at.lt.${cutoff}`)
      .limit(50)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('retry lookup error', error);
      return new Response(JSON.stringify({ ok: false, error: 'lookup_failed' }), { status: 500 });
    }

    if (!rows || !rows.length) return new Response(JSON.stringify({ ok: true, processed: 0 }), { status: 200 });

    let processed = 0;
    for (const r of rows) {
      const syncId = r.id;
      const videoId = r.video_id;
      const workspaceId = r.workspace_id;

      // Lookup youtube account for workspace
      const { data: accounts, error: acctErr } = await supabase
        .from('youtube_accounts')
        .select('access_token')
        .eq('workspace_id', workspaceId)
        .limit(1)
        .order('created_at', { ascending: false });

      if (acctErr || !accounts || !accounts.length) {
        await supabase.from('youtube_sync_logs').update({ status: 'failed', attempt_count: (r.attempt_count || 0) + 1, last_attempt_at: new Date().toISOString(), last_error: 'no_youtube_account' }).eq('id', syncId);
        continue;
      }

      const accessToken = accounts[0].access_token as string;
      try {
        const ytRes = await fetch(`https://www.googleapis.com/youtube/v3/videos/rate?id=${encodeURIComponent(videoId)}&rating=like`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
        });
        if (ytRes.ok) {
          await supabase.from('youtube_sync_logs').update({ status: 'synced', attempt_count: (r.attempt_count || 0) + 1, last_attempt_at: new Date().toISOString(), last_error: null }).eq('id', syncId);
        } else {
          const text = await ytRes.text();
          await supabase.from('youtube_sync_logs').update({ status: 'failed', attempt_count: (r.attempt_count || 0) + 1, last_attempt_at: new Date().toISOString(), last_error: text }).eq('id', syncId);
        }
      } catch (e) {
        await supabase.from('youtube_sync_logs').update({ status: 'failed', attempt_count: (r.attempt_count || 0) + 1, last_attempt_at: new Date().toISOString(), last_error: String(e) }).eq('id', syncId);
      }
      processed += 1;
    }

    return new Response(JSON.stringify({ ok: true, processed }), { status: 200 });
  } catch (e) {
    console.error('retry unexpected', e);
    return new Response(JSON.stringify({ ok: false, error: 'unexpected', detail: String(e) }), { status: 500 });
  }
});
