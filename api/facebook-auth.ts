import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const ALLOWED_ORIGINS = [
  'https://engage-hub-ten.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
];

function handleCors(req: VercelRequest, res: VercelResponse): boolean {
  const origin = req.headers.origin || '';

  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (process.env.NODE_ENV !== 'production') {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }

  return false;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  const { action } = req.query;

  try {
    if (action === 'auth') {
      return handleFacebookAuth(req, res);
    } else if (action === 'token') {
      return handleFacebookToken(req, res);
    } else if (action === 'simple') {
      return handleFacebookSimple(req, res);
    } else if (action === 'connect-page') {
      return handleConnectPage(req, res);
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
  const redirectUri = 'https://engage-hub-ten.vercel.app/auth/facebook/callback';
  
  if (!clientId || !clientSecret) {
    return res.status(500).json({ 
      error: 'Facebook credentials not configured',
      details: 'FACEBOOK_APP_ID or FACEBOOK_APP_SECRET not set'
    });
  }
  
  const scopes = 'public_profile,email,pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_content_publish';
  const state = JSON.stringify({ workspaceId: workspaceId || 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9' });
  
  const facebookAuthUrl = new URL('https://www.facebook.com/v21.0/dialog/oauth');
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
  const redirectUri = 'https://engage-hub-ten.vercel.app/auth/facebook/callback';

  try {
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?` +
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
      `https://graph.facebook.com/v21.0/oauth/access_token?` +
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
      `https://graph.facebook.com/v21.0/me/accounts?` +
      `fields=id,name,access_token,instagram_business_account&` +
      `access_token=${longTermData.access_token}&` +
      `limit=100`
    );

    const pagesData = await pagesResponse.json();

    // Map pages to include pageId for frontend compatibility
    let mappedPages = (pagesData.data || []).map((page: any) => ({
      pageId: page.id || page.page_id,
      pageName: page.name, // Add pageName for frontend compatibility
      name: page.name,
      accessToken: page.access_token,
      instagramBusinessAccount: page.instagram_business_account
    }));

    // For pages that include an instagram_business_account, attempt to fetch the Instagram username
    // so the frontend can display which Instagram profile is linked. This is best-effort and won't
    // fail the whole flow if a lookup fails.
    for (const p of mappedPages) {
      try {
        const ig = p.instagramBusinessAccount;
        const igId = ig?.id || ig?.instagram_business_account_id || null;
        if (igId && p.accessToken) {
          const igResp = await fetch(`https://graph.facebook.com/v21.0/${encodeURIComponent(igId)}?fields=id,username,profile_picture_url&access_token=${encodeURIComponent(p.accessToken)}`);
          const igData = await igResp.json();
          if (igData && !igData.error) {
            p.instagramBusinessAccountId = igId;
            p.instagramBusinessAccountUsername = igData.username;
            p.instagramUsername = igData.username;
            p.instagramProfilePicture = igData.profile_picture_url || null;
          }
        }
      } catch (e) {
        // ignore per-page errors
        console.warn('[handleFacebookSimple] Failed to fetch IG username for page', p.pageId, e);
      }
    }

    const profileResponse = await fetch(
      `https://graph.facebook.com/v21.0/me?` +
      `fields=id,name,email&` +
      `access_token=${longTermData.access_token}`
    );

    const profileData = await profileResponse.json();

    return res.status(200).json({
      success: true,
      accessToken: longTermData.access_token,
      expiresIn: longTermData.expires_in,
      user: profileData,
      pages: mappedPages
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
  return res.redirect(`/auth/facebook/callback?facebook_code=${code}&workspaceId=${workspaceId}`);
}

// Handler for action=connect-page - save page connection to database
async function handleConnectPage(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { pageId, pageAccessToken, pageName, workspaceId, instagramBusinessAccountId } = req.body;

  // Use accessToken if pageAccessToken is not provided
  const accessToken = pageAccessToken || req.body.accessToken;
  const igAccountId = instagramBusinessAccountId || (req.body.instagramBusinessAccount?.id);

  if (!pageId || !workspaceId) {
    return res.status(400).json({ error: 'pageId and workspaceId are required' });
  }

  console.log('[handleConnectPage] Connecting page:', pageName, 'ID:', pageId);

  // Initialize Supabase client
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Database configuration missing' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Try to get workspace owner, but don't fail if not found
    let ownerId = null;
    try {
      const { data: workspaceData } = await supabase
        .from('workspaces')
        .select('owner_id')
        .eq('id', workspaceId)
        .single();
      ownerId = workspaceData?.owner_id;
    } catch (e) {
      console.log('[handleConnectPage] Could not get workspace owner:', e);
    }

    // Save to social_accounts table
    const { data, error } = await supabase
      .from('social_accounts')
      .upsert(
        {
          workspace_id: workspaceId,
          connected_by: ownerId,
          platform: 'facebook',
          account_type: 'page',
          account_id: pageId,
          username: pageName,
          display_name: pageName,
          access_token: accessToken,
          platform_data: {
            instagram_business_account: igAccountId
          },
          is_active: true,
          connection_status: 'connected',
          last_sync_at: new Date().toISOString(),
        },
        { onConflict: 'workspace_id,platform,account_id' }
      )
      .select()
      .single();

    if (error) {
      console.error('[handleConnectPage] Database error:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log('[handleConnectPage] Page connected successfully:', data);

    // If page has Instagram Business Account, also save/reactivate Instagram
    if (igAccountId && accessToken) {
      console.log('[handleConnectPage] Page has Instagram Business Account:', igAccountId);
      try {
        // Fetch Instagram account details
        const igResponse = await fetch(
          `https://graph.facebook.com/v21.0/${encodeURIComponent(igAccountId)}?` +
          `fields=id,username,profile_picture_url&` +
          `access_token=${encodeURIComponent(accessToken)}`
        );
        const igData = await igResponse.json();
        
        if (igData && !igData.error) {
          console.log('[handleConnectPage → Instagram] Fetched IG profile:', igData.username);
          
          const { data: igResult, error: igError } = await supabase
            .from('social_accounts')
            .upsert(
              {
                workspace_id: workspaceId,
                connected_by: ownerId,
                platform: 'instagram',
                account_type: 'business',
                account_id: igData.id,
                username: igData.username,
                display_name: `@${igData.username}`,
                access_token: accessToken,
                platform_data: {
                  profile_picture_url: igData.profile_picture_url || null,
                  connected_facebook_page_id: pageId,
                  connected_facebook_page_name: pageName,
                  instagram_business_account_id: igAccountId
                },
                is_active: true,
                connection_status: 'connected',
                last_sync_at: new Date().toISOString(),
              },
              { onConflict: 'workspace_id,platform,account_id' }
            )
            .select()
            .single();

          if (igError) {
            console.error('[handleConnectPage → Instagram] upsert FAILED for account_id:', igData.id, 'error:', igError);
            // Fallback: mark most recent Instagram row active
            const { data: recent } = await supabase
              .from('social_accounts')
              .select('id')
              .eq('workspace_id', workspaceId)
              .eq('platform', 'instagram')
              .order('updated_at', { ascending: false })
              .limit(1)
              .single();
            
            if (recent?.id) {
              console.log('[handleConnectPage → Instagram] fallback: marking row', recent.id, 'active');
              await supabase
                .from('social_accounts')
                .update({ is_active: true, last_sync_at: new Date().toISOString() })
                .eq('id', recent.id);
            }
          } else {
            console.log('[handleConnectPage → Instagram] upsert SUCCESS for account_id:', igData.id);
          }
        } else {
          console.warn('[handleConnectPage → Instagram] Failed to fetch IG profile:', igData?.error);
        }
      } catch (igErr) {
        console.error('[handleConnectPage → Instagram] exception:', igErr);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Page connected successfully',
      pageConnection: data
    });
  } catch (err: any) {
    console.error('[handleConnectPage] Error:', err);
    return res.status(500).json({ error: err.message });
  }
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
  const redirectUri = 'https://engage-hub-ten.vercel.app/auth/facebook/callback';

  try {
    // Exchange code for access token
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?` +
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
      `https://graph.facebook.com/v21.0/oauth/access_token?` +
      `grant_type=fb_exchange_token&` +
      `client_id=${clientId}&` +
      `client_secret=${clientSecret}&` +
      `fb_exchange_token=${tokenData.access_token}`
    );

    const longTermData = await longTermResponse.json();

    if (longTermData.error) {
      throw new Error(longTermData.error.message);
    }

    // Get user's pages - add page_id field
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?` +
      `fields=id,page_id,name,access_token,instagram_business_account&` +
      `access_token=${longTermData.access_token}&` +
      `limit=100`
    );

    const pagesData = await pagesResponse.json();

    // Map pages to include pageId for frontend compatibility
    const mappedPages = (pagesData.data || []).map((page: any) => ({
      pageId: page.id || page.page_id,
      pageName: page.name, // Add pageName for frontend compatibility
      name: page.name,
      accessToken: page.access_token,
      instagramBusinessAccount: page.instagram_business_account
    }));

    // Get user profile
    const profileResponse = await fetch(
      `https://graph.facebook.com/v21.0/me?` +
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
      pages: mappedPages,
      pagesCount: mappedPages.length,
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
