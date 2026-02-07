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
    // TEMPORARY: Use hardcoded token for immediate testing
    const longTermToken = 'EAAd7mnK3tIsBQgdv6bIe1bSXkcKRmwZCMrHYMCurxSq27sZAOWStvd374oUeLHBt98ZCYXULLjbUlMwGXI8270nh5r1OvH9lVOGyarLJXlgiji2b457XAbnOt3sBOaz76YLydD7SDDeX95LXymv9AWOQj2VZA8MZCB4s8e5OUqFWU3ouh7LF0vJLR2EotCeui';

    console.log('Using hardcoded Facebook token for immediate testing');

    // Get Facebook Pages using hardcoded token
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
      message: 'Using hardcoded Facebook token',
      pages: pagesData.data || [],
      note: 'This is a temporary solution - add FACEBOOK_LONG_TERM_TOKEN to Vercel environment variables'
    });

  } catch (error: any) {
    console.error('Facebook pages fetch failed:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch Facebook pages',
      details: error.message 
    });
  }
}
