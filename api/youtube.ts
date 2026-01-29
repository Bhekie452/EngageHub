import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * YouTube/Google API Handler
 * 
 * Consolidated endpoint for all YouTube/Google interactions:
 * - Token Exchange (action=token)
 * - Channel Fetch (action=channel)
 */

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://engage-hub-ten.vercel.app',
];

function setCORSHeaders(req: VercelRequest, res: VercelResponse) {
    const origin = req.headers.origin || '';
    if (ALLOWED_ORIGINS.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else if (origin.includes('vercel.app')) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
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
        return res.status(405).json({
            error: 'Method not allowed',
            message: 'Only POST requests are allowed'
        });
    }

    const { action } = req.query;

    try {
        switch (action) {
            case 'token':
                return await handleTokenExchange(req, res);
            case 'channel':
                return await handleChannelFetch(req, res);
            default:
                return res.status(400).json({
                    error: 'Invalid action',
                    message: `Action '${action}' is not supported. Valid actions: token, channel`
                });
        }
    } catch (error: any) {
        console.error('YouTube API error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error.message || 'An unexpected error occurred'
        });
    }
}

async function handleTokenExchange(req: VercelRequest, res: VercelResponse) {
    const { code, redirectUri } = req.body;

    if (!code || !redirectUri) {
        return res.status(400).json({ error: 'Missing required parameters (code, redirectUri)' });
    }

    const CLIENT_ID = process.env.YOUTUBE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || process.env.VITE_YOUTUBE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
    const CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;

    if (!CLIENT_ID || !CLIENT_SECRET) {
        return res.status(500).json({ error: 'Server configuration error' });
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: redirectUri,
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
        }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || tokenData.error) {
        return res.status(400).json({
            error: tokenData.error,
            message: tokenData.error_description || 'Token exchange failed',
            details: tokenData
        });
    }

    return res.status(200).json({
        access_token: tokenData.access_token,
        expires_in: tokenData.expires_in,
        refresh_token: tokenData.refresh_token,
        token_type: tokenData.token_type || 'Bearer',
        id_token: tokenData.id_token,
    });
}

async function handleChannelFetch(req: VercelRequest, res: VercelResponse) {
    const { accessToken } = req.body;

    if (!accessToken) return res.status(400).json({ error: 'Missing accessToken' });

    // First get user info from Google
    const userInfoResponse = await fetch(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        }
    );

    if (!userInfoResponse.ok) {
        const errorData = await userInfoResponse.json();
        console.error('Google user info error:', errorData);
        return res.status(userInfoResponse.status).json({
            error: 'Failed to fetch user info',
            message: errorData.error?.message || 'Could not retrieve Google user information',
        });
    }

    const userInfo = await userInfoResponse.json();

    // Then get YouTube channel info
    const channelResponse = await fetch(
        'https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails,statistics&mine=true',
        {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        }
    );

    if (!channelResponse.ok) {
        const errorData = await channelResponse.json();
        return res.status(channelResponse.status).json({
            error: errorData.error?.message || 'Failed to fetch YouTube channel',
            message: errorData.error?.message || 'Could not retrieve YouTube channel information',
        });
    }

    const channelData = await channelResponse.json();

    return res.status(200).json({
        user: userInfo,
        channels: channelData.items || []
    });
}
