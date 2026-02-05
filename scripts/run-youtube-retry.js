#!/usr/bin/env node
// Local retry job for YouTube syncs. Run with NODE env vars set:
// SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// Optionally: RETRY_MAX_ATTEMPTS, RETRY_INTERVAL_SECONDS

const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');

(async () => {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const MAX_ATTEMPTS = Number(process.env.RETRY_MAX_ATTEMPTS || '5');
  const RETRY_INTERVAL_SECONDS = Number(process.env.RETRY_INTERVAL_SECONDS || String(60 * 5));

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });

  const cutoff = new Date(Date.now() - RETRY_INTERVAL_SECONDS * 1000).toISOString();
  try {
    const { data: rows, error } = await supabase
      .from('youtube_sync_logs')
      .select('*')
      .in('status', ['failed', 'pending'])
      .lt('attempt_count', MAX_ATTEMPTS)
      .or(`last_attempt_at.is.null,last_attempt_at.lt.${cutoff}`)
      .limit(50)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Lookup error', error);
      process.exit(2);
    }

    if (!rows || !rows.length) {
      console.log('No candidates to retry');
      process.exit(0);
    }

    console.log(`Found ${rows.length} candidates`);
    let processed = 0;

    for (const r of rows) {
      const syncId = r.id;
      const videoId = r.video_id;
      const workspaceId = r.workspace_id;

      const { data: accounts, error: acctErr } = await supabase
        .from('youtube_accounts')
        .select('access_token')
        .eq('workspace_id', workspaceId)
        .limit(1)
        .order('created_at', { ascending: false });

      if (acctErr || !accounts || !accounts.length) {
        await supabase.from('youtube_sync_logs').update({ status: 'failed', attempt_count: (r.attempt_count || 0) + 1, last_attempt_at: new Date().toISOString(), last_error: 'no_youtube_account' }).eq('id', syncId);
        console.warn(syncId, 'no youtube account');
        continue;
      }

      const accessToken = accounts[0].access_token;
      try {
        const ytRes = await fetch(`https://www.googleapis.com/youtube/v3/videos/rate?id=${encodeURIComponent(videoId)}&rating=like`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
        });

        if (ytRes.ok) {
          await supabase.from('youtube_sync_logs').update({ status: 'synced', attempt_count: (r.attempt_count || 0) + 1, last_attempt_at: new Date().toISOString(), last_error: null }).eq('id', syncId);
          console.log(syncId, 'synced');
        } else {
          const text = await ytRes.text();
          await supabase.from('youtube_sync_logs').update({ status: 'failed', attempt_count: (r.attempt_count || 0) + 1, last_attempt_at: new Date().toISOString(), last_error: text }).eq('id', syncId);
          console.warn(syncId, 'youtube api error', ytRes.status);
        }
      } catch (e) {
        await supabase.from('youtube_sync_logs').update({ status: 'failed', attempt_count: (r.attempt_count || 0) + 1, last_attempt_at: new Date().toISOString(), last_error: String(e) }).eq('id', syncId);
        console.error(syncId, 'fetch error', String(e));
      }
      processed += 1;
    }

    console.log('Processed', processed);
    process.exit(0);
  } catch (e) {
    console.error('Unexpected', e);
    process.exit(3);
  }
})();
