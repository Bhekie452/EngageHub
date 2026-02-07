import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = process.env.FACEBOOK_LONG_TERM_TOKEN;

    if (!token) {
      return res.status(400).json({ error: 'No Facebook token configured' });
    }

    console.log('Validating Facebook token:', {
      tokenLength: token.length,
      tokenPrefix: token.substring(0, 10),
      tokenFormat: /^[EAAC|EAAD]/.test(token)
    });

    // Test token with Facebook debug endpoint
    const debugResponse = await fetch(
      `https://graph.facebook.com/debug_token?` +
      `input_token=${token}&` +
      `access_token=${process.env.FACEBOOK_APP_ID}|${process.env.FACEBOOK_APP_SECRET}`
    );

    const debugData = await debugResponse.json();

    if (debugData.error) {
      return res.status(400).json({
        error: 'Invalid Facebook token',
        details: debugData.error,
        tokenInfo: {
          length: token.length,
          prefix: token.substring(0, 10),
          format: /^[EAAC|EAAD]/.test(token)
        }
      });
    }

    const tokenInfo = debugData.data;

    return res.status(200).json({
      success: true,
      tokenInfo: {
        appId: tokenInfo.app_id,
        isValid: tokenInfo.is_valid,
        expiresAt: tokenInfo.expires_at,
        scopes: tokenInfo.scopes,
        type: tokenInfo.type,
        application: tokenInfo.application
      },
      message: tokenInfo.is_valid ? 'Token is valid' : 'Token is invalid'
    });

  } catch (error: any) {
    console.error('Token validation failed:', error);
    return res.status(500).json({ 
      error: 'Validation failed',
      details: error.message 
    });
  }
}
