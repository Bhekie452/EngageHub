// ------------------------------------------------------------
//   Facebook‑OAuth / Pages API handler (Vercel Serverless)
// ------------------------------------------------------------

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from './lib/supabase.js';

// ------------------------------------------------------------------
//  Global augmentation – we store used OAuth “code” values here.
// ------------------------------------------------------------------
declare global {
  // eslint-disable-next-line no-var
  var usedCodes: Set<string> | undefined;
}

/**
 * Returns a Set that lives for the whole lifetime of the Vercel
 * serverless instance. The Set is lazily created on the first call.
 */
function getUsedCodes(): Set<string> {
  // `globalThis` works both in Node and in the Vercel sandbox.
  if (!globalThis.usedCodes) {
    globalThis.usedCodes = new Set<string>();
  }
  return globalThis.usedCodes;
}

// ------------------------------------------------------------------
//  Types for request bodies (helps IDE autocomplete & type safety)
// ------------------------------------------------------------------
interface SimpleRequestBody {
  code: string;
  redirectUri: string;
  workspaceId?: string;
  state?: string; // 🔥 Added unique state parameter
}

// ------------------------------------------------------------------
//  Main entry point
// ------------------------------------------------------------------
export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  // ------------- CORS ----------
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization',
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action } = req.query as { action?: string };

  try {
    switch (action) {
      case 'simple':
        return await handleFacebookSimple(req, res);
      case 'pages':
        return await handleFacebookPages(req, res);
      case 'token':
        return await handleFacebookToken(req, res);
      case 'validate':
        return await handleValidateToken(req, res);
      case 'diagnostics':
        return await handleFacebookDiagnostics(req, res);
      case 'connections':
        return await handleGetConnections(req, res);
      default:
        return res
          .status(400)
          .json({ error: 'Invalid action parameter' });
    }
  } catch (error: any) {
    console.error('Facebook API error:', error);
    // 🔥 CRITICAL: Handle Supabase initialization errors
    if (error.message?.includes('Supabase credentials not configured')) {
      return res.status(500).json({
        error: 'Database configuration error',
        details: 'Supabase credentials not properly configured',
        fix: 'Please check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables',
        timestamp: new Date().toISOString()
      });
    }
    return res.status(500).json({
      error: 'Facebook API request failed',
      details: error?.message ?? 'unknown',
      timestamp: new Date().toISOString(),
    });
  }
}

// ------------------------------------------------------------------
//  1️⃣  Simple flow – OAuth code → long‑term token → pages → DB save
// ------------------------------------------------------------------
async function handleFacebookSimple(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const FACEBOOK_APP_ID =
    process.env.FACEBOOK_APP_ID || process.env.VITE_FACEBOOK_APP_ID;
  const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;

  if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
    return res.status(500).json({
      error: 'Facebook credentials not configured',
      details: 'Missing FACEBOOK_APP_ID or FACEBOOK_APP_SECRET',
    });
  }

  // --------------------------------------------------------------
  // POST – exchange `code` for long‑term token, fetch pages,
  // and persist everything in Supabase.
  // --------------------------------------------------------------
  if (req.method === 'POST') {
    const {
      code,
      redirectUri,
      workspaceId,
      state, // 🔥 Added unique state parameter
    }: SimpleRequestBody = req.body as SimpleRequestBody;

    if (!code) {
      return res.status(400).json({
        error: 'Missing authorization code',
        details: 'No `code` provided in request body',
      });
    }

    console.log('🔍 OAuth request details:', {
      codeLength: code.length,
      redirectUri,
      workspaceId,
      state: state ? `${state.substring(0, 10)}...` : 'none',
    });

    // ----- 1️⃣  Prevent re‑use of an OAuth code with state tracking -----
    const codeKey = state ? `fb_code_${code.substring(0, 20)}_${state}` : `fb_code_${code.substring(0, 20)}`;
    const usedCodes = getUsedCodes();
    if (usedCodes.has(codeKey)) {
      console.log('🛑 Backend: Code already used - blocking duplicate');
      return res.status(400).json({
        error: 'Facebook API Error',
        message: 'This authorization code has already been used',
        type: 'OAuthException',
        code: 'CODE_ALREADY_USED',
        details: 'Authorization codes are single‑use only',
      });
    }
    usedCodes.add(codeKey);
    console.log('🔒 Code marked as used:', codeKey.substring(0, 30) + '...');

    // ----- 2️⃣  Exchange short‑term token -------------------------
    const shortTokenUrl = `https://graph.facebook.com/v21.0/oauth/access_token?` +
      `client_id=${FACEBOOK_APP_ID}` +
      `&client_secret=${FACEBOOK_APP_SECRET}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&code=${code}`;

    const shortResp = await fetch(shortTokenUrl);
    const shortData = await shortResp.json();

    if (shortData.error) {
      return res.status(400).json({
        error: 'Facebook API Error',
        message: shortData.error.message ?? 'Token exchange failed',
        type: shortData.error.type,
        code: shortData.error.code,
        details: 'Facebook rejected the token exchange request',
      });
    }

    const shortTermToken: string = shortData.access_token;

    // ----- 3️⃣  Exchange for long‑term token ---------------------
    const longTokenUrl = `https://graph.facebook.com/v21.0/oauth/access_token?` +
      `grant_type=fb_exchange_token` +
      `&client_id=${FACEBOOK_APP_ID}` +
      `&client_secret=${FACEBOOK_APP_SECRET}` +
      `&fb_exchange_token=${shortTermToken}`;

    const longResp = await fetch(longTokenUrl);
    const longData = await longResp.json();

    if (longData.error) {
      return res.status(400).json({
        error: 'Facebook API Error',
        message: longData.error.message ?? 'Long‑term token exchange failed',
        type: longData.error.type,
        code: longData.error.code,
        details: 'Failed to exchange short‑term token for long‑term token',
      });
    }

    const longTermToken: string = longData.access_token;
    const expiresIn: number = longData.expires_in; // seconds

    // ----- 4️⃣  Fetch managed Pages -----------------------------
    const pagesUrl = `https://graph.facebook.com/v21.0/me/accounts?` +
      `fields=id,name,access_token,instagram_business_account,category` +
      `&access_token=${longTermToken}`;

    const pagesResp = await fetch(pagesUrl);
    const pagesData = await pagesResp.json();

    if (pagesData.error) {
      return res.status(400).json({
        error: 'Failed to fetch pages',
        details: pagesData.error.message ?? 'Unknown error',
      });
    }

    const pages: any[] = pagesData.data ?? [];

    const pageConnections = pages.map((page) => ({
      pageId: page.id,
      pageName: page.name,
      pageAccessToken: page.access_token, // ← Page token (not user token)
      instagramBusinessAccountId: page.instagram_business_account?.id,
      category: page.category,
      hasInstagram: !!page.instagram_business_account,
    }));

    // ----- 5️⃣  Persist everything in Supabase ------------------
    if (workspaceId && longTermToken) {
      try {
        // 5a – Upsert the **user** (profile) connection (ALWAYS save user profile)
        const { data: userConn, error: userErr } = await supabase
          .from('social_accounts')
          .upsert(
            {
              workspace_id: workspaceId,
              connected_by:
                '00000000-0000-0000-0000-000000000000', // TODO: replace with actual user ID
              platform: 'facebook',
              account_type: 'profile',
              account_id: 'me',
              display_name: 'Facebook Profile',
              access_token: longTermToken,
              token_expires_at: new Date(
                Date.now() + expiresIn * 1000,
              ).toISOString(),
              scopes: [
                'email',
                'public_profile',
                'pages_show_list',
                'instagram_basic',
                'pages_read_engagement',
              ],
              platform_data: {
                pages: pageConnections,
                longTermUserToken: longTermToken,
                userTokenExpiresIn: expiresIn,
              },
              connection_status: 'connected',
              last_sync_at: new Date().toISOString(),
            },
            {
              onConflict: 'workspace_id,platform,account_id',
            },
          )
          .select()
          .single();

        if (userErr) throw userErr;

        console.log('✅ Facebook user connection saved:', userConn.id);

        // 5b – Upsert **each page** as its own connection (only if pages exist)
        if (pageConnections.length > 0) {
          for (const page of pageConnections) {
            const { data: pageConn, error: pageErr } = await supabase
              .from('social_accounts')
              .upsert(
                {
                  workspace_id: workspaceId,
                  connected_by:
                    '00000000-0000-0000-0000-000000000000', // TODO: replace with actual user ID
                  platform: 'facebook',
                  account_type: 'page',
                  account_id: page.pageId,
                  username: page.pageId,
                  display_name: page.pageName,
                  access_token: page.pageAccessToken,
                  platform_data: {
                    instagram_business_account_id:
                      page.instagramBusinessAccountId,
                    category: page.category,
                    hasInstagram: page.hasInstagram,
                    parentUserConnectionId: userConn.id,
                  },
                  connection_status: 'connected',
                  last_sync_at: new Date().toISOString(),
                },
                {
                  onConflict: 'workspace_id,platform,account_id',
                },
              )
              .select()
              .single();

            if (pageErr) {
              console.error(
                `❌ Error saving page ${page.pageName}:`,
                pageErr,
              );
            } else {
              console.log(
                `✅ Page saved: ${page.pageName} (${pageConn.id})`,
              );
            }
          }
        }

        console.log('✅ All Facebook connections saved', {
          workspaceId,
          userConnectionId: userConn.id,
          pagesSaved: pageConnections.length,
        });
      } catch (dbErr: any) {
        console.error('❌ Database error while persisting connections:', dbErr);
        // We still return page list to client – UI can decide what to do.
      }
    } else {
      console.warn('⚠️ No pages or missing workspaceId/long‑term token', {
        workspaceId,
        pagesFound: pageConnections.length,
        tokenPresent: !!longTermToken,
      });
    }

    // --------------------------------------------------------------
    // Final response – we give the caller the list of pages (with tokens)
    // --------------------------------------------------------------
    return res.status(200).json({
      success: true,
      pages: pageConnections,
      message:
        pageConnections.length > 0
          ? `Found ${pageConnections.length} Facebook page(s)`
          : 'No Facebook Pages found – the user may not manage any pages',
      workspaceId,
    });
  }

  // --------------------------------------------------------------
  // GET – return whatever Facebook connection(s) we have stored for the
  // supplied workspaceId.
  // --------------------------------------------------------------
  const { workspaceId } = req.query as { workspaceId?: string };

  if (!workspaceId) {
    return res
      .status(400)
      .json({ error: 'Missing workspaceId query parameter' });
  }

  // Validate UUID format (the most common format we use for workspaces)
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(workspaceId)) {
    console.error('❌ Invalid workspaceId format:', workspaceId);
    return res.status(400).json({
      error: 'Invalid workspaceId format',
      details: 'workspaceId must be a valid UUID',
      received: workspaceId,
    });
  }

  try {
    const { data: connections, error } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('platform', 'facebook')
      .eq('connection_status', 'connected');

    if (error) throw error;

    // If nothing is stored we return a 404 – the front‑end can show a proper UI.
    if (!connections || connections.length === 0) {
      return res.status(404).json({
        error: 'No Facebook connection found',
        details: 'No stored Facebook connection for this workspace',
        workspaceId,
      });
    }

    // Transform DB rows (snake_case) into a camelCase API payload.
    const transformed = connections.map((c) => ({
      id: c.id,
      workspaceId: c.workspace_id,
      platform: c.platform,
      platformType: c.platform, // alias kept for backward compatibility
      displayName: c.display_name,
      isConnected: c.connection_status === 'connected',
      accessToken: c.access_token,
      pages: c.platform_data?.pages ?? [],
      accountType: c.account_type,
      accountId: c.account_id,
      username: c.username,
      avatarUrl: c.avatar_url,
      profileUrl: c.profile_url,
      connectionStatus: c.connection_status,
      lastSyncAt: c.last_sync_at,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    }));

    console.log(
      `✅ Retrieved ${transformed.length} Facebook connection(s) for workspace ${workspaceId}`,
    );

    return res.status(200).json({
      success: true,
      connections: transformed,
      count: transformed.length,
    });
  } catch (err: any) {
    console.error('❌ DB fetch error:', err);
    return res.status(500).json({
      error: 'Failed to fetch connections',
      details: err?.message ?? 'unknown',
    });
  }
}

// ------------------------------------------------------------------
//  2️⃣  Fetch Pages – expects a **user** access token in the
//        Authorization header.
// ------------------------------------------------------------------
async function handleFacebookPages(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method !== 'GET')
    return res.status(405).json({ error: 'Method not allowed' });

  const token =
    req.headers.authorization?.replace('Bearer ', '') ?? '';

  if (!token) {
    return res
      .status(400)
      .json({ error: 'Missing access token in Authorization header' });
  }

  const pagesUrl = `https://graph.facebook.com/v21.0/me/accounts?` +
    `fields=id,name,access_token,instagram_business_account,category` +
    `&access_token=${token}`;

  const response = await fetch(pagesUrl);
  const data = await response.json();

  if (data.error) {
    return res.status(400).json({
      error: 'Failed to fetch pages',
      details: data.error.message ?? 'Unknown error',
    });
  }

  return res.status(200).json({
    success: true,
    pages: data.data ?? [],
  });
}

// ------------------------------------------------------------------
//  3️⃣  Token exchange – short‑term ↔ long‑term
// ------------------------------------------------------------------
async function handleFacebookToken(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  const { code, redirectUri } = req.body as {
    code?: string;
    redirectUri?: string;
  };

  if (!code) {
    return res
      .status(400)
      .json({ error: 'Missing authorization code' });
  }

  const FACEBOOK_APP_ID =
    process.env.FACEBOOK_APP_ID || process.env.VITE_FACEBOOK_APP_ID;
  const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;

  if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
    return res.status(500).json({
      error: 'Server configuration error',
      details: 'Facebook credentials not configured',
    });
  }

  const tokenUrl = `https://graph.facebook.com/v21.0/oauth/access_token?` +
    `client_id=${FACEBOOK_APP_ID}` +
    `&client_secret=${FACEBOOK_APP_SECRET}` +
    `&redirect_uri=${encodeURIComponent(redirectUri ?? '')}` +
    `&code=${code}`;

  const response = await fetch(tokenUrl);
  const data = await response.json();

  if (data.error) {
    return res.status(400).json({
      error: 'Token exchange failed',
      details: data.error.message ?? 'Unknown error',
    });
  }

  return res.status(200).json({
    success: true,
    accessToken: data.access_token,
    expiresIn: data.expires_in,
  });
}

// ------------------------------------------------------------------
//  4️⃣  Diagnostics – surface environment and FB API health
// ------------------------------------------------------------------
async function handleFacebookDiagnostics(
  _req: VercelRequest,
  res: VercelResponse,
) {
  const FACEBOOK_APP_ID =
    process.env.FACEBOOK_APP_ID || process.env.VITE_FACEBOOK_APP_ID;
  const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;
  const FACEBOOK_LONG_TERM_TOKEN =
    process.env.FACEBOOK_LONG_TERM_TOKEN;

  const environment = {
    FACEBOOK_APP_ID: {
      exists: !!FACEBOOK_APP_ID,
      value: FACEBOOK_APP_ID
        ? `${FACEBOOK_APP_ID.substring(0, 8)}...`
        : 'NOT SET',
      length: FACEBOOK_APP_ID?.length ?? 0,
    },
    FACEBOOK_APP_SECRET: {
      exists: !!FACEBOOK_APP_SECRET,
      value: FACEBOOK_APP_SECRET
        ? `***${FACEBOOK_APP_SECRET.slice(-4)}`
        : 'NOT SET',
      length: FACEBOOK_APP_SECRET?.length ?? 0,
    },
    FACEBOOK_LONG_TERM_TOKEN: {
      exists: !!FACEBOOK_LONG_TERM_TOKEN,
      value: FACEBOOK_LONG_TERM_TOKEN
        ? `***${FACEBOOK_LONG_TERM_TOKEN.slice(-4)}`
        : 'NOT SET',
      length: FACEBOOK_LONG_TERM_TOKEN?.length ?? 0,
    },
  };

  const recommendations: string[] = [];

  if (!FACEBOOK_APP_ID) {
    recommendations.push(
      '❌ Set FACEBOOK_APP_ID in Vercel environment variables',
    );
  } else {
    recommendations.push('✅ FACEBOOK_APP_ID is set');
  }

  if (!FACEBOOK_APP_SECRET) {
    recommendations.push(
      '❌ Set FACEBOOK_APP_SECRET in Vercel environment variables',
    );
  } else {
    recommendations.push('✅ FACEBOOK_APP_SECRET is set');
  }

  if (!FACEBOOK_LONG_TERM_TOKEN) {
    recommendations.push(
      '⚠️ FACEBOOK_LONG_TERM_TOKEN not set (optional)',
    );
  } else {
    recommendations.push('✅ FACEBOOK_LONG_TERM_TOKEN is set (optional)');
  }

  // --------------------------------------------------------------
  // Test basic Facebook Graph API connectivity (using APP_ID)
  // --------------------------------------------------------------
  let facebookApiTest: any = null;
  if (FACEBOOK_APP_ID) {
    try {
      const testUrl = `https://graph.facebook.com/v21.0/${FACEBOOK_APP_ID}?fields=id,name`;
      const testResp = await fetch(testUrl);
      const testData = await testResp.json();

      facebookApiTest = {
        reachable: testResp.ok,
        status: testResp.status,
        hasData: !!testData.id,
        appName: testData.name ?? null,
        error: testData.error?.message ?? null,
      };

      if (testResp.ok && testData.id) {
        recommendations.push(
          '✅ Facebook API reachable and app ID is valid',
        );
      } else {
        recommendations.push(
          '❌ Facebook API test failed – check APP_ID & permissions',
        );
      }
    } catch (err: any) {
      facebookApiTest = {
        reachable: false,
        status: 0,
        hasData: false,
        appName: null,
        error: err.message,
      };
      recommendations.push(
        '❌ Facebook API unreachable – check network connectivity',
      );
    }
  }

  const diagnostics = {
    success: true,
    environment,
    recommendations,
    facebookApiTest,
    deployment: {
      vercelEnv: process.env.VERCEL_ENV ?? 'unknown',
      nodeEnv: process.env.NODE_ENV ?? 'unknown',
      timestamp: new Date().toISOString(),
      region: process.env.VERCEL_REGION ?? 'unknown',
    },
  };

  return res.status(200).json(diagnostics);
}

// ------------------------------------------------------------------
//  5️⃣  Validate an access token (user or page)
// ------------------------------------------------------------------
async function handleValidateToken(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  const { token } = req.body as { token?: string };

  if (!token) {
    return res
      .status(400)
      .json({ error: 'Missing access token' });
  }

  const testUrl = `https://graph.facebook.com/v21.0/me?fields=id,name&access_token=${token}`;
  const response = await fetch(testUrl);
  const data = await response.json();

  if (data.error) {
    return res.status(400).json({
      valid: false,
      error: data.error.message ?? 'Invalid token',
    });
  }

  return res.status(200).json({
    valid: true,
    user: {
      id: data.id,
      name: data.name,
    },
  });
}

// ------------------------------------------------------------------
//  6️⃣  Get all stored Facebook connections for a workspace
// ------------------------------------------------------------------
async function handleGetConnections(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method !== 'GET')
    return res.status(405).json({ error: 'Method not allowed' });

  const { workspaceId } = req.query as { workspaceId?: string };

  if (!workspaceId) {
    return res
      .status(400)
      .json({ error: 'Missing workspaceId' });
  }

  // Validate UUID format (same regex used above)
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      workspaceId,
    )
  ) {
    console.error('❌ Invalid workspaceId format:', workspaceId);
    return res.status(400).json({
      error: 'Invalid workspaceId format',
      details: 'workspaceId must be a valid UUID',
      received: workspaceId,
    });
  }

  try {
    const { data: connections, error } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('platform', 'facebook')
      .eq('connection_status', 'connected');

    if (error) throw error;

    const transformed = (connections ?? []).map((c) => ({
      id: c.id,
      workspaceId: c.workspace_id,
      platform: c.platform,
      platformType: c.platform,
      displayName: c.display_name,
      isConnected: c.connection_status === 'connected',
      accessToken: c.access_token,
      pages: c.platform_data?.pages ?? [],
      accountType: c.account_type,
      accountId: c.account_id,
      username: c.username,
      avatarUrl: c.avatar_url,
      profileUrl: c.profile_url,
      connectionStatus: c.connection_status,
      lastSyncAt: c.last_sync_at,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    }));

    console.log(
      `✅ Found ${transformed.length} Facebook connections for workspace ${workspaceId}`,
    );

    return res.status(200).json({
      success: true,
      connections: transformed,
      count: transformed.length,
    });
  } catch (err: any) {
    console.error('❌ Get connections error:', err);
    return res.status(500).json({
      error: 'Failed to fetch connections',
      details: err?.message ?? 'unknown',
    });
  }
}

// ------------------------------------------------------------------
//  Utility – refresh Page tokens using a long‑term user token
// ------------------------------------------------------------------
export async function refreshPageTokens(
  longTermUserToken: string,
) {
  const url = `https://graph.facebook.com/v21.0/me/accounts?` +
    `fields=id,name,access_token,instagram_business_account,category` +
    `&access_token=${longTermUserToken}`;

  const resp = await fetch(url);
  const data = await resp.json();

  if (data.error) {
    throw new Error(
      `Failed to refresh Page tokens: ${data.error.message}`,
    );
  }

  return (data.data ?? []).map((page: any) => ({
    pageId: page.id,
    pageName: page.name,
    pageAccessToken: page.access_token,
    instagramBusinessAccountId: page.instagram_business_account?.id,
    category: page.category,
    hasInstagram: !!page.instagram_business_account,
  }));
}
