import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check environment variables
    const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
    const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;

    if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
      console.error('Missing Facebook environment variables:', {
        appId: !!FACEBOOK_APP_ID,
        appSecret: !!FACEBOOK_APP_SECRET
      });
      return res.status(500).json({ 
        error: 'Server configuration error',
        details: 'Facebook environment variables not set' 
      });
    }

    // Handle POST requests for token exchange
    if (req.method === 'POST') {
      const { code, redirectUri } = req.body;

      if (!code || !redirectUri) {
        return res.status(400).json({ 
          error: 'Missing required parameters',
          details: 'code and redirectUri are required' 
        });
      }

      console.log('Starting Facebook token exchange with:', {
        appId: FACEBOOK_APP_ID,
        hasSecret: !!FACEBOOK_APP_SECRET,
        codeLength: code.length,
        redirectUri
      });

      // Step 1: Exchange authorization code for short-term access token
      const tokenUrl = `https://graph.facebook.com/v21.0/oauth/access_token?` +
        `client_id=${FACEBOOK_APP_ID}` +
        `&client_secret=${FACEBOOK_APP_SECRET}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&code=${code}`;

      console.log('Exchanging code for access token...');
      const tokenResponse = await fetch(tokenUrl);
      const tokenData = await tokenResponse.json();

      if (tokenData.error) {
        throw new Error(`Token exchange failed: ${tokenData.error.message || tokenData.error.error_description}`);
      }

      const shortTermToken = tokenData.access_token;

      // Step 2: Exchange short-term token for long-term token (60 days)
      const longTermUrl = `https://graph.facebook.com/v21.0/oauth/access_token?` +
        `grant_type=fb_exchange_token` +
        `&client_id=${FACEBOOK_APP_ID}` +
        `&client_secret=${FACEBOOK_APP_SECRET}` +
        `&fb_exchange_token=${shortTermToken}`;

      console.log('Exchanging short-term token for long-term token...');
      const longTermResponse = await fetch(longTermUrl);
      const longTermData = await longTermResponse.json();

      if (longTermData.error) {
        throw new Error(`Long-term token exchange failed: ${longTermData.error.message || longTermData.error.error_description}`);
      }

      const longTermToken = longTermData.access_token;
      const expiresIn = longTermData.expires_in;

      // Step 3: Get Facebook Pages using the long-term token
      console.log('Fetching Facebook pages...');
      const pagesUrl = `https://graph.facebook.com/v21.0/me/accounts?` +
        `fields=id,name,access_token,instagram_business_account&` +
        `access_token=${longTermToken}`;

      const pagesResponse = await fetch(pagesUrl);
      const pagesData = await pagesResponse.json();

      if (pagesData.error) {
        throw new Error(`Failed to fetch pages: ${pagesData.error.message || pagesData.error.error_description}`);
      }

      console.log('Successfully retrieved Facebook pages:', pagesData.data?.length || 0);

      return res.status(200).json({
        success: true,
        accessToken: longTermToken,
        expiresIn: expiresIn,
        pages: pagesData.data || [],
        message: 'Token exchange completed successfully'
      });

    } else {
      // Handle GET requests for fetching pages with stored token
      const longTermToken = process.env.FACEBOOK_LONG_TERM_TOKEN;

      if (!longTermToken) {
        return res.status(400).json({ 
          error: 'No Facebook token available',
          details: 'FACEBOOK_LONG_TERM_TOKEN environment variable not set' 
        });
      }

      console.log('Fetching Facebook pages with stored token...');

      const pagesUrl = `https://graph.facebook.com/v21.0/me/accounts?` +
        `fields=id,name,access_token,instagram_business_account&` +
        `access_token=${longTermToken}`;

      const pagesResponse = await fetch(pagesUrl);
      const pagesData = await pagesResponse.json();

      if (pagesData.error) {
        throw new Error(`Failed to fetch pages: ${pagesData.error.message || pagesData.error.error_description}`);
      }

      return res.status(200).json({
        success: true,
        pages: pagesData.data || [],
        message: 'Pages retrieved successfully'
      });
    }

  } catch (error: any) {
    console.error('Facebook API error:', error);
    return res.status(500).json({ 
      error: 'Facebook API request failed',
      details: error.message 
    });
  }
}
