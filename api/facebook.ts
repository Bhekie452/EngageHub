import { VercelRequest, VercelResponse } from '@vercel/node';

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
        error: 'Server configuration error',
        details: 'Facebook credentials not configured'
      });
    }

    if (req.method === 'POST') {
      const { code, redirectUri, workspaceId } = req.body;
      
      // ✅ Use exact redirect URI from frontend (not hardcoded)
      const cleanRedirectUri = redirectUri || "https://engage-hub-ten.vercel.app/auth/facebook/callback";

      if (!code) {
        return res.status(400).json({ error: 'Missing authorization code' });
      }

      // ✅ Validate workspace ID (basic check)
      if (!workspaceId) {
        return res.status(400).json({ 
          error: 'No workspace found',
          details: 'Workspace ID is required for Facebook connection'
        });
      }

      // ✅ Check for code reuse (basic prevention)
      const codeKey = `fb_code_${code.substring(0, 20)}`;
      if (global.usedCodes?.has(codeKey)) {
        return res.status(400).json({ 
          error: 'Facebook API Error',
          message: 'This authorization code has already been used',
          type: 'OAuthException',
          code: 'CODE_ALREADY_USED',
          details: 'Authorization codes are single-use only'
        });
      }
      
      // Mark code as used
      if (!global.usedCodes) global.usedCodes = new Set();
      global.usedCodes.add(codeKey);

      // ✅ Log workspace info
      console.log('📋 Workspace ID:', workspaceId || 'Not provided');
      console.log('🔗 Using Redirect URI:', cleanRedirectUri);
      console.log('🔑 Code Key:', codeKey);

      // Exchange code for short-term token
      const tokenUrl = `https://graph.facebook.com/v21.0/oauth/access_token?` +
        `client_id=${FACEBOOK_APP_ID}` +
        `&client_secret=${FACEBOOK_APP_SECRET}` +
        `&redirect_uri=${encodeURIComponent(cleanRedirectUri)}` +
        `&code=${code}`;

      console.log('🔗 Token Exchange URL:', tokenUrl.substring(0, 100) + '...');

      const tokenResponse = await fetch(tokenUrl);
      const tokenData = await tokenResponse.json();

      console.log('📋 Token Response:', {
        status: tokenResponse.status,
        ok: tokenResponse.ok,
        data: tokenData
      });

      if (tokenData.error) {
        console.error('❌ Facebook Token Error:', {
          error: tokenData.error,
          message: tokenData.error?.message,
          type: tokenData.error?.type,
          code: tokenData.error?.code
        });
        return res.status(400).json({ 
          error: 'Facebook API Error',
          message: tokenData.error.message || 'Token exchange failed',
          type: tokenData.error?.type,
          code: tokenData.error?.code,
          details: 'Facebook rejected the token exchange request'
        });
      }

      const shortTermToken = tokenData.access_token;

      // Exchange for long-term token
      const longTermUrl = `https://graph.facebook.com/v21.0/oauth/access_token?` +
        `grant_type=fb_exchange_token` +
        `&client_id=${FACEBOOK_APP_ID}` +
        `&client_secret=${FACEBOOK_APP_SECRET}` +
        `&fb_exchange_token=${shortTermToken}`;

      console.log('🔄 Long-term Exchange URL:', longTermUrl.substring(0, 100) + '...');

      const longTermResponse = await fetch(longTermUrl);
      const longTermData = await longTermResponse.json();

      console.log('📋 Long-term Response:', {
        status: longTermResponse.status,
        ok: longTermResponse.ok,
        data: longTermData
      });

      if (longTermData.error) {
        console.error('❌ Facebook Long-term Error:', {
          error: longTermData.error,
          message: longTermData.error?.message,
          type: longTermData.error?.type,
          code: longTermData.error?.code
        });
        return res.status(400).json({ 
          error: 'Long-term token exchange failed',
          details: longTermData.error.message || 'Long-term token exchange failed',
          facebookError: longTermData.error
        });
      }

      const longTermToken = longTermData.access_token;
      const expiresIn = longTermData.expires_in;

      // Get Facebook Pages with Instagram fields
      const pagesUrl = `https://graph.facebook.com/v21.0/me/accounts?` +
        `fields=id,name,access_token,instagram_business_account,category&` +  // ✅ Added category and instagram fields
        `access_token=${longTermToken}`;

      const pagesResponse = await fetch(pagesUrl);
      const pagesData = await pagesResponse.json();

      if (pagesData.error) {
        return res.status(400).json({ 
          error: 'Failed to fetch pages',
          details: pagesData.error.message || 'Failed to fetch pages'
        });
      }

      const pages = pagesData.data || [];

      // 🔥 CRITICAL: Save connection to database
      if (workspaceId && longTermToken) {
        console.log('💾 Saving Facebook connection to database...');
        
        try {
          // TODO: Replace with actual database save
          // For now, just log the data that would be saved
          const connectionData = {
            workspaceId: workspaceId,
            platform: 'facebook',
            accessToken: longTermToken,
            expiresIn: expiresIn,
            pages: pages.map(page => ({
              pageId: page.id,
              pageName: page.name,
              pageAccessToken: page.access_token,
              instagramBusinessAccountId: page.instagram_business_account?.id,
              category: page.category,
              hasInstagram: !!page.instagram_business_account
            })),
            createdAt: new Date().toISOString()
          };
          
          console.log('✅ Connection data prepared for database:', {
            workspaceId: connectionData.workspaceId,
            platform: connectionData.platform,
            tokenLength: connectionData.accessToken.length,
            pagesCount: connectionData.pages.length,
            pagesWithInstagram: connectionData.pages.filter(p => p.hasInstagram).length
          });
          
          // TODO: Actual database save:
          // await saveFacebookConnection(connectionData);
          
        } catch (dbError) {
          console.error('❌ Database save error:', dbError);
          // Continue anyway - frontend will use localStorage fallback
        }
      } else {
        console.warn('⚠️ Cannot save to database - missing workspaceId or token');
      }

      return res.status(200).json({
        success: true,
        accessToken: longTermToken,
        expiresIn: expiresIn,
        pages: pages
      });

    } else {
      // GET request - fetch pages with stored token
      const longTermToken = process.env.FACEBOOK_LONG_TERM_TOKEN;

      if (!longTermToken) {
        return res.status(400).json({ 
          error: 'No Facebook token available',
          details: 'FACEBOOK_LONG_TERM_TOKEN environment variable not set'
        });
      }

      const pagesUrl = `https://graph.facebook.com/v21.0/me/accounts?` +
        `fields=id,name,access_token,instagram_business_account,category&` +  // ✅ Added category and instagram fields
        `access_token=${longTermToken}`;

      const pagesResponse = await fetch(pagesUrl);
      const pagesData = await pagesResponse.json();

      if (pagesData.error) {
        return res.status(400).json({ 
          error: 'Failed to fetch pages',
          details: pagesData.error.message || 'Failed to fetch pages'
        });
      }

      return res.status(200).json({
        success: true,
        pages: pagesData.data || []
      });
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

    console.log('📋 Fetching Facebook connections for workspace:', workspaceId);

    // 🔥 CRITICAL: For now, return localStorage data as fallback
    // TODO: Replace with actual database query
    const connections = []; // Empty array - no database storage yet

    return res.status(200).json({
      success: true,
      connections: connections,
      workspaceId: workspaceId,
      message: 'Database storage not implemented yet - using localStorage fallback'
    });

  } catch (error: any) {
    console.error('Get connections error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch connections',
      details: error.message
    });
  }
}
