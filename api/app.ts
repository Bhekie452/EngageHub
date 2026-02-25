import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { createHmac, timingSafeEqual } from 'crypto';
import https from 'https';

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

function handleCors(req: VercelRequest, res: VercelResponse): boolean {
  const allowedOrigins = [
    'https://engage-hub-ten.vercel.app',
    'https://www.engagehub.co.za',
    'http://localhost:3000',
    'http://localhost:5173'
  ];

  const origin = (req.headers.origin || '').toString();
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }

  return false;
}

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

      case 'webhook-tiktok':
      case 'tiktok-webhook':
        return await handleTikTokWebhook(req, res);

      case 'tiktok-comments':
        return await handleTikTokComments(req, res);

      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid action parameter',
          validActions: ['engagement', 'publish', 'test-tiktok', 'webhook-facebook', 'webhook-tiktok', 'tiktok-comments'],
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
// TIKTOK WEBHOOK HANDLER
// ============================================
async function handleTikTokWebhook(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    const challenge = req.query.challenge || req.query.challenge_code || req.query.echo;
    if (challenge) {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.status(200).send(String(challenge));
    }
    return res.status(200).json({ ok: true, message: 'TikTok webhook endpoint active' });
  }

  if (req.method === 'POST') {
    try {
      const secret = process.env.TIKTOK_WEBHOOK_SECRET;
      if (secret) {
        const receivedRaw = (req.headers['x-tiktok-signature'] || req.headers['x-tiktok-signature-v1'] || req.headers['x-signature'] || '').toString();
        const received = receivedRaw.replace(/^sha256=/i, '').trim();
        if (!received) {
          return res.status(401).json({ ok: false, error: 'Missing signature' });
        }

        const payload = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
        const computed = createHmac('sha256', secret).update(payload).digest('hex');
        const isValid = received.length === computed.length && timingSafeEqual(Buffer.from(received), Buffer.from(computed));
        if (!isValid) {
          return res.status(401).json({ ok: false, error: 'Invalid signature' });
        }
      }

      const payload = req.body || {};
      const eventType = payload.event_type || payload.type || payload.event || 'unknown';
      console.log('[TikTokWebhook] Event received:', {
        eventType,
        hasData: !!payload.data
      });

      return res.status(200).json({ ok: true, received: true });
    } catch (error: any) {
      console.error('[TikTokWebhook] Error:', error);
      return res.status(500).json({ ok: false, error: 'Webhook processing failed' });
    }
  }

  return res.status(405).json({ ok: false, error: 'Method not allowed' });
}

// ============================================
// TIKTOK COMMENTS PROXY (avoids CORS)
// ============================================
async function handleTikTokComments(req: VercelRequest, res: VercelResponse) {
  const videoId = req.query.videoId;
  const workspaceId = req.query.workspaceId;
  console.log('[TikTokComments] Called with videoId:', videoId, 'workspaceId:', workspaceId);

  if (!videoId || !workspaceId) {
    return res.status(400).json({ success: false, error: 'Missing videoId or workspaceId' });
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: ttAccount, error: ttErr } = await supabase
      .from('social_accounts')
      .select('access_token, refresh_token, token_expires_at')
      .eq('workspace_id', String(workspaceId))
      .eq('platform', 'tiktok')
      .maybeSingle();

    console.log('[TikTokComments] Account lookup:', { found: !!ttAccount, err: ttErr?.message });

    if (!ttAccount?.access_token) {
      return res.status(404).json({ success: false, error: 'No TikTok account found' });
    }

    const fields = 'id,text,create_date,like_count,parent_comment_id';
    const apiUrl = `https://open.tiktokapis.com/v2/comment/list/?fields=${encodeURIComponent(fields)}`;
    const bodyStr = JSON.stringify({ video_id: String(videoId), max_count: 50 });

    const ttJson: any = await new Promise((resolve, reject) => {
      try {
        const parsed = new URL(apiUrl);
        const options: https.RequestOptions = {
          hostname: parsed.hostname,
          path: parsed.pathname + parsed.search,
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${ttAccount.access_token}`,
            'Content-Type': 'application/json',
            'Content-Length': String(Buffer.byteLength(bodyStr)),
          },
        };
        const request = https.request(options, (response) => {
          let body = '';
          response.on('data', (chunk: Buffer | string) => { body += chunk; });
          response.on('end', () => {
            try {
              resolve(JSON.parse(body));
            } catch {
              console.error('[TikTokComments] Non-JSON from TikTok:', body.slice(0, 300));
              resolve({ error: { code: 'parse_error', message: 'Non-JSON TikTok response', status: response.statusCode } });
            }
          });
        });
        request.on('error', (err) => {
          console.error('[TikTokComments] Request error:', err.message);
          reject(err);
        });
        request.write(bodyStr);
        request.end();
      } catch (innerErr) {
        reject(innerErr);
      }
    });

    console.log('[TikTokComments] TikTok response:', JSON.stringify(ttJson).slice(0, 500));
    return res.status(200).json({ success: true, data: ttJson });
  } catch (error: any) {
    console.error('[TikTokComments] Handler error:', error?.message || error);
    return res.status(500).json({ success: false, error: String(error?.message || 'Unknown error') });
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
