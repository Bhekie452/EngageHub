export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code, redirectUri, codeVerifier } = req.body;

    console.log('[tiktok-debug] Request received:', {
      code: code?.substring(0, 20) + '...',
      redirectUri,
      hasCodeVerifier: !!codeVerifier
    });

    if (!code) {
      return res.status(400).json({ error: 'Authorization code required' });
    }

    // Make the exact same request as the main API
    const tokenRequestBody = {
      client_key: process.env.TIKTOK_CLIENT_KEY || 'sbawvd31u17vw8ajd3',
      client_secret: process.env.TIKTOK_CLIENT_SECRET,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri || 'https://engage-hub-ten.vercel.app'
    };

    // Add code verifier if available
    if (codeVerifier) {
      tokenRequestBody.code_verifier = codeVerifier;
    }

    console.log('[tiktok-debug] Sending to TikTok:', {
      ...tokenRequestBody,
      client_secret: tokenRequestBody.client_secret ? '[REDACTED]' : null
    });

    const tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(tokenRequestBody)
    });

    console.log('[tiktok-debug] TikTok response status:', tokenResponse.status);
    console.log('[tiktok-debug] TikTok response headers:', Object.fromEntries(tokenResponse.headers.entries()));

    // Get raw response text first
    const responseText = await tokenResponse.text();
    console.log('[tiktok-debug] Raw TikTok response:', responseText);

    // Try to parse JSON
    let tokenData;
    try {
      tokenData = JSON.parse(responseText);
      console.log('[tiktok-debug] Parsed JSON successfully:', tokenData);
    } catch (parseError) {
      console.error('[tiktok-debug] JSON parse error:', parseError);
      console.log('[tiktok-debug] Response that failed to parse:', responseText);
      return res.status(500).json({ 
        error: 'Invalid response from TikTok',
        details: 'Response parsing failed',
        rawResponse: responseText
      });
    }

    // Return the parsed data or error
    if (!tokenResponse.ok || tokenData.error) {
      console.error('[tiktok-debug] Token exchange failed:', tokenData);
      return res.status(400).json({ 
        error: 'Token exchange failed',
        details: tokenData.error_description || tokenData.error || 'Unknown error',
        rawResponse: responseText
      });
    }

    console.log('[tiktok-debug] Token exchange successful!');
    return res.status(200).json({
      success: true,
      data: tokenData,
      rawResponse: responseText
    });

  } catch (error) {
    console.error('[tiktok-debug] Unexpected error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message
    });
  }
}
