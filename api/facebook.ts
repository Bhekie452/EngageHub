import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from './lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action } = req.query;

  try {
    switch (action) {
      case 'simple':
        return await handleFacebookSimple(req, res);
      case 'pages':
        return await handleFacebookPages(req, res);
      case 'token':
        return await handleFacebookToken(req, res);
      case 'diagnostics':
        return await handleFacebookDiagnostics(req, res);
      case 'validate':
        return await handleValidateToken(req, res);
      case 'connections':
        return await handleGetConnections(req, res);
      default:
        return res.status(400).json({ error: 'Invalid action parameter' });
    }
  } catch (error: any) {
    console.error('Facebook API error:', error);
    return res.status(500).json({ 
      error: 'Facebook API request failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// Handle Facebook OAuth token exchange and page fetching
async function handleFacebookSimple(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID || process.env.VITE_FACEBOOK_APP_ID;
    const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;

    if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
      return res.status(500).json({ 
        error: 'Facebook credentials not configured',
        details: 'Missing FACEBOOK_APP_ID or FACEBOOK_APP_SECRET'
      });
    }

    // POST request - exchange code for token
    if (req.method === 'POST') {
      const { code, redirectUri, workspaceId } = req.body;

      if (!code) {
        return res.status(400).json({ 
          error: 'Missing authorization code',
          details: 'No code provided in request body'
        });
      }

      // 🔥 CRITICAL: Check if code already used
      const codeKey = `fb_code_${code.substring(0, 20)}`;
      if (!global.usedCodes) global.usedCodes = new Set();
      if (global.usedCodes.has(codeKey)) {
        return res.status(400).json({ 
          error: 'Facebook API Error',
          message: 'This authorization code has already been used',
          type: 'OAuthException',
          code: 'CODE_ALREADY_USED',
          details: 'Authorization codes are single-use only'
        });
      }
      
      // Mark code as used IMMEDIATELY
      global.usedCodes.add(codeKey);
      console.log('🔒 Code marked as used:', codeKey);

      console.log('📋 Workspace ID:', workspaceId || 'Not provided');
      console.log('🔗 Using Redirect URI:', redirectUri);

      // Exchange code for short-term token
      const tokenUrl = `https://graph.facebook.com/v21.0/oauth/access_token?` +
        `client_id=${FACEBOOK_APP_ID}` +
        `&client_secret=${FACEBOOK_APP_SECRET}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&code=${code}`;

      console.log('🔗 Token Exchange URL:', tokenUrl.substring(0, 100) + '...');

      const tokenResponse = await fetch(tokenUrl);
      const tokenData = await tokenResponse.json();

      console.log('📋 Token Response:', {
        status: tokenResponse.status,
        ok: tokenResponse.ok,
        hasAccessToken: !!tokenData.access_token,
        tokenLength: tokenData.access_token?.length || 0
      });

      if (tokenData.error) {
        console.error('❌ Facebook Token Error:', tokenData.error);
        return res.status(400).json({ 
          error: 'Facebook API Error',
          message: tokenData.error.message || 'Token exchange failed',
          type: tokenData.error?.type,
          code: tokenData.error?.code,
          details: 'Facebook rejected the token exchange request'
        });
      }

      const shortTermToken = tokenData.access_token;

      // Exchange short-term token for long-term token
      const longTermUrl = `https://graph.facebook.com/v21.0/oauth/access_token?` +
        `grant_type=fb_exchange_token` +
        `&client_id=${FACEBOOK_APP_ID}` +
        `&client_secret=${FACEBOOK_APP_SECRET}` +
        `&fb_exchange_token=${shortTermToken}`;

      console.log('🔄 Exchanging for long-term token...');

      const longTermResponse = await fetch(longTermUrl);
      const longTermData = await longTermResponse.json();

      console.log('📋 Long-term Token Response:', {
        status: longTermResponse.status,
        ok: longTermResponse.ok,
        hasAccessToken: !!longTermData.access_token,
        tokenLength: longTermData.access_token?.length || 0,
        expiresIn: longTermData.expires_in
      });

      if (longTermData.error) {
        console.error('❌ Long-term token error:', longTermData.error);
        return res.status(400).json({ 
          error: 'Facebook API Error',
          message: longTermData.error.message || 'Long-term token exchange failed',
          type: longTermData.error?.type,
          code: longTermData.error?.code,
          details: 'Failed to exchange short-term token for long-term token'
        });
      }

      const longTermToken = longTermData.access_token;
      const expiresIn = longTermData.expires_in;

      // 🔥 CRITICAL: Fetch Pages with long-term token
      const pagesUrl = `https://graph.facebook.com/v21.0/me/accounts?` +
        `fields=id,name,access_token,instagram_business_account,category&` +
        `access_token=${longTermToken}`;

      console.log('📄 Fetching Facebook Pages...');

      const pagesResponse = await fetch(pagesUrl);
      const pagesData = await pagesResponse.json();

      console.log('📋 Pages Response:', {
        status: pagesResponse.status,
        ok: pagesResponse.ok,
        hasData: !!pagesData.data,
        pageCount: pagesData.data?.length || 0,
        error: pagesData.error
      });

      if (pagesData.error) {
        console.error('❌ Pages fetch error:', pagesData.error);
        return res.status(400).json({ 
          error: 'Failed to fetch pages',
          details: pagesData.error.message || 'Failed to fetch pages'
        });
      }

      const pages = pagesData.data || [];

      // 🔥 CRITICAL: Extract Page access tokens (not user token)
      const pageConnections = pages.map(page => ({
        pageId: page.id,
        pageName: page.name,
        pageAccessToken: page.access_token,   // ✅ Use Page token for Page actions
        instagramBusinessAccountId: page.instagram_business_account?.id,
        category: page.category,
        hasInstagram: !!page.instagram_business_account
      }));

      // 🔥 CRITICAL: Save to database (workspace + tokens)
      if (workspaceId && longTermToken && pageConnections.length > 0) {
        console.log('💾 Saving Facebook connection to database...');
        
        const connectionData = {
          workspaceId: workspaceId,
          platform: 'facebook',
          longTermUserToken: longTermToken, // For refreshing Page tokens
          pages: pageConnections,  // ✅ Store Page tokens
          createdAt: new Date().toISOString()
        };
        
        console.log('✅ Connection data prepared for database:', {
          workspaceId: connectionData.workspaceId,
          platform: connectionData.platform,
          userTokenLength: connectionData.longTermUserToken.length,
          pagesCount: connectionData.pages.length,
          pagesWithInstagram: connectionData.pages.filter(p => p.hasInstagram).length,
          hasPageTokens: connectionData.pages.some(p => p.pageAccessToken)
        });
        
        // 🔥 CRITICAL: Save connection to Supabase database
        if (workspaceId && longTermToken) {
          console.log('💾 Saving Facebook connection to Supabase...');
          
          try {
            // First, save the main Facebook user connection
            const { data: userConnection, error: userError } = await supabase
              .from('social_accounts')
              .upsert({
                workspace_id: workspaceId,
                connected_by: '00000000-0000-0000-0000-000000000000', // TODO: Get actual user ID from auth
                platform: 'facebook',
                account_type: 'profile',
                account_id: 'me', // Facebook user profile
                display_name: 'Facebook Profile',
                access_token: longTermToken,
                token_expires_at: new Date(Date.now() + (expiresIn * 1000)).toISOString(),
                scopes: ['email', 'public_profile', 'pages_show_list', 'instagram_basic', 'pages_read_engagement'],
                platform_data: {
                  pages: pageConnections,
                  longTermUserToken: longTermToken,
                  userTokenExpiresIn: expiresIn
                },
                connection_status: 'connected',
                last_sync_at: new Date().toISOString()
              }, {
                onConflict: 'workspace_id,platform,account_id'
              })
              .select()
              .single();

            if (userError) {
              console.error('❌ Error saving user connection:', userError);
              throw userError;
            }

            console.log('✅ Facebook user connection saved:', userConnection.id);

            // Now save each Facebook Page as a separate connection
            for (const page of pageConnections) {
              const { data: pageConnection, error: pageError } = await supabase
                .from('social_accounts')
                .upsert({
                  workspace_id: workspaceId,
                  connected_by: '00000000-0000-0000-0000-000000000000', // TODO: Get actual user ID from auth
                  platform: 'facebook',
                  account_type: 'page',
                  account_id: page.pageId,
                  username: page.pageId,
                  display_name: page.pageName,
                  access_token: page.pageAccessToken,
                  platform_data: {
                    instagram_business_account_id: page.instagramBusinessAccountId,
                    category: page.category,
                    hasInstagram: page.hasInstagram,
                    parentUserConnectionId: userConnection.id
                  },
                  connection_status: 'connected',
                  last_sync_at: new Date().toISOString()
                }, {
                  onConflict: 'workspace_id,platform,account_id'
                })
                .select()
                .single();

              if (pageError) {
                console.error(`❌ Error saving page ${page.pageName}:`, pageError);
              } else {
                console.log(`✅ Facebook page saved: ${page.pageName} (${pageConnection.id})`);
              }
            }

            console.log('✅ All Facebook connections saved to database:', {
              workspaceId: workspaceId,
              userConnectionId: userConnection.id,
              pagesCount: pageConnections.length,
              pagesWithInstagram: pageConnections.filter(p => p.hasInstagram).length
            });
            
          } catch (saveError) {
            console.error('❌ Database save error:', saveError);
            // Continue anyway - frontend will use localStorage fallback
          }
        } else {
          console.warn('⚠️ Cannot save - missing workspaceId or token');
        }
        
      } else {
        console.warn('⚠️ No Pages found or missing workspaceId');
        if (!workspaceId) console.warn('❌ Missing workspaceId');
        if (!longTermToken) console.warn('❌ Missing long-term token');
        if (pageConnections.length === 0) console.warn('❌ No Page connections found');
      }

      return res.status(200).json({
        success: true,
        pages: pageConnections,  // ✅ Return Page tokens to frontend
        message: pageConnections.length > 0 
          ? `Found ${pageConnections.length} Facebook Pages` 
          : 'No Facebook Pages found - user may not manage any Pages',
        workspaceId: workspaceId
      });

    } else {
      // GET request - return stored connection
      try {
        const { workspaceId } = req.query;

        // 🔥 CRITICAL: Validate workspaceId format
        if (typeof workspaceId !== 'string' || !workspaceId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
          console.error('❌ Invalid workspaceId format:', workspaceId);
          return res.status(400).json({
            error: 'Invalid workspaceId format',
            details: 'workspaceId must be a valid UUID',
            received: workspaceId
          });
        }

        console.log('📋 Fetching stored connection for workspace:', workspaceId);

        // 🔥 CRITICAL: Fetch connections from Supabase database
        const { data: connections, error } = await supabase
          .from('social_accounts')
          .select('*')
          .eq('workspace_id', workspaceId)
          .eq('platform', 'facebook')
          .eq('connection_status', 'connected');

        if (error) {
          console.error('❌ Error fetching connections:', error);
          return res.status(500).json({
            error: 'Failed to fetch connections',
            details: error.message
          });
        }

        if (!connections || connections.length === 0) {
          return res.status(404).json({
            error: 'No Facebook connection found',
            details: 'No stored Facebook connection for this workspace',
            workspaceId: workspaceId
          });
        }

        // Transform database records to match expected format
        const transformedConnections = connections.map(conn => ({
          id: conn.id,
          workspaceId: conn.workspace_id,
          platform: conn.platform,
          platformType: conn.platform,
          displayName: conn.display_name,
          isConnected: conn.connection_status === 'connected',
          accessToken: conn.access_token,
          pages: conn.platform_data?.pages || [],
          accountType: conn.account_type,
          accountId: conn.account_id,
          username: conn.username,
          avatarUrl: conn.avatar_url,
          profileUrl: conn.profile_url,
          connectionStatus: conn.connection_status,
          lastSyncAt: conn.last_sync_at,
          createdAt: conn.created_at,
          updatedAt: conn.updated_at
        }));

        console.log(`✅ Found ${transformedConnections.length} Facebook connections for workspace ${workspaceId}`);

        return res.status(200).json({
          success: true,
          connections: transformedConnections,
          count: transformedConnections.length
        });

      } catch (fetchError) {
        console.error('❌ Database fetch error:', fetchError);
        return res.status(500).json({
          error: 'Database error',
          details: fetchError.message
        });
      }
    }

  } catch (error: any) {
    console.error('Facebook simple error:', error);
    return res.status(500).json({ 
      error: 'Facebook API request failed',
      details: error.message
    });
  }
}

// Handle Facebook Pages fetch
async function handleFacebookPages(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(400).json({ error: 'Missing access token' });
    }

    const pagesUrl = `https://graph.facebook.com/v21.0/me/accounts?` +
      `fields=id,name,access_token,instagram_business_account,category&` +  // ✅ Added category and instagram fields
      `access_token=${token}`;

    const response = await fetch(pagesUrl);
    const data = await response.json();

    if (data.error) {
      return res.status(400).json({ 
        error: 'Failed to fetch pages',
        details: data.error.message || 'Failed to fetch pages'
      });
    }

    return res.status(200).json({
      success: true,
      pages: data.data || []
    });

  } catch (error: any) {
    console.error('Facebook pages error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch pages',
      details: error.message
    });
  }
}

// Handle Facebook token operations
async function handleFacebookToken(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code, redirectUri } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Missing authorization code' });
    }

    const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID || process.env.VITE_FACEBOOK_APP_ID;
    const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;

    if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
      return res.status(500).json({ 
        error: 'Server configuration error',
        details: 'Facebook credentials not configured'
      });
    }

    const tokenUrl = `https://graph.facebook.com/v21.0/oauth/access_token?` +
      `client_id=${FACEBOOK_APP_ID}` +
      `&client_secret=${FACEBOOK_APP_SECRET}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&code=${code}`;

    const response = await fetch(tokenUrl);
    const data = await response.json();

    if (data.error) {
      return res.status(400).json({ 
        error: 'Token exchange failed',
        details: data.error.message || 'Token exchange failed'
      });
    }

    return res.status(200).json({
      success: true,
      accessToken: data.access_token,
      expiresIn: data.expires_in
    });

  } catch (error: any) {
    console.error('Facebook token error:', error);
    return res.status(500).json({ 
      error: 'Token exchange failed',
      details: error.message
    });
  }
}

// Handle Facebook diagnostics
async function handleFacebookDiagnostics(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID || process.env.VITE_FACEBOOK_APP_ID;
    const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;
    const FACEBOOK_LONG_TERM_TOKEN = process.env.FACEBOOK_LONG_TERM_TOKEN;

    const environment = {
      FACEBOOK_APP_ID: {
        exists: !!FACEBOOK_APP_ID,
        value: FACEBOOK_APP_ID ? `${FACEBOOK_APP_ID.substring(0, 8)}...` : 'NOT SET',
        length: FACEBOOK_APP_ID?.length || 0
      },
      FACEBOOK_APP_SECRET: {
        exists: !!FACEBOOK_APP_SECRET,
        value: FACEBOOK_APP_SECRET ? `***${FACEBOOK_APP_SECRET.slice(-4)}` : 'NOT SET',
        length: FACEBOOK_APP_SECRET?.length || 0
      },
      FACEBOOK_LONG_TERM_TOKEN: {
        exists: !!FACEBOOK_LONG_TERM_TOKEN,
        value: FACEBOOK_LONG_TERM_TOKEN ? `***${FACEBOOK_LONG_TERM_TOKEN.slice(-4)}` : 'NOT SET',
        length: FACEBOOK_LONG_TERM_TOKEN?.length || 0
      }
    };

    const recommendations = [];

    if (!FACEBOOK_APP_ID) {
      recommendations.push('❌ Set FACEBOOK_APP_ID in Vercel environment variables');
    } else {
      recommendations.push('✅ FACEBOOK_APP_ID is set');
    }

    if (!FACEBOOK_APP_SECRET) {
      recommendations.push('❌ Set FACEBOOK_APP_SECRET in Vercel environment variables');
    } else {
      recommendations.push('✅ FACEBOOK_APP_SECRET is set');
    }

    if (!FACEBOOK_LONG_TERM_TOKEN) {
      recommendations.push('⚠️ FACEBOOK_LONG_TERM_TOKEN not set (optional)');
    } else {
      recommendations.push('✅ FACEBOOK_LONG_TERM_TOKEN is set (optional)');
    }

    // Test Facebook API connectivity
    let facebookApiTest = null;
    if (FACEBOOK_APP_ID) {
      try {
        const testUrl = `https://graph.facebook.com/v21.0/${FACEBOOK_APP_ID}?fields=id,name`;
        const testResponse = await fetch(testUrl);
        const testData = await testResponse.json();
        
        facebookApiTest = {
          reachable: testResponse.ok,
          status: testResponse.status,
          hasData: !!testData.id,
          appName: testData.name || 'Unknown',
          error: testData.error?.message || null
        };

        if (testResponse.ok && testData.id) {
          recommendations.push('✅ Facebook API is reachable and app is valid');
        } else {
          recommendations.push('❌ Facebook API test failed - check app ID and permissions');
        }
      } catch (error: any) {
        facebookApiTest = {
          reachable: false,
          status: 0,
          hasData: false,
          appName: null,
          error: error.message
        };
        recommendations.push('❌ Facebook API unreachable - check network connectivity');
      }
    }

    const diagnostics = {
      success: true,
      environment,
      recommendations,
      facebookApiTest,
      deployment: {
        vercelEnv: process.env.VERCEL_ENV || 'unknown',
        nodeEnv: process.env.NODE_ENV || 'unknown',
        timestamp: new Date().toISOString(),
        region: process.env.VERCEL_REGION || 'unknown'
      }
    };

    return res.status(200).json(diagnostics);

  } catch (error: any) {
    console.error('Facebook diagnostics error:', error);
    return res.status(500).json({ 
      error: 'Diagnostics failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// Handle Facebook token validation
async function handleValidateToken(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Missing access token' });
    }

    const testUrl = `https://graph.facebook.com/v21.0/me?fields=id,name&access_token=${token}`;
    const response = await fetch(testUrl);
    const data = await response.json();

    if (data.error) {
      return res.status(400).json({ 
        valid: false,
        error: data.error.message || 'Invalid token'
      });
    }

    return res.status(200).json({
      valid: true,
      user: {
        id: data.id,
        name: data.name
      }
    });

  } catch (error: any) {
    console.error('Facebook validation error:', error);
    return res.status(500).json({ 
      error: 'Token validation failed',
      details: error.message
    });
  }
}

// Handle fetching stored Facebook connections
async function handleGetConnections(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { workspaceId } = req.query;

    if (!workspaceId) {
      return res.status(400).json({ error: 'Missing workspaceId' });
    }

    // 🔥 CRITICAL: Validate workspaceId format
    if (typeof workspaceId !== 'string' || !workspaceId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      console.error('❌ Invalid workspaceId format:', workspaceId);
      return res.status(400).json({
        error: 'Invalid workspaceId format',
        details: 'workspaceId must be a valid UUID',
        received: workspaceId
      });
    }

    console.log('📋 Fetching Facebook connections for workspace:', workspaceId);

    // 🔥 CRITICAL: Fetch connections from Supabase database
    try {
      const { data: connections, error } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('platform', 'facebook')
        .eq('connection_status', 'connected');

      if (error) {
        console.error('❌ Error fetching connections:', error);
        return res.status(500).json({ 
          error: 'Failed to fetch connections',
          details: error.message
        });
      }

      // Transform database records to match expected format
      const transformedConnections = connections?.map(conn => ({
        id: conn.id,
        workspaceId: conn.workspace_id,
        platform: conn.platform,
        platformType: conn.platform,
        displayName: conn.display_name,
        isConnected: conn.connection_status === 'connected',
        accessToken: conn.access_token,
        pages: conn.platform_data?.pages || [],
        accountType: conn.account_type,
        accountId: conn.account_id,
        username: conn.username,
        avatarUrl: conn.avatar_url,
        profileUrl: conn.profile_url,
        connectionStatus: conn.connection_status,
        lastSyncAt: conn.last_sync_at,
        createdAt: conn.created_at,
        updatedAt: conn.updated_at
      })) || [];

      console.log(`✅ Found ${transformedConnections.length} connections for workspace ${workspaceId}`);

      return res.status(200).json({
        success: true,
        connections: transformedConnections,
        count: transformedConnections.length
      });

    } catch (error: any) {
      console.error('Get connections error:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch connections',
        details: error.message
      });
    }
  }
}

/**
 * Refresh Page tokens using long-term user token
 */
async function refreshPageTokens(longTermUserToken: string) {
  const url = `https://graph.facebook.com/v21.0/me/accounts?` +
    `fields=id,name,access_token,instagram_business_account,category&` +
    `access_token=${longTermUserToken}`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.error) {
    throw new Error(`Failed to refresh Page tokens: ${data.error.message}`);
  }

  return (data.data || []).map(page => ({
    pageId: page.id,
    pageName: page.name,
    pageAccessToken: page.access_token,   // ✅ always fresh
    instagramBusinessAccountId: page.instagram_business_account?.id,
    category: page.category,
    hasInstagram: !!page.instagram_business_account
  }));
}
