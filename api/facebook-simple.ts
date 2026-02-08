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
    // Check environment variables with detailed logging
    const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID || process.env.VITE_FACEBOOK_APP_ID;
    const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;

    console.log('📥 Facebook API Request:', {
      method: req.method,
      hasAppId: !!FACEBOOK_APP_ID,
      hasAppSecret: !!FACEBOOK_APP_SECRET,
      appIdLength: FACEBOOK_APP_ID?.length || 0,
      appSecretLength: FACEBOOK_APP_SECRET?.length || 0
    });

    if (!FACEBOOK_APP_ID) {
      console.error('❌ FACEBOOK_APP_ID not set in environment variables');
      return res.status(500).json({ 
        error: 'Server configuration error',
        details: 'FACEBOOK_APP_ID environment variable not set. Please add it to Vercel environment variables.',
        environment: {
          FACEBOOK_APP_ID: { exists: false, value: 'NOT SET' },
          FACEBOOK_APP_SECRET: { exists: !!FACEBOOK_APP_SECRET, value: FACEBOOK_APP_SECRET ? '***SET***' : 'NOT SET' }
        }
      });
    }

    if (!FACEBOOK_APP_SECRET) {
      console.error('❌ FACEBOOK_APP_SECRET not set in environment variables');
      return res.status(500).json({ 
        error: 'Server configuration error',
        details: 'FACEBOOK_APP_SECRET environment variable not set. Please add it to Vercel environment variables.',
        environment: {
          FACEBOOK_APP_ID: { exists: !!FACEBOOK_APP_ID, value: FACEBOOK_APP_ID ? FACEBOOK_APP_ID.substring(0, 8) + '...' : 'NOT SET' },
          FACEBOOK_APP_SECRET: { exists: false, value: 'NOT SET' }
        }
      });
    }

    console.log('✅ Environment variables validated');

    // Handle POST requests for token exchange
    if (req.method === 'POST') {
      const { code, redirectUri } = req.body;

      console.log('📋 Token exchange request:', {
        hasCode: !!code,
        codeLength: code?.length || 0,
        redirectUri,
        redirectUriLength: redirectUri?.length || 0
      });

      if (!code) {
        console.error('❌ Missing authorization code');
        return res.status(400).json({ 
          error: 'Missing required parameter',
          details: 'Authorization code is required for token exchange',
          received: { code, redirectUri }
        });
      }

      if (!redirectUri) {
        console.error('❌ Missing redirect URI');
        return res.status(400).json({ 
          error: 'Missing required parameter',
          details: 'Redirect URI is required for token exchange',
          received: { code, redirectUri }
        });
      }

      // CRITICAL: Use hardcoded redirect URI for security and consistency
      // Never trust redirectUri from frontend - prevents mismatch and security issues
      const cleanRedirectUri = "https://engage-hub-ten.vercel.app/auth/facebook/callback";
      console.log('📋 Using hardcoded secure redirect URI:', cleanRedirectUri);

      console.log('🔄 Step 1: Exchanging code for short-term access token...');
      
      // Step 1: Exchange authorization code for short-term access token
      const tokenUrl = `https://graph.facebook.com/v21.0/oauth/access_token?` +
        `client_id=${FACEBOOK_APP_ID}` +
        `&client_secret=${FACEBOOK_APP_SECRET}` +
        `&redirect_uri=${encodeURIComponent(cleanRedirectUri)}` +
        `&code=${code}`;

      console.log('📡 Requesting token from Facebook...');
      console.log('📋 Token URL length:', tokenUrl.length);

      const tokenResponse = await fetch(tokenUrl);
      const tokenData = await tokenResponse.json();

      console.log('📡 Facebook response status:', tokenResponse.status);
      console.log('📋 Facebook response data:', {
        hasAccessToken: !!tokenData.access_token,
        tokenLength: tokenData.access_token?.length || 0,
        expiresIn: tokenData.expires_in,
        hasError: !!tokenData.error,
        errorType: tokenData.error_type,
        errorMessage: tokenData.error?.message || tokenData.error?.error_description
      });

      if (tokenData.error) {
        const errorMessage = tokenData.error.message || tokenData.error.error_description || tokenData.error;
        console.error('❌ Token exchange failed:', errorMessage);
        return res.status(400).json({ 
          error: 'Token exchange failed',
          details: errorMessage,
          facebookError: tokenData.error,
          requestInfo: {
            redirectUri: cleanRedirectUri,
            codeLength: code.length
          }
        });
      }

      const shortTermToken = tokenData.access_token;
      console.log('✅ Short-term token obtained, length:', shortTermToken.length);

      // Step 2: Exchange short-term token for long-term token (60 days)
      console.log('🔄 Step 2: Exchanging short-term token for long-term token...');
      
      const longTermUrl = `https://graph.facebook.com/v21.0/oauth/access_token?` +
        `grant_type=fb_exchange_token` +
        `&client_id=${FACEBOOK_APP_ID}` +
        `&client_secret=${FACEBOOK_APP_SECRET}` +
        `&fb_exchange_token=${shortTermToken}`;

      const longTermResponse = await fetch(longTermUrl);
      const longTermData = await longTermResponse.json();

      console.log('📡 Long-term token response:', {
        status: longTermResponse.status,
        hasAccessToken: !!longTermData.access_token,
        tokenLength: longTermData.access_token?.length || 0,
        expiresIn: longTermData.expires_in,
        hasError: !!longTermData.error,
        errorMessage: longTermData.error?.message || longTermData.error?.error_description
      });

      if (longTermData.error) {
        const errorMessage = longTermData.error.message || longTermData.error.error_description || longTermData.error;
        console.error('❌ Long-term token exchange failed:', errorMessage);
        return res.status(400).json({ 
          error: 'Long-term token exchange failed',
          details: errorMessage,
          facebookError: longTermData.error
        });
      }

      const longTermToken = longTermData.access_token;
      const expiresIn = longTermData.expires_in;

      console.log('✅ Long-term token obtained:', {
        tokenLength: longTermToken.length,
        expiresIn: expiresIn,
        expiresInDays: Math.round(expiresIn / 86400)
      });

      // Step 3: Get Facebook Pages using the long-term token
      console.log('🔄 Step 3: Fetching Facebook pages...');
      
      const pagesUrl = `https://graph.facebook.com/v21.0/me/accounts?` +
        `fields=id,name,access_token,instagram_business_account&` +
        `access_token=${longTermToken}`;

      const pagesResponse = await fetch(pagesUrl);
      const pagesData = await pagesResponse.json();

      console.log('📡 Pages response:', {
        status: pagesResponse.status,
        hasData: !!pagesData.data,
        pageCount: pagesData.data?.length || 0,
        hasError: !!pagesData.error,
        errorMessage: pagesData.error?.message || pagesData.error?.error_description
      });

      if (pagesData.error) {
        const errorMessage = pagesData.error.message || pagesData.error.error_description || pagesData.error;
        console.error('❌ Failed to fetch pages:', errorMessage);
        return res.status(400).json({ 
          error: 'Failed to fetch Facebook pages',
          details: errorMessage,
          facebookError: pagesData.error
        });
      }

      const pages = pagesData.data || [];
      console.log('✅ Successfully retrieved Facebook pages:', pages.length);

      return res.status(200).json({
        success: true,
        accessToken: longTermToken,
        expiresIn: expiresIn,
        pages: pages,
        message: 'Token exchange completed successfully',
        debug: {
          tokenLength: longTermToken.length,
          expiresInDays: Math.round(expiresIn / 86400),
          pagesCount: pages.length,
          redirectUri: cleanRedirectUri
        }
      });

    } else {
      // Handle GET requests for fetching pages with stored token
      console.log('📋 GET request - fetching pages with stored token');
      
      const longTermToken = process.env.FACEBOOK_LONG_TERM_TOKEN;

      if (!longTermToken) {
        console.error('❌ No FACEBOOK_LONG_TERM_TOKEN available for GET request');
        return res.status(400).json({ 
          error: 'No Facebook token available',
          details: 'FACEBOOK_LONG_TERM_TOKEN environment variable not set for GET requests',
          recommendation: 'Use POST request with authorization code first, or set FACEBOOK_LONG_TERM_TOKEN environment variable'
        });
      }

      console.log('📋 Using stored long-term token, length:', longTermToken.length);

      const pagesUrl = `https://graph.facebook.com/v21.0/me/accounts?` +
        `fields=id,name,access_token,instagram_business_account&` +
        `access_token=${longTermToken}`;

      const pagesResponse = await fetch(pagesUrl);
      const pagesData = await pagesResponse.json();

      console.log('📡 GET pages response:', {
        status: pagesResponse.status,
        hasData: !!pagesData.data,
        pageCount: pagesData.data?.length || 0,
        hasError: !!pagesData.error,
        errorMessage: pagesData.error?.message || pagesData.error?.error_description
      });

      if (pagesData.error) {
        const errorMessage = pagesData.error.message || pagesData.error.error_description || pagesData.error;
        console.error('❌ Failed to fetch pages:', errorMessage);
        return res.status(400).json({ 
          error: 'Failed to fetch Facebook pages',
          details: errorMessage,
          facebookError: pagesData.error
        });
      }

      const pages = pagesData.data || [];
      console.log('✅ GET request successful - retrieved pages:', pages.length);

      return res.status(200).json({
        success: true,
        pages: pages,
        message: 'Pages retrieved successfully',
        debug: {
          tokenLength: longTermToken.length,
          pagesCount: pages.length
        }
      });
    }

  } catch (error: any) {
    console.error('❌ Facebook API error:', error);
    console.error('❌ Error stack:', error.stack);
    
    return res.status(500).json({ 
      error: 'Facebook API request failed',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
  }
}
