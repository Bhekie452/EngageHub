// Simple TikTok token exchange test endpoint
import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  console.log('=== TIKTOK TOKEN EXCHANGE TEST ===');
  console.log('TIKTOK_CLIENT_KEY:', process.env.TIKTOK_CLIENT_KEY ? 'SET' : 'NOT SET');
  console.log('TIKTOK_CLIENT_SECRET:', process.env.TIKTOK_CLIENT_SECRET ? 'SET' : 'NOT SET');
  console.log('TIKTOK_REDIRECT_URI:', process.env.TIKTOK_REDIRECT_URI || 'NOT SET');

  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;

  if (!clientKey || !clientSecret) {
    return res.status(400).json({
      error: 'Missing environment variables',
      clientKeySet: !!clientKey,
      clientSecretSet: !!clientSecret,
      message: 'Please set TIKTOK_CLIENT_KEY and TIKTOK_CLIENT_SECRET in Vercel'
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Environment variables are configured correctly',
    clientKey: clientKey.substring(0, 5) + '...'
  });
}
