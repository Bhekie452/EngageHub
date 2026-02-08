import { VercelRequest, VercelResponse } from '@vercel/node';

export const config = {
  runtime: 'nodejs18.x',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Check all Facebook-related environment variables
    const envCheck = {
      FACEBOOK_APP_ID: process.env.FACEBOOK_APP_ID,
      FACEBOOK_APP_SECRET: process.env.FACEBOOK_APP_SECRET ? '***SET***' : 'NOT SET',
      FACEBOOK_LONG_TERM_TOKEN: process.env.FACEBOOK_LONG_TERM_TOKEN ? '***SET***' : 'NOT SET',
      NODE_ENV: process.env.NODE_ENV,
      ALL_ENV_VARS: Object.keys(process.env).filter(key => key.includes('FACEBOOK'))
    };

    return res.status(200).json({
      success: true,
      message: 'Environment variable check',
      environment: envCheck,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Environment check failed:', error);
    return res.status(500).json({ 
      error: 'Check failed',
      details: error.message 
    });
  }
}
