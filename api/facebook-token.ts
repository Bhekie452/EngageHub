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

  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Authorization code required' });
    }

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
