import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://zourlqrkoyugzymxkbgn.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey || '');

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
        // Check if it's a TikTok error message
        if (responseText.toLowerCase().includes('unsupported') || 
            responseText.toLowerCase().includes('invalid') ||
            responseText.toLowerCase().includes('error')) {
          return res.status(400).json({ 
            error: 'TikTok API error: ' + responseText.trim(),
            details: responseText.trim(),
            rawResponse: responseText
          });
        }
        // For unknown plain text, also return 400
        return res.status(400).json({ 
          error: 'TikTok API error: ' + responseText.trim(),
          details: responseText.trim(),
          rawResponse: responseText
        });
      }
      
      // Try to parse as JSON
      tokenData = JSON.parse(responseText);
    } catch (parseError: any) {
      console.error('[tiktok-token] JSON parse error:', parseError);
      console.log('[tiktok-token] Response that failed to parse:', responseText?.substring(0, 500) || 'No response text');
      return res.status(500).json({ 
        error: 'Invalid response from TikTok',
        details: 'Response parsing failed: ' + (parseError?.message || 'Unknown error'),
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

    // Get user info from TikTok (optional - some apps may not have permission)
    // Skip user info for now to avoid errors
    let userInfo: any = {};
    console.log('[tiktok-token] Skipping user info request - will use token data only');

    // Save TikTok account to database
    const { workspaceId, userId } = req.body;
    const openId = tokenData.open_id;
    
    // Use the userId from request or workspaceId as fallback for connected_by
    const connectedBy = userId || workspaceId;
    
    if (workspaceId && openId && supabaseKey) {
      const { error: saveError } = await supabase.from('social_accounts').upsert({
        workspace_id: workspaceId,
        platform: 'tiktok',
        account_id: openId,
        access_token: access_token,
        refresh_token: refresh_token,
        token_expires_at: new Date(Date.now() + expires_in * 1000).toISOString(),
        is_active: true,
        connected_by: connectedBy
      }, { onConflict: 'workspace_id,platform,account_id' });
      
      if (saveError) {
        console.error('[tiktok-token] Failed to save to database:', saveError);
      } else {
        console.log('[tiktok-token] Saved TikTok account to database');
      }
    } else {
      console.log('[tiktok-token] Skipping database save - no workspaceId or supabaseKey');
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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { accessToken } = req.body;
    if (!accessToken) return res.status(400).json({ error: 'accessToken required' });

    // Try TikTok Open API v2 user info endpoint using Bearer token
    const urlsToTry = [
      `https://open.tiktokapis.com/v2/user/info/`,
      `https://open.tiktokapis.com/v2/user/info`,
    ];

    let profileData: any = null;
    for (const url of urlsToTry) {
      try {
        const resp = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
          }
        });
        const text = await resp.text();
        // attempt to parse
        let json: any = null;
        try { json = JSON.parse(text); } catch { json = null; }
        if (resp.ok && json) {
          profileData = json;
          break;
        }
        // if not ok, continue to next
      } catch (e) {
        console.warn('[handleTikTokProfile] fetch attempt failed for', url, e);
      }
    }

    if (!profileData) {
      return res.status(502).json({ error: 'Failed to fetch TikTok profile', details: 'No profile response from TikTok' });
    }

    return res.status(200).json(profileData);
  } catch (err: any) {
    console.error('[handleTikTokProfile] Error:', err);
    return res.status(500).json({ error: 'Failed to fetch TikTok profile', details: err.message });
  }
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
