import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Use existing long-term token directly for now
    const longTermToken = process.env.FACEBOOK_LONG_TERM_TOKEN;

    if (!longTermToken) {
      return res.status(500).json({ 
        error: 'Facebook long-term token not configured',
        details: 'FACEBOOK_LONG_TERM_TOKEN environment variable not set' 
      });
    }

    console.log('Using existing long-term token for Facebook pages request');

    // Get Facebook Pages using existing long-term token
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v19.0/me/accounts?` +
      `fields=id,name,access_token,instagram_business_account&` +
      `access_token=${longTermToken}`
    );

    const pagesData = await pagesResponse.json();

    if (pagesData.error) {
      throw new Error(pagesData.error.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Using existing long-term token',
      pages: pagesData.data || []
    });

  } catch (error: any) {
    console.error('Facebook pages fetch failed:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch Facebook pages',
      details: error.message 
    });
  }
}
