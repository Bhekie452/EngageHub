export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, code_verifier } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Authorization code required' });
  }

  try {
    console.log('[tiktok-token] Authorization code received:', code.substring(0, 20) + '...');
    console.log('[tiktok-token] Code verifier found:', !!code_verifier);

    // Exchange authorization code for access token with PKCE
    const tokenRequestBody = {
      client_key: process.env.TIKTOK_CLIENT_KEY || 'sbawvd31u17vw8ajd3',
      client_secret: process.env.TIKTOK_CLIENT_SECRET,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: process.env.TIKTOK_REDIRECT_URI || 'https://engage-hub-ten.vercel.app'
    };
    
    // Add code verifier if available (required for PKCE)
    if (code_verifier) {
      tokenRequestBody.code_verifier = code_verifier;
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

    let userInfo = {};
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

  } catch (error) {
    console.error('[tiktok-token] Error:', error);
    return res.status(500).json({ 
      error: 'Token exchange failed',
      details: error.message 
    });
  }
}
