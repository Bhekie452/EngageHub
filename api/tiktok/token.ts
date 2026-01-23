import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * TikTok OAuth Token Exchange Endpoint
 * 
 * This endpoint securely exchanges the TikTok OAuth authorization code
 * for an access token. The Client Secret is kept secure on the server.
 * 
 * POST /api/tiktok/token
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
    const CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY || process.env.VITE_TIKTOK_CLIENT_KEY;
    const CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET;

    // Validate credentials are configured
    if (!CLIENT_KEY) {
      console.error('TikTok Client Key not configured');
      return res.status(500).json({ 
        error: 'Server configuration error',
        message: 'TikTok Client Key is not configured. Please set TIKTOK_CLIENT_KEY in Vercel environment variables.'
      });
    }

    if (!CLIENT_SECRET) {
      console.error('TikTok Client Secret not configured');
      return res.status(500).json({ 
        error: 'Server configuration error',
        message: 'TikTok Client Secret is not configured. Please set TIKTOK_CLIENT_SECRET in Vercel environment variables (backend only).'
      });
    }

    // Debug logging
    console.log('TikTok token exchange request:', {
      hasCode: !!code,
      codePrefix: code ? `${code.substring(0, 20)}...` : 'MISSING',
      redirectUri: redirectUri,
      hasCodeVerifier: !!codeVerifier,
      codeVerifierPrefix: codeVerifier ? `${codeVerifier.substring(0, 10)}...` : 'MISSING',
      clientKeyPrefix: CLIENT_KEY ? `${CLIENT_KEY.substring(0, 4)}...` : 'NOT FOUND',
      hasClientSecret: !!CLIENT_SECRET
    });

    // Exchange code for access token using TikTok OAuth 2.0
    // TikTok requires POST with client_key and client_secret in body
    const tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_key: CLIENT_KEY,
        client_secret: CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier
      }),
    });

    const tokenData = await tokenResponse.json();

    // Handle TikTok API errors
    if (!tokenResponse.ok || tokenData.error) {
      console.error('TikTok token exchange error:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: tokenData.error,
        errorDescription: tokenData.error_description || tokenData.description,
        errorDetails: tokenData.error_description || tokenData.description || tokenData,
        redirectUri: redirectUri,
        codePrefix: code ? `${code.substring(0, 20)}...` : 'MISSING',
        codeVerifierPrefix: codeVerifier ? `${codeVerifier.substring(0, 10)}...` : 'MISSING',
        clientKeyPrefix: CLIENT_KEY ? `${CLIENT_KEY.substring(0, 4)}...` : 'NOT FOUND',
        fullError: tokenData
      });
      
      // Provide more helpful error messages
      let errorMessage = tokenData.error_description || tokenData.description || tokenData.error || 'Failed to exchange authorization code for access token';
      
      if (tokenData.error === 'invalid_grant' || tokenData.error_code === 'invalid_grant') {
        errorMessage = `Invalid authorization code. This usually means:\n\n` +
          `1. The code has expired (codes expire quickly)\n` +
          `2. The code was already used\n` +
          `3. The redirect URI doesn't match\n` +
          `4. The code verifier doesn't match\n\n` +
          `Please try connecting again.`;
      } else if (tokenData.error === 'invalid_client' || tokenData.error_code === 'invalid_client') {
        errorMessage = `Invalid client credentials. Please verify:\n\n` +
          `1. TIKTOK_CLIENT_KEY is correct\n` +
          `2. TIKTOK_CLIENT_SECRET is correct\n` +
          `3. Both are set in Vercel environment variables`;
      }
      
      return res.status(400).json({ 
        error: tokenData.error || tokenData.error_code || 'Token exchange failed',
        message: errorMessage,
        details: tokenData
      });
    }

    // Return success response
    return res.status(200).json({
      access_token: tokenData.data?.access_token || tokenData.access_token,
      expires_in: tokenData.data?.expires_in || tokenData.expires_in,
      refresh_token: tokenData.data?.refresh_token || tokenData.refresh_token,
      token_type: tokenData.data?.token_type || tokenData.token_type || 'Bearer',
      scope: tokenData.data?.scope || tokenData.scope
    });

  } catch (error: any) {
    console.error('TikTok token exchange error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message || 'An unexpected error occurred during token exchange'
    });
  }
}
