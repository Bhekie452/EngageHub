import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * YouTube/Google OAuth Token Exchange Endpoint
 * 
 * This endpoint securely exchanges the Google OAuth authorization code
 * for an access token. The Client Secret is kept secure on the server.
 * 
 * POST /api/youtube/token
 * Body: { code: string, redirectUri: string }
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
    const { code, redirectUri } = req.body;

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

    // Get credentials from environment variables
    const CLIENT_ID = process.env.YOUTUBE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || process.env.VITE_YOUTUBE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
    const CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;

    // Validate credentials are configured
    if (!CLIENT_ID) {
      console.error('YouTube/Google Client ID not configured');
      return res.status(500).json({ 
        error: 'Server configuration error',
        message: 'YouTube/Google Client ID is not configured. Please set YOUTUBE_CLIENT_ID or GOOGLE_CLIENT_ID in Vercel environment variables.'
      });
    }

    if (!CLIENT_SECRET) {
      console.error('YouTube/Google Client Secret not configured');
      return res.status(500).json({ 
        error: 'Server configuration error',
        message: 'YouTube/Google Client Secret is not configured. Please set YOUTUBE_CLIENT_SECRET or GOOGLE_CLIENT_SECRET in Vercel environment variables (backend only).'
      });
    }

    // Debug logging
    console.log('YouTube token exchange request:', {
      hasCode: !!code,
      redirectUri: redirectUri,
      clientIdPrefix: CLIENT_ID ? `${CLIENT_ID.substring(0, 4)}...` : 'NOT FOUND',
      hasClientSecret: !!CLIENT_SECRET
    });

    // Exchange code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      }),
    });

    const tokenData = await tokenResponse.json();

    // Handle Google API errors
    if (!tokenResponse.ok || tokenData.error) {
      console.error('YouTube token exchange error:', {
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
      
      if (tokenData.error === 'redirect_uri_mismatch') {
        errorMessage = `Redirect URI mismatch!\n\n` +
          `The redirect URI used (${redirectUri}) does not match what's registered in Google Cloud Console.\n\n` +
          `Please verify in Google Cloud Console → OAuth Client → Authorized redirect URIs:\n` +
          `- http://localhost:3000 (for local development)\n` +
          `- https://engage-hub-ten.vercel.app (for production)\n\n` +
          `Make sure there are NO trailing slashes and NO paths - just the root URL.`;
      } else if (tokenData.error === 'invalid_grant') {
        errorMessage = `Invalid authorization code. This usually means:\n\n` +
          `1. The code has expired (codes expire quickly)\n` +
          `2. The code was already used\n` +
          `3. The redirect URI doesn't match\n\n` +
          `Please try connecting again.`;
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
      id_token: tokenData.id_token,
    });

  } catch (error: any) {
    console.error('YouTube token exchange error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message || 'An unexpected error occurred during token exchange'
    });
  }
}
