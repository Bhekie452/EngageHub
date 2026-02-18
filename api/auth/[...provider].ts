import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { provider, action } = req.query;
  
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (provider === 'facebook') {
      if (action === 'auth') {
        return await handleFacebookAuth(req, res);
      } else if (action === 'token') {
        return await handleFacebookToken(req, res);
      } else if (action === 'callback') {
        return await handleFacebookCallback(req, res);
      }
    }

    if (provider === 'tiktok') {
      if (action === 'token') {
        return await handleTikTokToken(req, res);
      }
    }

    return res.status(404).json({ error: 'Endpoint not found' });
  } catch (error: any) {
    console.error('Auth error:', error);
    return res.status(500).json({ error: error.message });
  }
}

async function handleTikTokToken(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Authorization code required' });
  }

  try {
    // Get code verifier from cookie
    let codeVerifier = null;
    
    if (req.headers.cookie) {
      const cookies: { [key: string]: string } = req.headers.cookie.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        if (key && value) {
          acc[key] = value;
        }
        return acc;
      }, {});
      codeVerifier = cookies.tiktok_oauth_code_verifier;
    }

    console.log('[tiktok-token] Code verifier found:', !!codeVerifier);

    // Exchange authorization code for access token with PKCE
    const clientKey = process.env.TIKTOK_CLIENT_KEY || 'sbawvd31u17vw8ajd3';
    const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
    
    // Check if client secret is set and not a placeholder
    if (!clientSecret || clientSecret === 'your_tiktok_client_secret_here' || clientSecret.startsWith('your_')) {
      console.error('[tiktok-token] TIKTOK_CLIENT_SECRET is not set or is a placeholder value');
      return res.status(500).json({ 
        error: 'TikTok client secret not configured',
        details: 'Please set TIKTOK_CLIENT_SECRET in Vercel environment variables. Get your credentials from https://developers.tiktok.com/',
        isPlaceholder: true
      });
    }

    const tokenRequestBody: { [key: string]: any } = {
      client_key: clientKey,
      client_secret: clientSecret,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: process.env.TIKTOK_REDIRECT_URI || 'https://engage-hub-ten.vercel.app'
    };
    
    // Add code verifier if available (required for PKCE)
    if (codeVerifier) {
      tokenRequestBody.code_verifier = codeVerifier;
    }
    
    console.log('[tiktok-token] Token exchange request:', {
      ...tokenRequestBody,
      client_secret: tokenRequestBody.client_secret ? '[REDACTED]' : null,
      code: tokenRequestBody.code ? code.substring(0, 20) + '...' : null
    });

    const tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(tokenRequestBody)
    });

    // Get raw response text first to handle non-JSON errors
    const responseText = await tokenResponse.text();
    console.log('[tiktok-token] Raw TikTok response:', responseText);
    
    let tokenData;
    try {
      // Check if response looks like HTML
      if (responseText.includes('<!DOCTYPE') || responseText.includes('<html>')) {
        console.error('[tiktok-token] Received HTML instead of JSON');
        return res.status(500).json({ 
          error: 'TikTok API returned HTML error page',
          details: 'API endpoint or parameters incorrect'
        });
      }
      
      // Handle plain text error responses
      if (!responseText.startsWith('{') && !responseText.startsWith('[')) {
        console.error('[tiktok-token] Received plain text error:', responseText);
        return res.status(400).json({ 
          error: 'TikTok API error: ' + responseText.trim(),
          details: responseText.trim()
        });
      }
      
      tokenData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('[tiktok-token] JSON parse error:', parseError);
      return res.status(500).json({ 
        error: 'Invalid response from TikTok',
        details: 'Response parsing failed'
      });
    }

    console.log('[tiktok-token] Token response status:', tokenResponse.status);
    console.log('[tiktok-token] Token response keys:', Object.keys(tokenData));

    if (!tokenResponse.ok || tokenData.error) {
      console.error('[tiktok-token] Token exchange failed:', tokenData);
      return res.status(400).json({ 
        error: 'Token exchange failed',
        details: tokenData.error_description || tokenData.error 
      });
    }

    const { access_token, refresh_token, expires_in, scope, refresh_expires_in } = tokenData;

    if (!access_token) {
      console.error('[tiktok-token] No access token in response');
      return res.status(400).json({ error: 'No access token received' });
    }

    console.log('[tiktok-token] Access token obtained successfully');

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

    const userInfoData = await userInfoResponse.json();
    console.log('[tiktok-token] User info response status:', userInfoResponse.status);

    let userInfo: any = {};
    if (userInfoResponse.ok && userInfoData.data) {
      userInfo = userInfoData.data.user;
      console.log('[tiktok-token] User info obtained:', userInfo.display_name);
    } else {
      console.warn('[tiktok-token] Could not get user info:', userInfoData);
    }

    // Return success response
    return res.status(200).json({
      success: true,
      access_token,
      refresh_token,
      expires_in,
      scope,
      refresh_expires_in,
      user: userInfo
    });

  } catch (error: any) {
    console.error('[tiktok-token] Error:', error);
    return res.status(500).json({ 
      error: 'Token exchange failed',
      details: error.message 
    });
  }
}

// Facebook OAuth - Initiate Auth Flow
async function handleFacebookAuth(req: VercelRequest, res: VercelResponse) {
  const { workspaceId } = req.query;
  
  const clientId = process.env.FACEBOOK_APP_ID;
  const clientSecret = process.env.FACEBOOK_APP_SECRET;
  const redirectUri = 'https://engage-hub-ten.vercel.app/api/auth?provider=facebook&action=callback';
  
  if (!clientId || !clientSecret) {
    return res.status(500).json({ 
      error: 'Facebook credentials not configured',
      details: 'FACEBOOK_APP_ID or FACEBOOK_APP_SECRET not set in environment variables'
    });
  }
  
  // Build Facebook OAuth URL
  const scopes = 'public_profile,email,pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_content_publish';
  const state = JSON.stringify({ workspaceId: workspaceId || 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9' });
  
  const facebookAuthUrl = new URL('https://www.facebook.com/v19.0/dialog/oauth');
  facebookAuthUrl.searchParams.set('client_id', clientId);
  facebookAuthUrl.searchParams.set('redirect_uri', redirectUri);
  facebookAuthUrl.searchParams.set('scope', scopes);
  facebookAuthUrl.searchParams.set('state', state);
  facebookAuthUrl.searchParams.set('response_type', 'code');
  
  console.log('[facebook-auth] Redirecting to Facebook OAuth');
  console.log('[facebook-auth] Redirect URI:', redirectUri);
  
  // Redirect to Facebook
  return res.redirect(facebookAuthUrl.toString());
}

async function handleFacebookToken(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Authorization code required' });
  }

  try {
    // Exchange authorization code for access token
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?` +
      `client_id=${process.env.FACEBOOK_APP_ID}&` +
      `client_secret=${process.env.FACEBOOK_APP_SECRET}&` +
      `redirect_uri=${encodeURIComponent('https://engage-hub-ten.vercel.app/auth/facebook/callback')}&` +
      `code=${code}`
    );

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      throw new Error(tokenData.error.message);
    }

    // Exchange short-lived token for long-lived token
    const longTermResponse = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?` +
      `grant_type=fb_exchange_token&` +
      `client_id=${process.env.FACEBOOK_APP_ID}&` +
      `client_secret=${process.env.FACEBOOK_APP_SECRET}&` +
      `fb_exchange_token=${tokenData.access_token}`
    );

    const longTermData = await longTermResponse.json();

    if (longTermData.error) {
      throw new Error(longTermData.error.message);
    }

    // Get Facebook Pages
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v19.0/me/accounts?` +
      `fields=id,name,access_token,instagram_business_account&` +
      `access_token=${longTermData.access_token}`
    );

    const pagesData = await pagesResponse.json();

    if (pagesData.error) {
      throw new Error(pagesData.error.message);
    }

    return res.status(200).json({
      success: true,
      longTermToken: longTermData.access_token,
      expiresIn: longTermData.expires_in,
      pages: pagesData.data || []
    });

  } catch (error: any) {
    console.error('Facebook token exchange failed:', error);
    return res.status(500).json({ 
      error: 'Token exchange failed',
      details: error.message 
    });
  }
}

async function handleFacebookCallback(req: VercelRequest, res: VercelResponse) {
  const { code, state } = req.query;

  if (!code) {
    const error = req.query.error as string;
    const errorDescription = req.query.error_description as string;
    console.error('[facebook-callback] Error:', error, errorDescription);
    return res.redirect(`/social-media?error=${encodeURIComponent(error || 'OAuth error')}`);
  }

  // Parse state to get workspaceId
  let workspaceId = 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9';
  try {
    if (state) {
      const stateData = JSON.parse(state as string);
      workspaceId = stateData.workspaceId || workspaceId;
    }
  } catch (e) {
    console.log('[facebook-callback] Could not parse state:', e);
  }

  // Redirect to frontend with the code
  console.log('[facebook-callback] Redirecting with code');
  return res.redirect(`/social-media?facebook_code=${code}&workspaceId=${workspaceId}`);
}
