import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    console.log('[FacebookCron] Starting background sync...');

    // Get all connected Facebook accounts
    const { data: accounts, error: accountsError } = await supabase
      .from('social_accounts')
      .select('id, workspace_id, access_token, page_id')
      .eq('platform', 'facebook')
      .eq('status', 'connected');

    if (accountsError) {
      console.error('[FacebookCron] Failed to fetch accounts:', accountsError);
      return res.status(500).json({ error: accountsError.message });
    }

    console.log(`[FacebookCron] Found ${accounts?.length || 0} Facebook accounts`);

    const results = {
      accountsProcessed: 0,
      postsSynced: 0,
      errors: [] as string[]
    };

    for (const account of accounts || []) {
      try {
        // Get posts that need syncing (haven't been synced in the last 10 minutes)
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

        const { data: posts, error: postsError } = await supabase
          .from('posts')
          .select('id, platform_post_id, last_synced_at')
          .eq('workspace_id', account.workspace_id)
          .eq('platform', 'facebook')
          .not('platform_post_id', 'is', null)
          .or(`last_synced_at.is.null,last_synced_at.lt.${tenMinutesAgo}`)
          .limit(20);

        if (postsError) {
          console.error(`[FacebookCron] Failed to fetch posts for account ${account.id}:`, postsError);
          results.errors.push(`Posts fetch failed for account: ${postsError.message}`);
          continue;
        }

        if (!posts || posts.length === 0) {
          console.log(`[FacebookCron] No posts to sync for account ${account.id}`);
          continue;
        }

        console.log(`[FacebookCron] Syncing ${posts.length} posts for account ${account.id}`);
        results.accountsProcessed++;

        // For each post, call the sync-facebook-engagement function
        for (const post of posts) {
          try {
            const syncResponse = await fetch(
              `${supabaseUrl}/functions/v1/sync-facebook-engagement`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${supabaseKey}`
                },
                body: JSON.stringify({
                  workspaceId: account.workspace_id,
                  postId: post.id,
                  platformPostId: post.platform_post_id,
                  accessToken: account.access_token
                })
              }
            );

            if (syncResponse.ok) {
              results.postsSynced++;
            } else {
              const errorText = await syncResponse.text();
              console.error(`[FacebookCron] Sync failed for post ${post.platform_post_id}:`, errorText);
            }

            // Update last_synced_at
            await supabase
              .from('posts')
              .update({ last_synced_at: new Date().toISOString() })
              .eq('id', post.id);
          } catch (syncErr: any) {
            console.error(`[FacebookCron] Error syncing post ${post.platform_post_id}:`, syncErr);
            results.errors.push(syncErr.message);
          }
        }
      } catch (err: any) {
        console.error(`[FacebookCron] Error processing account ${account.id}:`, err);
        results.errors.push(`Account ${account.id}: ${err.message}`);
      }
    }

    console.log(`[FacebookCron] Sync complete:`, results);

    return res.status(200).json({
      success: true,
      ...results
    });
  } catch (error: any) {
    console.error('[FacebookCron] Fatal error:', error);
    return res.status(500).json({ error: error.message });
  }
}
