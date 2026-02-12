import { supabase } from "./lib/supabase.js";
import { createHash } from "crypto";

// ------------------------------------------------------------------
//  Database-backed OAuth code guard (shared across all Vercel instances)
// ------------------------------------------------------------------
/**
 * Inserts a SHA-256 hash of OAuth `code` into `fb_used_codes`.
 * Returns `true` when insert succeeded (code was fresh),
 * `false` when a duplicate-key error occurred (code already used).
 */
async function markCodeAsUsed(code) {
    const hash = createHash('sha256')
        .update(code)
        .digest('hex')
        .substring(0, 32); // 128-bit slice is plenty unique
    const { error } = await supabase
        .from('fb_used_codes')
        .insert({ code_hash: hash })
        .single();
    // PostgreSQL (Supabase) reports duplicate-key as code '23505'
    if (error?.code === '23505')
        return false;
    if (error) {
        // Only ignore if it's "relation does not exist" (e.g. migration hasn't run),
        // but stricter is better. Let's warn but proceed if table missing to avoid blocking users.
        if (error.code === '42P01') {
            console.warn('⚠️ fb_used_codes table missing, skipping duplicate check');
            return true;
        }
        throw error; // any other DB problem
    }
    return true;
}

// ------------------------------------------------------------------
//  0️⃣  Auth Initiation – Redirect user to Facebook
// ------------------------------------------------------------------
async function handleFacebookAuth(req, res) {
    const { workspaceId, redirectUri: customRedirect } = req.query;
    if (!workspaceId) {
        return res.status(400).json({ error: 'Missing workspaceId' });
    }

    const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID || process.env.VITE_FACEBOOK_APP_ID;
    // Fallback redirect URI if not provided - must be the backend callback
    const REDIRECT_URI = customRedirect || (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}/api/facebook?action=callback`
        : `http://localhost:3000/api/facebook?action=callback`);

    // We pass workspaceId in the 'state' parameter to recover it in the callback
    const state = JSON.stringify({ workspaceId, origin: req.headers.referer });

    const authUrl = `https://www.facebook.com/v21.0/dialog/oauth?` +
        `client_id=${FACEBOOK_APP_ID}` +
        `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
        `&state=${encodeURIComponent(state)}` +
        `&scope=email,public_profile,pages_show_list,instagram_basic,pages_read_engagement,pages_manage_posts`;

    console.log('🔗 Redirecting to Facebook Auth:', authUrl);
    return res.redirect(authUrl);
}

// ------------------------------------------------------------------
//  0️⃣  Auth Callback – Exchange code and store
// ------------------------------------------------------------------
async function handleFacebookCallbackAction(req, res) {
    const { code, state, error, error_description } = req.query;

    if (error) {
        console.error('❌ Facebook Auth Error:', error, error_description);
        return res.redirect(`/#social?error=${encodeURIComponent(error_description || error)}`);
    }

    if (!code || !state) {
        return res.status(400).json({ error: 'Missing code or state' });
    }

    let workspaceId, origin;
    try {
        const stateData = JSON.parse(decodeURIComponent(state));
        workspaceId = stateData.workspaceId;
        origin = stateData.origin || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    } catch (e) {
        return res.status(400).json({ error: 'Invalid state parameter' });
    }

    console.log('✅ Received Callback for workspace:', workspaceId);

    // 1. Exchange code for token
    const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID || process.env.VITE_FACEBOOK_APP_ID;
    const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;
    const REDIRECT_URI = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}/api/facebook?action=callback`
        : `http://localhost:3000/api/facebook?action=callback`;

    try {
        // Exchange for short-term token
        const shortTokenUrl = `https://graph.facebook.com/v21.0/oauth/access_token?` +
            `client_id=${FACEBOOK_APP_ID}` +
            `&client_secret=${FACEBOOK_APP_SECRET}` +
            `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
            `&code=${code}`;

        const shortResp = await fetch(shortTokenUrl);
        const shortData = await shortResp.json();

        if (shortData.error) {
            console.error('❌ Token exchange failed:', shortData.error);
            return res.redirect(`${origin}/#social?error=token_exchange_failed`);
        }

        const shortTermToken = shortData.access_token;

        // Exchange for long-term token
        const longTokenUrl = `https://graph.facebook.com/v21.0/oauth/access_token?` +
            `grant_type=fb_exchange_token` +
            `&client_id=${FACEBOOK_APP_ID}` +
            `&client_secret=${FACEBOOK_APP_SECRET}` +
            `&fb_exchange_token=${shortTermToken}`;

        const longResp = await fetch(longTokenUrl);
        const longData = await longResp.json();

        if (longData.error) {
            console.error('❌ Long-term token exchange failed:', longData.error);
            return res.redirect(`${origin}/#social?error=long_token_failed`);
        }

        const longTermToken = longData.access_token;
        const expiresIn = longData.expires_in;

        // 2. Fetch Pages
        const pagesUrl = `https://graph.facebook.com/v21.0/me/accounts?` +
            `fields=id,name,access_token,instagram_business_account,category` +
            `&access_token=${longTermToken}`;
        const pagesResp = await fetch(pagesUrl);
        const pagesData = await pagesResp.json();
        const pages = pagesData.data ?? [];

        const pageConnections = pages.map((p) => ({
            pageId: p.id,
            pageName: p.name,
            pageAccessToken: p.access_token,
            instagramBusinessAccountId: p.instagram_business_account?.id,
            category: p.category,
            hasInstagram: !!p.instagram_business_account,
        }));

        // 3. Store Profile and Pages info in Supabase
        const { data: userConn, error: userErr } = await supabase
            .from('social_accounts')
            .upsert({
                workspace_id: workspaceId,
                connected_by: '00000000-0000-0000-0000-000000000000', // System user or handle correctly
                platform: 'facebook',
                account_type: 'profile',
                account_id: 'me',
                display_name: 'Connected Profile', // Will be updated on first sync
                access_token: longTermToken,
                token_expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
                platform_data: {
                    pages: pageConnections,
                    longTermUserToken: longTermToken,
                },
                connection_status: 'connected',
                last_sync_at: new Date().toISOString(),
            }, { onConflict: 'workspace_id,platform,account_id' })
            .select()
            .single();

        if (userErr) throw userErr;

        // 4. Redirect to Frontend Page Selection
        const redirectPath = `/select-facebook-pages?workspaceId=${workspaceId}&connectionId=${userConn.id}`;
        console.log('🚀 Redirecting back to frontend:', redirectPath);
        return res.redirect(`${origin}${redirectPath}`);

    } catch (e) {
        console.error('❌ Handshake error:', e);
        return res.redirect(`${origin}/#social?error=handshake_error`);
    }
}

// ------------------------------------------------------------------
//  Main entry point - Vercel Serverless Function
// ------------------------------------------------------------------
export default async function handler(req, res) {
    // ---------- CORS ----------
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        // pre‑flight for POST/GET
        return res.status(200).end();
    }
    // ---- `action` can be string | string[] | undefined → cast safely ----
    const { action } = req.query;
    try {
        switch (action) {
            case 'simple':
                // handleOAuth → token exchange → pages → DB
                return await handleFacebookSimple(req, res);
            case 'pages':
                // fetch pages using a *user* access token that you already have
                return await handleFacebookPages(req, res);
            case 'token':
                // short‑term → long‑term token exchange (stand‑alone endpoint)
                return await handleFacebookToken(req, res);
            case 'auth':
                // Redirect user to Facebook Auth
                return await handleFacebookAuth(req, res);
            case 'callback':
                // Handle Facebook Auth callback
                return await handleFacebookCallbackAction(req, res);
            case 'diagnostics':
                // env-check + simple Graph API ping
                return await handleFacebookDiagnostics(req, res);
            case 'validate':
                // test whether a token is still good
                return await handleValidateToken(req, res);
            case 'connections':
                // get all stored FB connections for a workspace
                return await handleGetConnections(req, res);
            case 'connect-page':
                // connect directly to a Facebook page (no profile)
                return await handleConnectPage(req, res);
            case 'list-pages':
                // list pages using existing user token
                return await handleListPages(req, res);
            case 'verify-page':
                // verify a page token is valid
                return await handleVerifyPage(req, res);
            default:
                // Anything that is not one of the above actions
                return res
                    .status(400)
                    .json({ error: 'Invalid action parameter' });
        }
    }
    catch (error) {
        // Centralised error logger – UI will see a JSON error object
        console.error('Facebook API error (handler):', error);
        return res.status(500).json({
            error: 'Facebook request failed',
            details: error?.message ?? 'unknown',
            timestamp: new Date().toISOString(),
        });
    }
}

// ------------------------------------------------------------------
//  1️⃣  Simple flow – OAuth code → long‑term token → pages → DB
// ------------------------------------------------------------------
async function handleFacebookSimple(req, res) {
    if (req.method !== 'GET' && req.method !== 'POST')
        return res.status(405).json({ error: 'Method not allowed' });
    const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID || process.env.VITE_FACEBOOK_APP_ID;
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
        const { code, redirectUri, workspaceId, state } = req.body;
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

        // ----- 1️⃣  Database-backed single‑use guard -----
        try {
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
        } catch (dbErr) {
            console.error('⚠️ DB guard error:', dbErr);
            // Proceed anyway if DB check fails to avoid blocking users due to DB issues
        }

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
        const shortTermToken = shortData.access_token;
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
        const longTermToken = longData.access_token;
        const expiresIn = longData.expires_in; // seconds
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
        const pages = pagesData.data ?? [];
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
                const { data: userConn, error: userErr, } = await supabase
                    .from('social_accounts')
                    .upsert({
                        workspace_id: workspaceId,
                        connected_by: '00000000-0000-0000-0000-000000000000', // TODO: replace with real user ID
                        platform: 'facebook',
                        account_type: 'profile',
                        account_id: 'me',
                        display_name: 'Facebook Profile',
                        access_token: longTermToken,
                        token_expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
                        scopes: [
                            'email',
                            'public_profile',
                            'pages_show_list',
                            'instagram_basic',
                            'pages_read_engagement',
                            'pages_manage_posts',
                        ],
                        platform_data: {
                            pages: pageConnections,
                            longTermUserToken: longTermToken,
                            userTokenExpiresIn: expiresIn,
                        },
                        connection_status: 'connected',
                        last_sync_at: new Date().toISOString(),
                    }, { onConflict: 'workspace_id,platform,account_id' })
                    .select()
                    .single();
                if (userErr)
                    throw userErr;
                console.log('✅ Facebook user connection saved:', userConn.id);
                // --- each PAGE connection ------------------------------------
                // 🔥 MODIFIED: Do NOT auto-connect pages. 
                // We just return them to the frontend for manual selection.

                console.log('✅ All Facebook connections saved', {
                    workspaceId,
                    userConnectionId: userConn.id,
                    pagesSaved: pageConnections.length,
                });
            }
            catch (dbErr) {
                console.error('❌ Database error while persisting connections:', dbErr);
                // We still return page list to client – UI can decide what to do.
            }
        }
        else {
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
            accessToken: longTermToken,  // 🔥 CRITICAL: Return the token!
            expiresIn: expiresIn,          // 🔥 CRITICAL: Return expiration!
            pages: pageConnections,
            message: pageConnections.length > 0
                ? `Found ${pageConnections.length} Facebook page(s)`
                : 'No Facebook Pages found – user may not manage any pages',
            workspaceId,
        });
    }
    // --------------------------------------------------------------
    // GET – return stored connections for a workspace (used by UI later)
    // --------------------------------------------------------------
    const { workspaceId } = req.query;
    if (!workspaceId) {
        return res
            .status(400)
            .json({ error: 'Missing workspaceId query parameter' });
    }
    // UUID validation (helps catch typos early)
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(workspaceId)) {
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
        if (error)
            throw error;
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
        console.log(`✅ Retrieved ${transformed.length} Facebook connections for workspace ${workspaceId}`);
        return res.status(200).json({
            success: true,
            connections: transformed,
            count: transformed.length,
        });
    }
    catch (err) {
        console.error('❌ DB fetch error:', err);
        return res.status(500).json({
            error: 'Failed to fetch connections',
            details: err.message ?? 'unknown',
        });
    }
}

// ------------------------------------------------------------------
// 2️⃣ Fetch pages (used by a UI that already owns a user token)
// ------------------------------------------------------------------
async function handleFacebookPages(req, res) {
    if (req.method !== 'GET')
        return res.status(405).json({ error: 'Method not allowed' });
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res
            .status(400)
            .json({ error: 'Missing access token in Authorization header' });
    }
    const pagesUrl = `https://graph.facebook.com/v21.0/me/accounts?` +
        `fields=id,name,access_token,instagram_business_account,category` +
        `&access_token=${token}`;
    const resp = await fetch(pagesUrl);
    const data = await resp.json();
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
// 3️⃣ Token exchange (short-term → long-term)
// ------------------------------------------------------------------
async function handleFacebookToken(req, res) {
    if (req.method !== 'POST')
        return res.status(405).json({ error: 'Method not allowed' });
    const { code, redirectUri } = req.body;
    if (!code) {
        return res
            .status(400)
            .json({ error: 'Missing authorization code' });
    }
    const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID || process.env.VITE_FACEBOOK_APP_ID;
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
    const resp = await fetch(tokenUrl);
    const data = await resp.json();
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
// 4️⃣ Diagnostics (env + Graph API sanity check)
// ------------------------------------------------------------------
async function handleFacebookDiagnostics(_req, res) {
    const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID || process.env.VITE_FACEBOOK_APP_ID;
    const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;
    const FACEBOOK_LONG_TERM_TOKEN = process.env.FACEBOOK_LONG_TERM_TOKEN;
    const env = {
        FACEBOOK_APP_ID: {
            exists: !!FACEBOOK_APP_ID,
            masked: FACEBOOK_APP_ID
                ? `${FACEBOOK_APP_ID.slice(0, 6)}…${FACEBOOK_APP_ID.slice(-4)}`
                : null,
        },
        FACEBOOK_APP_SECRET: {
            exists: !!FACEBOOK_APP_SECRET,
            masked: FACEBOOK_APP_SECRET
                ? `***${FACEBOOK_APP_SECRET.slice(-4)}`
                : null,
        },
        FACEBOOK_LONG_TERM_TOKEN: {
            exists: !!FACEBOOK_LONG_TERM_TOKEN,
            masked: FACEBOOK_LONG_TERM_TOKEN
                ? `***${FACEBOOK_LONG_TERM_TOKEN.slice(-4)}`
                : null,
        },
    };
    const recommendations = [];
    if (!FACEBOOK_APP_ID)
        recommendations.push('❌ Set FACEBOOK_APP_ID');
    else
        recommendations.push('✅ FACEBOOK_APP_ID is set');
    if (!FACEBOOK_APP_SECRET)
        recommendations.push('❌ Set FACEBOOK_APP_SECRET');
    else
        recommendations.push('✅ FACEBOOK_APP_SECRET is set');
    if (!FACEBOOK_LONG_TERM_TOKEN)
        recommendations.push('⚠️ FACEBOOK_LONG_TERM_TOKEN not set (optional)');
    else
        recommendations.push('✅ FACEBOOK_LONG_TERM_TOKEN is set');
    // Simple Graph API ping (uses app ID - it does not need a user token)
    let apiPing = null;
    if (FACEBOOK_APP_ID) {
        try {
            const pingUrl = `https://graph.facebook.com/v21.0/${FACEBOOK_APP_ID}?fields=id,name`;
            const pingResp = await fetch(pingUrl);
            const pingData = await pingResp.json();
            apiPing = {
                reachable: pingResp.ok,
                status: pingResp.status,
                hasData: !!pingData.id,
                appName: pingData.name ?? null,
                error: pingData.error?.message ?? null,
            };
            if (pingResp.ok && pingData.id) {
                recommendations.push('✅ Facebook API reachable & app ID valid');
            }
            else {
                recommendations.push('❌ Facebook API test failed - check app permissions');
            }
        }
        catch (e) {
            apiPing = { reachable: false, error: e.message };
            recommendations.push('❌ Facebook API unreachable - network issue?');
        }
    }
    return res.status(200).json({
        success: true,
        environment: env,
        recommendations,
        apiPing,
        deployment: {
            vercelEnv: process.env.VERCEL_ENV ?? 'unknown',
            nodeEnv: process.env.NODE_ENV ?? 'unknown',
            region: process.env.VERCEL_REGION ?? 'unknown',
            timestamp: new Date().toISOString(),
        },
    });
}
// ------------------------------------------------------------------
// 5️⃣ Validate a token (user- or page-token)
// ------------------------------------------------------------------
async function handleValidateToken(req, res) {
    if (req.method !== 'POST')
        return res.status(405).json({ error: 'Method not allowed' });
    const { token } = req.body;
    if (!token) {
        return res
            .status(400)
            .json({ error: 'Missing access token in request body' });
    }
    const testUrl = `https://graph.facebook.com/v21.0/me?fields=id,name&access_token=${token}`;
    const resp = await fetch(testUrl);
    const data = await resp.json();
    if (data.error) {
        return res.status(400).json({
            valid: false,
            error: data.error.message ?? 'Invalid token',
        });
    }
    return res.status(200).json({
        valid: true,
        user: { id: data.id, name: data.name },
    });
}
// ------------------------------------------------------------------
// 6️⃣ Get stored Facebook connections (used by UI)
// ------------------------------------------------------------------
async function handleGetConnections(req, res) {
    if (req.method !== 'GET')
        return res.status(405).json({ error: 'Method not allowed' });
    const { workspaceId } = req.query;
    if (!workspaceId) {
        return res
            .status(400)
            .json({ error: 'Missing workspaceId query parameter' });
    }
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(workspaceId)) {
        return res.status(400).json({
            error: 'Invalid workspaceId format',
            details: 'workspaceId must be a valid UUID',
        });
    }
    try {
        const { data: connections, error } = await supabase
            .from('social_accounts')
            .select('*')
            .eq('workspace_id', workspaceId)
            .eq('platform', 'facebook')
            .eq('connection_status', 'connected')
            .order('account_type', { ascending: false }); // Pages first, then profiles
        if (error)
            throw error;
        // Get both pages and profiles, but prioritize pages in UI
        const pageConnections = (connections ?? []).filter(c => c.account_type === 'page');
        const profileConnections = (connections ?? []).filter(c => c.account_type === 'profile');

        // Return page if available, otherwise profile (for UI selection)
        const primaryConnection = pageConnections.length > 0 ? pageConnections[0] :
            (profileConnections.length > 0 ? profileConnections[0] : null);

        const transformed = primaryConnection ? [{
            id: primaryConnection.id,
            workspaceId: primaryConnection.workspace_id,
            platform: primaryConnection.platform,
            platformType: primaryConnection.platform,
            displayName: primaryConnection.display_name,
            isConnected: primaryConnection.connection_status === 'connected',
            accessToken: primaryConnection.access_token,
            pages: primaryConnection.platform_data?.pages ?? [],
            accountType: primaryConnection.account_type,
            accountId: primaryConnection.account_id,
            username: primaryConnection.username,
            avatarUrl: primaryConnection.avatar_url,
            profileUrl: primaryConnection.profile_url,
            connectionStatus: primaryConnection.connection_status,
            lastSyncAt: primaryConnection.last_sync_at,
            createdAt: primaryConnection.created_at,
            updatedAt: primaryConnection.updated_at,
        }] : [];
        console.log(`✅ Retrieved ${transformed.length} Facebook connections for workspace ${workspaceId} (pages prioritized, profiles as fallback)`);
        return res.status(200).json({
            success: true,
            connections: transformed,
            count: transformed.length,
        });
    }
    catch (err) {
        console.error('❌ DB fetch error (connections):', err);
        return res.status(500).json({
            error: 'Failed to fetch connections',
            details: err?.message ?? 'unknown',
        });
    }
}
// ------------------------------------------------------------------
// 7️⃣ Connect directly to a Facebook Page (no profile)
// ------------------------------------------------------------------
async function handleConnectPage(req, res) {
    if (req.method !== 'POST')
        return res.status(405).json({ error: 'Method not allowed' });
    const { pageId, pageAccessToken, workspaceId, pageName, instagramBusinessAccountId, } = req.body;
    if (!pageId || !pageAccessToken || !workspaceId) {
        return res.status(400).json({
            error: 'Missing required fields',
            details: 'pageId, pageAccessToken, and workspaceId are required',
        });
    }
    try {
        // Verify the page token works
        const verifyUrl = `https://graph.facebook.com/v21.0/${pageId}?fields=id,name&access_token=${pageAccessToken}`;
        const verifyResp = await fetch(verifyUrl);
        const verifyData = await verifyResp.json();
        if (verifyData.error) {
            return res.status(400).json({
                error: 'Invalid page access token',
                details: verifyData.error.message,
            });
        }
        // Store page connection in database
        const { data: pageConn, error: pageErr } = await supabase
            .from('social_accounts')
            .upsert({
                workspace_id: workspaceId,
                connected_by: '00000000-0000-0000-0000-000000000000', // TODO: real user ID
                platform: 'facebook',
                account_type: 'page',
                account_id: pageId,
                username: pageId,
                display_name: pageName || `Page ${pageId}`,
                access_token: pageAccessToken,
                platform_data: {
                    instagram_business_account_id: instagramBusinessAccountId,
                    hasInstagram: !!instagramBusinessAccountId,
                    pageVerified: true,
                },
                connection_status: 'connected',
                last_sync_at: new Date().toISOString(),
            }, { onConflict: 'workspace_id,platform,account_id' })
            .select('id')
            .single();
        if (pageErr) {
            console.error('❌ Failed to store page connection:', pageErr);
            return res.status(500).json({
                error: 'Failed to save page connection',
                details: pageErr.message,
            });
        }
        console.log('✅ Facebook page connection saved:', {
            pageId,
            pageName,
            connectionId: pageConn.id,
            workspaceId,
        });
        return res.status(200).json({
            success: true,
            pageConnection: {
                id: pageConn.id,
                pageId,
                pageName: pageName || `Page ${pageId}`,
                accessToken: pageAccessToken,
                hasInstagram: !!instagramBusinessAccountId,
                instagramBusinessAccountId,
                isConnected: true,
            },
            message: `Successfully connected to Facebook page: ${pageName || pageId}`,
        });
    }
    catch (err) {
        console.error('❌ Page connection error:', err);
        return res.status(500).json({
            error: 'Page connection failed',
            details: err.message,
        });
    }
}
// ------------------------------------------------------------------
// 8️⃣ List available pages (from existing user token)
// ------------------------------------------------------------------
async function handleListPages(req, res) {
    if (req.method !== 'GET')
        return res.status(405).json({ error: 'Method not allowed' });
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res
            .status(400)
            .json({ error: 'Missing access token in Authorization header' });
    }
    try {
        const pagesUrl = `https://graph.facebook.com/v21.0/me/accounts?` +
            `fields=id,name,access_token,instagram_business_account,category,fan_count` +
            `&access_token=${token}`;
        const resp = await fetch(pagesUrl);
        const data = await resp.json();
        if (data.error) {
            return res.status(400).json({
                error: 'Failed to fetch pages',
                details: data.error.message ?? 'Unknown error',
            });
        }
        const pages = data.data?.map((p) => ({
            pageId: p.id,
            pageName: p.name,
            pageAccessToken: p.access_token,
            instagramBusinessAccountId: p.instagram_business_account?.id,
            category: p.category,
            fanCount: p.fan_count || 0,
            hasInstagram: !!p.instagram_business_account,
        })) || [];
        return res.status(200).json({
            success: true,
            pages,
            count: pages.length,
            message: `Found ${pages.length} Facebook pages`,
        });
    }
    catch (err) {
        console.error('❌ List pages error:', err);
        return res.status(500).json({
            error: 'Failed to list pages',
            details: err.message,
        });
    }
}
// ------------------------------------------------------------------
// 9️⃣ Verify a page token is valid
// ------------------------------------------------------------------
async function handleVerifyPage(req, res) {
    if (req.method !== 'POST')
        return res.status(405).json({ error: 'Method not allowed' });
    const { pageId, pageAccessToken } = req.body;
    if (!pageId || !pageAccessToken) {
        return res.status(400).json({
            error: 'Missing pageId or pageAccessToken',
        });
    }
    try {
        const testUrl = `https://graph.facebook.com/v21.0/${pageId}?fields=id,name,fan_count&access_token=${pageAccessToken}`;
        const resp = await fetch(testUrl);
        const data = await resp.json();
        if (data.error) {
            return res.status(400).json({
                valid: false,
                error: data.error.message,
            });
        }
        return res.status(200).json({
            valid: true,
            page: {
                id: data.id,
                name: data.name,
                fanCount: data.fan_count || 0,
            },
        });
    }
    catch (err) {
        console.error('❌ Verify page error:', err);
        return res.status(500).json({
            error: 'Verification failed',
            details: err.message,
        });
    }
}
