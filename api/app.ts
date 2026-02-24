import { VercelRequest, VercelResponse } from '@vercel/node';
import { handleCors } from '../lib/server/cors';
import { createClient } from '@supabase/supabase-js';

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

      case 'webhook-facebook':
      case 'facebook-webhook':
        return await handleFacebookWebhook(req, res);

      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid action parameter',
          validActions: ['engagement', 'publish', 'test-tiktok', 'webhook-facebook'],
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
  try {
    // Test that environment variables are configured
    const tiktokClientKey = process.env.TIKTOK_CLIENT_KEY;
    const tiktokClientSecret = process.env.TIKTOK_CLIENT_SECRET;
    
    return res.status(200).json({
      success: true,
      message: 'TikTok connection test endpoint working',
      envConfigured: {
        clientKey: !!tiktokClientKey,
        clientSecret: !!tiktokClientSecret
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('[TikTokTest] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// ============================================
// FACEBOOK WEBHOOK HANDLER
// ============================================
async function handleFacebookWebhook(req: VercelRequest, res: VercelResponse) {
  // Handle webhook verification (GET request from Facebook)
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const verifyToken = process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN;

    if (mode === 'subscribe' && token === verifyToken) {
      return res.status(200).send(challenge);
    }
    return res.status(403).json({ error: 'Verification failed' });
  }

  // Handle webhook events (POST)
  if (req.method === 'POST') {
    try {
      const payload = req.body;
      if (payload.object !== 'page') {
        return res.status(200).json({ status: 'ignored' });
      }

      const supabase = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      for (const entry of payload.entry || []) {
        const pageId = entry.id;
        for (const change of entry.changes || []) {
          const field = change.field;
          const value = change.value;

          if (field === 'comments') {
            const commentId = value.comment_id;
            const message = value.message;
            const from = value.from?.name || 'Unknown';
            const createdTime = new Date(parseInt(value.created_time) * 1000).toISOString();

            const { data: account } = await supabase
              .from('social_accounts')
              .select('id, workspace_id')
              .eq('platform', 'facebook')
              .eq('platform_id', pageId)
              .single();

            if (account) {
              const { data: existing } = await supabase
                .from('engagement_actions')
                .select('id')
                .eq('platform', 'facebook')
                .eq('platform_comment_id', commentId)
                .single();

              if (!existing) {
                await supabase.from('engagement_actions').insert({
                  workspace_id: account.workspace_id,
                  social_account_id: account.id,
                  platform: 'facebook',
                  action_type: 'comment',
                  platform_comment_id: commentId,
                  user_name: from,
                  content: message,
                  performed_at: createdTime
                });
              }
            }
          }
        }
      }
      return res.status(200).json({ status: 'received' });
    } catch (error) {
      return res.status(500).json({ error: 'Webhook processing failed' });
    }
  }
  return res.status(405).json({ error: 'Method not allowed' });
}
