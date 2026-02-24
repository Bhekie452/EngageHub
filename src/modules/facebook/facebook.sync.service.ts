/**
 * Facebook Sync Service
 * Handles all database operations for syncing Facebook engagement data
 * Uses Supabase as the database
 */

import { supabase } from '../../lib/supabase';
import FacebookApiService from './facebook.api.service';
import { FacebookMetrics, FacebookComment, FacebookPost } from './facebook.types';

export class FacebookSyncService {
  constructor(
    private workspaceId: string,
    private accessToken: string,
    private pageId: string
  ) {}

  /**
   * Sync a single post's engagement data
   */
  async syncPost(postId: string): Promise<{
    success: boolean;
    metrics?: FacebookMetrics;
    newComments: number;
    errors: string[];
  }> {
    const fb = new FacebookApiService(this.accessToken);
    const errors: string[] = [];

    try {
      // 1. Sync Metrics
      let metrics: FacebookMetrics | undefined;
      try {
        metrics = await fb.getPostMetrics(postId);
        await this.upsertMetrics(postId, metrics);
        console.log(`[FacebookSync] Synced metrics for post ${postId}:`, metrics);
      } catch (err: any) {
        errors.push(`Metrics sync failed: ${err.message}`);
        console.error(`[FacebookSync] Failed to sync metrics for ${postId}:`, err);
      }

      // 2. Sync Comments
      let newComments = 0;
      try {
        const comments = await fb.getPostComments(postId, 100);
        for (const comment of comments) {
          const inserted = await this.upsertComment(postId, comment);
          if (inserted) newComments++;
        }
        console.log(`[FacebookSync] Synced ${newComments} new comments for post ${postId}`);
      } catch (err: any) {
        errors.push(`Comments sync failed: ${err.message}`);
        console.error(`[FacebookSync] Failed to sync comments for ${postId}:`, err);
      }

      // 3. Update last_synced_at
      await this.updateLastSynced(postId);

      return {
        success: errors.length === 0,
        metrics,
        newComments,
        errors
      };
    } catch (err: any) {
      console.error(`[FacebookSync] Full sync failed for ${postId}:`, err);
      return {
        success: false,
        newComments: 0,
        errors: [err.message]
      };
    }
  }

  /**
   * Import existing posts from Facebook Page
   * Run this when connecting a new Facebook account
   */
  async importPagePosts(limit: number = 25): Promise<{
    imported: number;
    matched: number;
    errors: string[];
  }> {
    const fb = new FacebookApiService(this.accessToken);
    const errors: string[] = [];
    let imported = 0;
    let matched = 0;

    try {
      const posts = await fb.getPagePosts(this.pageId, limit);
      console.log(`[FacebookSync] Found ${posts.length} posts from Facebook`);

      for (const post of posts) {
        try {
          // Try to match by message content and date
          const { data: existingPosts } = await supabase
            .from('posts')
            .select('id, content, created_at')
            .eq('workspace_id', this.workspaceId)
            .eq('platform', 'facebook')
            .limit(10);

          let matchedPostId: string | null = null;

          // Try to find matching post by message similarity
          if (existingPosts && existingPosts.length > 0 && post.message) {
            for (const p of existingPosts) {
              if (p.content && post.message && 
                  p.content.toLowerCase().includes(post.message.toLowerCase().substring(0, 50))) {
                matchedPostId = p.id;
                matched++;
                break;
              }
            }
          }

          // Insert as new post if no match
          if (!matchedPostId) {
            const { data: newPost, error: insertError } = await supabase
              .from('posts')
              .insert({
                workspace_id: this.workspaceId,
                platform: 'facebook',
                platform_post_id: post.id,
                content: post.message || '',
                link_url: post.permalink_url || '',
                published_at: post.created_time,
                created_at: new Date().toISOString()
              })
              .select('id')
              .single();

            if (insertError) {
              console.error(`[FacebookSync] Failed to insert post ${post.id}:`, insertError);
            } else if (newPost) {
              imported++;
              
              // Also add to post_publications
              await supabase
                .from('post_publications')
                .upsert({
                  post_id: newPost.id,
                  social_account_id: this.pageId,
                  platform: 'facebook',
                  platform_post_id: post.id,
                  platform_url: post.permalink_url || '',
                  status: 'published',
                  published_at: post.created_time
                }, { onConflict: 'post_id,social_account_id' });
            }
          } else {
            // Update existing post with platform_post_id
            await supabase
              .from('posts')
              .update({ platform_post_id: post.id })
              .eq('id', matchedPostId);
          }
        } catch (err: any) {
          errors.push(`Post ${post.id}: ${err.message}`);
        }
      }

      return { imported, matched, errors };
    } catch (err: any) {
      console.error('[FacebookSync] Import failed:', err);
      return { imported, matched, errors: [err.message] };
    }
  }

  /**
   * Upsert post metrics
   */
  private async upsertMetrics(postId: string, metrics: FacebookMetrics): Promise<void> {
    // First get the internal post ID from platform_post_id
    const { data: post } = await supabase
      .from('posts')
      .select('id')
      .eq('platform_post_id', postId)
      .eq('workspace_id', this.workspaceId)
      .maybeSingle();

    if (!post) {
      console.log(`[FacebookSync] Post not found for platform_post_id: ${postId}`);
      return;
    }

    await supabase
      .from('post_metrics')
      .upsert({
        post_id: post.id,
        likes_count: metrics.reactions,
        comments_count: metrics.comments,
        shares_count: metrics.shares,
        last_updated: new Date().toISOString()
      }, { onConflict: 'post_id' });
  }

  /**
   * Upsert a single comment (with deduplication)
   */
  private async upsertComment(postId: string, comment: FacebookComment): Promise<boolean> {
    // Get internal post ID
    const { data: post } = await supabase
      .from('posts')
      .select('id')
      .eq('platform_post_id', postId)
      .eq('workspace_id', this.workspaceId)
      .maybeSingle();

    if (!post) {
      console.log(`[FacebookSync] Post not found for comment: ${postId}`);
      return false;
    }

    // Check for existing comment (deduplication)
    const { data: existing } = await supabase
      .from('engagement_actions')
      .select('id')
      .eq('post_id', post.id)
      .eq('platform', 'facebook')
      .eq('social_id', comment.id)
      .maybeSingle();

    if (existing) {
      return false; // Already exists
    }

    // Insert new comment
    const { error } = await supabase
      .from('engagement_actions')
      .insert({
        workspace_id: this.workspaceId,
        post_id: post.id,
        platform: 'facebook',
        type: 'comment',
        social_id: comment.id,
        social_user_id: comment.from?.id,
        username: comment.from?.name,
        message: comment.message,
        parent_id: comment.parent?.id || null,
        action_date: comment.created_time,
        synced_at: new Date().toISOString()
      });

    if (error) {
      console.error(`[FacebookSync] Failed to insert comment ${comment.id}:`, error);
      return false;
    }

    return true;
  }

  /**
   * Update last_synced_at timestamp
   */
  private async updateLastSynced(postId: string): Promise<void> {
    await supabase
      .from('posts')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('platform_post_id', postId)
      .eq('workspace_id', this.workspaceId);
  }
}

export default FacebookSyncService;
