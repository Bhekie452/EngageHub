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
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
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
    const CLIENT_ID = process.env.VITE_LINKEDIN_CLIENT_ID;
    const CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;

    // Validate credentials are configured
    if (!CLIENT_ID) {
      console.error('LinkedIn Client ID not configured');
      return res.status(500).json({ 
        error: 'Server configuration error',
        message: 'LinkedIn Client ID is not configured. Please set VITE_LINKEDIN_CLIENT_ID in environment variables.'
      });
    }

    if (!CLIENT_SECRET) {
      console.error('LinkedIn Client Secret not configured');
      return res.status(500).json({ 
        error: 'Server configuration error',
        message: 'LinkedIn Client Secret is not configured. Please set LINKEDIN_CLIENT_SECRET in Vercel environment variables.'
      });
    }

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
      console.error('LinkedIn token exchange error:', tokenData);
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
