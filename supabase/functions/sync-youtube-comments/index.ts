const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const { videoId, postId, accessToken, workspaceId, userId } = await req.json();

    if (!videoId || !postId || !accessToken) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: videoId, postId, accessToken' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch comments from YouTube API
    const ytRes = await fetch(
      `https://www.googleapis.com/youtube/v3/commentThreads?` +
      `part=snippet&videoId=${videoId}&maxResults=100&order=time`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!ytRes.ok) {
      const errorText = await ytRes.text();
      throw new Error(`YouTube API error: ${ytRes.status} - ${errorText}`);
    }

    const ytData = await ytRes.json();
    const items = ytData.items ?? [];

    // Map YouTube comments to engagement_actions table
    const comments = items
      .filter((item: any) => item?.snippet?.topLevelComment?.snippet)
      .map((item: any) => {
        const s = item.snippet.topLevelComment.snippet;
        return {
          workspace_id: workspaceId || null,
          user_id: userId || null,
          post_id: postId,
          platform_post_id: videoId,
          platform: 'youtube',
          action_type: 'comment',
          action_data: {
            comment_text: s.textDisplay,
            user_name: s.authorDisplayName,
            user_avatar: s.authorProfileImageUrl,
          },
          source: 'youtube',
          platform_object_id: item.id, // YouTube comment ID for deduplication
          like_count: s.likeCount ?? 0,
          synced_at: new Date().toISOString(),
          created_at: s.publishedAt,
        };
      });

    if (comments.length === 0) {
      return new Response(
        JSON.stringify({ synced: 0, message: 'No new comments to sync' }),
        { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    // Upsert into Supabase engagement_actions table (skip duplicates)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const upsertRes = await fetch(`${supabaseUrl}/rest/v1/engagement_actions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'resolution=ignore-duplicates',
      },
      body: JSON.stringify(comments),
    });

    if (!upsertRes.ok) {
      const errorText = await upsertRes.text();
      throw new Error(`Supabase upsert failed: ${errorText}`);
    }

    return new Response(
      JSON.stringify({ synced: comments.length }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Sync error:', message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }
});
