async function handleFacebookAuth(req, res) {
  const { code, state } = req.query;
  const clientId = process.env.FACEBOOK_APP_ID;
  const clientSecret = process.env.FACEBOOK_APP_SECRET;
  
  const redirectUri = process.env.NODE_ENV === 'production' 
    ? 'https://engage-hub.vercel.app/api/facebook-auth' 
    : 'http://localhost:3000/api/facebook-auth';

  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: 'Facebook credentials not configured' });
  }

  if (code) {
    console.log('[facebook-auth] Handling OAuth callback with code');
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
        console.error('[facebook-auth] Token exchange error:', tokenData.error);
        return res.status(400).json({ error: tokenData.error.message });
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
         console.error('[facebook-auth] Long-term token error:', longTermData.error);
        return res.status(400).json({ error: longTermData.error.message });
      }

      return res.status(200).json({
        success: true,
        accessToken: longTermData.access_token,
        expiresIn: longTermData.expires_in
      });

    } catch (error) {
      console.error('[facebook-auth] Failed:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  const scopes = 'public_profile,email,pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_content_publish';
  const authState = state || JSON.stringify({ workspaceId: req.query.workspaceId || 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9' });

  const facebookAuthUrl = new URL('https://www.facebook.com/v19.0/dialog/oauth');
  facebookAuthUrl.searchParams.set('client_id', clientId);
  facebookAuthUrl.searchParams.set('redirect_uri', redirectUri);
  facebookAuthUrl.searchParams.set('scope', scopes);
  facebookAuthUrl.searchParams.set('state', authState);
  facebookAuthUrl.searchParams.set('response_type', 'code');

  console.log('[facebook-auth] Initiating OAuth flow');
  return res.redirect(facebookAuthUrl.toString());
}

module.exports = handleFacebookAuth;
module.exports.default = handleFacebookAuth;
