import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Unified Social Authentication API Proxy
 * Handles token exchange and profile fetching for multiple providers.
 */

const ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://engage-hub-ten.vercel.app',
];

function setCORSHeaders(req: VercelRequest, res: VercelResponse) {
    const origin = req.headers.origin || '';
    if (ALLOWED_ORIGINS.includes(origin) || origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('vercel.app')) {
        res.setHeader('Access-Control-Allow-Origin', origin || '*');
    }
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method === 'OPTIONS') {
        setCORSHeaders(req, res);
        return res.status(200).end();
    }

    setCORSHeaders(req, res);

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { provider, action } = req.query;

    if (!provider) {
        return res.status(400).json({ error: 'Missing provider' });
    }

    try {
        switch (provider) {
            case 'facebook':
                return await handleFacebook(req, res, action as string);
            case 'linkedin':
                return await handleLinkedIn(req, res, action as string);
            case 'twitter':
                return await handleTwitter(req, res, action as string);
            case 'tiktok':
                return await handleTikTok(req, res, action as string);
            case 'youtube':
            case 'google':
                return await handleYouTube(req, res, action as string);
            default:
                return res.status(400).json({ error: `Provider ${provider} not supported` });
        }
    } catch (error: any) {
        console.error(`API Error (${provider}):`, error);
        return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
}

// --- Facebook Handler ---
async function handleFacebook(req: VercelRequest, res: VercelResponse, action: string) {
    const body = typeof req.body === 'object' && req.body ? req.body : {};
    const { code, redirectUri } = body;

    if (!code || typeof code !== 'string' || !redirectUri || typeof redirectUri !== 'string') {
        return res.status(400).json({
            error: 'Missing code or redirect_uri',
            message: 'Request body must include code and redirectUri (same redirect_uri used in the OAuth authorization request).',
        });
    }

    const APP_ID = process.env.VITE_FACEBOOK_APP_ID || '1621732999001688';
    const APP_SECRET = process.env.FACEBOOK_APP_SECRET;

    if (!APP_SECRET) return res.status(500).json({ error: 'Facebook Secret not configured' });

    const response = await fetch(
        `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${APP_ID}&client_secret=${APP_SECRET}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${encodeURIComponent(code)}`
    );
    const data = await response.json();
    if (!response.ok) {
        const message = (data?.error?.message ?? data?.message ?? 'Token exchange failed') as string;
        return res.status(response.status).json({ ...data, message });
    }
    return res.status(200).json(data);
}

// --- LinkedIn Handler ---
async function handleLinkedIn(req: VercelRequest, res: VercelResponse, action: string) {
    const CLIENT_ID = process.env.LINKEDIN_CLIENT_ID || process.env.VITE_LINKEDIN_CLIENT_ID;
    const CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;

    if (action === 'token') {
        const { code, redirectUri } = req.body;
        const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: redirectUri,
                client_id: CLIENT_ID!,
                client_secret: CLIENT_SECRET!,
            }),
        });
        const data = await response.json();
        return res.status(response.ok ? 200 : response.status).json(data);
    }

    if (action === 'profile') {
        const { accessToken } = req.body;
        const response = await fetch('https://api.linkedin.com/v2/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = await response.json();
        return res.status(response.ok ? 200 : response.status).json(data);
    }

    return res.status(400).json({ error: 'Invalid action for LinkedIn' });
}

// --- Twitter Handler ---
async function handleTwitter(req: VercelRequest, res: VercelResponse, action: string) {
    const CLIENT_ID = process.env.TWITTER_CLIENT_ID || process.env.VITE_TWITTER_CLIENT_ID;
    const CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET;

    if (action === 'token') {
        const { code, redirectUri, codeVerifier } = req.body;
        const basicAuth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
        const response = await fetch('https://api.twitter.com/2/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${basicAuth}`
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: redirectUri,
                code_verifier: codeVerifier
            }),
        });
        const data = await response.json();
        return res.status(response.ok ? 200 : response.status).json(data);
    }

    if (action === 'refresh') {
        const { refresh_token: refreshToken } = req.body || {};
        if (!refreshToken || typeof refreshToken !== 'string') {
            return res.status(400).json({ error: 'Missing refresh_token' });
        }
        if (!CLIENT_ID || !CLIENT_SECRET) {
            return res.status(500).json({ error: 'Twitter app not configured' });
        }
        const basicAuth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
        const response = await fetch('https://api.twitter.com/2/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${basicAuth}`
            },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: refreshToken
            }),
        });
        const data = await response.json();
        if (!response.ok) {
            const msg = (data as any)?.error_description || (data as any)?.error || 'Token refresh failed';
            return res.status(response.status).json({ error: msg });
        }
        return res.status(200).json({
            access_token: data.access_token,
            refresh_token: data.refresh_token ?? refreshToken,
            expires_in: data.expires_in
        });
    }

    if (action === 'profile') {
        const { accessToken } = req.body;
        const response = await fetch('https://api.twitter.com/2/users/me?user.fields=profile_image_url,username,name', {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = await response.json();
        return res.status(response.ok ? 200 : response.status).json(data);
    }

    return res.status(400).json({ error: 'Invalid action for Twitter' });
}

// --- TikTok Handler ---
async function handleTikTok(req: VercelRequest, res: VercelResponse, action: string) {
    const CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY || process.env.VITE_TIKTOK_CLIENT_KEY;
    const CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET;

    if (action === 'token') {
        const { code, redirectUri, codeVerifier } = req.body;
        const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_key: CLIENT_KEY!,
                client_secret: CLIENT_SECRET!,
                grant_type: 'authorization_code',
                code,
                redirect_uri: redirectUri,
                code_verifier: codeVerifier
            }),
        });
        const data = await response.json();
        return res.status(response.ok ? 200 : response.status).json(data);
    }

    if (action === 'profile') {
        const { accessToken } = req.body;
        const response = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name,username', {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = await response.json();
        return res.status(response.ok ? 200 : response.status).json(data);
    }

    return res.status(400).json({ error: 'Invalid action for TikTok' });
}

// --- YouTube Handler ---
async function handleYouTube(req: VercelRequest, res: VercelResponse, action: string) {
    const CLIENT_ID = process.env.YOUTUBE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || process.env.VITE_YOUTUBE_CLIENT_ID;
    const CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;

    if (action === 'token') {
        const { code, redirectUri } = req.body;
        const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: redirectUri,
                client_id: CLIENT_ID!,
                client_secret: CLIENT_SECRET!,
            }),
        });
        const data = await response.json();
        return res.status(response.ok ? 200 : response.status).json(data);
    }

    if (action === 'refresh') {
        const { refresh_token: refreshToken } = (req.body || {}) as { refresh_token?: string };
        if (!refreshToken || typeof refreshToken !== 'string') {
            return res.status(400).json({ error: 'Missing refresh_token' });
        }
        if (!CLIENT_ID || !CLIENT_SECRET) {
            return res.status(500).json({ error: 'YouTube/Google app not configured' });
        }
        const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
            }),
        });
        const data = await response.json();
        if (!response.ok) {
            const msg = (data as any)?.error_description || (data as any)?.error || 'Token refresh failed';
            return res.status(response.status).json({ error: msg });
        }
        return res.status(200).json({
            access_token: data.access_token,
            refresh_token: data.refresh_token ?? refreshToken,
            expires_in: data.expires_in,
        });
    }

    if (action === 'channel') {
        const { accessToken } = req.body;
        const response = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails,statistics&mine=true', {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = await response.json();
        if (!response.ok) return res.status(response.status).json(data);
        // Frontend expects { channels: [...] }; YouTube returns { items: [...] }
        return res.status(200).json({ channels: data.items || [] });
    }

    return res.status(400).json({ error: 'Invalid action for YouTube' });
}
