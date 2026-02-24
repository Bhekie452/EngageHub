import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-hub-signature-256',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

function setCorsHeaders(res: VercelResponse): VercelResponse {
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  return res;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200);
  }

  // Handle webhook verification (GET request from Facebook)
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const verifyToken = process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN;

    console.log('[FacebookWebhook] Verification request received');
    console.log('[FacebookWebhook] Mode:', mode);
    console.log('[FacebookWebhook] Token match:', token === verifyToken);

    if (mode === 'subscribe' && token === verifyToken) {
      console.log('[FacebookWebhook] Webhook verified successfully');
      return res.status(200).send(challenge);
    }

    console.warn('[FacebookWebhook] Webhook verification failed');
    return res.status(403).json({ error: 'Verification failed' });
  }

  // Handle webhook events (POST request from Facebook)
  if (req.method === 'POST') {
    try {
      const payload = req.body;
      console.log('[FacebookWebhook] Received webhook:', JSON.stringify(payload).substring(0, 500));

      // Verify it's a page webhook
      if (payload.object !== 'page') {
        console.log('[FacebookWebhook] Ignoring non-page webhook');
        return res.status(200).json({ status: 'ignored' });
      }

      // Initialize Supabase
      const supabaseUrl = process.env.SUPABASE_URL || 'https://zourlqrkoyugzymxkbgn.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Process each entry (page)
      for (const entry of payload.entry || []) {
        const pageId = entry.id;
        console.log(`[FacebookWebhook] Processing page: ${pageId}`);

        // Process changes
        for (const change of entry.changes || []) {
          const field = change.field;
          const value = change.value;

          console.log(`[FacebookWebhook] Field: ${field}`);

          // Handle comments
          if (field === 'comments') {
            const commentId = value.comment_id;
            const message = value.message;
            const from = value.from?.name || 'Unknown';
            const createdTime = new Date(parseInt(value.created_time) * 1000).toISOString();

            console.log(`[FacebookWebhook] New comment: ${commentId} from ${from}`);

            // Find the social account by page ID
            const { data: account } = await supabase
              .from('social_accounts')
              .select('id, workspace_id')
              .eq('platform', 'facebook')
              .eq('platform_id', pageId)
              .single();

            if (account) {
              // Check if comment already exists
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
                console.log(`[FacebookWebhook] Comment saved to database`);
              }
            }
          }
        }
      }

      return res.status(200).json({ status: 'received' });
    } catch (error) {
      console.error('[FacebookWebhook] Error:', error);
      return res.status(500).json({ error: 'Webhook processing failed' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
