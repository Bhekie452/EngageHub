import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { action } = req.query;
  
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (action === 'auth') {
      return handleFacebookAuth(req, res);
    } else if (action === 'token') {
      return handleFacebookToken(req, res);
    } else if (action === 'simple') {
      return handleFacebookSimple(req, res);
    } else if (action === 'callback') {
      return handleFacebookCallback(req, res);
    }
    
    return res.status(404).json({ error: 'Action not found' });
  } catch (error: any) {
    console.error('Facebook API error:', error);
    return res.status(500).json({ error: error.message });
  }
}

async function handleFacebookAuth(req: VercelRequest, res: VercelResponse) {
  const { workspaceId } = req.query;
  
  const clientId = process.env.FACEBOOK_APP_ID;
  const clientSecret = process.env.FACEBOOK_APP_SECRET;
  const redirectUri = 'https://engage-hub-ten.vercel.app/#/pages/auth/facebook/callback';
  
  if (!clientId || !clientSecret) {
    return res.status(500).json({ 
      error: 'Facebook credentials not configured',
      details: 'FACEBOOK_APP_ID or FACEBOOK_APP_SECRET not set'
    });
  }
  
  const scopes = 'public_profile,email,pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_content_publish';
  const state = JSON.stringify({ workspaceId: workspaceId || 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9' });
  
  const facebookAuthUrl = new URL('https://www.facebook.com/v19.0/dialog/oauth');
  facebookAuthUrl.searchParams.set('client_id', clientId);
  facebookAuthUrl.searchParams.set('redirect_uri', redirectUri);
  facebookAuthUrl.searchParams.set('scope', scopes);
  facebookAuthUrl.searchParams.set('state', state);
  facebookAuthUrl.searchParams.set('response_type', 'code');
  
  console.log('[facebook-auth] Redirecting to Facebook OAuth');
  
  return res.redirect(facebookAuthUrl.toString());
}

async function handleFacebookToken(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Authorization code required' });
  }

  const clientId = process.env.FACEBOOK_APP_ID;
  const clientSecret = process.env.FACEBOOK_APP_SECRET;
  const redirectUri = 'https://engage-hub-ten.vercel.app/#/pages/auth/facebook/callback';

  try {
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?` +
      `client_id=${clientId}&` +
      `client_secret=${clientSecret}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `code=${code}`
    );

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      throw new Error(tokenData.error.message);
    }

    const longTermResponse = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?` +
      `grant_type=fb_exchange_token&` +
      `client_id=${clientId}&` +
      `client_secret=${clientSecret}&` +
      `fb_exchange_token=${tokenData.access_token}`
    );

    const longTermData = await longTermResponse.json();

    if (longTermData.error) {
      throw new Error(longTermData.error.message);
    }

    const pagesResponse = await fetch(
      `https://graph.facebook.com/v19.0/me/accounts?` +
      `fields=id,name,access_token,instagram_business_account&` +
      `access_token=${longTermData.access_token}&` +
      `limit=100`
    );

    const pagesData = await pagesResponse.json();

    const profileResponse = await fetch(
      `https://graph.facebook.com/v19.0/me?` +
      `fields=id,name,email&` +
      `access_token=${longTermData.access_token}`
    );

    const profileData = await profileResponse.json();

    return res.status(200).json({
      success: true,
      accessToken: longTermData.access_token,
      expiresIn: longTermData.expires_in,
      user: profileData,
      pages: pagesData.data || []
    });

  } catch (error: any) {
    console.error('Facebook token exchange failed:', error);
    return res.status(500).json({ error: error.message });
  }
}

async function handleFacebookCallback(req: VercelRequest, res: VercelResponse) {
  const { code, state, error, error_description } = req.query;

  if (error) {
    console.error('[facebook-callback] Error:', error, error_description);
    return res.redirect(`/social-media?error=${encodeURIComponent(error as string)}`);
  }

  if (!code) {
    return res.redirect('/social-media?error=no_code');
  }

  let workspaceId = 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9';
  try {
    if (state) {
      const stateData = JSON.parse(state as string);
      workspaceId = stateData.workspaceId || workspaceId;
    }
  } catch (e) {
    console.log('[facebook-callback] Could not parse state');
  }

  console.log('[facebook-callback] Redirecting with code');
  return res.redirect(`/#/pages/auth/facebook/callback?facebook_code=${code}&workspaceId=${workspaceId}`);
}

// Handler for action=simple - same as token but GET method with query params
async function handleFacebookSimple(req: VercelRequest, res: VercelResponse) {
  const { code: queryCode, workspaceId: wsId, origin } = req.query;
  // Support both query params and body
  const code = (queryCode as string) || (req.body && req.body.code);
  const workspaceId = ((wsId as string) || (req.body && req.body.workspaceId)) || 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9';
  
  console.log('[handleFacebookSimple] Received code, workspaceId:', workspaceId);
  
  if (!code) {
    return res.status(400).json({ error: 'Authorization code required' });
  }

  const clientId = process.env.FACEBOOK_APP_ID;
  const clientSecret = process.env.FACEBOOK_APP_SECRET;
  const redirectUri = 'https://engage-hub-ten.vercel.app/#/pages/auth/facebook/callback';

  try {
    // Exchange code for access token
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?` +
      `client_id=${clientId}&` +
      `client_secret=${clientSecret}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `code=${code}`
    );

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      throw new Error(tokenData.error.message);
    }

    // Get long-lived token
    const longTermResponse = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?` +
      `grant_type=fb_exchange_token&` +
      `client_id=${clientId}&` +
      `client_secret=${clientSecret}&` +
      `fb_exchange_token=${tokenData.access_token}`
    );

    const longTermData = await longTermResponse.json();

    if (longTermData.error) {
      throw new Error(longTermData.error.message);
    }

    // Get user's pages
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v19.0/me/accounts?` +
      `fields=id,name,access_token,instagram_business_account&` +
      `access_token=${longTermData.access_token}&` +
      `limit=100`
    );

    const pagesData = await pagesResponse.json();

    // Get user profile
    const profileResponse = await fetch(
      `https://graph.facebook.com/v19.0/me?` +
      `fields=id,name,email&` +
      `access_token=${longTermData.access_token}`
    );

    const profileData = await profileResponse.json();

    console.log('[handleFacebookSimple] Success - returning tokens');
    console.log('[handleFacebookSimple] Pages:', JSON.stringify(pagesData));
    console.log('[handleFacebookSimple] User:', JSON.stringify(profileData));
    
    return res.status(200).json({
      success: true,
      accessToken: longTermData.access_token,
      expiresIn: longTermData.expires_in,
      user: profileData,
      pages: pagesData.data || [],
      pagesCount: pagesData.data ? pagesData.data.length : 0,
      workspaceId: workspaceId,
      debug: {
        permissions: longTermData.scope || 'N/A',
        pagesSummary: pagesData.summary || null
      }
    });

  } catch (error: any) {
    console.error('[handleFacebookSimple] Facebook token exchange failed:', error);
    return res.status(500).json({ error: error.message });
  }
}
