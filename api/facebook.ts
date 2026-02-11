// ------------------------------------------------------------
//   Facebook‑OAuth / Pages API handler (Vercel Serverless)
// ------------------------------------------------------------

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from './lib/supabase.js';
import { createHash } from 'crypto';

// ------------------------------------------------------------------
//  Database-backed OAuth code guard (shared across all Vercel instances)
// ------------------------------------------------------------------
/**
 * Inserts a SHA-256 hash of OAuth `code` into `fb_used_codes`.
 * Returns `true` when insert succeeded (code was fresh),
 * `false` when a duplicate-key error occurred (code already used).
 */
async function markCodeAsUsed(code: string): Promise<boolean> {
  const hash = createHash('sha256')
    .update(code)
    .digest('hex')
    .substring(0, 32); // 128-bit slice is plenty unique

  const { error } = await supabase
    .from('fb_used_codes')
    .insert({ code_hash: hash })
    .single();

  // PostgreSQL (Supabase) reports duplicate-key as code '23505'
  if (error?.code === '23505') return false;
  if (error) throw error; // any other DB problem

  return true;
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
      case 'diagnostics':
        return await handleFacebookDiagnostics(req, res);
      case 'validate':
        return await handleValidateToken(req, res);
      case 'connections':
        return await handleGetConnections(req, res);
      default:
        return res
          .status(400)
          .json({ error: 'Invalid action parameter' });
    }
  } catch (error: any) {
    console.error('Facebook API error:', error);
    return res.status(500).json({
      error: 'Facebook request failed',
      details: error.message ?? 'unknown',
      timestamp: new Date().toISOString(),
    });
  }
}

// ------------------------------------------------------------------
//  1️⃣  Simple flow – OAuth code → long‑term token → pages → DB
// ------------------------------------------------------------------
async function handleFacebookSimple(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method !== 'GET' && req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

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
  // POST – exchange `code`, fetch pages, persist in DB
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

    // ----- 1️⃣  Database-backed single‑use guard (replaces in‑memory Set) -----
    const fresh = await markCodeAsUsed(code);
    if (!fresh) {
      console.log('🛑 Backend: Code already used in DB - blocking duplicate');
      return res.status(400).json({
        error: 'Facebook API Error',
        message: 'This authorization code has already been used',
        type: 'OAuthException',
        code: 'CODE_ALREADY_USED',
        details: 'Authorization codes are single‑use only',
      });
    }
    console.log('✅ Code marked as used in DB:', code.substring(0, 20) + '...');

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
        details: 'Facebook rejected token exchange request',
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

    // ----- 4️⃣  Fetch managed pages (page‑access‑tokens) -----
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

    const pageConnections = pages.map((p) => ({
      pageId: p.id,
      pageName: p.name,
      pageAccessToken: p.access_token,
      instagramBusinessAccountId: p.instagram_business_account?.id,
      category: p.category,
      hasInstagram: !!p.instagram_business_account,
    }));

    // ----- 5️⃣  Persist user + page connections in Supabase -----
    if (workspaceId && longTermToken) {
      try {
        // --- user (profile) connection ---------------------------------
        const {
          data: userConn,
          error: userErr,
        } = await supabase
          .from('social_accounts')
          .upsert(
            {
              workspace_id: workspaceId,
              connected_by:
                '00000000-0000-0000-0000-000000000000', // TODO: replace with real user ID
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
            { onConflict: 'workspace_id,platform,account_id' },
          )
          .select()
          .single();

        if (userErr) throw userErr;

        console.log('✅ Facebook user connection saved:', userConn.id);

        // --- each PAGE connection ------------------------------------
        if (pageConnections.length > 0) {
          for (const page of pageConnections) {
            const {
              data: pageConn,
              error: pageErr,
            } = await supabase
              .from('social_accounts')
              .upsert(
                {
                  workspace_id: workspaceId,
                  connected_by:
                    '00000000-0000-0000-0000-000000000000', // TODO: replace with real user ID
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
    // Final response – tell the front‑end what pages exist
    // --------------------------------------------------------------
    return res.status(200).json({
      success: true,
      pages: pageConnections,
      message:
        pageConnections.length > 0
          ? `Found ${pageConnections.length} Facebook page(s)`
          : 'No Facebook Pages found – user may not manage any pages',
      workspaceId,
    });
  }

  // --------------------------------------------------------------
  // GET – return stored connections for a workspace (used by UI later)
  // --------------------------------------------------------------
  const { workspaceId } = req.query as { workspaceId?: string };

  if (!workspaceId) {
    return res
      .status(400)
      .json({ error: 'Missing workspaceId query parameter' });
  }

  // UUID validation (helps catch typos early)
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

    if (!connections || connections.length === 0) {
      return res.status(404).json({
        error: 'No Facebook connection found',
        details: 'No stored Facebook connection for this workspace',
        workspaceId,
      });
    }

    const transformed = connections.map((c) => ({
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
      `✅ Retrieved ${transformed.length} Facebook connections for workspace ${workspaceId}`,
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
      details: err.message ?? 'unknown',
    });
  }
}
