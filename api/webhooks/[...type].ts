import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  apiVersion: '2025-02-24.acacia' as any,
}) : null;

// Facebook webhook handler
const handleFacebookWebhook = async (req: VercelRequest, res: VercelResponse) => {
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
};

// Stripe webhook handler
const handleStripeWebhook = async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!stripe) {
    return res.status(500).json({ error: 'Stripe is not configured on the server.' });
  }

  const sig = req.headers['stripe-signature'] as string;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !endpointSecret) {
    return res.status(400).json({ error: 'Missing signature or webhook secret' });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      (req as any).rawBody || JSON.stringify(req.body),
      sig,
      endpointSecret
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        // Handle successful payment
        const session = event.data.object;
        console.log('Checkout session completed:', session);
        // Add your business logic here
        break;
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        // Handle subscription changes
        const subscription = event.data.object;
        console.log('Subscription updated:', subscription);
        // Add your business logic here
        break;
      // Add more event types as needed
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    return res.status(500).json({ error: 'Error processing webhook' });
  }
};

// Main webhook handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { type } = req.query;

  try {
    switch (type) {
      case 'stripe':
        return await handleStripeWebhook(req, res);
      case 'facebook':
        return await handleFacebookWebhook(req, res);
      // Add more webhook types as needed
      default:
        return res.status(404).json({ error: 'Webhook type not found' });
    }
  } catch (error) {
    console.error(`Error in webhook handler (${type}):`, error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export const config = {
  api: {
    bodyParser: false, // Required for webhooks to work with raw body
  },
};
