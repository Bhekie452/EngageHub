import { VercelRequest, VercelResponse } from '@vercel/node';
import { handleCors } from './_cors.js';

/**
 * CONSOLIDATED APP API
 * Handles: engagement, publishing, testing
 * Reduces serverless function count from 7 to 4
 * 
 * Usage:
 * - /api/app?action=engagement&method=create
 * - /api/app?action=publish
 * - /api/app?action=test-tiktok
 */

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  const { action } = req.query;

  try {
    // Route to appropriate handler
    switch (action) {
      case 'engagement':
        return await handleEngagement(req, res);
      
      case 'publish':
      case 'publish-post':
        return await handlePublishPost(req, res);
      
      case 'test-tiktok':
      case 'tiktok-test':
        return await handleTikTokTest(req, res);
      
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid action parameter',
          validActions: ['engagement', 'publish', 'test-tiktok'],
          usage: '/api/app?action=engagement&method=create'
        });
    }
  } catch (error: any) {
    console.error('[API/App] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}

// ============================================
// ENGAGEMENT HANDLERS
// ============================================
async function handleEngagement(req: VercelRequest, res: VercelResponse) {
  const { method: actionMethod } = req.query;
  const { method } = req;

  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    switch (method) {
      case 'POST':
        if (actionMethod === 'create') {
          return await createEngagement(req, res, supabase);
        }
        break;

      case 'GET':
        if (actionMethod === 'list') {
          return await listEngagement(req, res, supabase);
        } else if (actionMethod === 'aggregates') {
          return await getAggregates(req, res, supabase);
        }
        break;

      case 'DELETE':
        return await deleteEngagement(req, res, supabase);

      default:
        return res.status(405).json({
          success: false,
          error: 'Method not allowed for engagement'
        });
    }

    return res.status(400).json({
      success: false,
      error: 'Invalid engagement method',
      validMethods: {
        POST: ['create'],
        GET: ['list', 'aggregates'],
        DELETE: []
      }
    });
  } catch (error: any) {
    console.error('[Engagement] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

async function createEngagement(req: VercelRequest, res: VercelResponse, supabase: any) {
  const {
    workspaceId,
    userId,
    postId,
    platformPostId,
    platform,
    actionType,
    actionData,
    platformUserId
  } = req.body;

  // Validation
  if (!workspaceId || !userId || !platformPostId || !platform || !actionType) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: workspaceId, userId, platformPostId, platform, actionType'
    });
  }

  // Create engagement action
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
      source: 'engagehub',
      platform_user_id: platformUserId || null,
    })
    .select()
    .single();

  if (engagementError) {
    console.error('[Engagement] Creation error:', engagementError);
    return res.status(500).json({
      success: false,
      error: engagementError.message
    });
  }

  // Queue for sync to native platform
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
    console.warn('[Engagement] Queue error (non-critical):', queueError);
  }

  // Fetch aggregates
  const { data: aggregates } = await supabase
    .from('engagement_aggregates')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('platform', platform.toLowerCase())
    .eq('platform_post_id', platformPostId)
    .single();

  return res.status(201).json({
    success: true,
    engagement: engagementAction,
    aggregates: aggregates || null
  });
}

async function listEngagement(req: VercelRequest, res: VercelResponse, supabase: any) {
  const { workspaceId, platformPostId, platform, actionType } = req.query;

  if (!workspaceId || !platformPostId || !platform) {
    return res.status(400).json({
      success: false,
      error: 'Missing required parameters: workspaceId, platformPostId, platform'
    });
  }

  let query = supabase
    .from('engagement_actions')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('platform', (platform as string).toLowerCase())
    .eq('platform_post_id', platformPostId)
    .order('created_at', { ascending: false });

  if (actionType) {
    query = query.eq('action_type', (actionType as string).toLowerCase());
  }

  const { data, error } = await query;

  if (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }

  return res.status(200).json({
    success: true,
    actions: data || []
  });
}

async function getAggregates(req: VercelRequest, res: VercelResponse, supabase: any) {
  const { workspaceId, platformPostId, platform } = req.query;

  if (!workspaceId || !platformPostId || !platform) {
    return res.status(400).json({
      success: false,
      error: 'Missing required parameters: workspaceId, platformPostId, platform'
    });
  }

  const { data, error } = await supabase
    .from('engagement_aggregates')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('platform', (platform as string).toLowerCase())
    .eq('platform_post_id', platformPostId)
    .single();

  if (error && error.code !== 'PGRST116') {  // Not "no rows" error
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }

  return res.status(200).json({
    success: true,
    aggregates: data || {
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
      total_saves: 0,
      total_reposts: 0
    }
  });
}

async function deleteEngagement(req: VercelRequest, res: VercelResponse, supabase: any) {
  const { engagementId, workspaceId } = req.body;

  if (!engagementId || !workspaceId) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: engagementId, workspaceId'
    });
  }

  const { error } = await supabase
    .from('engagement_actions')
    .delete()
    .eq('id', engagementId)
    .eq('workspace_id', workspaceId);

  if (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Engagement deleted successfully'
  });
}

// ============================================
// PUBLISH POST HANDLER
// ============================================
async function handlePublishPost(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  const { platform, content, workspaceId, userId, mediaUrl, scheduledFor } = req.body;

  if (!platform || !content || !workspaceId) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: platform, content, workspaceId'
    });
  }

  try {
    // NOTE: Publishing logic is handled by the frontend's publishPost function
    // This endpoint is kept for backward compatibility but delegates to platform-specific APIs
    return res.status(200).json({
      success: true,
      message: 'Use platform-specific publishing endpoints (Facebook, Instagram, etc.)',
      platform,
      content: content.substring(0, 50) + '...'
    });
  } catch (error: any) {
    console.error('[PublishPost] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// ============================================
// TIKTOK TEST HANDLER
// ============================================
async function handleTikTokTest(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  const { workspaceId } = req.query;

  if (!workspaceId) {
    return res.status(400).json({
      success: false,
      error: 'Missing required parameter: workspaceId'
    });
  }

  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch TikTok connection
    const { data: tiktokAccount, error } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('platform', 'tiktok')
      .single();

    if (error || !tiktokAccount) {
      return res.status(404).json({
        success: false,
        error: 'TikTok account not connected for this workspace'
      });
    }

    // Test the connection
    const accessToken = tiktokAccount.access_token;
    const testResponse = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const userData = await testResponse.json();

    return res.status(200).json({
      success: testResponse.ok,
      connection: {
        platform: 'tiktok',
        connected: true,
        username: tiktokAccount.username,
        accountId: tiktokAccount.account_id
      },
      apiTest: {
        status: testResponse.status,
        data: userData
      }
    });
  } catch (error: any) {
    console.error('[TikTokTest] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
