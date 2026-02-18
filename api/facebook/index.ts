import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { action, workspaceId } = req.query;
  
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  console.log('[facebook-api] Action:', action, 'Workspace:', workspaceId);

  try {
    if (action === 'auth') {
      return await handleFacebookAuth(req, res);
    }

    if (action === 'connections') {
      return await handleFacebookConnections(req, res);
    }

    return res.status(404).json({ error: 'Action not found' });
  } catch (error: any) {
    console.error('[facebook-api] Error:', error);
    return res.status(500).json({ error: error.message });
  }
}

async function handleFacebookAuth(req: VercelRequest, res: VercelResponse) {
  const { workspaceId } = req.query;
  
  const clientId = process.env.FACEBOOK_APP_ID;
  const clientSecret = process.env.FACEBOOK_APP_SECRET;
  const redirectUri = 'https://engage-hub-ten.vercel.app/auth/facebook/callback';
  
  if (!clientId || !clientSecret) {
    console.error('[facebook-auth] Missing credentials:', { clientId: !!clientId, clientSecret: !!clientSecret });
    return res.status(500).json({ 
      error: 'Facebook credentials not configured',
      details: 'FACEBOOK_APP_ID or FACEBOOK_APP_SECRET not set in environment variables'
    });
  }
  
  // Build Facebook OAuth URL
  const scopes = 'public_profile,email,pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_content_publish';
  const state = JSON.stringify({ workspaceId: workspaceId || 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9' });
  
  const facebookAuthUrl = new URL('https://www.facebook.com/v19.0/dialog/oauth');
  facebookAuthUrl.searchParams.set('client_id', clientId);
  facebookAuthUrl.searchParams.set('redirect_uri', redirectUri);
  facebookAuthUrl.searchParams.set('scope', scopes);
  facebookAuthUrl.searchParams.set('state', state);
  facebookAuthUrl.searchParams.set('response_type', 'code');
  
  console.log('[facebook-auth] Redirecting to Facebook OAuth');
  console.log('[facebook-auth] Redirect URI:', redirectUri);
  console.log('[facebook-auth] Client ID:', clientId);
  
  // Redirect to Facebook
  return res.redirect(facebookAuthUrl.toString());
}

async function handleFacebookConnections(req: VercelRequest, res: VercelResponse) {
  const { workspaceId } = req.query;
  
  if (!workspaceId) {
    return res.status(400).json({ error: 'Workspace ID required' });
  }
  
  // For now, return empty connections - the frontend handles this via SocialMedia.tsx
  return res.status(200).json({
    success: true,
    connections: []
  });
}
