import { serve } from 'std/server.ts';
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

// Edge function: called by client to record a like (server-side) and safely trigger YouTube sync.
// - Verifies the incoming Supabase access token (Authorization: Bearer <token>)
// - Inserts a post_like into analytics_events using the service role key
// - Calls the internal `youtube-like` function with x-internal-secret to perform idempotent sync

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const INTERNAL_SECRET = process.env.INTERNAL_SECRET || '';
const YOUTUBE_LIKE_FN_URL = process.env.YOUTUBE_LIKE_FN_URL || ''; // e.g. https://<region>-<project>.functions.supabase.co/youtube-like

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });

serve(async (req) => {
  try {
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

    const auth = req.headers.get('authorization') || req.headers.get('Authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (!token) return new Response(JSON.stringify({ ok: false, error: 'missing_auth' }), { status: 401 });

    // Validate token and get user
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) return new Response(JSON.stringify({ ok: false, error: 'invalid_token' }), { status: 401 });
    const user = userData.user;

    const body = await req.json().catch(() => null);
    if (!body || !body.postId) return new Response(JSON.stringify({ ok: false, error: 'missing_postId' }), { status: 400 });

    const postId = String(body.postId);
    const platform = body.platform ? String(body.platform) : null;
    const videoId = body.videoId ? String(body.videoId) : null;

    // Resolve workspace for this user (same logic as client)
    const { data: workspaces, error: wsErr } = await supabase.from('workspaces').select('id').eq('owner_id', user.id).limit(1);
    if (wsErr) return new Response(JSON.stringify({ ok: false, error: 'workspace_lookup_failed' }), { status: 500 });
    const workspaceId = workspaces && workspaces.length ? workspaces[0].id : null;
    if (!workspaceId) return new Response(JSON.stringify({ ok: false, error: 'workspace_not_found' }), { status: 400 });

    // Check if the user already liked this post to avoid duplicate inserts
    let alreadyLiked = false;
    try {
      const { data: existingLike, error: likeErr } = await supabase
        .from('analytics_events')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('entity_type', 'post')
        .eq('entity_id', postId)
        .eq('event_type', 'post_like')
        .eq('user_id', user.id)
        .limit(1);
      if (likeErr) {
        console.error('analytics lookup error', likeErr);
        return new Response(JSON.stringify({ ok: false, error: 'analytics_lookup_failed' }), { status: 500 });
      }
      if (existingLike && existingLike.length) {
        alreadyLiked = true;
      }
    } catch (e) {
      console.error('analytics lookup exception', e);
      return new Response(JSON.stringify({ ok: false, error: 'analytics_lookup_exception' }), { status: 500 });
    }

    // Insert analytics event (post_like) only if not already liked
    if (!alreadyLiked) {
      const payload = {
        workspace_id: workspaceId,
        user_id: user.id,
        session_id: null,
        event_type: 'post_like',
        entity_type: 'post',
        entity_id: postId,
        platform: platform ?? null,
        metadata: { actor: user.email ?? `@${String(user.id).slice(0, 8)}` },
        occurred_at: new Date().toISOString(),
      };

      const { error: insertErr } = await supabase.from('analytics_events').insert(payload);
      if (insertErr) {
        console.error('analytics insert error', insertErr);
        return new Response(JSON.stringify({ ok: false, error: 'analytics_insert_failed' }), { status: 500 });
      }
    }

    // If user just liked (not a duplicate) and it's a YouTube post, call youtube-like function securely
    let youtubeResult: any = null;
    if (!alreadyLiked && platform === 'youtube' && videoId) {
      if (!YOUTUBE_LIKE_FN_URL) {
        console.warn('YOUTUBE_LIKE_FN_URL not set; skipping YouTube sync');
      } else if (!INTERNAL_SECRET) {
        console.warn('INTERNAL_SECRET not set; skipping YouTube sync');
      } else {
        try {
          const resp = await fetch(YOUTUBE_LIKE_FN_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-internal-secret': INTERNAL_SECRET,
            },
            body: JSON.stringify({ videoId, workspaceId, userId: user.id, action: 'like', metadata: { actor: user.email } }),
          });
          const json = await resp.json().catch(() => null);
          youtubeResult = { status: resp.status, body: json };
        } catch (e) {
          console.error('youtube-like call failed', e);
          youtubeResult = { error: String(e) };
        }
      }
    }

    return new Response(JSON.stringify({ ok: true, youtube: youtubeResult }), { status: 200 });
  } catch (e: any) {
    console.error('unexpected', e);
    return new Response(JSON.stringify({ ok: false, error: 'unexpected', detail: String(e?.message || e) }), { status: 500 });
  }
});
