import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * LinkedIn OAuth Token Exchange Endpoint
 * 
 * This endpoint securely exchanges the LinkedIn OAuth authorization code
 * for an access token. The Client Secret is kept secure on the server.
 * 
 * POST /api/linkedin/token
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
  
  // Always set CORS headers - be permissive for development
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
    // Allow any localhost for development
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (origin.includes('vercel.app')) {
    // Allow any Vercel preview deployments
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (origin) {
    // For development, allow any origin (be careful in production)
    // In production, you might want to restrict this
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
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
    // Note: VITE_ prefix variables are only available in frontend build, not in serverless functions
    // So we check both VITE_LINKEDIN_CLIENT_ID (for frontend) and LINKEDIN_CLIENT_ID (for backend)
    const CLIENT_ID = process.env.LINKEDIN_CLIENT_ID || process.env.VITE_LINKEDIN_CLIENT_ID;
    const CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;

    // Validate credentials are configured
    if (!CLIENT_ID) {
      console.error('LinkedIn Client ID not configured');
      return res.status(500).json({ 
        error: 'Server configuration error',
        message: 'LinkedIn Client ID is not configured. Please set LINKEDIN_CLIENT_ID (backend) or VITE_LINKEDIN_CLIENT_ID (frontend) in Vercel environment variables.'
      });
    }

    if (!CLIENT_SECRET) {
      console.error('LinkedIn Client Secret not configured');
      return res.status(500).json({ 
        error: 'Server configuration error',
        message: 'LinkedIn Client Secret is not configured. Please set LINKEDIN_CLIENT_SECRET in Vercel environment variables (backend only).'
      });
    }

    // Debug logging (remove sensitive data in production)
    console.log('LinkedIn token exchange request:', {
      hasCode: !!code,
      redirectUri: redirectUri,
      clientIdPrefix: CLIENT_ID ? `${CLIENT_ID.substring(0, 4)}...` : 'NOT FOUND',
      hasClientSecret: !!CLIENT_SECRET
    });

    // Exchange code for access token
    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
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

    // Handle LinkedIn API errors
    if (!tokenResponse.ok || tokenData.error) {
      console.error('LinkedIn token exchange error:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: tokenData.error,
        errorDescription: tokenData.error_description,
        redirectUri: redirectUri,
        clientIdPrefix: CLIENT_ID ? `${CLIENT_ID.substring(0, 4)}...` : 'NOT FOUND'
      });
      return res.status(400).json({ 
        error: tokenData.error || 'Token exchange failed',
        message: tokenData.error_description || tokenData.error || 'Failed to exchange authorization code for access token',
        details: tokenData
      });
    }

    // Return success response
    return res.status(200).json({
      access_token: tokenData.access_token,
      expires_in: tokenData.expires_in,
      refresh_token: tokenData.refresh_token,
      token_type: tokenData.token_type || 'Bearer',
    });

  } catch (error: any) {
    console.error('LinkedIn token exchange error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message || 'An unexpected error occurred during token exchange'
    });
  }
}
