import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Twitter/X API Handler
 * 
 * Consolidated endpoint for all Twitter interactions:
 * - Token Exchange (action=token)
 * - Profile Fetch (action=profile)
 */

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://engage-hub-ten.vercel.app',
];

// Helper function to set CORS headers
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
    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        setCORSHeaders(req, res);
        return res.status(200).end();
    }

    // Set CORS headers for actual request
    setCORSHeaders(req, res);

    // Only allow POST requests
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
            case 'profile':
                return await handleProfileFetch(req, res);
            default:
                return res.status(400).json({
                    error: 'Invalid action',
                    message: `Action '${action}' is not supported. Valid actions: token, profile`
                });
        }
    } catch (error: any) {
        console.error('Twitter API error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error.message || 'An unexpected error occurred'
        });
    }
}

async function handleTokenExchange(req: VercelRequest, res: VercelResponse) {
    const { code, redirectUri, codeVerifier } = req.body;

    if (!code || !redirectUri || !codeVerifier) {
        return res.status(400).json({ error: 'Missing required parameters (code, redirectUri, codeVerifier)' });
    }

    const CLIENT_ID = process.env.TWITTER_CLIENT_ID || process.env.VITE_TWITTER_CLIENT_ID;
    const CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET;

    if (!CLIENT_ID || !CLIENT_SECRET) {
        return res.status(500).json({ error: 'Server configuration error' });
    }

    const basicAuth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

    const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${basicAuth}`
        },
        body: new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: redirectUri,
            code_verifier: codeVerifier
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

    return res.status(200).json(tokenData);
}

async function handleProfileFetch(req: VercelRequest, res: VercelResponse) {
    const { accessToken } = req.body;

    if (!accessToken) return res.status(400).json({ error: 'Missing accessToken' });

    const response = await fetch('https://api.twitter.com/2/users/me?user.fields=profile_image_url,username,name,description', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    });

    const data = await response.json();

    if (!response.ok) {
        return res.status(response.status).json({
            error: data.error || 'Failed to fetch Twitter profile',
            message: data.detail || data.title || 'Failed to fetch Twitter profile',
        });
    }

    return res.status(200).json(data);
}
