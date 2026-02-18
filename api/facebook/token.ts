import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
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

  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Authorization code required' });
  }

  console.log('[facebook-token] Exchanging code for token');

  const clientId = process.env.FACEBOOK_APP_ID;
  const clientSecret = process.env.FACEBOOK_APP_SECRET;
  const redirectUri = 'https://engage-hub-ten.vercel.app/auth/facebook/callback';

  if (!clientId || !clientSecret) {
    console.error('[facebook-token] Missing credentials');
    return res.status(500).json({ 
      error: 'Facebook credentials not configured',
      details: 'FACEBOOK_APP_ID or FACEBOOK_APP_SECRET not set'
    });
  }

  try {
    // Exchange authorization code for access token
    const tokenUrl = `https://graph.facebook.com/v19.0/oauth/access_token?` +
      `client_id=${clientId}&` +
      `client_secret=${clientSecret}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `code=${code}`;

    console.log('[facebook-token] Requesting token from:', tokenUrl.replace(clientSecret, 'REDACTED'));

    const tokenResponse = await fetch(tokenUrl);
    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error('[facebook-token] Token exchange error:', tokenData.error);
      throw new Error(tokenData.error.message || 'Token exchange failed');
    }

    const accessToken = tokenData.access_token;
    const expiresIn = tokenData.expires_in;

    console.log('[facebook-token] Got access token, exchanging for long-lived token');

    // Exchange for long-lived token
    const longTermUrl = `https://graph.facebook.com/v19.0/oauth/access_token?` +
      `grant_type=fb_exchange_token&` +
      `client_id=${clientId}&` +
      `client_secret=${clientSecret}&` +
      `fb_exchange_token=${accessToken}`;

    const longTermResponse = await fetch(longTermUrl);
    const longTermData = await longTermResponse.json();

    if (longTermData.error) {
      console.error('[facebook-token] Long-term token error:', longTermData.error);
      // Continue with short-lived token
    }

    const finalToken = longTermData.access_token || accessToken;
    const finalExpiresIn = longTermData.expires_in || expiresIn;

    console.log('[facebook-token] Got long-lived token');

    // Get user profile
    const profileResponse = await fetch(
      `https://graph.facebook.com/v19.0/me?fields=id,name,email&access_token=${finalToken}`
    );
    const profile = await profileResponse.json();

    console.log('[facebook-token] Got user profile:', profile.name);

    // Get Facebook Pages
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v19.0/me/accounts?` +
      `fields=id,name,access_token,instagram_business_account&` +
      `access_token=${finalToken}`
    );
    const pagesData = await pagesResponse.json();

    console.log('[facebook-token] Got pages:', pagesData.data?.length || 0);

    return res.status(200).json({
      success: true,
      accessToken: finalToken,
      expiresIn: finalExpiresIn,
      profile,
      pages: pagesData.data || []
    });

  } catch (error: any) {
    console.error('[facebook-token] Error:', error);
    return res.status(500).json({ 
      error: 'Token exchange failed',
      details: error.message 
    });
  }
}
