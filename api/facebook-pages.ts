// src/api/facebook-pages.ts - Facebook Page-Only Connection
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from './lib/supabase';
import { createHash } from 'crypto';

// ------------------------------------------------------------------
// Page-Only OAuth Flow - Connect directly to Facebook Pages
// ------------------------------------------------------------------
interface PageRequestBody {
  pageId: string;
  pageAccessToken: string;
  workspaceId?: string;
  pageName: string;
  instagramBusinessAccountId?: string;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  // ---------- CORS ----------
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
      case 'connect-page':
        return await handleConnectPage(req, res);
      case 'list-pages':
        return await handleListPages(req, res);
      case 'verify-page':
        return await handleVerifyPage(req, res);
      default:
        return res
          .status(400)
          .json({ error: 'Invalid action parameter' });
    }
  } catch (error: any) {
    console.error('Facebook Pages API error:', error);
    return res.status(500).json({
      error: 'Facebook Pages request failed',
      details: error?.message ?? 'unknown',
      timestamp: new Date().toISOString(),
    });
  }
}

// ------------------------------------------------------------------
// Connect directly to a Facebook Page
// ------------------------------------------------------------------
async function handleConnectPage(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  const {
    pageId,
    pageAccessToken,
    workspaceId,
    pageName,
    instagramBusinessAccountId,
  }: PageRequestBody = req.body as PageRequestBody;

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
      .upsert(
        {
          workspace_id: workspaceId,
          connected_by: '00000000-0000-0000-0000-000000000000', // TODO: real user ID
          platform: 'facebook',
          account_type: 'page',
          account_id: pageId,
          username: pageId,
          display_name: pageName,
          access_token: pageAccessToken,
          platform_data: {
            instagram_business_account_id: instagramBusinessAccountId,
            hasInstagram: !!instagramBusinessAccountId,
            pageVerified: true,
          },
          connection_status: 'connected',
          last_sync_at: new Date().toISOString(),
        },
        { onConflict: 'workspace_id,platform,account_id' },
      )
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
        pageName,
        accessToken: pageAccessToken,
        hasInstagram: !!instagramBusinessAccountId,
        instagramBusinessAccountId,
        isConnected: true,
      },
      message: `Successfully connected to Facebook page: ${pageName}`,
    });

  } catch (err: any) {
    console.error('❌ Page connection error:', err);
    return res.status(500).json({
      error: 'Page connection failed',
      details: err.message,
    });
  }
}

// ------------------------------------------------------------------
// List available pages (from existing user token)
// ------------------------------------------------------------------
async function handleListPages(
  req: VercelRequest,
  res: VercelResponse,
) {
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

    const pages = data.data?.map((p: any) => ({
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

  } catch (err: any) {
    console.error('❌ List pages error:', err);
    return res.status(500).json({
      error: 'Failed to list pages',
      details: err.message,
    });
  }
}

// ------------------------------------------------------------------
// Verify a page token is valid
// ------------------------------------------------------------------
async function handleVerifyPage(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  const { pageId, pageAccessToken } = req.body as {
    pageId?: string;
    pageAccessToken?: string;
  };

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

  } catch (err: any) {
    console.error('❌ Verify page error:', err);
    return res.status(500).json({
      error: 'Verification failed',
      details: err.message,
    });
  }
}
