/**
 * Facebook Webhook Controller
 * Handles incoming webhook events from Facebook
 * Real-time sync of comments and reactions
 */

import { supabase } from '../../lib/supabase';
import FacebookSyncService from './facebook.sync.service';

export interface FacebookWebhookPayload {
  object: string;
  entry: Array<{
    id: string;        // page_id
    time: number;
    changes: Array<{
      field: string;
      value: {
        post_id?: string;
        comment_id?: string;
        message?: string;
        from?: {
          id: string;
          name: string;
        };
        created_time?: string;
        item?: string;
        verb?: string;
      };
    }>;
  }>;
}

/**
 * Handle Facebook webhook verification (GET request)
 */
export async function handleWebhookVerification(
  mode: string | string[] | undefined,
  token: string | string[] | undefined,
  challenge: string | string[] | undefined
): Promise<string> {
  const verifyToken = process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN;
  
  if (mode === 'subscribe' && token === verifyToken) {
    console.log('[FacebookWebhook] Webhook verified successfully');
    return challenge as string;
  }
  
  console.warn('[FacebookWebhook] Webhook verification failed');
  return 'Verification failed';
}

/**
 * Handle Facebook webhook events (POST request)
 */
export async function handleWebhookEvent(payload: FacebookWebhookPayload): Promise<{
  success: boolean;
  processed: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let processed = 0;

  // Only handle page events
  if (payload.object !== 'page') {
    console.log('[FacebookWebhook] Ignoring non-page webhook');
    return { success: true, processed: 0, errors: [] };
  }

  for (const entry of payload.entry) {
    const pageId = entry.id;

    // Get the social account for this page
    const { data: account } = await supabase
      .from('social_accounts')
      .select('id, workspace_id, access_token, page_id')
      .eq('page_id', pageId)
      .eq('platform', 'facebook')
      .maybeSingle();

    if (!account) {
      console.log(`[FacebookWebhook] No account found for page ${pageId}`);
      continue;
    }

    const syncService = new FacebookSyncService(
      account.workspace_id,
      account.access_token,
      pageId
    );

    for (const change of entry.changes) {
      try {
        if (change.field === 'feed') {
          const value = change.value;
          
          // Handle new comment
          if (value.item === 'comment') {
            console.log(`[FacebookWebhook] New comment on post ${value.post_id}`);
            
            // Sync the whole post to get the new comment
            const result = await syncService.syncPost(value.post_id);
            if (result.success) {
              processed++;
            } else {
              errors.push(...result.errors);
            }
          }
          
          // Handle new reaction
          if (value.item === 'reaction') {
            console.log(`[FacebookWebhook] Reaction on post ${value.post_id}`);
            
            const result = await syncService.syncPost(value.post_id);
            if (result.success) {
              processed++;
            } else {
              errors.push(...result.errors);
            }
          }
        }
      } catch (err: any) {
        console.error(`[FacebookWebhook] Error processing change:`, err);
        errors.push(err.message);
      }
    }
  }

  return {
    success: errors.length === 0,
    processed,
    errors
  };
}

/**
 * Subscribe to Facebook Webhooks
 */
export async function subscribeToWebhooks(pageId: string, accessToken: string): Promise<boolean> {
  const appId = process.env.FACEBOOK_APP_ID;
  const appSecret = process.env.FACEBOOK_APP_SECRET;
  
  if (!appId || !appSecret) {
    console.error('[FacebookWebhook] Missing Facebook app credentials');
    return false;
  }

  try {
    // Subscribe to feed webhooks
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${pageId}/subscribed_apps?access_token=${accessToken}&subscribed_fields=feed`,
      {
        method: 'POST'
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('[FacebookWebhook] Failed to subscribe:', error);
      return false;
    }

    console.log(`[FacebookWebhook] Successfully subscribed to page ${pageId} webhooks`);
    return true;
  } catch (err) {
    console.error('[FacebookWebhook] Subscription error:', err);
    return false;
  }
}

export default {
  handleWebhookVerification,
  handleWebhookEvent,
  subscribeToWebhooks
};
