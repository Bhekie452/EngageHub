import { serve } from 'std/server.ts';
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

// This function is written for Supabase Edge Functions / Node-like environments.
// It implements idempotent syncing of a "like" action to YouTube by first
// inserting a log record with a unique constraint. If the insert fails due to
// uniqueness, the function returns success (already-synced).

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const INTERNAL_SECRET = process.env.INTERNAL_SECRET || ''; // simple guard for requests

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.warn('Missing Supabase env vars');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });

serve(async (req) => {
  try {
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

    // Basic auth guard: require INTERNAL_SECRET header
    const secret = req.headers.get('x-internal-secret') || '';
    if (!INTERNAL_SECRET || secret !== INTERNAL_SECRET) {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body || !body.videoId || !body.workspaceId || !body.userId) {
      return new Response(JSON.stringify({ error: 'Missing parameters (videoId, workspaceId, userId required)' }), { status: 400 });
    }

    const { videoId, workspaceId, userId, action = 'like', metadata = {} } = body;

    // Attempt to insert an idempotency record. The unique index (workspace_id,user_id,video_id,action)
    // will prevent duplicates. If insert fails due to unique constraint, treat as already-synced.
    const insertPayload = {
      workspace_id: workspaceId,
      user_id: userId,
      video_id: videoId,
      action,
      metadata,
    };

    const { data: insertedRow, error: insertErr } = await supabase.from('youtube_sync_logs').insert(insertPayload).select().single();
    if (insertErr) {
      // If unique violation, supabase returns an error; check message text for "duplicate" or rely on constraint
      const msg = String(insertErr.message || '').toLowerCase();
      if (msg.includes('duplicate') || msg.includes('unique')) {
        return new Response(JSON.stringify({ ok: true, skipped: true, reason: 'already_synced' }), { status: 200 });
      }
      console.error('Insert error', insertErr);
      return new Response(JSON.stringify({ error: 'db_insert_failed', detail: insertErr.message }), { status: 500 });
    }

    // At this point we've recorded the sync intent. Proceed to call YouTube API.
    const syncId = insertedRow?.id;
    // Lookup the OAuth access token for this workspace (assumes a table `youtube_accounts` exists with access_token)
    const { data: accounts, error: acctErr } = await supabase
      .from('youtube_accounts')
      .select('access_token,refresh_token,expires_at')
      .eq('workspace_id', workspaceId)
      .limit(1)
      .order('created_at', { ascending: false });

    if (acctErr) {
      console.error('youtube_accounts lookup error', acctErr);
      return new Response(JSON.stringify({ ok: false, error: 'youtube_account_lookup_failed' }), { status: 500 });
    }

    const account = Array.isArray(accounts) && accounts.length ? accounts[0] : null;
    if (!account || !account.access_token) {
      return new Response(JSON.stringify({ ok: true, skipped: true, reason: 'no_youtube_account' }), { status: 200 });
    }

    const accessToken = account.access_token as string;

    // YouTube Data API: set rating to 'like'
    // Endpoint: POST https://www.googleapis.com/youtube/v3/videos/rate?id={VIDEO_ID}&rating=like
    // Requires OAuth 2.0 user credentials with sufficient scope.
    try {
      const ytRes = await fetch(`https://www.googleapis.com/youtube/v3/videos/rate?id=${encodeURIComponent(videoId)}&rating=like`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      });

      if (ytRes.ok) {
        // mark synced
        try {
          if (syncId) {
            await supabase
              .from('youtube_sync_logs')
              .update({ status: 'synced', attempt_count: supabase.raw('attempt_count + 1'), last_attempt_at: new Date().toISOString(), last_error: null })
              .eq('id', syncId);
          }
        } catch (e) {
          // ignore update failure
        }
        return new Response(JSON.stringify({ ok: true, synced: true }), { status: 200 });
      }

      const text = await ytRes.text();
      // If 401, token may be expired — let caller handle reauth flow
      if (ytRes.status === 401) {
        try {
          if (syncId) {
            await supabase
              .from('youtube_sync_logs')
              .update({ status: 'failed', attempt_count: supabase.raw('attempt_count + 1'), last_attempt_at: new Date().toISOString(), last_error: text })
              .eq('id', syncId);
          }
        } catch (e) {
          // ignore
        }
        return new Response(JSON.stringify({ ok: false, error: 'youtube_unauthorized', detail: text }), { status: 401 });
      }

      console.error('YouTube API error', ytRes.status, text);
      try {
        if (syncId) {
          await supabase
            .from('youtube_sync_logs')
            .update({ status: 'failed', attempt_count: supabase.raw('attempt_count + 1'), last_attempt_at: new Date().toISOString(), last_error: text })
            .eq('id', syncId);
        }
      } catch (e) {
        // ignore
      }
      return new Response(JSON.stringify({ ok: false, error: 'youtube_api_error', status: ytRes.status, detail: text }), { status: 502 });
    } catch (e) {
      console.error('YouTube fetch failed', e);
      try {
        if (syncId) {
          await supabase
            .from('youtube_sync_logs')
            .update({ status: 'failed', attempt_count: supabase.raw('attempt_count + 1'), last_attempt_at: new Date().toISOString(), last_error: String(e) })
            .eq('id', syncId);
        }
      } catch (er) {
        // ignore
      }
      return new Response(JSON.stringify({ ok: false, error: 'youtube_fetch_failed', detail: String(e) }), { status: 502 });
    }
  } catch (e: any) {
    console.error('unexpected', e);
    return new Response(JSON.stringify({ ok: false, error: 'unexpected', detail: String(e?.message || e) }), { status: 500 });
  }
});
