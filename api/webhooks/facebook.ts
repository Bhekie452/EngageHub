import { VercelRequest, VercelResponse } from '@vercel/node';

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

      // Process each entry (page)
      for (const entry of payload.entry || []) {
        const pageId = entry.id;
        console.log(`[FacebookWebhook] Processing page: ${pageId}`);

        // Process changes
        for (const change of entry.changes || []) {
          const field = change.field;
          const value = change.value;

          console.log(`[FacebookWebhook] Field: ${field}, Value:`, JSON.stringify(value).substring(0, 200));

          // Handle feed changes (comments, posts, reactions)
          if (field === 'feed') {
            const item = value.item;
            const verb = value.verb;

            console.log(`[FacebookWebhook] Feed event: ${item} - ${verb}`);

            // Log the event - in production, you'd trigger a sync here
            if (item === 'comment') {
              console.log(`[FacebookWebhook] New comment on post: ${value.post_id}`);
              // TODO: Trigger sync for this specific post
            } else if (item === 'reaction') {
              console.log(`[FacebookWebhook] Reaction on post: ${value.post_id}`);
              // TODO: Trigger sync for this specific post
            } else if (item === 'post') {
              console.log(`[FacebookWebhook] Post created: ${value.post_id}`);
            }
          }
        }
      }

      return res.status(200).json({ status: 'received' });
    } catch (error) {
      console.error('[FacebookWebhook] Error processing webhook:', error);
      return res.status(500).json({ error: 'Internal error' });
    }
  }

  // Method not allowed
  return res.status(405).json({ error: 'Method not allowed' });
}
