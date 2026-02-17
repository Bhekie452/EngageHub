// TikTok connection test endpoint
import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const result: any = {
    timestamp: new Date().toISOString(),
    environment: {
      TIKTOK_CLIENT_KEY: process.env.TIKTOK_CLIENT_KEY ? 'SET' : 'NOT SET',
      TIKTOK_CLIENT_SECRET: process.env.TIKTOK_CLIENT_SECRET ? 'SET' : 'NOT SET',
      TIKTOK_REDIRECT_URI: process.env.TIKTOK_REDIRECT_URI || 'NOT SET (will use default)'
    }
  };

  // Try to get TikTok API key info
  if (process.env.TIKTOK_CLIENT_KEY && process.env.TIKTOK_CLIENT_SECRET) {
    try {
      // Test TikTok OAuth endpoint with invalid code to see error message
      const testResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_key: process.env.TIKTOK_CLIENT_KEY,
          client_secret: process.env.TIKTOK_CLIENT_SECRET,
          code: 'test_code',
          grant_type: 'authorization_code',
          redirect_uri: 'https://engage-hub-ten.vercel.app'
        })
      });

      const responseText = await testResponse.text();
      
      result.test = {
        status: testResponse.status,
        response: responseText.substring(0, 200)
      };
    } catch (error: any) {
      result.test = {
        error: error.message
      };
    }
  }

  return res.status(200).json(result);
}
