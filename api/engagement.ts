import { VercelRequest, VercelResponse } from '@vercel/node';
import { handleCors } from './_cors.js';

/**
 * Engagement API - Handles bidirectional engagement sync
 * 
 * Endpoints:
 * - POST /api/engagement - Create engagement action (like, comment, share)
 * - GET /api/engagement - Get engagement for a post
 * - GET /api/engagement/aggregates - Get aggregated counts
 * - DELETE /api/engagement/:id - Remove engagement (unlike, delete comment)
 */

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  const { method } = req;
  const { action } = req.query;

  try {
    switch (method) {
      case 'POST':
        if (action === 'create') {
          return await handleCreateEngagement(req, res);
        }
        break;

      case 'GET':
        if (action === 'list') {
          return await handleListEngagement(req, res);
        }
        if (action === 'aggregates') {
          return await handleGetAggregates(req, res);
        }
        break;

      case 'DELETE':
        return await handleDeleteEngagement(req, res);

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (error: any) {
    console.error('[engagement] Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

/**
 * Create an engagement action (like, comment, share, etc.)
 * This is called when a user performs an action INSIDE EngageHub
 * The action will be:
 * 1. Saved to engagement_actions table with source='engagehub'
 * 2. Added to engagement_sync_queue to push to native platform
 * 3. Aggregates will auto-update via trigger
 */
async function handleCreateEngagement(req: VercelRequest, res: VercelResponse) {
  const { 
    workspaceId, 
    userId, 
    postId, 
    platformPostId, 
    platform,
    actionType, // 'like', 'comment', 'share', etc.
    actionData, // Comment text, share caption, etc.
    platformUserId 
  } = req.body;

  // Validation
  if (!workspaceId || !userId || !platformPostId || !platform || !actionType) {
    return res.status(400).json({ 
      error: 'Missing required fields: workspaceId, userId, platformPostId, platform, actionType' 
    });
  }

  // Validate platform
  const validPlatforms = ['facebook', 'instagram', 'twitter', 'linkedin', 'youtube', 'tiktok', 'whatsapp'];
  if (!validPlatforms.includes(platform.toLowerCase())) {
    return res.status(400).json({ error: `Invalid platform. Must be one of: ${validPlatforms.join(', ')}` });
  }

  // Validate action type
  const validActions = ['like', 'comment', 'share', 'view', 'save', 'repost'];
  if (!validActions.includes(actionType.toLowerCase())) {
    return res.status(400).json({ error: `Invalid actionType. Must be one of: ${validActions.join(', ')}` });
  }

  try {
    // Get Supabase client (service role for server-side operations)
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Create engagement action
    const { data: engagementAction, error: engagementError } = await supabase
      .from('engagement_actions')
      .insert({
        workspace_id: workspaceId,
        user_id: userId,
        post_id: postId || null,
        platform_post_id: platformPostId,
        platform: platform.toLowerCase(),
        action_type: actionType.toLowerCase(),
        action_data: actionData || {},
        source: 'engagehub', // CRITICAL: This action came from EngageHub
        platform_user_id: platformUserId || null,
        synced: false
      })
      .select()
      .single();

    if (engagementError) {
      console.error('[engagement] Failed to create action:', engagementError);
      return res.status(500).json({ error: 'Failed to create engagement action', details: engagementError.message });
    }

    console.log('[engagement] Created action:', engagementAction.id, actionType, platform);

    // 2. Add to sync queue to push to native platform
    const { error: queueError } = await supabase
      .from('engagement_sync_queue')
      .insert({
        workspace_id: workspaceId,
        engagement_action_id: engagementAction.id,
        platform: platform.toLowerCase(),
        action_type: actionType.toLowerCase(),
        status: 'pending'
      });

    if (queueError) {
      console.error('[engagement] Failed to queue sync:', queueError);
      // Don't fail the request, background worker will retry
    }

    // 3. Get updated aggregates
    const { data: aggregates } = await supabase
      .from('engagement_aggregates')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('platform', platform.toLowerCase())
      .eq('platform_post_id', platformPostId)
      .single();

    return res.status(201).json({
      success: true,
      action: engagementAction,
      aggregates
    });

  } catch (error: any) {
    console.error('[engagement] Error creating engagement:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * List engagement actions for a post
 */
async function handleListEngagement(req: VercelRequest, res: VercelResponse) {
  const { workspaceId, platformPostId, platform, actionType } = req.query;

  if (!workspaceId || !platformPostId || !platform) {
    return res.status(400).json({ error: 'Missing required query params: workspaceId, platformPostId, platform' });
  }

  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let query = supabase
      .from('engagement_actions')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('platform', platform)
      .eq('platform_post_id', platformPostId)
      .order('created_at', { ascending: false });

    // Filter by action type if specified
    if (actionType) {
      query = query.eq('action_type', actionType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[engagement] Failed to list actions:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({
      success: true,
      actions: data,
      count: data.length
    });

  } catch (error: any) {
    console.error('[engagement] Error listing engagement:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Get aggregated engagement counts for a post
 * Returns total, native, and engagehub counts for all engagement types
 */
async function handleGetAggregates(req: VercelRequest, res: VercelResponse) {
  const { workspaceId, platformPostId, platform } = req.query;

  if (!workspaceId || !platformPostId || !platform) {
    return res.status(400).json({ error: 'Missing required query params: workspaceId, platformPostId, platform' });
  }

  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from('engagement_aggregates')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('platform', platform)
      .eq('platform_post_id', platformPostId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('[engagement] Failed to get aggregates:', error);
      return res.status(500).json({ error: error.message });
    }

    // If no aggregates exist yet, return zeros
    if (!data) {
      return res.status(200).json({
        success: true,
        aggregates: {
          total_likes: 0,
          native_likes: 0,
          engagehub_likes: 0,
          total_comments: 0,
          native_comments: 0,
          engagehub_comments: 0,
          total_shares: 0,
          native_shares: 0,
          engagehub_shares: 0,
          total_views: 0,
          native_views: 0,
          engagehub_views: 0,
          total_saves: 0,
          native_saves: 0,
          engagehub_saves: 0,
          total_reposts: 0,
          native_reposts: 0,
          engagehub_reposts: 0
        }
      });
    }

    return res.status(200).json({
      success: true,
      aggregates: data
    });

  } catch (error: any) {
    console.error('[engagement] Error getting aggregates:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Delete an engagement action (unlike, delete comment)
 * This removes the action and queues a sync to remove on native platform
 */
async function handleDeleteEngagement(req: VercelRequest, res: VercelResponse) {
  const { engagementId, workspaceId } = req.body;

  if (!engagementId || !workspaceId) {
    return res.status(400).json({ error: 'Missing required fields: engagementId, workspaceId' });
  }

  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get the engagement action first
    const { data: action, error: fetchError } = await supabase
      .from('engagement_actions')
      .select('*')
      .eq('id', engagementId)
      .eq('workspace_id', workspaceId)
      .single();

    if (fetchError || !action) {
      return res.status(404).json({ error: 'Engagement action not found' });
    }

    // Only allow deleting EngageHub-sourced actions
    if (action.source !== 'engagehub') {
      return res.status(403).json({ error: 'Cannot delete native platform engagement from EngageHub' });
    }

    // Delete the action
    const { error: deleteError } = await supabase
      .from('engagement_actions')
      .delete()
      .eq('id', engagementId)
      .eq('workspace_id', workspaceId);

    if (deleteError) {
      console.error('[engagement] Failed to delete action:', deleteError);
      return res.status(500).json({ error: deleteError.message });
    }

    // Queue sync to remove from native platform
    await supabase
      .from('engagement_sync_queue')
      .insert({
        workspace_id: workspaceId,
        engagement_action_id: engagementId,
        platform: action.platform,
        action_type: `delete_${action.action_type}`, // e.g., 'delete_like', 'delete_comment'
        status: 'pending'
      });

    return res.status(200).json({
      success: true,
      message: 'Engagement action deleted'
    });

  } catch (error: any) {
    console.error('[engagement] Error deleting engagement:', error);
    return res.status(500).json({ error: error.message });
  }
}
