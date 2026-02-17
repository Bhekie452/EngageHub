import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { provider, action } = req.query;

  if (!provider || !action) {
    return res.status(400).json({ error: 'Provider and action required' });
  }

  console.log(`[oauth] ${provider} ${action} request received`);

  try {
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

  console.log('[tiktok-token] Full request body:', req.body);
  console.log('[tiktok-token] Request headers:', req.headers);

  const { code, redirectUri, codeVerifier, code_verifier } = req.body;

  // Support both naming conventions
  const verifier = codeVerifier || code_verifier;

  console.log('[tiktok-token] Parsed parameters:');
  console.log('  code:', code ? code.substring(0, 20) + '...' : 'MISSING');
  console.log('  redirectUri:', redirectUri || 'MISSING');
  console.log('  codeVerifier:', codeVerifier ? 'PRESENT' : 'MISSING');
  console.log('  code_verifier:', code_verifier ? 'PRESENT' : 'MISSING');
  console.log('  final verifier:', verifier ? 'PRESENT' : 'MISSING');

  if (!code) {
    return res.status(400).json({ error: 'Authorization code required' });
  }

  try {
    console.log('[tiktok-token] Authorization code received:', code?.substring(0, 20) + '...');
    console.log('[tiktok-token] Code verifier found:', !!verifier);

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

    // Get redirect URI from environment or use default
    const redirectUri = process.env.TIKTOK_REDIRECT_URI || 'https://engage-hub-ten.vercel.app';

    // Debug: Log what we're sending
    console.log('[tiktok-token] === CREDENTIALS DEBUG ===');
    console.log('[tiktok-token] client_key:', clientKey);
    console.log('[tiktok-token] client_secret first 5 chars:', clientSecret?.substring(0, 5) + '...');
    console.log('[tiktok-token] redirect_uri:', redirectUri);

    const tokenRequestBody: { [key: string]: any } = {
      client_key: clientKey,
      client_secret: clientSecret,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri
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

    console.log('[tiktok-token] TikTok response status:', tokenResponse.status);
    console.log('[tiktok-token] TikTok response headers:', Object.fromEntries(tokenResponse.headers.entries()));

    // Get raw response text for debugging
    const responseText = await tokenResponse.text();
    console.log('[tiktok-token] Raw TikTok response:', responseText);

    let tokenData;
    try {
      // Check if response looks like HTML
      if (responseText.includes('<!DOCTYPE') || responseText.includes('<html>')) {
        console.error('[tiktok-token] Received HTML instead of JSON - likely API error page');
        return res.status(500).json({ 
          error: 'TikTok API returned HTML error page',
          details: 'API endpoint or parameters incorrect',
          rawResponse: responseText.substring(0, 500)
        });
      }
      
      // Handle plain text error responses (like "Unsupported response type")
      if (!responseText.startsWith('{') && !responseText.startsWith('[')) {
        console.error('[tiktok-token] Received plain text error:', responseText);
        return res.status(400).json({ 
          error: 'TikTok API error: ' + responseText.trim(),
          details: responseText.trim(),
          rawResponse: responseText
        });
      }
      
      // Try to parse as JSON
      tokenData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('[tiktok-token] JSON parse error:', parseError);
      console.log('[tiktok-token] Response that failed to parse:', responseText?.substring(0, 500) || 'No response text');
      return res.status(500).json({ 
        error: 'Invalid response from TikTok',
        details: 'Response parsing failed',
        rawResponse: responseText?.substring(0, 500) + '...' || 'No response available'
      });
    }

    console.log('[tiktok-token] Token response status:', tokenResponse.status);
    console.log('[tiktok-token] Token response keys:', Object.keys(tokenData));

    if (!tokenResponse.ok || tokenData.error) {
      console.error('[tiktok-token] Token exchange failed:', tokenData);
      const errorMessage = tokenData.error_description || tokenData.error || 'Unknown error';
      return res.status(400).json({ 
        error: 'Token exchange failed',
        details: String(errorMessage)
      });
    }

    const { access_token, refresh_token, expires_in, scope, refresh_expires_in } = tokenData;

    if (!access_token) {
      console.error('[tiktok-token] No access token in response');
      return res.status(400).json({ error: 'No access token received' });
    }

    console.log('[tiktok-token] Access token obtained successfully');

    // Get user info from TikTok
    console.log('[tiktok-token] Fetching user info from TikTok...');
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

    console.log('[tiktok-token] User info response status:', userInfoResponse.status);
    
    // Get raw response first to handle non-JSON errors
    const userInfoRaw = await userInfoResponse.text();
    console.log('[tiktok-token] User info raw response:', userInfoRaw.substring(0, 500));
    
    let userInfo: any = {};
    try {
      const userInfoData = JSON.parse(userInfoRaw);
      if (userInfoResponse.ok && userInfoData.data) {
        userInfo = userInfoData.data.user;
        console.log('[tiktok-token] User info obtained:', (userInfo as any)?.display_name);
      } else {
        console.warn('[tiktok-token] Could not get user info:', userInfoData);
      }
    } catch (parseError: any) {
      console.error('[tiktok-token] Failed to parse user info response:', parseError);
      // Continue without user info - token was obtained successfully
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
