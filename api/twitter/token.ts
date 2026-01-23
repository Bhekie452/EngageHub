import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Twitter/X OAuth Token Exchange Endpoint
 * 
 * This endpoint securely exchanges the Twitter OAuth authorization code
 * for an access token. The Client Secret is kept secure on the server.
 * 
 * POST /api/twitter/token
 * Body: { code: string, redirectUri: string, codeVerifier: string }
 */

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://engage-hub-ten.vercel.app',
];

// Helper function to set CORS headers
function setCORSHeaders(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin || '';
  
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (origin.includes('vercel.app')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    setCORSHeaders(req, res);
    return res.status(200).end();
  }

  // Set CORS headers for actual request
  setCORSHeaders(req, res);

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Only POST requests are allowed'
    });
  }

  try {
    const { code, redirectUri, codeVerifier } = req.body;

    // Validate required parameters
    if (!code) {
      return res.status(400).json({ 
        error: 'Missing code',
        message: 'Authorization code is required'
      });
    }

    if (!redirectUri) {
      return res.status(400).json({ 
        error: 'Missing redirectUri',
        message: 'Redirect URI is required'
      });
    }

    if (!codeVerifier) {
      return res.status(400).json({ 
        error: 'Missing codeVerifier',
        message: 'Code verifier is required for PKCE'
      });
    }

    // Get credentials from environment variables
    const CLIENT_ID = process.env.TWITTER_CLIENT_ID || process.env.VITE_TWITTER_CLIENT_ID;
    const CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET;

    // Validate credentials are configured
    if (!CLIENT_ID) {
      console.error('Twitter Client ID not configured');
      return res.status(500).json({ 
        error: 'Server configuration error',
        message: 'Twitter Client ID is not configured. Please set TWITTER_CLIENT_ID in Vercel environment variables.'
      });
    }

    if (!CLIENT_SECRET) {
      console.error('Twitter Client Secret not configured');
      return res.status(500).json({ 
        error: 'Server configuration error',
        message: 'Twitter Client Secret is not configured. Please set TWITTER_CLIENT_SECRET in Vercel environment variables (backend only).'
      });
    }

    // Debug logging
    console.log('Twitter token exchange request:', {
      hasCode: !!code,
      redirectUri: redirectUri,
      hasCodeVerifier: !!codeVerifier,
      clientIdPrefix: CLIENT_ID ? `${CLIENT_ID.substring(0, 4)}...` : 'NOT FOUND',
      hasClientSecret: !!CLIENT_SECRET
    });

    // Exchange code for access token using Twitter OAuth 2.0
    // Twitter requires Basic Auth with client_id:client_secret
    const basicAuth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
    
    const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${basicAuth}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier
      }),
    });

    const tokenData = await tokenResponse.json();

    // Handle Twitter API errors
    if (!tokenResponse.ok || tokenData.error) {
      console.error('Twitter token exchange error:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: tokenData.error,
        errorDescription: tokenData.error_description,
        redirectUri: redirectUri,
        clientIdPrefix: CLIENT_ID ? `${CLIENT_ID.substring(0, 4)}...` : 'NOT FOUND',
        fullError: tokenData
      });
      
      // Provide more helpful error messages
      let errorMessage = tokenData.error_description || tokenData.error || 'Failed to exchange authorization code for access token';
      
      if (tokenData.error === 'invalid_grant') {
        errorMessage = `Invalid authorization code. This usually means:\n\n` +
          `1. The code has expired (codes expire quickly)\n` +
          `2. The code was already used\n` +
          `3. The redirect URI doesn't match\n` +
          `4. The code verifier doesn't match\n\n` +
          `Please try connecting again.`;
      } else if (tokenData.error === 'invalid_client') {
        errorMessage = `Invalid client credentials. Please verify:\n\n` +
          `1. TWITTER_CLIENT_ID is correct\n` +
          `2. TWITTER_CLIENT_SECRET is correct\n` +
          `3. Both are set in Vercel environment variables`;
      }
      
      return res.status(400).json({ 
        error: tokenData.error || 'Token exchange failed',
        message: errorMessage,
        details: tokenData
      });
    }

    // Return success response
    return res.status(200).json({
      access_token: tokenData.access_token,
      expires_in: tokenData.expires_in,
      refresh_token: tokenData.refresh_token,
      token_type: tokenData.token_type || 'Bearer',
      scope: tokenData.scope
    });

  } catch (error: any) {
    console.error('Twitter token exchange error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message || 'An unexpected error occurred during token exchange'
    });
  }
}
