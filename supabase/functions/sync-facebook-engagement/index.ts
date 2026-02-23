const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const { postId, platformPostId, workspaceId, userId, pageId, accessToken } = await req.json();

    if (!platformPostId || !accessToken) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: platformPostId, accessToken' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const headers = {
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Prefer': 'resolution=ignore-duplicates',
    };

    // 1. Fetch comments from Facebook Graph API
    const commentsRes = await fetch(
      `https://graph.facebook.com/v19.0/${platformPostId}/comments` +
      `?fields=id,message,from,created_time,like_count&limit=100&access_token=${accessToken}`
    );
    
    if (!commentsRes.ok) {
      const errorText = await commentsRes.text();
      throw new Error(`Facebook API error: ${commentsRes.status} - ${errorText}`);
    }
    
    const commentsData = await commentsRes.json();

    const comments = (commentsData.data ?? [])
      .filter((c: any) => c?.message)
      .map((c: any) => ({
        workspace_id: workspaceId,
        user_id: userId,
        post_id: postId,
        platform_post_id: platformPostId,
        platform: 'facebook',
        action_type: 'comment',
        action_data: {
          comment_text: c.message,
          user_name: c.from?.name ?? 'Unknown',
          user_avatar: c.from?.id
            ? `https://graph.facebook.com/${c.from.id}/picture?type=square`
            : null,
        },
        source: 'facebook',
        platform_object_id: c.id,
        like_count: c.like_count ?? 0,
        created_at: c.created_time,
      }));

    // 2. Fetch likes from Facebook Graph API
    const likesRes = await fetch(
      `https://graph.facebook.com/v19.0/${platformPostId}/likes` +
      `?fields=id,name&limit=100&access_token=${accessToken}`
    );
    
    const likesData = await likesRes.json();

    const likes = (likesData.data ?? []).map((l: any) => ({
      workspace_id: workspaceId,
      user_id: userId,
      post_id: postId,
      platform_post_id: platformPostId,
      platform: 'facebook',
      action_type: 'like',
      action_data: {
        user_name: l.name,
        user_avatar: `https://graph.facebook.com/${l.id}/picture?type=square`,
      },
      source: 'facebook',
      platform_object_id: `like_${platformPostId}_${l.id}`,
      created_at: new Date().toISOString(),
    }));

    // 3. Upsert both into engagement_actions
    const allActions = [...comments, ...likes];

    if (allActions.length > 0) {
      const upsertRes = await fetch(`${supabaseUrl}/rest/v1/engagement_actions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(allActions),
      });

      if (!upsertRes.ok) {
        const errorText = await upsertRes.text();
        throw new Error(`Supabase upsert failed: ${errorText}`);
      }
    }

    return new Response(
      JSON.stringify({ 
        synced_comments: comments.length, 
        synced_likes: likes.length,
        total: allActions.length
      }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[sync-facebook-engagement] Error:', message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }
});
