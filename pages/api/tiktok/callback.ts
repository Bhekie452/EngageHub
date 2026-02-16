import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface TikTokUserInfo {
  open_id?: string;
  union_id?: string;
  avatar_url?: string;
  display_name?: string;
}

interface TikTokTokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  refresh_expires_in?: number;
  error?: string;
  error_description?: string;
}

interface TikTokUserInfoResponse {
  data?: {
    user: TikTokUserInfo;
  };
  error?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ 
      error: 'Method Not Allowed',
      expected: 'GET',
      received: req.method
    });
  }

  try {
    console.log('[tiktok-callback] OAuth callback received:', {
      query: req.query,
      url: req.url
    });

    const { code, state, error } = req.query;

    // Handle OAuth errors
    if (error) {
      console.error('[tiktok-callback] OAuth error:', error);
      return res.redirect(`/social-media?error=tiktok_oauth_error&details=${error}`);
    }

    // Check for authorization code
    if (!code || typeof code !== 'string') {
      console.error('[tiktok-callback] No authorization code received');
      return res.redirect(`/social-media?error=tiktok_no_code`);
    }

    console.log('[tiktok-callback] Authorization code received:', code.substring(0, 20) + '...');

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_key: process.env.TIKTOK_CLIENT_KEY || 'sbawvd31u17vw8ajd3',
        client_secret: process.env.TIKTOK_CLIENT_SECRET!,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: process.env.TIKTOK_REDIRECT_URI || 'https://engage-hub-ten.vercel.app'
      })
    });

    const tokenData: TikTokTokenResponse = await tokenResponse.json();
    console.log('[tiktok-callback] Token response status:', tokenResponse.status);
    console.log('[tiktok-callback] Token response keys:', Object.keys(tokenData));

    if (!tokenResponse.ok || tokenData.error) {
      console.error('[tiktok-callback] Token exchange failed:', tokenData);
      return res.redirect(`/social-media?error=tiktok_token_failed&details=${tokenData.error_description || tokenData.error}`);
    }

    const { access_token, refresh_token, expires_in, scope, refresh_expires_in } = tokenData;

    if (!access_token) {
      console.error('[tiktok-callback] No access token in response');
      return res.redirect(`/social-media?error=tiktok_no_token`);
    }

    console.log('[tiktok-callback] Access token obtained successfully');

    // Get user info from TikTok
    const userInfoResponse = await fetch('https://open.tiktokapis.com/v2/user/info/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${access_token}`
      },
      body: JSON.stringify({
        fields: ['open_id', 'union_id', 'avatar_url', 'display_name']
      })
    });

    const userInfoData: TikTokUserInfoResponse = await userInfoResponse.json();
    console.log('[tiktok-callback] User info response status:', userInfoResponse.status);

    let userInfo: TikTokUserInfo = {};
    if (userInfoResponse.ok && userInfoData.data) {
      userInfo = userInfoData.data.user;
      console.log('[tiktok-callback] User info obtained:', userInfo.display_name);
    } else {
      console.warn('[tiktok-callback] Could not get user info:', userInfoData);
    }

    // Get workspace ID (for now, use default)
    const workspaceId = 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9';

    // Save connection to database
    const connectionData = {
      workspace_id: workspaceId,
      platform: 'tiktok',
      account_type: 'business',
      account_id: userInfo.open_id || 'tiktok_user',
      display_name: userInfo.display_name || 'TikTok Account',
      access_token: access_token,
      refresh_token: refresh_token,
      token_expires_at: new Date(Date.now() + (expires_in || 86400) * 1000).toISOString(),
      refresh_token_expires_at: new Date(Date.now() + (refresh_expires_in || 31536000) * 1000).toISOString(),
      platform_data: {
        scope: scope,
        user_info: userInfo,
        sandbox: true
      },
      connection_status: 'connected',
      last_sync_at: new Date().toISOString()
    };

    console.log('[tiktok-callback] Saving connection to database...');

    const { data: connection, error: saveError } = await supabase
      .from('social_accounts')
      .upsert(connectionData, { 
        onConflict: 'workspace_id,platform,account_id'
      })
      .select()
      .single();

    if (saveError) {
      console.error('[tiktok-callback] Failed to save connection:', saveError);
      return res.redirect(`/social-media?error=tiktok_save_failed&details=${saveError.message}`);
    }

    console.log('[tiktok-callback] Connection saved successfully:', connection.id);

    // Redirect back to social media page with success
    const redirectUrl = `/social-media?success=tiktok_connected&platform=tiktok&account=${encodeURIComponent(userInfo.display_name || 'TikTok Account')}`;
    console.log('[tiktok-callback] Redirecting to:', redirectUrl);
    
    return res.redirect(redirectUrl);

  } catch (error) {
    console.error('[tiktok-callback] Unexpected error:', error);
    return res.redirect(`/social-media?error=tiktok_callback_error&details=${error.message}`);
  }
}
