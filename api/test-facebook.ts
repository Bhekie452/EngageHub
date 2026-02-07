import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Test environment variables
    const envStatus = {
      FACEBOOK_APP_ID: process.env.FACEBOOK_APP_ID ? 'Set' : 'Not set',
      FACEBOOK_APP_SECRET: process.env.FACEBOOK_APP_SECRET ? 'Set' : 'Not set',
      FACEBOOK_LONG_TERM_TOKEN: process.env.FACEBOOK_LONG_TERM_TOKEN ? 'Set' : 'Not set',
      NODE_ENV: process.env.NODE_ENV || 'Not set'
    };

    return res.status(200).json({
      success: true,
      message: 'Facebook API environment test',
      environment: envStatus,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Test endpoint error:', error);
    return res.status(500).json({ 
      error: 'Test endpoint failed',
      details: error.message 
    });
  }
}
