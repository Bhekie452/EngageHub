import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { provider, action } = req.query;

  if (!provider || !action) {
    return res.status(400).json({ error: 'Provider and action required' });
  }

  try {
    console.log(`[oauth] ${provider} ${action} request received`);

    // Handle TikTok OAuth
    if (provider === 'tiktok') {
      if (action === 'token') {
        return await handleTikTokToken(req, res);
      }
      if (action === 'profile') {
        return await handleTikTokProfile(req, res);
      }
    }

    // Handle Facebook OAuth
    if (provider === 'facebook') {
      if (action === 'token') {
        return await handleFacebookToken(req, res);
      }
      if (action === 'profile') {
        return await handleFacebookProfile(req, res);
      }
    }

    // Handle LinkedIn OAuth
    if (provider === 'linkedin') {
      if (action === 'token') {
        return await handleLinkedInToken(req, res);
      }
      if (action === 'profile') {
        return await handleLinkedInProfile(req, res);
      }
      if (action === 'organization-details') {
        return await handleLinkedInOrganizationDetails(req, res);
      }
    }

    // Handle Twitter OAuth
    if (provider === 'twitter') {
      if (action === 'token') {
        return await handleTwitterToken(req, res);
      }
      if (action === 'profile') {
        return await handleTwitterProfile(req, res);
      }
    }

    // Handle YouTube OAuth
    if (provider === 'youtube') {
      if (action === 'token') {
        return await handleYouTubeToken(req, res);
      }
      if (action === 'channel') {
        return await handleYouTubeChannel(req, res);
      }
    }

    return res.status(400).json({ error: 'Invalid action' });

  } catch (error: any) {
    console.error(`[oauth] Error:`, error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}

// TikTok Token Exchange
async function handleTikTokToken(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, redirectUri, codeVerifier, code_verifier } = req.body;

  // Support both naming conventions
  const verifier = codeVerifier || code_verifier;

  if (!code) {
    return res.status(400).json({ error: 'Authorization code required' });
  }

  try {
    console.log('[tiktok-token] Authorization code received:', code?.substring(0, 20) + '...');
    console.log('[tiktok-token] Code verifier found:', !!verifier);

    // Exchange authorization code for access token with PKCE
    const tokenRequestBody: { [key: string]: any } = {
      client_key: process.env.TIKTOK_CLIENT_KEY || 'sbawvd31u17vw8ajd3',
      client_secret: process.env.TIKTOK_CLIENT_SECRET,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri || process.env.TIKTOK_REDIRECT_URI || 'https://engage-hub-ten.vercel.app'
    };
    
    // Add code verifier if available (required for PKCE)
    if (verifier) {
      tokenRequestBody.code_verifier = verifier;
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

    const tokenData = await tokenResponse.json();
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
      console.log('[tiktok-token] User info obtained:', (userInfo as any)?.display_name);
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

// TikTok Profile (placeholder)
async function handleTikTokProfile(req: VercelRequest, res: VercelResponse) {
  return res.status(501).json({ error: 'Not implemented' });
}

// Facebook Token (placeholder)
async function handleFacebookToken(req: VercelRequest, res: VercelResponse) {
  return res.status(501).json({ error: 'Not implemented' });
}

// Facebook Profile (placeholder)
async function handleFacebookProfile(req: VercelRequest, res: VercelResponse) {
  return res.status(501).json({ error: 'Not implemented' });
}

// LinkedIn Token (placeholder)
async function handleLinkedInToken(req: VercelRequest, res: VercelResponse) {
  return res.status(501).json({ error: 'Not implemented' });
}

// LinkedIn Profile (placeholder)
async function handleLinkedInProfile(req: VercelRequest, res: VercelResponse) {
  return res.status(501).json({ error: 'Not implemented' });
}

// LinkedIn Organization Details (placeholder)
async function handleLinkedInOrganizationDetails(req: VercelRequest, res: VercelResponse) {
  return res.status(501).json({ error: 'Not implemented' });
}

// Twitter Token (placeholder)
async function handleTwitterToken(req: VercelRequest, res: VercelResponse) {
  return res.status(501).json({ error: 'Not implemented' });
}

// Twitter Profile (placeholder)
async function handleTwitterProfile(req: VercelRequest, res: VercelResponse) {
  return res.status(501).json({ error: 'Not implemented' });
}

// YouTube Token (placeholder)
async function handleYouTubeToken(req: VercelRequest, res: VercelResponse) {
  return res.status(501).json({ error: 'Not implemented' });
}

// YouTube Channel (placeholder)
async function handleYouTubeChannel(req: VercelRequest, res: VercelResponse) {
  return res.status(501).json({ error: 'Not implemented' });
}
