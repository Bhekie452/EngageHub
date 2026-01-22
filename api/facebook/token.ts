import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Facebook OAuth Token Exchange Endpoint
 * 
 * This endpoint securely exchanges the Facebook OAuth authorization code
 * for an access token. The App Secret is kept secure on the server.
 * 
 * POST /api/facebook/token
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
    const APP_ID = process.env.VITE_FACEBOOK_APP_ID || '1621732999001688';
    const APP_SECRET = process.env.FACEBOOK_APP_SECRET;

    // Validate App Secret is configured
    if (!APP_SECRET) {
      console.error('Facebook App Secret not configured');
      return res.status(500).json({ 
        error: 'Server configuration error',
        message: 'Facebook App Secret is not configured. Please set FACEBOOK_APP_SECRET in Vercel environment variables.'
      });
    }

    // Exchange code for access token
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?` +
      `client_id=${APP_ID}&` +
      `client_secret=${APP_SECRET}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `code=${code}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const tokenData = await tokenResponse.json();

    // Handle Facebook API errors
    if (!tokenResponse.ok || tokenData.error) {
      console.error('Facebook token exchange error:', tokenData);
      return res.status(400).json({ 
        error: tokenData.error?.type || 'Token exchange failed',
        message: tokenData.error?.message || tokenData.error_description || 'Failed to exchange authorization code for access token',
        details: tokenData.error
      });
    }

    // Return success response
    return res.status(200).json({
      access_token: tokenData.access_token,
      expires_in: tokenData.expires_in,
      token_type: tokenData.token_type || 'Bearer',
    });

  } catch (error: any) {
    console.error('Facebook token exchange error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message || 'An unexpected error occurred during token exchange'
    });
  }
}
