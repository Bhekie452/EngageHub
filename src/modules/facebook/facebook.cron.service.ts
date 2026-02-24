/**
 * Facebook Background Sync Cron Service
 * Runs periodically to sync all Facebook posts
 * Safety net for when webhooks miss events
 */

import { supabase } from '../../lib/supabase';
import FacebookSyncService from './facebook.sync.service';

const SYNC_INTERVAL_MINUTES = 10; // Run every 10 minutes
const BATCH_SIZE = 20; // Sync 20 posts at a time

export interface SyncResult {
  totalPosts: number;
  successful: number;
  failed: number;
  errors: string[];
}

/**
 * Main background sync function
 * Should be called by a cron job (e.g., every 10 minutes)
 */
export async function runFacebookBackgroundSync(): Promise<SyncResult> {
  console.log('[FacebookCron] Starting background sync...');
  
  const result: SyncResult = {
    totalPosts: 0,
    successful: 0,
    failed: 0,
    errors: []
  };

  try {
    // Get all Facebook accounts with posts that need syncing
    const { data: accounts, error: accountsError } = await supabase
      .from('social_accounts')
      .select('id, workspace_id, access_token, page_id')
      .eq('platform', 'facebook')
      .eq('status', 'connected');

    if (accountsError) {
      console.error('[FacebookCron] Failed to fetch accounts:', accountsError);
      result.errors.push(`Accounts fetch failed: ${accountsError.message}`);
      return result;
    }

    console.log(`[FacebookCron] Found ${accounts.length} Facebook accounts`);

    for (const account of accounts) {
      try {
        // Get posts that need syncing (haven't been synced recently)
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
        
        const { data: posts, error: postsError } = await supabase
          .from('posts')
          .select('id, platform_post_id, last_synced_at')
          .eq('workspace_id', account.workspace_id)
          .eq('platform', 'facebook')
          .not('platform_post_id', 'is', null)
          .or(`last_synced_at.is.null,last_synced_at.lt.${tenMinutesAgo}`)
          .limit(BATCH_SIZE);

        if (postsError) {
          console.error(`[FacebookCron] Failed to fetch posts for account ${account.id}:`, postsError);
          result.errors.push(`Posts fetch failed: ${postsError.message}`);
          continue;
        }

        if (!posts || posts.length === 0) {
          console.log(`[FacebookCron] No posts to sync for account ${account.id}`);
          continue;
        }

        console.log(`[FacebookCron] Syncing ${posts.length} posts for account ${account.id}`);
        result.totalPosts += posts.length;

        const syncService = new FacebookSyncService(
          account.workspace_id,
          account.access_token,
          account.page_id
        );

        for (const post of posts) {
          try {
            const syncResult = await syncService.syncPost(post.platform_post_id);
            if (syncResult.success) {
              result.successful++;
            } else {
              result.failed++;
              result.errors.push(...syncResult.errors);
            }
          } catch (err: any) {
            result.failed++;
            result.errors.push(`Post ${post.platform_post_id}: ${err.message}`);
            console.error(`[FacebookCron] Failed to sync post ${post.platform_post_id}:`, err);
          }
        }
      } catch (err: any) {
        console.error(`[FacebookCron] Error syncing account ${account.id}:`, err);
        result.errors.push(`Account ${account.id}: ${err.message}`);
      }
    }

    console.log(`[FacebookCron] Sync complete. Total: ${result.totalPosts}, Successful: ${result.successful}, Failed: ${result.failed}`);
    return result;
  } catch (err: any) {
    console.error('[FacebookCron] Fatal error:', err);
    result.errors.push(`Fatal: ${err.message}`);
    return result;
  }
}

/**
 * Sync a specific workspace's Facebook posts
 */
export async function syncWorkspaceFacebookPosts(workspaceId: string): Promise<SyncResult> {
  console.log(`[FacebookCron] Syncing workspace ${workspaceId}...`);
  
  const result: SyncResult = {
    totalPosts: 0,
    successful: 0,
    failed: 0,
    errors: []
  };

  try {
    // Get the Facebook account for this workspace
    const { data: account, error: accountError } = await supabase
      .from('social_accounts')
      .select('id, workspace_id, access_token, page_id')
      .eq('workspace_id', workspaceId)
      .eq('platform', 'facebook')
      .eq('status', 'connected')
      .maybeSingle();

    if (accountError || !account) {
      result.errors.push('No connected Facebook account found');
      return result;
    }

    // Get posts that need syncing
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('id, platform_post_id, last_synced_at')
      .eq('workspace_id', workspaceId)
      .eq('platform', 'facebook')
      .not('platform_post_id', 'is', null)
      .or(`last_synced_at.is.null,last_synced_at.lt.${tenMinutesAgo}`);

    if (postsError) {
      result.errors.push(`Posts fetch failed: ${postsError.message}`);
      return result;
    }

    if (!posts || posts.length === 0) {
      console.log('[FacebookCron] No posts to sync');
      return result;
    }

    result.totalPosts = posts.length;
    console.log(`[FacebookCron] Syncing ${posts.length} posts`);

    const syncService = new FacebookSyncService(
      workspaceId,
      account.access_token,
      account.page_id
    );

    for (const post of posts) {
      try {
        const syncResult = await syncService.syncPost(post.platform_post_id);
        if (syncResult.success) {
          result.successful++;
        } else {
          result.failed++;
          result.errors.push(...syncResult.errors);
        }
      } catch (err: any) {
        result.failed++;
        result.errors.push(`Post ${post.platform_post_id}: ${err.message}`);
      }
    }

    return result;
  } catch (err: any) {
    console.error('[FacebookCron] Error:', err);
    result.errors.push(err.message);
    return result;
  }
}

/**
 * Import posts from Facebook for a workspace
 * Run this when connecting a new Facebook account
 */
export async function importFacebookPosts(workspaceId: string, limit: number = 25): Promise<{
  imported: number;
  matched: number;
  errors: string[];
}> {
  console.log(`[FacebookCron] Importing posts for workspace ${workspaceId}...`);

  try {
    // Get the Facebook account
    const { data: account, error: accountError } = await supabase
      .from('social_accounts')
      .select('id, workspace_id, access_token, page_id')
      .eq('workspace_id', workspaceId)
      .eq('platform', 'facebook')
      .eq('status', 'connected')
      .maybeSingle();

    if (accountError || !account) {
      return { imported: 0, matched: 0, errors: ['No connected Facebook account found'] };
    }

    const syncService = new FacebookSyncService(
      workspaceId,
      account.access_token,
      account.page_id
    );

    const importResult = await syncService.importPagePosts(limit);
    return importResult;
  } catch (err: any) {
    console.error('[FacebookCron] Import error:', err);
    return { imported: 0, matched: 0, errors: [err.message] };
  }
}

export default {
  runFacebookBackgroundSync,
  syncWorkspaceFacebookPosts,
  importFacebookPosts
};
